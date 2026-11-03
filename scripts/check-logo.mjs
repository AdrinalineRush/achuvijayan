import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';

// Run against the shipped bundle; a lightweight XML DOM is sufficient here.
if (!process.argv[2]) throw new Error('Pass the installed linkedom/esm/index.js path');
const {DOMParser} = await import(pathToFileURL(process.argv[2]).href);
globalThis.DOMParser = class extends DOMParser {
  parseFromString(...args) {
    const document = super.parseFromString(...args);
    // Browsers return an empty string for an unset CSS declaration; linkedom
    // returns undefined. Match the browser contract for SVGLoader's style pass.
    document.querySelectorAll('*').forEach(node => {
      if (!node.style) return;
      Object.defineProperty(node, 'style', {value: new Proxy(node.style, {
        get(target, property) { return Reflect.get(target, property) ?? ''; }
      })});
    });
    return document;
  }
};
const {buildLogoModel, logoInteractionPose, logoAssemblyPose} = await import('../vendor/logo-sculpture.js');
const svg = await readFile(new URL('../assets/icons/logo.svg', import.meta.url), 'utf8');
const {model, materials, width, height} = buildLogoModel(svg);
assert.equal(width, height);
assert.equal(model.children.length, 12, 'All original disconnected contours retained');
assert.deepEqual(model.children.reduce((roles, mesh) => {
  roles[mesh.userData.role] = (roles[mesh.userData.role] || 0) + 1;
  return roles;
}, {}), {v: 3, a: 3, frame: 6}, 'A and V each contain their original metal contours and inlay');
assert.ok(model.children.reduce((sum, mesh) => sum + mesh.geometry.attributes.position.count, 0) < 22000,
  'Rounded bevels retain a small geometry budget');
for (const mesh of model.children) {
  const geometry = mesh.geometry;
  for (const key of ['position', 'normal']) {
    assert.ok([...geometry.attributes[key].array].every(Number.isFinite), `Valid ${key}`);
  }
  const normal = geometry.attributes.normal;
  for (let index = 0; index < normal.count; index++) {
    assert.ok(Math.abs(Math.hypot(normal.getX(index), normal.getY(index), normal.getZ(index)) - 1) < .001);
  }
  assert.ok(geometry.boundingBox.max.z - geometry.boundingBox.min.z >= (mesh.userData.role === 'frame' ? 36 : 67), 'Physical depth');
  assert.ok(Math.abs(geometry.boundingBox.max.z) < .001, 'Front face aligns to docking plane');
  assert.ok(geometry.groups.some(group => group.materialIndex === 0), 'Cap material');
  assert.ok(geometry.groups.some(group => group.materialIndex === 1), 'Beveled edge material');
  const settled = logoAssemblyPose(1, mesh.userData.role);
  assert.ok(settled.x === 0 && settled.y === 0 && settled.z === 0 && settled.turn === 0, 'Exact assembled coordinates');
  assert.ok(settled.tilt === 0 && settled.yaw === 0, 'Depth reveal returns to the docking plane');
  assert.equal(settled.opacity, 1);
  assert.equal(settled.visible, true);
  console.log(`${mesh.name}: ${geometry.attributes.position.count} vertices, valid normals and depth`);
  geometry.dispose();
}
assert.equal(materials[2].color.getHexString(), 'beff1f');
materials.forEach(material => material.dispose());
for (const role of ['a', 'v', 'frame']) {
  for (let p = 0; p <= 1; p += .001) {
    const pose = logoAssemblyPose(p, role);
    const next = logoAssemblyPose(Math.min(1, p + .001), role);
    assert.ok(Math.hypot(next.x - pose.x, next.y - pose.y) < 2, 'Assembly is continuous');
    assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
    for (const axis of ['z', 'turn', 'tilt', 'yaw']) assert.ok(Number.isFinite(pose[axis]), `Valid assembly ${axis}`);
  }
}
assert.ok(logoAssemblyPose(.36, 'a').x < 0 && logoAssemblyPose(.36, 'v').x > 0, 'The original letter groups visibly separate');

// The click turn must finish at its original orientation and never accumulate.
assert.equal(logoInteractionPose(-1).active, false);
assert.equal(logoInteractionPose(0).turn, 0);
assert.equal(logoInteractionPose(.9).turn, 180);
assert.equal(logoInteractionPose(1.8).active, false);
assert.equal(logoInteractionPose(1.8).scale, 1);
assert.equal(logoInteractionPose(1.8).lift, 0);
assert.ok(360 - logoInteractionPose(1.7999).turn < .001, 'Full turn joins rest without snapping');
let lastTurn = 0;
for (let time = 0; time < 1.8; time += .01) {
  const pose = logoInteractionPose(time);
  assert.ok(pose.turn >= lastTurn, 'Turn never reverses abruptly');
  assert.ok(pose.scale >= 1 && pose.scale <= 1.08, 'Fits canvas overscan');
  lastTurn = pose.turn;
}
console.log('Click flourish: complete turn, bounded scale and exact settling passed');

