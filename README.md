# Achu Vijayan — portfolio

Static portfolio for filmmaker and editor Achu Vijayan, hosted on Vercel at
https://achuvijayan.com. No application build step or package installation is needed.

## Structure

- `index.html`: page content, selected films, static filmography fallback and sharing metadata.
- `style.css`: responsive layout and reduced-motion rules.
- `app.js`: film browsing, navigation, video players, dialogs and scroll animation.
- `data.js`: filmography, commercials, music videos, trailer cuts and AI films.
- `image-sources.js`: generated responsive-image manifest.
- `assets/icons/`: active logo and favicons.
- `assets/images/`: current original artwork; `optimized/` contains generated WebP copies.
- `assets/video/`: full films, short previews and their poster sources.
- `assets/social/`: sharing card and editable SVG source.
- `vendor/`: self-hosted GSAP, ScrollTrigger, SplitText, Lenis and the Three.js logo bundle.
- `scripts/`: local preview and image generation tools; excluded from deployment.
- `vercel.json`: hosting and caching rules.

## Local preview

```sh
python3 scripts/serve.py
```

Open http://127.0.0.1:4175. Use `--port 4173` for another port.
The server disables caching and supports video byte ranges for seeking.

## Editing content

Edit `FEATURE_FILMS`, `TV_COMMERCIALS`, `MUSIC_VIDEOS`, `TRAILER_CUTS` or `AI_FILMS` in `data.js`.
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

Full videos with sound load on click. Commercials, music videos, trailer cuts
and AI films autoplay muted previews while visible. Previews stop outside the
viewport, in a hidden tab, behind a dialog or during playback with sound, and
resume when eligible again. Reduced motion and supported Data Saver preferences
retain click-to-play posters. Browser or provider autoplay restrictions may also
leave the poster visible.

## Appearance and motion

The header's sun/moon button switches between day and night themes. Night is
the default; a visitor's explicit choice is saved as `achu-theme` in localStorage
and restored before the stylesheet loads. Scrolling never changes the theme.
If storage is unavailable, switching still works for the current page.

Glass surfaces use shared tokens in `style.css`, with light-theme, reduced-motion,
reduced-transparency and no-backdrop-filter fallbacks. Large media cards use
translucent gradients; backdrop blur is reserved for overlays. `MOTION` in
`app.js` coordinates reveal and dialog timing. Mobile cards reveal individually
as they enter view, and the footer retains the visitor's reduced-motion control.
Entrances and the 300+ counter replay when their content leaves and re-enters
the viewport from either direction. Offscreen animations finish rather than
rewinding visible content. The hero replays on return; the loading sequence
still runs only once per session. Scroll-scrubbed sequences follow scroll as before.

The floating emblem starts in the portrait, while the small header logo stays
in place. The hero holds for a scroll-controlled reveal: the photograph dissolves
into the original logo contours, its A and V groups separate and assemble, and
the image on their faces resolves into titanium, dark edges and a lime inlay.
The finished mark holds at portrait scale for a restrained 3D turn before launch.
Every contour comes directly from `assets/icons/logo.svg`; the geometry is not
redrawn. The source's original corner brackets reappear late in the assembly.

`logoFlightPose` gives each journey a distinct position across the viewport,
with scale and rotation following scroll. A damped pointer attraction adds at
most 100px horizontally and 72px vertically, plus a small idle drift. Its
influence goes to zero at each heading and the footer for precise landings.
Commercial and music titles integrate the mark on their right; other titles
reserve space on their left or above. There are no decorative docking rings.
The path and reveal reverse with scroll; the pointer and idle motion remain live.
The pinned hero and film archive are accounted for when measuring headings.
ResizeObserver and ScrollTrigger refresh events remeasure after layout changes.

The self-hosted Three.js scene uses beveled geometry, studio strip reflections,
soft lighting changes on arrival and dedicated finishes for both themes. It
renders at up to 60 fps with a larger buffer for the portrait reveal and a small
buffer during travel. Rendering pauses in hidden tabs and behind dialogs; the
footer stops rendering after it settles. Desktop heading marks are 96–128px;
phones use 72px and omit pointer attraction. The module loads only when motion
is enabled. An unavailable or lost GPU shows the original vector and a simpler
photo dissolve. Reduced motion retains the photograph and static endpoint logos
without pinning the hero or loading the 3D module.

Clicking the assembled emblem plays a 1.8-second full 3D turn with a small lift
and moving reflection. Enter and Space use the native button with its visible
focus outline. Repeated presses during a turn are ignored. The button becomes
interactive only after assembly; its surrounding overlay passes clicks through.
Without WebGL, clicking the vector gives a short rocking response.
Source, pinned build instructions and verification are in `scripts/LOGO-3D.md`.
The footer repeats the name and role beneath the emblem. Its docking socket
is excluded from entrance transforms so the final alignment stays stable.

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
