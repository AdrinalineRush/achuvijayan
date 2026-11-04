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
const {buildLogoModel, logoInteractionPose, logoAssemblyPose, logoDockRotation} = await import('../vendor/logo-sculpture.js');
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

const rest = () => ({angle: 0, speed: 0, revealing: true, rotation: 0});
const docked = {phase: 'chapter', docked: true, reveal: 1};
const spinFor = (fps, seconds, pose = docked) => {
  let state = rest();
  for (let frame = 0; frame < fps * seconds; frame++) state = logoDockRotation(state, pose, 1 / fps);
  return state;
};
const spun = spinFor(60, 4);
assert.ok(spun.rotation > 85 && spun.rotation < 95, 'Docked logo keeps rotating at a restrained pace');
for (const fps of [30, 120]) assert.ok(Math.abs(spinFor(fps, 4).rotation - spun.rotation) < 1e-8, 'Refresh-rate-independent turn');
assert.equal(spinFor(60, 4, {...docked, phase: 'footer'}).rotation, spun.rotation, 'Footer also rotates in place');
const inspected = spinFor(60, 4, {...docked, magnet: 1});
assert.ok(inspected.speed > 6 && inspected.speed < 8, 'A nearby pointer slows the turn for inspection');
assert.ok(inspected.rotation < spun.rotation * .35 && inspected.rotation > 0, 'Inspection preserves a gentle continuous turn');
for (const fps of [30, 120]) assert.ok(Math.abs(spinFor(fps, 4, {...docked, magnet: 1}).rotation - inspected.rotation) < 1e-8,
  'Inspection speed is refresh-rate independent');
const hoverEntered = logoDockRotation(spun, {...docked, magnet: 1}, 1 / 60);
assert.ok(hoverEntered.rotation > spun.rotation && hoverEntered.rotation - spun.rotation < .5, 'Hover never resets the accumulated angle');
assert.ok(hoverEntered.speed < spun.speed && hoverEntered.speed > inspected.speed, 'Hover eases into its slower pace');
const hoverLeft = logoDockRotation(hoverEntered, {...docked, magnet: 0}, 1 / 60);
assert.ok(hoverLeft.rotation > hoverEntered.rotation && hoverLeft.rotation - hoverEntered.rotation < .5, 'Pointer exit keeps rotation continuous');
assert.ok(hoverLeft.speed > hoverEntered.speed, 'Pointer exit resumes the original pace');
const departing = logoDockRotation(spun, {...docked, phase: 'transit', docked: false}, 1 / 60);
assert.ok(departing.rotation > spun.rotation && departing.rotation - spun.rotation < .5, 'Departure carries the angle without resetting');
assert.ok(departing.speed < spun.speed, 'Departure eases away the idle angular speed');
const resumed = logoDockRotation(departing, docked, 1 / 60);
assert.ok(resumed.rotation > departing.rotation && resumed.rotation - departing.rotation < .5, 'Redocking continues without an angle jump');
const longHold = {...spun, angle: 360 * 100 + 135};
const reverseHero = logoDockRotation(longHold, {phase: 'reveal', reveal: 1}, 1 / 60);
assert.equal(reverseHero.rotation, 135, 'Long holds return by an equivalent short angle');
assert.equal(logoDockRotation(reverseHero, {phase: 'reveal', reveal: .65}, 1 / 60).rotation, 0, 'Photo alignment is restored before its dissolve');
assert.equal(logoDockRotation(rest(), {phase: 'reveal', reveal: 0}, .05).rotation, 0, 'Photograph never receives idle rotation');
console.log('Docked rotation: inspection, pace, refresh rates, footer, departure, redocking and reverse photo alignment passed');

