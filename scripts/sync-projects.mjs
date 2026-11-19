#!/usr/bin/env node
/**
 * Regenerates the open-source project list in index.html from the GitHub org's
 * public repositories.
 *
 *   node scripts/sync-projects.mjs            # rewrite index.html
 *   node scripts/sync-projects.mjs --dry-run  # print the generated HTML only
 *
 * Runs in the deploy workflow before the Pages artifact is uploaded, so the
 * published page is static HTML with no client-side fetching. The committed
 * index.html keeps its last known cards between the markers, so local preview
 * and a failed sync never leave the page empty.
 *
 * Curated copy in data/projects.json wins over anything from the API. Text from
 * the API is escaped; text from data/projects.json is trusted and may contain
 * entities such as &middot; and inline tags such as <code>.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HTML_PATH = path.join(ROOT, "index.html");
const CONFIG_PATH = path.join(ROOT, "data", "projects.json");

const CARD_INDENT = "      ";
const FOOTER_INDENT = "        ";
const DRY_RUN = process.argv.includes("--dry-run");

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function fetchRepos(org) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "singlebarrellabs-site-sync",
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const repos = [];
  for (let page = 1; ; page += 1) {
    const url = `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}&sort=pushed`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API ${response.status} for ${url}\n${body}`);
    }
    const batch = await response.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

/** Greedy wrap on spaces only, so tags and entities are never split. */
function wrapText(text, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function kickerFor(repo, override) {
  if (override?.kicker) return override.kicker;
  const language = repo.language ? escapeHtml(repo.language) : null;
  return language ? `Open source &middot; ${language}` : "Open source";
}

function copyFor(repo, override) {
  if (override?.copy) return override.copy;
  if (repo.description) return escapeHtml(repo.description.trim());
  console.warn(`warning: ${repo.name} has no description; using a generic line`);
  return "Source and documentation on GitHub.";
}

function licenseFor(repo, override) {
  return override?.license ?? repo.license?.spdx_id ?? null;
}

function renderCard(repo, override) {
  const indent = `${CARD_INDENT}  `;
  const copy = copyFor(repo, override);
  const license = licenseFor(repo, override);
  const href = escapeHtml(repo.html_url);

  const lines = [
    `${indent}<article class="card">`,
    `${indent}  <p class="card-index">${kickerFor(repo, override)}</p>`,
    `${indent}  <h3>${escapeHtml(repo.name)}</h3>`,
    `${indent}  <p class="card-copy">`,
    ...wrapText(copy, 78 - indent.length - 4).map((line) => `${indent}    ${line}`),
    `${indent}  </p>`,
    `${indent}  <p class="card-foot">`,
  ];
  if (license) lines.push(`${indent}    <span>${escapeHtml(license)}</span>`);
  lines.push(
    `${indent}    <a class="card-link" href="${href}" target="_blank" rel="noopener">View source<span aria-hidden="true"> ↗</span></a>`,
    `${indent}  </p>`,
    `${indent}</article>`,
  );
  return lines.join("\n");
}

function renderGrid(entries) {
  const cards = entries
    .map(({ repo, override }) => renderCard(repo, override))
    .join("\n\n");
  return [
    `${CARD_INDENT}<div class="card-grid card-grid--three">`,
    cards,
    `${CARD_INDENT}</div>`,
  ].join("\n");
}

function renderFooterLinks(entries) {
  return entries
    .map(
      ({ repo }) =>
        `${FOOTER_INDENT}<a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a>`,
    )
    .join("\n");
}

function replaceBlock(html, name, content, indent) {
  const pattern = new RegExp(
    `(<!--\\s*${name}:start\\s*-->)[\\s\\S]*?(<!--\\s*${name}:end\\s*-->)`,
    "g",
  );
  const matches = html.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(
      `index.html must contain exactly one ${name}:start / ${name}:end marker pair (found ${matches?.length ?? 0})`,
    );
  }
  return html.replace(pattern, `$1\n${content}\n${indent}$2`);
}

async function main() {
  const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  const org = config.org ?? "singlebarrellabs";
  const siteRepo = config.siteRepo ?? "singlebarrellabs-site";
  const excluded = new Set([siteRepo, ...(config.exclude ?? [])]);
  const order = config.order ?? [];
  const overrides = config.overrides ?? {};

  const repos = await fetchRepos(org);
  const entries = repos
    .filter((repo) => !repo.archived && !repo.fork && !excluded.has(repo.name))
    .map((repo) => ({ repo, override: overrides[repo.name] }))
    .sort((a, b) => {
      const ai = order.indexOf(a.repo.name);
      const bi = order.indexOf(b.repo.name);
      if (ai !== bi) return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      return a.repo.name.localeCompare(b.repo.name);
    });

  if (entries.length === 0) {
    throw new Error(`no usable repositories returned for ${org}; index.html left untouched`);
  }

  const grid = renderGrid(entries);
  const footer = renderFooterLinks(entries);

  if (DRY_RUN) {
    process.stdout.write(`${grid}\n\n${footer}\n`);
    return;
  }

  let html = await readFile(HTML_PATH, "utf8");
  html = replaceBlock(html, "projects", grid, CARD_INDENT);
  html = replaceBlock(html, "projects-footer", footer, FOOTER_INDENT);
  await writeFile(HTML_PATH, html);

  const curated = entries.filter((entry) => entry.override?.copy).length;
  console.log(
    `synced ${entries.length} repositories from ${org} (${curated} with curated copy): ${entries
      .map((entry) => entry.repo.name)
      .join(", ")}`,
  );
}

main().catch((error) => {
  console.error(`sync-projects: ${error.message}`);
  process.exit(1);
});
