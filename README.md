# singlebarrellabs-site

One-page site for Single Barrel Labs LLC, served at singlebarrellabs.com.

Static HTML and CSS with one small inline script for the mobile menu. No build
step, no dependencies, no framework. The deploy workflow runs one dependency-free
Node script that refreshes the open-source list from GitHub before publishing.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page |
| `styles.css` | Design tokens, components, layout |
| `scripts/sync-projects.mjs` | Regenerates the open-source list from GitHub |
| `data/projects.json` | Curated copy, ordering, and exclusions for that list |
| `sitemap.xml`, `robots.txt` | Search engine configuration |
| `assets/brand/` | Approved lockup and emblem, trimmed for web |
| `assets/fonts/` | Inter variable font, latin subset |
| `assets/` | Favicons, app icon, social preview |
| `CNAME` | Custom domain |

## Brand usage

The emblem is approved artwork. Do not redraw, recolor, trace, stretch, or
regenerate it. The site uses:

- `assets/brand/lockup-dark.png` — horizontal lockup for the charcoal header and
  footer. Derived from `SBL_Horizontal_Transparent_For_Dark` in the brand kit,
  trimmed of transparent padding only.
- `assets/brand/emblem.webp` — the approved master emblem, used decoratively in
  the hero and as the mobile header mark.

The favicon is the one exception to using the emblem. At 16px the emblem's
ticks, brackets, and barrel collapse into an indistinct smudge, so the tab icon
uses a reduced glyph built from the mark's own structure: `{ • }` at 16px, and
`{ [ • ] }` at 32px. It is a legibility stand-in, not a redraw, and it is used
nowhere except the browser tab. `apple-touch-icon.png` keeps the real emblem.

Source of truth and the full kit:
`~/Documents/SingleBarrelLabs/brand-assets/`.

Typography is Inter, one variable file covering the full weight range. Optical
sizing is left automatic (`font-optical-sizing: auto`), so display sizes render
at Inter's display optical size — the "Inter Display" cut of the same typeface.

## Design tokens

Defined once at the top of `styles.css`: brand colours, ink and surface neutrals,
rules, type scale, spacing, container width, radii, focus colours, and motion.

Headings use charcoal on ivory and ivory on charcoal. Copper is reserved for
accents and primary actions; `--copper-deep` is the accessible text colour on
ivory surfaces.

## Open-source project list

The cards under "Engineering in Practice" and the footer repository links are
generated from the public repositories of the `singlebarrellabs` org, so a new
repository appears on the site without an HTML edit.

Two marker pairs in `index.html` delimit the generated regions:

```html
<!-- projects:start -->        … cards …        <!-- projects:end -->
<!-- projects-footer:start --> … links …        <!-- projects-footer:end -->
```

The deploy workflow runs `node scripts/sync-projects.mjs` after checkout and
before the Pages artifact is uploaded. The published page is therefore plain
static HTML — nothing is fetched in the browser. The committed HTML keeps the
last generated cards inside the markers, so a local preview and a failed sync
both leave the page intact.

`data/projects.json` is the overlay:

| Key | Effect |
|---|---|
| `org` | Org to list (default `singlebarrellabs`) |
| `siteRepo` | Excluded automatically (default `singlebarrellabs-site`) |
| `exclude` | Repositories to leave off the page |
| `order` | Names first, in this order; anything else follows alphabetically |
| `overrides` | Per-repo `kicker`, `copy`, `license` |

Curated `copy` wins over the GitHub description; everything not overridden uses
the repository's own description, language, and detected licence. Text from the
API is escaped, while `copy` and `kicker` in `projects.json` are trusted HTML —
so `&middot;` and inline `<code>` are allowed there.

Archived and forked repositories are skipped. Without an override, a repository
with no description gets a generic line and a warning in the workflow log.

Sync locally (writes `index.html`, commit the result if you want the fallback to
stay current):

```sh
GITHUB_TOKEN=$(gh auth token) node scripts/sync-projects.mjs
GITHUB_TOKEN=$(gh auth token) node scripts/sync-projects.mjs --dry-run
```

## Local preview

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly also works,
though absolute asset paths resolve best over HTTP.

## Accessibility

Semantic landmarks, skip link, visible focus rings, 44px minimum tap targets,
`prefers-reduced-motion` support, and AA contrast for all text and UI edges.

## Deploying

Push to `main`. GitHub Pages builds from the repository root.
