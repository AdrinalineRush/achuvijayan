// Source for vendor/logo-sculpture.js. Build notes are in scripts/LOGO-3D.md.
import {
  ACESFilmicToneMapping, BoxGeometry, Color, DirectionalLight, ExtrudeGeometry, Group,
  HemisphereLight, MathUtils, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera,
  PlaneGeometry, PMREMGenerator, Scene, ShaderMaterial, SRGBColorSpace, TextureLoader, WebGLRenderer
} from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

// Exported separately so the actual SVG geometry can be tested without a GPU.
export function buildLogoModel(svg) {
  const parsed = new SVGLoader().parse(svg);
  const viewBox = parsed.xml.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
  if (viewBox.length !== 4 || !viewBox.every(Number.isFinite)) throw new Error('Invalid logo viewBox');
  const [left, top, width, height] = viewBox;
  const centreX = left + width / 2, centreY = top + height / 2;
  const model = new Group();
  const silver = new MeshPhysicalMaterial({
    color: 0xc5ccd2, metalness: 1, roughness: .23, anisotropy: .32,
    clearcoat: .28, clearcoatRoughness: .24, envMapIntensity: 1.2
  });
  const edge = new MeshPhysicalMaterial({
    color: 0x536373, metalness: .96, roughness: .3,
    clearcoat: .32, clearcoatRoughness: .22, envMapIntensity: 1.3
  });
  const lime = new MeshPhysicalMaterial({
    color: 0xbeff1f, metalness: .35, roughness: .26,
    clearcoat: .55, clearcoatRoughness: .2, envMapIntensity: .7,
    emissive: 0x486b00, emissiveIntensity: .08
  });
  const limeEdge = new MeshPhysicalMaterial({color: 0x597d19, metalness: .85, roughness: .26});
  const frameSilver = silver.clone(), frameEdge = edge.clone();
  const materials = [silver, edge, lime, limeEdge, frameSilver, frameEdge];
  for (const path of parsed.paths) {
    const shapes = path.toShapes();
    if (!shapes.length) continue;
    const accent = path.userData.style.fill.toLowerCase() === '#beff1f';
    const depth = accent ? 60 : 54;
    // Keep every SVG shape verbatim. The A and V are groups of original
    // disconnected contours; rebuilding letters from a font changes the mark.
    shapes.forEach((shape, index) => {
      const points = shape.getPoints(10);
      const isFrame = !accent && points.some(point => Math.abs(point.y - centreY) > height * .4);
      const bevel = isFrame ? 1.6 : 5;
      const bevelDepth = isFrame ? 3 : 6.5;
      const geometry = toCreasedNormals(new ExtrudeGeometry(shape, {
        depth: isFrame ? 30 : depth, bevelEnabled: true, bevelThickness: bevelDepth,
        bevelSize: bevel, bevelSegments: 6, steps: 1, curveSegments: 10
      }), Math.PI / 3);
      // Rotate the SVG plane instead of negative scaling, preserving winding
      // and normals. The front face sits at Z=0 for exact docking.
      geometry.translate(-centreX, -centreY, 0);
      geometry.rotateX(Math.PI);
      geometry.translate(0, 0, -bevelDepth);
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      // SVGLoader sorts contours when resolving holes. Identify the actual
      // geometry spatially; source path order is not a reliable letter index.
      const {min, max} = geometry.boundingBox;
      const role = isFrame ? 'frame' : (max.y > height * .2 || (accent && min.y > 0) ? 'a' : 'v');
      const mesh = new Mesh(geometry, isFrame ? [frameSilver, frameEdge] : accent ? [lime, limeEdge] : [silver, edge]);
      mesh.name = `${role}-${accent ? 'inlay' : 'metal'}-${index}`;
      mesh.userData.role = role;
      model.add(mesh);
    });
  }
  if (!model.children.length) throw new Error('Logo has no geometry');
  return {model, materials, width, height};
}