// Extract the existing pure helper, so tests exercise production movement.
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('  function logoFlightPose(');
const end = app.indexOf('  let lenis = null;', start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({});
vm.runInContext(app.slice(start, end), context);
const flight = context.logoFlightPose;
const pointerPose = context.logoPointerPose, pointerSpring = context.logoPointerSpring;
const pointerGeometry = {width: 1440, size: 128, compact: false};
const pointerDock = {x: 400, y: 450, scale: 1, reveal: 1, attraction: 0, docked: true};
const cursor = {x: 460, y: 450, active: true};
const nearPointer = pointerPose(cursor, pointerDock, pointerGeometry);
assert.ok(nearPointer.tiltX * nearPointer.magnet > .55, 'Moving over the mark produces visible tilt, not a doubly attenuated response');
assert.equal(nearPointer.tiltY, 0);
const farPointer = pointerPose({...cursor, x: 700}, pointerDock, pointerGeometry);
assert.ok(nearPointer.magnet > farPointer.magnet, 'The magnetic field is strongest near the mark');
const outsidePointer = pointerPose({...cursor, x: 900}, pointerDock, pointerGeometry);
assert.equal(outsidePointer.magnet, 0, 'Distant mouse movement cannot disturb a heading');
assert.equal(outsidePointer.x, 0);
const quiet = response => assert.ok(Object.values(response).every(value => value === 0), 'Disabled pointer response clears every target');
quiet(pointerPose({...cursor, active: false}, pointerDock, pointerGeometry));
quiet(pointerPose(cursor, pointerDock, {...pointerGeometry, compact: true}));
quiet(pointerPose(cursor, {...pointerDock, reveal: .7}, pointerGeometry));
quiet(pointerPose(cursor, {...pointerDock, reveal: .88}, pointerGeometry));
for (const docked of [true, false]) {
  for (let x = -500; x <= 1500; x += 50) {
    for (let y = -500; y <= 1500; y += 50) {
      const response = pointerPose({x, y, active: true}, {...pointerDock, docked, attraction: docked ? 0 : 1}, pointerGeometry);
      assert.ok(Object.values(response).every(Number.isFinite), 'Pointer targets remain finite');
      assert.ok(Math.abs(response.x) <= (docked ? 14 : 36) && Math.abs(response.y) <= (docked ? 10.5 : 27), 'Pointer translation stays bounded');
      assert.ok(Math.abs(response.tiltX) <= 1 && Math.abs(response.tiltY) <= 1 && response.magnet >= 0 && response.magnet <= 1, 'Pointer attitude and strength stay bounded');
    }
  }
}
const springFor = (fps, target, initial = {value: 0, velocity: 0}) => {
  let state = initial;
  for (let frame = 0; frame < fps; frame++) state = pointerSpring(state, target, 1 / fps);
  return state;
};
const attracted = springFor(60, 14), returned = springFor(60, 0, attracted);
assert.ok(Math.abs(attracted.value - 14) < .001, 'Pointer spring reaches its target promptly');
assert.ok(Math.abs(returned.value) < .001 && Math.abs(returned.velocity) < .003, 'Leaving the logo returns to the measured socket');
for (const fps of [30, 120]) {
  const alternative = springFor(fps, 14), alternativeReturn = springFor(fps, 0, alternative);
  for (const key of ['value', 'velocity']) {
    assert.ok(Math.abs(alternative[key] - attracted[key]) < 1e-8, 'Attraction is refresh-rate independent');
    assert.ok(Math.abs(alternativeReturn[key] - returned[key]) < 1e-8, 'Return is refresh-rate independent');
  }
}
let spring = {value: 0, velocity: 0};
for (let frame = 0; frame < 120; frame++) {
  const next = pointerSpring(spring, 14, 1 / 60);
  assert.ok(next.value >= spring.value && next.value <= 14, 'Spring approaches a stationary target without overshoot');
  spring = next;
}
console.log('Pointer response: visible local tilt, bounded translation, inactive/touch/photo gates and refresh-rate-independent return passed');
for (const [width, height, size, sourceSize] of [[1440, 900, 128, 418], [390, 844, 72, 226], [320, 568, 72, 186]]) {
  const limit = 10000;
  const heroEnd = height * 1.4;
  const g = {
    width, height, size, sourceSize, heroEnd, compact: width <= 760, sourceX: width - sourceSize / 2 - 28, sourceY: height * .46,
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
  const assembledHold = flight(heroEnd * .56, limit, g);
  assert.equal(assembledHold.reveal, 1, 'The metal is fully assembled before the studio revolution');
  assert.equal(assembledHold.scrollTurn, 0, 'The assembled mark has a readable beat before turning');
  for (let progress = 0; progress <= 1; progress += .005) {
    const pose = flight(heroEnd * progress, limit, g);
    if (pose.scrollTurn > 0) assert.equal(pose.reveal, 1, 'The studio turn never races the material assembly');
  }
  const unveiled = flight(heroEnd, limit, g);
  assert.equal(unveiled.reveal, 1); assert.equal(unveiled.photoOpacity, 0);
  assert.equal(unveiled.scrollTurn, 360, 'Opening completes one full revolution');
  assert.ok(unveiled.scale * size >= sourceSize, 'Reveal holds the portrait scale');
  assert.ok(Math.abs(unveiled.rotationX) + Math.abs(unveiled.rotationY) + Math.abs(unveiled.rotationZ) < .001, 'Opening turn settles before departure');
  assert.ok(Math.abs(flight(heroEnd + height * .33, limit, g).scale - (g.compact ? .84 : .8)) < .001,
    'Portrait-sized logo shrinks to a readable travel size before crossing the work');
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
