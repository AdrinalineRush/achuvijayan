# Achu Vijayan — portfolio

Static portfolio for filmmaker and editor Achu Vijayan, hosted on Vercel at
https://www.achuvijayan.com (the bare `achuvijayan.com` redirects there). No application
build step or package installation is needed.

## Structure

- `index.html`: page content, selected films, static filmography fallback and sharing metadata.
- `style.css`: responsive layout and reduced-motion rules.
- `app.js`: film browsing, navigation, video players, dialogs and scroll animation.
- `data.js`: filmography, commercials, music videos, trailer cuts and AI films.
- `image-sources.js`: generated responsive-image manifest.
- `404.html`: branded not-found page; Vercel serves it automatically for unknown URLs.
- `assets/icons/`: active logo, favicons and `logo-mask.svg`, a copy of `logo.svg` with
  explicit 1024px dimensions used only as the 3D dissolve mask. An SVG with just a
  `viewBox` is rasterised at 150px as a GPU texture. Keep its paths identical to `logo.svg`.
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
in place. The hero holds for a scroll-controlled reveal: a soft, contour-aware
matte releases the photograph into the original logo. A and V lift and tilt in
depth, then assemble while a directional material sweep resolves their photo
surfaces into titanium, dark edges and a satin lime inlay. The GPU photograph
matches the original crop, grayscale, brightness and contrast. The finished mark
holds at portrait scale for a full scroll-controlled 360° turn before launch.
The turn overlaps the end of the material reveal and settles before departure.
Every contour comes directly from `assets/icons/logo.svg`; the geometry is not
redrawn. The source's original corner brackets reappear late in the assembly.

`logoFlightPose` blends measured heading positions into bounded, gently curved
journeys, with short departure and approach windows even across long sections.
Quintic easing matches the heading's movement at each join. On desktop, the
assembled sculpture is magnetic within 380px of the cursor: a proximity-weighted
pull is bounded to 46px horizontally and 34px vertically, with a damped 3D tilt.
The photograph stays anchored during its dissolve. Moving the cursor away returns
the logo to its measured heading or footer socket; touch layouts omit attraction.
A small idle drift runs only during travel.
The footer settles up to 96px before the scroll limit, when its socket is visible.
The mark shrinks during departure to 68% of its docking size (76% on phones),
giving the work more room while it travels. It grows back to the measured socket
during approach. Both ends match the position, scale and movement of their hold.
Each journey completes another 360° turn around the vertical axis. The turns
scrub backward with reverse scrolling, ease to rest at each socket and retain
their cumulative angle so docking never causes a reverse spin.
Commercial and music titles integrate the mark on their right; other titles
reserve space on their left or above. There are no decorative docking rings.
The path and reveal reverse with scroll; the pointer and idle motion remain live.
The pinned hero and film archive are accounted for when measuring headings;
stable pin spacers define the path and live socket rectangles align each hold.
ResizeObserver and ScrollTrigger refresh events remeasure after layout changes.

The self-hosted Three.js scene uses rounded, smoothly shaded bevels, a perspective camera and
six softboxes against a dark studio environment, with studio strip reflections,
soft lighting changes on arrival and dedicated finishes for both themes. It
renders at up to 60 fps with a larger buffer for the portrait reveal and a small
buffer during travel. Buffer changes happen immediately before drawing so they
cannot introduce a cleared frame. Rendering pauses in hidden tabs and behind dialogs; the
footer stops rendering after it settles. Desktop heading marks are 96–128px;
phones use 72px and omit pointer attraction. The module loads only when motion
is enabled. Shaders compile before the first GPU handoff to avoid a hitch during
assembly. An unavailable or lost GPU shows the original vector and a simpler
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

Ordinary media revalidates after one day. Content-versioned WebP images and everything
in `vendor/` use long-lived immutable caching. Every `vendor/` script is loaded with a
`?v=` tag (library version, or a dated label for `logo-sculpture.js`); change that tag
whenever a vendor file changes, or visitors keep the old copy. Use a new filename when
replacing other media to avoid serving an older cached version.

`vercel.json` also sends `Referrer-Policy` and `Permissions-Policy` headers and
redirects the bare domain to `www`, which matches the canonical URL and sitemap.

## Retired versions

The classic site, exports, duplicate branding, unused artwork and old video
loops were moved to a recovery archive outside this workspace. The archive
preserves the retired nested Git repository and a bundle of the main repository.
They are not dependencies of the current site.