// The reveal scrubs both ways. At the end every original contour returns to
// its exact SVG coordinates; no drift is accumulated across repeated visits.
export function logoAssemblyPose(progress, role) {
  const ease = (a, b) => MathUtils.smootherstep(progress, a, b);
  const delay = role === 'v' ? .025 : 0;
  const split = ease(.2 + delay, .47 + delay) * (1 - ease(.47 + delay, .9));
  const sign = role === 'a' ? -1 : 1;
  if (role === 'frame') {
    const assembled = ease(.37, .82);
    return {x: 0, y: 0, z: (1 - assembled) * -38, turn: 0, tilt: 0, yaw: 0,
      visible: progress > .37, opacity: assembled};
  }
  return {x: sign * split * 22, y: -sign * split * 12, z: split * (role === 'a' ? 78 : 48),
    turn: sign * split * .018, tilt: -sign * split * .06, yaw: sign * split * .11,
    visible: progress > .075, opacity: ease(.075, .205)};
}

// Both photo surfaces share one crop and one tone calculation. The original
// image is 4:5; object-fit:cover in a 20:21 card exposes 84% at 30% from the top.
// CSS applies its filters in display colour, so match there before relighting.
const portraitSampling = `
  vec3 portraitDisplay(vec2 uv) {
    vec3 linear = texture2D(uPortrait, uv).rgb;
    vec3 display = mix(linear * 12.92, 1.055 * pow(max(linear, vec3(0.0)), vec3(1.0 / 2.4)) - .055, step(vec3(.0031308), linear));
    float gray = clamp(dot(display, vec3(.2126, .7152, .0722)) * .9064 - .015, 0.0, 1.0);
    return vec3(gray);
  }
  float polishedEase(float a, float b, float value) {
    float t = clamp((value - a) / (b - a), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }
`;

// A full turn with zero velocity at either end, layered onto the live scroll pose.
export function logoInteractionPose(elapsed) {
  if (elapsed < 0 || elapsed >= 1.8) return {active: false, turn: 0, tilt: 0, lift: 0, scale: 1, glow: 0};
  const t = elapsed / 1.8;
  const ease = t * t * t * (t * (t * 6 - 15) + 10);
  const bloom = Math.sin(t * Math.PI) ** 2;
  return {active: true, turn: ease * 360, tilt: bloom * 16, lift: bloom * 24, scale: 1 + bloom * .08, glow: bloom};
}