// Extract the existing pure helper, so tests exercise production movement.
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('  function logoFlightPose(');
const end = app.indexOf('  let lenis = null;', start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({});
vm.runInContext(app.slice(start, end), context);
const flight = context.logoFlightPose;
for (const [width, height, size, sourceSize] of [[1440, 900, 128, 418], [390, 844, 72, 226], [320, 568, 72, 186]]) {
  const limit = 10000;
  const heroEnd = height * 1.4;
  const g = {
    width, height, size, sourceSize, heroEnd, sourceX: width - sourceSize / 2 - 28, sourceY: height * .46,
    dockX: width / 2, dockY: limit + height - 150, dockSize: size,
    nodes: [
      {x: 28 + size / 2, y: heroEnd + height * 1.3},
      {x: 28 + size / 2, y: 3800, pinStart: 3400, pinEnd: 4900},
      {x: width - 28 - size / 2, y: 7300}
    ]
  };
  const top = flight(0, limit, g), bottom = flight(limit, limit, g);
  assert.equal(top.x, g.sourceX); assert.equal(top.y, g.sourceY);
  assert.equal(top.scale, sourceSize / size);
  assert.equal(top.opacity, 0); assert.equal(top.photoOpacity, 1); assert.equal(top.reveal, 0);
  assert.equal(top.scrollTurn, 0, 'Photograph starts without rotation');
  const unveiled = flight(heroEnd, limit, g);
  assert.equal(unveiled.reveal, 1); assert.equal(unveiled.photoOpacity, 0);
  assert.equal(unveiled.scrollTurn, 360, 'Opening completes one full revolution');
  assert.ok(unveiled.scale * size >= sourceSize, 'Reveal holds the portrait scale');
  assert.ok(Math.abs(unveiled.rotationX) + Math.abs(unveiled.rotationY) + Math.abs(unveiled.rotationZ) < .001, 'Opening turn settles before departure');
  assert.ok(flight(heroEnd + height * .33, limit, g).scale < .8, 'Portrait-sized logo shrinks before crossing the work');
  assert.equal(bottom.x, g.dockX); assert.equal(bottom.y, height - 150);
  assert.equal(bottom.scale, 1);
  assert.equal(flight(limit + 100, limit, g).y, bottom.y, 'Overscroll docks correctly');
  const pinned = flight(4000, limit, g);
  assert.equal(pinned.active, 1); assert.equal(pinned.y, 400, 'Pinned archive offset');
  for (let scroll = 0; scroll <= limit; scroll += 10) {
    const pose = flight(scroll, limit, g);
    for (const key of ['x', 'y', 'scale', 'rotationX', 'rotationY', 'rotationZ', 'scrollTurn']) assert.ok(Number.isFinite(pose[key]));
    assert.ok(pose.x >= 0 && pose.x <= width, 'Flight stays in viewport horizontally');
    assert.ok(pose.attraction >= 0 && pose.attraction <= 1);
    if (pose.active >= 0) {
      assert.equal(pose.scale, 1);
      assert.equal(pose.attraction, 0, 'Pointer and idle drift cannot displace a chapter landing');
      assert.equal(pose.freedom, 0, 'No 3D idle drift at a heading');
      assert.equal(pose.docked, true, 'Heading hold settles the renderer');
      assert.equal(pose.scrollTurn % 360, 0, 'Every heading is front-facing');
    }
    assert.equal(JSON.stringify(pose), JSON.stringify(flight(scroll, limit, g)), 'Reversible, independent of previous visits');
    if (scroll > 0 && scroll < limit - 1) {
      const before = flight(scroll - .001, limit, g);
      assert.ok(Math.hypot(pose.x - before.x, pose.y - before.y) < 1, 'Continuous path');
      assert.ok(Math.abs(pose.scale - before.scale) < .01, 'Continuous scale');
      assert.ok(pose.scrollTurn >= before.scrollTurn - 1e-8, 'Rotation never unwinds at docking');
      assert.ok(Math.abs(pose.scrollTurn - before.scrollTurn) < .1, 'Continuous unwrapped angle');
    }
  }
  const earlyDock = flight(limit - 50, limit, g);
  assert.equal(earlyDock.phase, 'footer', 'Footer docks before the exact scroll limit');
  assert.equal(earlyDock.y, g.dockY - (limit - 50));
  for (const at of g.nodes.map(node => node.y - height * .64)) {
    const epsilon = .01;
    const before = flight(at - epsilon, limit, g), landed = flight(at, limit, g), after = flight(at + epsilon, limit, g);
    const incoming = (landed.y - before.y) / epsilon;
    const outgoing = (after.y - landed.y) / epsilon;
    assert.ok(Math.abs(incoming - outgoing) < .01, 'Arrival matches socket scroll velocity');
  }
  for (const at of [heroEnd, ...g.nodes.flatMap(node => [node.y - height * .64, node.y + ((node.pinEnd || 0) - (node.pinStart || 0)) - height * .29]), limit]) {
    const before = flight(at - .0001, limit, g), after = flight(at + .0001, limit, g);
    assert.ok(Math.hypot(before.x - after.x, before.y - after.y) < .1, 'No snapping at phase boundaries');
    assert.ok(Math.abs(before.scale - after.scale) < .001, 'No scale snapping at phase boundaries');
    assert.ok(Math.abs(before.attraction - after.attraction) < .001, 'Pointer influence joins continuously');
    assert.ok(Math.abs(before.scrollTurn - after.scrollTurn) < .001, 'No rotation snapping at phase boundaries');
  }
  const arrivals = g.nodes.map(node => node.y - height * .64);
  let previousTurn = unveiled.scrollTurn;
  for (const at of [...arrivals, limit]) {
    const arrival = flight(at, limit, g);
    assert.equal(arrival.scrollTurn - previousTurn, 360, 'Exactly one full turn per journey');
    previousTurn = arrival.scrollTurn;
  }
  const moving = flight(6100, limit, g, 24), reversing = flight(6100, limit, g, -24), still = flight(6100, limit, g, 0);
  assert.equal(moving.x, still.x); assert.equal(moving.y, still.y); assert.equal(moving.scale, still.scale);
  assert.notEqual(moving.rotationY, reversing.rotationY, 'Scroll momentum changes the live attitude');
  assert.ok(moving.energy > still.energy, 'Scroll momentum increases the lighting response');
  console.log(`${width}px: varied chapter paths, live momentum, reverse path and footer docking passed`);
}
