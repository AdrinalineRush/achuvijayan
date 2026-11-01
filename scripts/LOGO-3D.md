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

Commit the generated bundle and legal notice with any source changes. Retain
`vendor/THREE-LICENSE.txt`. No package installation is needed for deployment.
Bump the module's version in `app.js` and the app/style versions in `index.html`
when shipping a new revision.

The geometry check verifies actual meshes, cap/edge material groups, valid
normals and coordinates, physical depth and a front face at the docking plane.
It also checks exact assembly endpoints, original geometry count, desktop/mobile
portrait reveals, pinned archive coordinates, reverse scrolling, phase-boundary
continuity, zero pointer displacement at headings and precise footer docking.
It does not substitute for visual browser testing. Review both themes,
scroll down/up through all headings, resize, open/close a film, and check
reduced motion plus a WebGL-disabled browser before release.

Implementation references: [ExtrudeGeometry](https://threejs.org/docs/pages/ExtrudeGeometry.html),
[SVGLoader](https://threejs.org/docs/pages/SVGLoader.html),
[RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html).