export async function createLogoSculpture(host, ticker) {
  let renderer, environment, studio, model, portrait, photo, mask, materials = [], resizeObserver, themeObserver;
  let disposed = false, contextLost = false, visible = true, ready = false;
  let pose = {rotationX: 0, rotationY: 0, rotationZ: 0, active: -1, docked: true, freedom: 0, reveal: 0};
  let pointer = {x: 0, y: 0}, pointerTarget = {x: 0, y: 0};
  let lastFrame = 0, previousActive = -1, arrivalStart = -10, needsFrame = true;
  let interactionStart = -10;
  let bufferSize = 0;
  let theme = '', scene, camera, key, rim;
  const materialReveal = {value: 0};
  const attitude = {x: 0, y: 0, z: 0};
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'signature-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.pointerEvents = 'none';

  function applyTheme() {
    if (!scene) return;
    const day = root.dataset.theme === 'light';
    theme = day ? 'light' : 'dark';
    materials[0].color.set(day ? 0x697d8d : 0xc5ccd2);
    materials[1].color.set(day ? 0x3c4d60 : 0x536373);
    materials[2].color.set(day ? 0x8ebc24 : 0xbeff1f);
    materials[4].color.copy(materials[0].color);
    materials[5].color.copy(materials[1].color);
    scene.environmentIntensity = day ? .9 : 1;
    renderer.toneMappingExposure = day ? .97 : 1.02;
    needsFrame = true;
  }

  function draw(time) {
    if (disposed || contextLost || !visible || document.hidden || root.classList.contains('is-locked')) return;
    // Up to 60 fps for the small scene. The DOM travel follows Lenis at
    // display refresh rate. Docked logos render only when something changes.
    if (time - lastFrame < 1 / 60 - .001) return;
    const interaction = logoInteractionPose(time - interactionStart);
    const settling = Math.abs(attitude.x) + Math.abs(attitude.y) + Math.abs(attitude.z) > .01;
    const arriving = time - arrivalStart < 1.1;
    if (ready && (pose.opacity === 0 || (pose.docked && !settling && !arriving)) && !needsFrame && !interaction.active) return;
    const dt = Math.min(.05, Math.max(.001, time - lastFrame));
    lastFrame = time;
    const floating = !pose.docked;
    const freedom = floating ? pose.freedom : 0;
    const magnet = pose.magnet || 0;
    const energy = MathUtils.clamp(pose.energy || 0, 0, 1);
    const arrivalProgress = MathUtils.clamp((time - arrivalStart) / 1.1, 0, 1);
    const arrival = Math.sin(arrivalProgress * Math.PI) ** 2;
    pointer.x = MathUtils.damp(pointer.x, floating || magnet ? pointerTarget.x : 0, 7, dt);
    pointer.y = MathUtils.damp(pointer.y, floating || magnet ? pointerTarget.y : 0, 7, dt);
    const reveal = pose.reveal ?? 1;
    const assembled = MathUtils.smootherstep(reveal, .5, .88);
    const x = pose.rotationX + (3 + Math.sin(time * .63)) * freedom * assembled + pointer.y * magnet;
    const y = pose.rotationY + (-5 + Math.sin(time * .49) * 2) * freedom * assembled + pointer.x * magnet;
    const z = pose.rotationZ + Math.sin(time * .55) * .5 * freedom * assembled;
    for (const [axis, value] of Object.entries({x, y, z})) attitude[axis] = MathUtils.damp(attitude[axis], value, 9, dt);
    // Keep scroll revolutions unwrapped and separate from the damped attitude.
    // 360 -> 0 damping would otherwise unwind the logo at every landing.
    model.rotation.set(MathUtils.degToRad(attitude.x + interaction.tilt), MathUtils.degToRad(attitude.y + (pose.scrollTurn || 0) + interaction.turn), MathUtils.degToRad(attitude.z));
    model.position.y = Math.sin(time * .8) * 3 * freedom * assembled + interaction.lift;
    model.scale.setScalar(interaction.scale);
    for (const piece of model.children) {
      const part = logoAssemblyPose(reveal, piece.userData.role);
      piece.position.set(part.x, part.y, part.z);
      piece.rotation.set(part.tilt, part.yaw, part.turn);
      piece.visible = part.visible;
    }
    const bodyOpacity = MathUtils.smootherstep(reveal, .075, .205);
    materials.forEach((material, index) => { material.opacity = index > 3 ? logoAssemblyPose(reveal, 'frame').opacity : bodyOpacity; });
    materialReveal.value = reveal;
    portrait.visible = reveal < .5;
    portrait.material.uniforms.uReveal.value = reveal;
    // This moves the reflected studio, not a white stripe painted over an SVG.
    scene.environmentRotation.y = -.68 + MathUtils.smootherstep(reveal, .24, .96) * .78 + attitude.y * .012 + arrival * .12 + interaction.glow * .4;
    scene.environmentRotation.z = Math.sin(time * .12) * .025 * freedom;
    key.intensity = 1.65 + arrival * .2 + energy * .15 + interaction.glow * .5;
    rim.intensity = 2.3 + arrival * .35 + energy * .3 + interaction.glow * .6;
    // Resizing clears the drawing buffer. Do it only on a frame that paints,
    // never from setPose between two throttled render ticks.
    resize();
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      host.classList.add('has-webgl');
    }
    needsFrame = interaction.active || arriving;
  }

  function resize() {
    if (!renderer || disposed) return;
    // Two stable resolution tiers keep the hero crisp without rendering a
    // portrait-sized buffer throughout the rest of this long portfolio.
    const hero = pose.phase === 'reveal' || (pose.scale || 1) > 1.8;
    const size = hero ? Math.min(780, Math.max(320, Math.min(innerWidth * .52, 520) * 1.5)) : 196;
    const pixels = Math.ceil(size * Math.min(2, window.devicePixelRatio || 1));
    if (pixels === bufferSize) return;
    bufferSize = pixels;
    renderer.setPixelRatio(1);
    renderer.setSize(pixels, pixels, false);
    needsFrame = true;
  }
  const lost = event => {
    event.preventDefault();
    contextLost = true;
    ready = false;
    host.classList.remove('has-webgl');
  };
  const restored = () => { contextLost = false; needsFrame = true; };
  const visibilityChanged = () => { needsFrame = true; };
  function dispose() {
    if (disposed) return;
    disposed = true;
    ticker.remove(draw);
    resizeObserver?.disconnect();
    themeObserver?.disconnect();
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
    document.removeEventListener('visibilitychange', visibilityChanged);
    document.removeEventListener('portfolio:overlay', visibilityChanged);
    model?.traverse(object => object.geometry?.dispose());
    materials.forEach(material => material.dispose());
    portrait?.geometry.dispose();
    portrait?.material.dispose();
    photo?.dispose(); mask?.dispose();
    environment?.dispose();
    studio?.clear();
    renderer?.dispose();
    canvas.remove();
    host.classList.remove('has-webgl');
  }

  try {
    // Avoid fetching model data if WebGL isn't supported.
    renderer = new WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    const response = await fetch(new URL('../assets/icons/logo.svg', import.meta.url));
    if (!response.ok) throw new Error('Logo asset could not be loaded');
    const built = buildLogoModel(await response.text());
    model = built.model;
    materials = built.materials;
    scene = new Scene();
    scene.add(model);
    const loader = new TextureLoader();
    [photo, mask] = await Promise.all([
      loader.loadAsync(new URL('../assets/images/optimized/achu-vijayan-76ace22a11-760.webp', import.meta.url).href),
      loader.loadAsync(new URL('../assets/icons/logo-mask.svg', import.meta.url).href)
    ]);
    photo.colorSpace = SRGBColorSpace;
    // The portrait and the metal faces use the same projected crop, so the
    // photographic A/V pieces turn into the actual sculpture without a jump.
    for (const material of materials) {
      material.transparent = true;
      material.onBeforeCompile = shader => {
        shader.uniforms.uPortrait = {value: photo};
        shader.uniforms.uMaterialReveal = materialReveal;
        shader.vertexShader = 'varying vec2 vPhotoUV;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n vPhotoUV = vec2(position.x / ${built.width.toFixed(3)} + .5, (position.y / ${(built.height * 1.05).toFixed(3)} + .5) * .84 + .112);`);
        shader.fragmentShader = 'uniform sampler2D uPortrait; uniform float uMaterialReveal; varying vec2 vPhotoUV;\n' + portraitSampling + shader.fragmentShader;
        if (material === materials[0] || material === materials[4]) {
          // Very shallow machining across the metal cap bends the studio
          // reflection without changing the original contour or its dock.
          shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
            float cap = smoothstep(.6,.95,abs(normal.z));
            normal = normalize(normal + vec3((vPhotoUV - .5) * vec2(1.8,.65),0.0) * cap);
          `);
        }
        shader.fragmentShader = shader.fragmentShader.replace('#include <colorspace_fragment>', `#include <colorspace_fragment>
          float materialPosition = clamp(vPhotoUV.x * .62 + vPhotoUV.y * .38, 0.0, 1.0);
          float photoWeight = 1.0 - polishedEase(.23 + materialPosition * .19, .55 + materialPosition * .19, uMaterialReveal);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, portraitDisplay(vPhotoUV), photoWeight);
        `);
      };
    }
    model.children.forEach(piece => { piece.renderOrder = 1; });
    portrait = new Mesh(new PlaneGeometry(built.width, built.height * 1.05), new ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: {uPortrait: {value: photo}, uMask: {value: mask}, uReveal: {value: 0}},
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `uniform sampler2D uPortrait; uniform sampler2D uMask; uniform float uReveal; varying vec2 vUv;
        ${portraitSampling}
        void main(){
          vec2 maskUV = vec2(vUv.x,(vUv.y-.5)*1.05+.5);
          float silhouette = texture2D(uMask,maskUV).a;
          // A broad diagonal exposure moves from the photograph into its
          // matching cap texture. The same direction then reveals the metal.
          float field = clamp(vUv.x * .62 + vUv.y * .38, 0.0, 1.0);
          float outside = 1.0 - polishedEase(.06 + field * .12, .25 + field * .12, uReveal);
          float inside = 1.0 - polishedEase(.205,.225,uReveal);
          float alpha = mix(outside,inside,silhouette);
          gl_FragColor=vec4(portraitDisplay(vec2(vUv.x,vUv.y*.84+.112)),alpha);
        }`
    }));
    portrait.position.z = 0;
    portrait.renderOrder = -1;
    scene.add(portrait);
    // Overscan lets rotated corners and bevels clear the canvas edges, while
    // the CSS surface enlargement preserves the original mark's docking size.
    const half = Math.max(built.width, built.height) / 2 * 1.4;
    camera = new PerspectiveCamera(28, 1, .1, 5000);
    camera.position.set(0, 0, half / Math.tan(MathUtils.degToRad(14)));
    camera.lookAt(0, 0, 0);
    const pmrem = new PMREMGenerator(renderer);
    // A dark studio with separate softboxes gives the metal real highlight /
    // shadow contrast. Perspective makes the reflection vary across each face.
    studio = new Scene();
    studio.background = new Color(0x080b10);
    const panels = [];
    for (const [x, y, z, w, h, color, strength] of [
      [-4, 1, 2, 1.7, 6, 0xe9f1ff, 4.6],
      [4, 1, 2, .8, 5, 0xffead3, 3.2],
      [-.5, 4, 0, 5, 1.2, 0xf3f5ff, 3],
      [0, -2, -4, 5, .4, 0xc9d5df, 2],
      [1.4, .5, 5, 1.4, 5, 0xe6ecf2, 2.4],
      [-2, 0, 5, .35, 6, 0xf5f7ff, 5.4]
    ]) {
      const panel = new Mesh(new BoxGeometry(w,h,.1), new MeshBasicMaterial({color: new Color(color).multiplyScalar(strength)}));
      panel.position.set(x,y,z); panel.lookAt(0,0,0); studio.add(panel); panels.push(panel);
    }
    environment = pmrem.fromScene(studio, .04, .1, 100);
    scene.environment = environment.texture;
    panels.forEach(panel => { panel.geometry.dispose(); panel.material.dispose(); studio.remove(panel); });
    studio.clear(); studio = null;
    pmrem.dispose();
    key = new DirectionalLight(0xfff7e5, 1.65); key.position.set(-500, 700, 900);
    const fill = new DirectionalLight(0xc7defd, .75); fill.position.set(700, 100, 500);
    rim = new DirectionalLight(0xe1e8e8, 1.6); rim.position.set(200, -500, -100);
    scene.add(key, fill, rim, new HemisphereLight(0xe4edff, 0x222b14, .35));
    host.append(canvas);
    resize(); applyTheme();
    // Warm every material before the first visible handoff. Later assembly
    // stages should not introduce a shader-compilation hitch while scrolling.
    await renderer.compileAsync(scene, camera);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    resizeObserver = new ResizeObserver(() => { needsFrame = true; });
    resizeObserver.observe(host);
    themeObserver = new MutationObserver(() => {
      if (theme !== root.dataset.theme) applyTheme();
    });
    themeObserver.observe(root, {attributes: true, attributeFilter: ['data-theme']});
    document.addEventListener('visibilitychange', visibilityChanged);
    document.addEventListener('portfolio:overlay', visibilityChanged);
    ticker.add(draw);
    return {
      get ready() { return ready && !contextLost && !disposed; },
      interact() {
        if (disposed || contextLost || !visible || ticker.time - interactionStart < 1.8) return false;
        interactionStart = ticker.time;
        needsFrame = true;
        return true;
      },
      setPose(next) {
        if ((next.active >= 0 && next.active !== previousActive) || (next.phase === 'footer' && pose.phase !== 'footer')) arrivalStart = ticker.time;
        previousActive = next.active;
        if (Object.keys(next).some(key => next[key] !== pose[key])) needsFrame = true;
        pose = next;
      },
      setPointer(x, y) {
        const next = {x: x * 16, y: -y * 12};
        if (next.x === pointerTarget.x && next.y === pointerTarget.y) return;
        pointerTarget = next; needsFrame = true;
      },
      setVisible(next) { visible = next; needsFrame = true; },
      dispose
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
