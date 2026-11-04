# Logo sculpture

`logo-sculpture.mjs` is the editable source for the self-contained, lazy-loaded
`vendor/logo-sculpture.js`. It preserves all twelve contours in the two original
SVG paths and groups them into A, V and the original corner frame. SVGLoader
reorders contours when resolving holes, so roles are assigned from geometry,
not path order. No remote runtime imports are used.

Rebuild from the repository root (Node and npm required for this step only):

```sh
logo_tools=$(mktemp -d)
npm install --prefix "$logo_tools" --no-audit --no-fund three@0.187.0 esbuild@0.28.2 linkedom@0.18.12
NODE_PATH="$logo_tools/node_modules" "$logo_tools/node_modules/.bin/esbuild" scripts/logo-sculpture.mjs --bundle --minify --format=esm --outfile=vendor/logo-sculpture.js --legal-comments=linked
node scripts/check-logo.mjs "$logo_tools/node_modules/linkedom/esm/index.js"
node --check app.js
git diff --check
```

The portrait dissolve samples `assets/icons/logo-mask.svg`, not `logo.svg`: the same
paths with explicit `width`/`height`, so the GPU texture is 1024px instead of the 150px
browsers pick for an SVG with only a `viewBox`. Regenerate it whenever `logo.svg` changes.

The photo plane and sculpture share the exact crop and display-space grading.
The plane sits at the front-face depth, so perspective cannot change their image
alignment. Contour masking releases the photo before the letter groups separate;
a directional shader sweep then resolves their photographic surfaces into metal.
The perspective camera is calibrated to the same 140% overscan as the canvas,
preserving the measured SVG size at every dock. Eight studio panels, including
a dark flag, shape the metal. All materials compile before the first visible frame.

With the local server running, open `/scripts/review-logo.html` to inspect six
fixed production-renderer checkpoints and both themes. The review page is local
tooling; `scripts/` is excluded from deployment.

Commit the generated bundle and legal notice with any source changes. Retain
`vendor/THREE-LICENSE.txt`. No package installation is needed for deployment.
Bump the module's version in `app.js` and the app/style versions in `index.html`
when shipping a new revision.

The geometry check verifies actual meshes, cap/edge material groups, valid
normals and coordinates, physical depth and a front face at the docking plane.
It also checks exact assembly endpoints, original contour count, geometry budget, desktop/mobile
portrait reveals, pinned archive coordinates, reverse scrolling, phase-boundary
continuity, stable base sockets and precise footer docking. Browser testing also
checks the magnetic offset and return; those are layered onto the base path.
It does not substitute for visual browser testing. Review both themes,
scroll down/up through all headings, resize, open/close a film, and check
reduced motion plus a WebGL-disabled browser before release.

Implementation references: [ExtrudeGeometry](https://threejs.org/docs/pages/ExtrudeGeometry.html),
[SVGLoader](https://threejs.org/docs/pages/SVGLoader.html),
[RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html).

The refined reveal uses smaller, staggered A/V excursions and finishes its
material sweep before the hero revolution, leaving a readable assembled beat.
Letter bevels are 5 units wide and
6.5 units deep with six segments and creased-normal smoothing. The thin corner
brackets use their own 1.6-unit bevel and 30-unit extrusion. Shaped softboxes,
object-space cap normals and brushed titanium surfaces create continuous reflections.
The subtle roughness texture filters out at subpixel scale to avoid shimmer.
Canvas resolution changes occur in the draw callback, and the first GPU frame
replaces its fallback without an independent opacity transition. Early scrolls
accelerate the portrait entrance instead of force-completing it.

Desktop pointer attraction uses a smooth 380px proximity falloff after the photo
is released. A critically damped spring moves the DOM position; normalized
object-size pointer coordinates drive up to 22° yaw and 16° pitch, plus moving
reflections and key/rim lights. The complete proximity force is damped before
rendering. Heading displacement is bounded to 14px / 10.5px, travel to 36px / 27px.
Inactive pointers clear their targets and return to the measured socket.
Touch and reduced-motion layouts do not
apply this magnetic effect. The review page includes a
ten-second playback and a scrubber for inspecting the entire opening in either
direction, in addition to the fixed checkpoints.

Docked headings and the footer keep a 24-degree-per-second turn around the
vertical axis, with no autonomous translation or scaling. Proximity interaction
slows the turn smoothly to 7.2 degrees per second at full engagement.
A separate angle accumulator
eases its speed on arrival/departure and carries its orientation into travel.
Returning to the reveal rebases whole revolutions and smoothly restores photo
alignment. Hidden tabs and dialogs pause the turn without catching up on resume.
The `Docked rotation` review checkpoint previews this motion at portrait scale.
