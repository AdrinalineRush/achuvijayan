# Achu Vijayan — portfolio

Static portfolio for filmmaker and editor Achu Vijayan, hosted on Vercel at
https://achuvijayan.com. No application build step or package installation is needed.

## Structure

- `index.html`: page content, selected films, static filmography fallback and sharing metadata.
- `style.css`: responsive layout and reduced-motion rules.
- `app.js`: film browsing, navigation, video players, dialogs and scroll animation.
- `data.js`: filmography, commercials and AI films.
- `image-sources.js`: generated responsive-image manifest.
- `assets/icons/`: active logo and favicons.
- `assets/images/`: current original artwork; `optimized/` contains generated WebP copies.
- `assets/video/`: full films, short previews and their poster sources.
- `assets/social/`: sharing card and editable SVG source.
- `vendor/`: self-hosted GSAP, ScrollTrigger, SplitText and Lenis.
- `scripts/`: local preview and image generation tools; excluded from deployment.
- `vercel.json`: hosting and caching rules.

## Local preview

```sh
python3 scripts/serve.py
```

Open http://127.0.0.1:4175. Use `--port 4173` for another port.
The server disables caching and supports video byte ranges for seeking.

## Editing content

Edit `FEATURE_FILMS`, `TV_COMMERCIALS`, `MUSIC_VIDEOS` or `AI_FILMS` in `data.js`.
Keep the three static selected-film cards and the static filmography fallback in
`index.html` consistent with changes to credits.

After adding or changing artwork:

```sh
python3 scripts/optimize-images.py
```

Requires Python 3, ImageMagick (`magick`) and `cwebp`. The generator reads image
references from the current HTML and data, preserves originals, skips existing
copies and removes obsolete files from the generated `optimized/` directory.
Do not put manually created artwork inside that generated directory.

Image dimensions come from the manifest; `POSTER_SIZE` is a fallback. Bump affected
`?v=` tags in the HTML after changing scripts or styles. Optimized filenames
already change when the source artwork changes.

Full videos load on play. Silent previews load near the viewport, except when
reduced motion or a supported data-saving preference is active.

## Deployment

The connected Vercel project deploys pushes to `main`. Review changes locally
and obtain the owner's approval before pushing. `.vercelignore` excludes local
configuration, tooling and documentation. Never commit credentials, `.vercel/`,
`.claude/` or backup exports.

Ordinary media revalidates after one day. Content-versioned WebP images use
long-lived immutable caching. Use a new filename when replacing other media
to avoid serving an older cached version.

## Retired versions

The classic site, exports, duplicate branding, unused artwork and old video
loops were moved to a recovery archive outside this workspace. The archive
preserves the retired nested Git repository and a bundle of the main repository.
They are not dependencies of the current site.
