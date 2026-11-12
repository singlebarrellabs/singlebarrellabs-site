# singlebarrellabs-site

One-page site for Single Barrel Labs LLC, served at singlebarrellabs.com.

Static HTML and CSS with one small inline script for the mobile menu. No build
step, no dependencies, no framework.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page |
| `styles.css` | Design tokens, components, layout |
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
uses a reduced glyph built from the mark's own structure: `{ }` at 16px, and
`{ [ ] }` with the centre reticle dot at 32px. It is a legibility stand-in, not
a redraw, and it is used nowhere except the browser tab. `apple-touch-icon.png` keeps the real emblem.

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
