/* ─────────────────────────────────────────────
   The map: an orrery of my work.

   Four tilted rings turn slowly around a core, above a polar grid.
   Points on each ring are the nodes in data.js, drawn with a shape per
   ring and dropped to the grid like a 3D plot; faint lines join related
   ones and packets of light travel along them toward the core. A radar
   sweep circles the rings, and asking a question sends a pulse out from
   the core, then beams to the points the answer uses, the way a
   retrieval system pulls its sources. Bloom makes the light glow.

   Motion follows the "motion" class on <html>, which ui.js keeps in step
   with the visitor's choice (on by default).

   Talks to ui.js through window.portfolioScene and
   "portfolio:select" / "portfolio:clear" events.
   ───────────────────────────────────────────── */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const DATA = window.PORTFOLIO;
const TAU = Math.PI * 2;
const stage = document.getElementById("stage");
const calm = () => !document.documentElement.classList.contains("motion");
const calmAtLoad = calm();

const probe = document.createElement("canvas");
if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("WebGL unavailable");

/* ───────────── Colours come from the CSS tokens ───────────── */

const css = getComputedStyle(document.documentElement);
const token = (name) => new THREE.Color(css.getPropertyValue(name).trim());
const COL = {
  ground: token("--ground"),
  orbit: token("--orbit"),
  tick: token("--line-strong"),
  node: token("--node"),
  core: token("--text"),
  accent: token("--accent"),
  dust: token("--muted"),
};

/* ───────────── Renderer, bloom, camera, controls ───────────── */

const renderer = new THREE.WebGLRenderer({ antialias: true });
const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(pixelRatio);
renderer.domElement.className = "stage-canvas";

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = "stage-labels";
stage.prepend(renderer.domElement, labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = COL.ground.clone();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(pixelRatio);
composer.addPass(new RenderPass(scene, camera));
// strength, radius, threshold: only the brightest light blooms
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.62, 0.45, 0.5);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.enableZoom = false; // the page scrolls; the map doesn't hijack the wheel
controls.rotateSpeed = 0.5;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.4;
// sideways drags turn the map, vertical swipes still scroll the page on phones
renderer.domElement.style.touchAction = "pan-y";

const OUTER = Math.max(...DATA.rings.map((r) => r.radius));
const GRID_Y = -2.4;
const home = { dist: 20, polar: 0.98 };

/* ───────────── Shared textures and shapes ───────────── */

function radialTexture(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([at, a]) => grd.addColorStop(at, `rgba(255,255,255,${a})`));
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const GLOW = radialTexture([[0, 1], [0.15, 0.5], [0.45, 0.1], [1, 0]]);
const DOT = radialTexture([[0, 1], [0.45, 1], [0.7, 0.35], [1, 0]]);
const HAZE = radialTexture([[0, 1], [0.3, 0.45], [0.65, 0.1], [1, 0]]);

function loopGeometry(points) {
  return new THREE.BufferGeometry().setFromPoints(points);
}
function circlePoints(r, seg = 48, plane = "xy") {
  const pts = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * TAU;
    pts.push(plane === "xy"
      ? new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)
      : new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  return pts;
}

// one shape per ring: work is a turning octahedron, solved a ring,
// services a diamond, tools a plain point
const OCTA = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.27));
const RING_BADGE = loopGeometry(circlePoints(0.19));
const DIAMOND = loopGeometry([
  new THREE.Vector3(0, 0.23, 0), new THREE.Vector3(0.23, 0, 0),
  new THREE.Vector3(0, -0.23, 0), new THREE.Vector3(-0.23, 0, 0),
]);
const HIT_GEO = new THREE.SphereGeometry(0.4, 8, 6);
const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });

function lineMaterial(color, opacity, extra = {}) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, ...extra });
}
function sprite(map, color, scale, opacity = 0) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map, color: color.clone(), transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  s.scale.setScalar(scale);
  return s;
}
function makeLabel(text, className, ring) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  if (ring) el.dataset.ring = ring;
  return { el, obj: new CSS2DObject(el) };
}

/* ───────────── Atmosphere ───────────── */

const root = new THREE.Group();
scene.add(root);

const hazeNear = sprite(HAZE, COL.accent, 10, 0);
const hazeFar = sprite(HAZE, COL.node, 28, 0);
hazeFar.position.y = -1;
scene.add(hazeFar, hazeNear);

/* The polar grid the instrument stands on. It brightens around the
   pointer, ripples where you click, and carries each pulse outward. */
const gridUniforms = {
  uColor: { value: COL.orbit.clone() },
  uAccent: { value: COL.accent.clone() },
  uOpacity: { value: 0 },
  uCursor: { value: new THREE.Vector2(999, 999) },
  uCursorOn: { value: 0 },
  uPulse: { value: -10 },
  uPulseAmt: { value: 0 },
  uRipple: { value: new THREE.Vector2() },
  uRippleR: { value: 0 },
  uRippleAmt: { value: 0 },
};
const grid = (() => {
  const pts = [];
  for (let r = 1; r <= 13; r++) {
    const seg = r * 24;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * TAU, a1 = ((i + 1) / seg) * TAU;
      pts.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r);
    }
  }
  for (let d = 0; d < 360; d += 15) {
    const a = (d * Math.PI) / 180;
    pts.push(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2, Math.cos(a) * 13, 0, Math.sin(a) * 13);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: gridUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uAccent;
      uniform float uOpacity;
      uniform vec2 uCursor;
      uniform float uCursorOn;
      uniform float uPulse;
      uniform float uPulseAmt;
      uniform vec2 uRipple;
      uniform float uRippleR;
      uniform float uRippleAmt;
      varying vec3 vPos;
      void main() {
        float r = length(vPos.xz);
        float fade = (1.0 - smoothstep(5.5, 13.0, r)) * smoothstep(0.8, 2.2, r);
        float cursor = uCursorOn * (1.0 - smoothstep(0.0, 3.4, distance(vPos.xz, uCursor)));
        float pulse = uPulseAmt * (1.0 - smoothstep(0.0, 0.8, abs(r - uPulse)));
        float ripple = uRippleAmt * (1.0 - smoothstep(0.0, 0.55, abs(distance(vPos.xz, uRipple) - uRippleR)));
        float glow = clamp(cursor + pulse + ripple, 0.0, 1.0);
        vec3 col = mix(uColor, uAccent, glow);
        gl_FragColor = vec4(col, uOpacity * fade * (0.55 + glow * 2.2));
      }`,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.position.y = GRID_Y;
  lines.frustumCulled = false;
  root.add(lines);
  return lines;
})();

/* ───────────── Build the orrery ───────────── */

const hitTargets = [];
const rings = new Map();
const nodes = new Map();
const labels = []; // every label on the map, for keeping them from overlapping

DATA.rings.forEach((ring, ri) => {
  const frame = new THREE.Group();
  frame.rotation.set(ring.tilt[0], 0, ring.tilt[1]);
  root.add(frame);

  // the orbit itself
  const circlePts = circlePoints(ring.radius, 360, "xz");
  circlePts.push(circlePts[0].clone());
  const circleGeo = loopGeometry(circlePts);
  const circleMat = lineMaterial(COL.orbit, 0.9);
  frame.add(new THREE.Line(circleGeo, circleMat));

  // a scale of ticks: every 5°, longer every 30°
  const tickPts = [];
  for (let d = 0; d < 360; d += 5) {
    const a = (d * Math.PI) / 180;
    const len = d % 30 === 0 ? 0.2 : 0.08;
    const c = Math.cos(a), s = Math.sin(a);
    tickPts.push(
      new THREE.Vector3(c * ring.radius, 0, s * ring.radius),
      new THREE.Vector3(c * (ring.radius + len), 0, s * (ring.radius + len))
    );
  }
  const tickGeo = loopGeometry(tickPts);
  const tickMat = lineMaterial(COL.tick, 0.9);
  frame.add(new THREE.LineSegments(tickGeo, tickMat));

  // the ring's name sits on the scale and does not turn
  const tag = makeLabel(ring.label, "ring-label");
  tag.obj.position.set(ring.radius + 0.28, 0, 0);
  tag.obj.center.set(0, 0.5);
  frame.add(tag.obj);

  // the points travel on their own group
  const orbit = new THREE.Group();
  frame.add(orbit);

  // a belt of fine particles travelling with the ring
  const beltCount = Math.round(ring.radius * 16);
  const belt = new Float32Array(beltCount * 3);
  for (let i = 0; i < beltCount; i++) {
    const a = Math.random() * TAU;
    const r = ring.radius + (Math.random() - 0.5) * 0.3;
    belt.set([Math.cos(a) * r, (Math.random() - 0.5) * 0.08, Math.sin(a) * r], i * 3);
  }
  const beltGeo = new THREE.BufferGeometry();
  beltGeo.setAttribute("position", new THREE.BufferAttribute(belt, 3));
  const beltMat = new THREE.PointsMaterial({
    color: COL.node, map: DOT, size: 0.035, sizeAttenuation: true,
    transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  orbit.add(new THREE.Points(beltGeo, beltMat));

  const list = DATA.nodes.filter((n) => n.ring === ring.id);
  const size = ri === 0 ? 0.1 : ri === DATA.rings.length - 1 ? 0.065 : 0.08;
  const tail = Math.sign(ring.speed) || 1; // points move toward lower angles when speed > 0
  const trailLength = 2.2 / ring.radius;

  list.forEach((n, i) => {
    const a = 0.45 + ri * 0.8 + (i / list.length) * TAU;
    const mat = new THREE.MeshBasicMaterial({ color: COL.node.clone(), transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), mat);
    mesh.position.set(Math.cos(a) * ring.radius, 0, Math.sin(a) * ring.radius);
    orbit.add(mesh);

    const hit = new THREE.Mesh(HIT_GEO, HIT_MAT);
    hit.userData.id = n.id;
    mesh.add(hit);
    hitTargets.push(hit);

    const aura = sprite(GLOW, COL.node, ri === 0 ? 1.5 : 1.0);
    mesh.add(aura);

    let octa = null;
    if (ri === 0) {
      octa = new THREE.LineSegments(OCTA, lineMaterial(COL.node.clone(), 0.8));
      octa.rotation.set(Math.random(), Math.random(), 0);
      mesh.add(octa);
    }

    const label = makeLabel(n.label, "node-label", ring.id);
    label.obj.center.set(0, 0.5);
    mesh.add(label.obj);

    // things that always face the camera: the badge and the selection halo
    const bill = new THREE.Group();
    scene.add(bill);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.352, 64),
      new THREE.MeshBasicMaterial({ color: COL.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    bill.add(halo);
    let badge = null;
    if (ri === 1) badge = new THREE.LineLoop(RING_BADGE, lineMaterial(COL.node.clone(), 0.6));
    if (ri === 2) badge = new THREE.LineLoop(DIAMOND, lineMaterial(COL.node.clone(), 0.6));
    if (badge) bill.add(badge);

    // a fading trail behind the point as it travels
    const S = 48;
    const trailPts = [];
    const trailCol = [];
    for (let k = 0; k <= S; k++) {
      const u = k / S;
      const ang = a + tail * trailLength * u;
      trailPts.push(new THREE.Vector3(Math.cos(ang) * ring.radius, 0, Math.sin(ang) * ring.radius));
      trailCol.push(COL.node.r, COL.node.g, COL.node.b, Math.pow(1 - u, 1.6));
    }
    const trailGeo = loopGeometry(trailPts);
    trailGeo.setAttribute("color", new THREE.Float32BufferAttribute(trailCol, 4));
    const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false });
    orbit.add(new THREE.Line(trailGeo, trailMat));

    const node = {
      id: n.id, label: n.label, ring: ring.id, ri, order: i,
      mesh, mat, aura, octa, bill, halo, badge, trailMat, el: label.el,
      level: 0, lit: 0, appear: 0, swept: 0,
    };
    nodes.set(n.id, node);
    labels.push({ el: label.el, obj: label.obj, node, cx: 0, cy: 0.5, vis: 1, base: 0, prio: 0 });
  });

  const record = {
    ...ring, ri, frame, orbit, circleGeo, circleMat, tickGeo, tickMat, beltMat,
    tickCount: tickPts.length, emphasis: 0.85, tagBase: 0,
  };
  rings.set(ring.id, record);
  labels.push({ el: tag.el, obj: tag.obj, ring: record, cx: 0, cy: 0.5, vis: 1, base: 0, prio: 0 });
});

/* The core: that's you */
const coreGroup = new THREE.Group();
root.add(coreGroup);
const coreMat = new THREE.MeshBasicMaterial({ color: COL.core.clone(), transparent: true, depthWrite: false });
const core = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 20), coreMat);
coreGroup.add(core);
const coreHit = new THREE.Mesh(HIT_GEO, HIT_MAT);
coreHit.userData.id = "core";
core.add(coreHit);
hitTargets.push(coreHit);
const coreAura = sprite(GLOW, COL.core, 2.2);
core.add(coreAura);
const coreLabel = makeLabel(DATA.name, "core-label");
coreLabel.obj.center.set(0.5, 1);
coreLabel.obj.position.set(0, 1.25, 0);
core.add(coreLabel.obj);

// a geodesic cage and an equator around the core
const cageMat = lineMaterial(COL.orbit.clone(), 0.9);
const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.6, 1)), cageMat);
coreGroup.add(cage);
const equator = new THREE.LineLoop(loopGeometry(circlePoints(0.95, 96, "xz")), lineMaterial(COL.orbit, 0.7));
coreGroup.add(equator);
const axis = new THREE.Line(
  loopGeometry([new THREE.Vector3(0, GRID_Y, 0), new THREE.Vector3(0, 1.8, 0)]),
  lineMaterial(COL.orbit, 0.55)
);
coreGroup.add(axis);

const coreBill = new THREE.Group();
scene.add(coreBill);
const coreHalo = new THREE.Mesh(
  new THREE.RingGeometry(1.05, 1.064, 96),
  new THREE.MeshBasicMaterial({ color: COL.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
);
coreBill.add(coreHalo);

const coreNode = {
  id: "core", label: DATA.name, ring: null, ri: -1, order: 0,
  mesh: core, mat: coreMat, aura: coreAura, octa: null, bill: coreBill, halo: coreHalo, badge: null, trailMat: null,
  el: coreLabel.el, level: 0, lit: 0, appear: 0, swept: 0,
};
nodes.set("core", coreNode);
labels.push({ el: coreLabel.el, obj: coreLabel.obj, node: coreNode, cx: 0.5, cy: 1, vis: 1, base: 0, prio: 0 });

/* Stars: a field of faint points that twinkle at their own pace */
const starUniforms = {
  uColor: { value: COL.dust.clone() },
  uMap: { value: DOT },
  uTime: { value: 0 },
  uPx: { value: 400 },
  uOpacity: { value: 0 },
  uMotion: { value: calmAtLoad ? 0 : 1 },
};
const stars = (() => {
  const N = 700;
  const pos = new Float32Array(N * 3);
  const phase = new Float32Array(N);
  const sizes = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 2 + Math.pow(Math.random(), 0.55) * 14;
    const a = Math.random() * TAU;
    pos.set([Math.cos(a) * r, (Math.random() - 0.35) * (1.5 + r * 0.55), Math.sin(a) * r], i * 3);
    phase[i] = Math.random();
    sizes[i] = 0.025 + Math.pow(Math.random(), 4) * 0.09;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSize;
      uniform float uTime;
      uniform float uPx;
      uniform float uMotion;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPx / -mv.z;
        float speed = 0.5 + fract(aPhase * 7.13) * 1.6;
        vA = mix(0.7, 0.45 + 0.55 * sin(uTime * speed + aPhase * 6.2831), uMotion);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying float vA;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        gl_FragColor = vec4(uColor, a * vA * uOpacity);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  root.add(points);
  return points;
})();

/* ───────────── The sweep: a radar arm circling the rings ───────────── */

const SWEEP_WIDTH = 0.6;
const sweep = new THREE.Group();
root.add(sweep);
const sweepMat = (() => {
  const SEG = 40;
  const geo = new THREE.CircleGeometry(OUTER + 0.5, SEG, 0, SWEEP_WIDTH);
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    // vertex 0 is the centre; the arc runs from trailing (1) to leading (SEG + 1)
    const u = i === 0 ? 0 : (i - 1) / SEG;
    colors.set([COL.accent.r, COL.accent.g, COL.accent.b, i === 0 ? 0.02 : Math.pow(u, 2.2) * 0.22], i * 4);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const wedge = new THREE.Mesh(geo, mat);
  wedge.rotation.x = -Math.PI / 2;
  sweep.add(wedge);
  return mat;
})();
const sweepEdgeMat = lineMaterial(COL.accent, 0, { blending: THREE.AdditiveBlending });
sweep.add(new THREE.Line(
  loopGeometry([new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(SWEEP_WIDTH) * (OUTER + 0.5), 0, -Math.sin(SWEEP_WIDTH) * (OUTER + 0.5))]),
  sweepEdgeMat
));

/* ───────────── Pulses: rings of light that spread from the core ───────────── */

const pulses = Array.from({ length: 3 }, () => {
  const mat = new THREE.MeshBasicMaterial({
    color: COL.accent, transparent: true, opacity: 0, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 160), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  root.add(mesh);
  return { mesh, mat, start: -1, strength: 1 };
});
let pulseNext = 0;
let lastPulse = null;
function pulse(strength = 1) {
  if (calm()) return;
  const p = pulses[pulseNext++ % pulses.length];
  p.start = performance.now();
  p.strength = strength;
  p.mesh.visible = true;
  lastPulse = p;
}

const ripple = { start: -1 };

/* ───────────── Edges, highlighted edges, beams, drops, packets ───────────── */

const workIds = DATA.nodes.filter((n) => n.ring === DATA.rings[0].id).map((n) => n.id);
const pairs = [...DATA.edges, ...workIds.map((id) => ["core", id])].filter(([a, b]) => nodes.has(a) && nodes.has(b));

const adjacency = new Map([...nodes.keys()].map((id) => [id, new Set()]));
pairs.forEach(([a, b]) => { adjacency.get(a).add(b); adjacency.get(b).add(a); });

function segmentBuffer(count, color, opacity, extra) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 6), 3));
  geo.setDrawRange(0, 0);
  const mat = lineMaterial(color, opacity, extra);
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  scene.add(lines);
  return { geo, mat, pos: geo.attributes.position };
}

const edges = segmentBuffer(pairs.length, COL.orbit, 0.2);
const hot = segmentBuffer(pairs.length, COL.accent, 0.7);
const beams = segmentBuffer(nodes.size, COL.accent, 0.9, { blending: THREE.AdditiveBlending });

// drop lines from every point to the grid, with a mark where each lands
const nodeList = [...nodes.values()].filter((n) => n.ring);
const dropGeo = new THREE.BufferGeometry();
dropGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nodeList.length * 6), 3));
dropGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nodeList.length * 8), 4));
const dropMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const dropLines = new THREE.LineSegments(dropGeo, dropMat);
dropLines.frustumCulled = false;
scene.add(dropLines);
const footGeo = new THREE.BufferGeometry();
footGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nodeList.length * 3), 3));
footGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nodeList.length * 4), 4));
const footMat = new THREE.PointsMaterial({
  map: DOT, size: 0.09, sizeAttenuation: true, vertexColors: true,
  transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
});
const feet = new THREE.Points(footGeo, footMat);
feet.frustumCulled = false;
scene.add(feet);

// packets travel from the outer point of a link toward the inner one
const PACKETS = 48;
const packetGeo = new THREE.BufferGeometry();
packetGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PACKETS * 3), 3));
packetGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(PACKETS * 4), 4));
const packetMat = new THREE.PointsMaterial({
  map: DOT, size: 0.12, sizeAttenuation: true, vertexColors: true,
  transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
});
const packetPoints = new THREE.Points(packetGeo, packetMat);
packetPoints.frustumCulled = false;
scene.add(packetPoints);
const packets = Array.from({ length: PACKETS }, () => ({ route: null, t: Math.random(), speed: 0.16 + Math.random() * 0.2 }));

const rank = (id) => nodes.get(id).ri;
const inward = ([a, b]) => (rank(a) >= rank(b) ? [a, b] : [b, a]);

/* ───────────── State ───────────── */

const state = {
  active: new Set(), // points lit by an answer or a selection
  focus: null,       // the selected point, if any
  hover: null,
  ringFocus: null,   // a ring the visitor is pointing at in the legend
  retrieving: false,
  hotPairs: [],
  beamIds: [],
  beamStart: 0,
  routes: pairs.map(inward),
  lens: new Set(),
  spin: calmAtLoad ? 0 : 1,
  sweepAngle: 0,
  sweepSpeed: 0.7,
  dragging: false,
  turnTo: null,
  turnUntil: 0,
  px: 0, py: 0,      // pointer, for parallax
  cursorOn: 0,
  exit: 0,           // how far the map has scrolled away
  insetL: 0,         // width covered on the left (the introduction column)
  insetR: 0,         // width covered on the right (the readout card)
  curL: 0,
  curR: 0,
  nextIdlePulse: performance.now() + 4000,
};

const world = new Map([...nodes.keys()].map((id) => [id, new THREE.Vector3()]));

function refresh() {
  const f = state.focus || (state.active.size ? null : state.hover);
  state.hotPairs = pairs.filter(([a, b]) =>
    f ? a === f || b === f : state.active.has(a) && state.active.has(b)
  );
  // packets follow whatever is lit; with nothing lit they wander every link
  const lit = [...state.beamIds.map((id) => [id, "core"]), ...state.hotPairs];
  state.routes = (lit.length ? lit : pairs).map(inward);
  packets.forEach((p) => { p.route = null; });
}

function aim(ids) {
  // turn the camera round to face what was found
  if (!ids.length) { state.turnTo = null; return; }
  scene.updateMatrixWorld();
  const c = new THREE.Vector3();
  ids.forEach((id) => c.add(nodes.get(id).mesh.getWorldPosition(new THREE.Vector3())));
  c.divideScalar(ids.length);
  if (Math.hypot(c.x, c.z) < 0.8) { state.turnTo = null; return; }
  state.turnTo = Math.atan2(c.x, c.z);
  state.turnUntil = performance.now() + 1800;
}

function retrieve() {
  state.retrieving = true;
  state.active = new Set();
  state.focus = null;
  state.beamIds = [];
  refresh();
  pulse(1);
}

function highlight(ids) {
  const list = ids.filter((id) => nodes.has(id));
  state.retrieving = false;
  state.active = new Set(list);
  state.focus = null;
  state.beamIds = list.filter((id) => id !== "core");
  state.beamStart = performance.now();
  refresh();
  aim(state.beamIds);
  if (list.length) pulse(0.6);
}

function select(id) {
  if (!nodes.has(id)) return;
  state.retrieving = false;
  state.focus = id;
  state.active = new Set([id, ...adjacency.get(id)]);
  state.beamIds = id === "core" ? [] : [id];
  state.beamStart = performance.now();
  refresh();
  aim(id === "core" ? [] : [id]);
  pulse(0.5);
}

function clear() {
  state.retrieving = false;
  state.active = new Set();
  state.focus = null;
  state.beamIds = [];
  state.turnTo = null;
  refresh();
}

function setLens(name) {
  const lens = DATA.lenses[name] || DATA.lenses.none;
  state.lens = new Set(lens.rings);
}

function focusRing(id) { state.ringFocus = rings.has(id) ? id : null; }

// how much of the stage is covered at each side; the map centres itself
// in what is left, and eases there when these change
let insetsKnown = false;
function setInsets(left, right) {
  state.insetL = Math.max(0, left || 0);
  state.insetR = Math.max(0, right || 0);
  if (!insetsKnown) {
    // the first time, start there rather than sliding in from the middle
    insetsKnown = true;
    state.curL = state.insetL;
    state.curR = state.insetR;
    placeCamera();
  }
}

/* ───────────── Pointer: hover, click, parallax, the grid light ───────────── */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const canvas = renderer.domElement;
const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GRID_Y);
const gridHit = new THREE.Vector3();
let downAt = null;

function aimRay(e) {
  const r = canvas.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
}
function pick(e) {
  aimRay(e);
  const hit = raycaster.intersectObjects(hitTargets, false)[0];
  return hit ? hit.object.userData.id : null;
}
function pointOnGrid(e) {
  aimRay(e);
  if (!raycaster.ray.intersectPlane(gridPlane, gridHit)) return null;
  return root.worldToLocal(gridHit);
}

function setHover(id) {
  if (id === state.hover) return;
  state.hover = id;
  canvas.style.cursor = id ? "pointer" : "";
  refresh();
}

canvas.addEventListener("pointermove", (e) => {
  const g = pointOnGrid(e);
  if (g) { gridUniforms.uCursor.value.set(g.x, g.z); state.cursorOn = 1; }
  if (e.pointerType !== "mouse" || state.dragging) return;
  setHover(pick(e));
});
canvas.addEventListener("pointerleave", () => { setHover(null); state.cursorOn = 0; });
canvas.addEventListener("pointerdown", (e) => { downAt = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6) return;
  const id = pick(e);
  if (id) {
    select(id);
    document.dispatchEvent(new CustomEvent("portfolio:select", { detail: { id } }));
    return;
  }
  // a click on empty space sends a ripple across the grid
  const g = pointOnGrid(e);
  if (g && !calm()) {
    gridUniforms.uRipple.value.set(g.x, g.z);
    ripple.start = performance.now();
  }
  if (state.active.size) {
    clear();
    document.dispatchEvent(new CustomEvent("portfolio:clear"));
  }
});

controls.addEventListener("start", () => { state.dragging = true; state.turnUntil = 0; setHover(null); });
controls.addEventListener("end", () => { state.dragging = false; });

window.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const r = stage.getBoundingClientRect();
  if (e.clientY < r.top || e.clientY > r.bottom) return;
  state.px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
  state.py = ((e.clientY - r.top) / r.height) * 2 - 1;
});

function onScroll() {
  const r = stage.getBoundingClientRect();
  state.exit = Math.min(1, Math.max(0, -r.top / r.height));
  stage.style.setProperty("--exit", state.exit.toFixed(3));
}
window.addEventListener("scroll", onScroll, { passive: true });

/* ───────────── Sizing ───────────── */

let narrow = false;
const view = { w: 1, h: 1 };
const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

function fit() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  view.w = w;
  view.h = h;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.resolution.set(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  starUniforms.uPx.value = h * pixelRatio * 0.5;
  narrow = window.innerWidth < 1024;
  // look down from a height that opens the rings up; higher still on phones
  home.polar = narrow ? 0.82 : 0.98;
  home.dist = distanceFor(w - state.curL - state.curR * 0.5, h);
  labels.forEach((l) => { l.w = 0; }); // measure again at the new size
}

// how far back the camera sits so the rings fill the free width and fit the height
function distanceFor(freeW, h) {
  const fill = narrow ? 0.94 : 0.9;
  const byWidth = (OUTER * 1.06) / (fill * halfTan * (Math.max(200, freeW) / h));
  const lift = Math.sin(Math.PI / 2 - home.polar);
  const byHeight = (OUTER * (lift + 0.3)) / (0.84 * halfTan);
  return Math.max(12, byWidth, byHeight);
}

let placed = false;
function placeCamera() {
  state.curL = state.insetL;
  fit();
  camera.position.setFromSphericalCoords(home.dist, home.polar, 0.35);
  controls.target.set(0, 0, 0);
  controls.update();
  placed = true;
}

new ResizeObserver(() => { if (placed) fit(); else placeCamera(); }).observe(stage);

/* ───────────── The instrument readout ───────────── */

const hud = {
  a: document.getElementById("hud-a"),
  b: document.getElementById("hud-b"),
  c: document.getElementById("hud-c"),
  last: ["", "", ""],
};
const pointCount = DATA.nodes.length;

function writeHud(sph) {
  const az = ((THREE.MathUtils.radToDeg(sph.theta) % 360) + 360) % 360;
  const el = 90 - THREE.MathUtils.radToDeg(sph.phi);
  let status;
  if (state.retrieving) status = "RETRIEVING…";
  else if (state.focus) status = `SELECTED · ${nodes.get(state.focus).label.toUpperCase()}`;
  else if (state.active.size) status = `RETRIEVED ${state.beamIds.length || state.active.size} OF ${pointCount}`;
  else if (state.hover) status = `POINTING AT · ${nodes.get(state.hover).label.toUpperCase()}`;
  else if (state.ringFocus) status = `RING · ${rings.get(state.ringFocus).label.toUpperCase()}`;
  else if (calm()) status = "STILL · MOTION OFF";
  else status = state.spin > 0.5 ? "SCANNING" : "HELD";
  const lines = [
    `${DATA.rings.length} RINGS · ${pointCount} POINTS · ${pairs.length} LINKS`,
    `AZ ${az.toFixed(1).padStart(5, "0")}° · EL ${el.toFixed(1)}°`,
    status,
  ];
  ["a", "b", "c"].forEach((k, i) => {
    if (hud[k] && lines[i] !== hud.last[i]) { hud[k].textContent = lines[i]; hud.last[i] = lines[i]; }
  });
}

/* ───────────── Keeping labels apart ─────────────
   Each frame, labels are placed in order of importance; one that would
   overlap a more important one fades out until there's room again. */

const screen = new THREE.Vector3();
function settleLabels(k) {
  const tiny = view.w < 600;
  const boxes = [];
  for (const l of labels) {
    l.target = 1;
    if (l.base < 0.06) continue;
    if (tiny && (l.ring || (l.node && l.node.ring && l.node.ring !== "work" && l.node.lit < 0.5))) continue;
    if (!l.w) {
      if (!l.el.isConnected || l.el.style.display === "none") continue;
      l.w = l.el.offsetWidth;
      l.h = l.el.offsetHeight;
      l.pad = parseFloat(getComputedStyle(l.el).paddingLeft) || 0;
      if (!l.w) continue;
    }
    screen.setFromMatrixPosition(l.obj.matrixWorld).project(camera);
    if (screen.z > 1) continue;
    const x = (screen.x * 0.5 + 0.5) * view.w;
    const y = (-screen.y * 0.5 + 0.5) * view.h;
    const left = x - l.cx * l.w + l.pad;
    const top = y - l.cy * l.h;
    boxes.push({ l, x0: left - 4, x1: left + l.w - l.pad + 4, y0: top - 2, y1: top + l.h + 2, prio: l.prio + (l.vis > 0.5 ? 0.35 : 0) });
  }
  boxes.sort((a, b) => b.prio - a.prio);
  const kept = [];
  for (const b of boxes) {
    const clash = kept.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
    b.l.target = clash ? 0 : 1;
    if (!clash) kept.push(b);
  }
  for (const l of labels) {
    l.vis += (l.target - l.vis) * Math.min(1, k * 1.8);
    l.el.style.opacity = (l.base * l.vis).toFixed(2);
  }
}

/* ───────────── Animation ───────────── */

const t0 = performance.now();
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (v) => 1 - Math.pow(1 - clamp01(v), 3);
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const local = new THREE.Vector3();
const camDir = new THREE.Vector3();
const sph = new THREE.Spherical();
const offset = new THREE.Vector3();
const focusPoint = new THREE.Vector3();

function wrap(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

function writeSegments(buf, list, ends) {
  list.forEach((item, i) => {
    const [a, b] = ends(item, i);
    buf.pos.setXYZ(i * 2, a.x, a.y, a.z);
    buf.pos.setXYZ(i * 2 + 1, b.x, b.y, b.z);
  });
  buf.pos.needsUpdate = true;
  buf.geo.setDrawRange(0, list.length * 2);
}

let last = performance.now();
let running = false;

function frame(now) {
  if (!running) return;
  const still = calm();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = (now - t0) / 1000 + (calmAtLoad ? 99 : 0);
  const k = still ? 1 : 1 - Math.pow(0.001, dt); // frame-rate independent easing

  // rings turn unless something has the visitor's attention
  const anyActive = state.active.size > 0;
  const held = still || anyActive || state.hover || state.dragging || state.ringFocus;
  state.spin += ((held ? 0 : 1) - state.spin) * k * 0.6;

  // the whole instrument leans toward the pointer, and tips away as you scroll past
  const leanX = still ? 0 : state.py * 0.05 + state.exit * 0.5;
  const leanZ = still ? 0 : -state.px * 0.04;
  root.rotation.x += (leanX - root.rotation.x) * k * 0.4;
  root.rotation.z += (leanZ - root.rotation.z) * k * 0.4;

  for (const ring of rings.values()) {
    ring.orbit.rotation.y += ring.speed * dt * state.spin;

    let emphasis = 0.85;
    if (anyActive) emphasis = [...state.active].some((id) => nodes.get(id).ring === ring.id) ? 1 : 0.4;
    else if (state.ringFocus) emphasis = state.ringFocus === ring.id ? 1.2 : 0.25;
    else if (state.lens.size) emphasis = state.lens.has(ring.id) ? 1 : 0.35;
    ring.emphasis += (emphasis - ring.emphasis) * k;

    const draw = ease((t - ring.ri * 0.16) / 1.3);
    ring.circleGeo.setDrawRange(0, Math.floor(draw * 361));
    ring.tickGeo.setDrawRange(0, Math.floor((draw * ring.tickCount) / 2) * 2);
    ring.circleMat.color.copy(COL.orbit).lerp(COL.accent, clamp01(ring.emphasis - 1) * 3);
    ring.circleMat.opacity = Math.min(1, 0.35 + ring.emphasis * 0.65);
    ring.tickMat.opacity = Math.min(1, 0.2 + ring.emphasis * 0.7);
    ring.beltMat.opacity = draw * Math.min(1, ring.emphasis) * 0.45;
    ring.tagBase = draw * Math.min(1, 0.3 + ring.emphasis * 0.7);
  }

  // the core's cage turns slowly on its own
  cage.rotation.y += still ? 0 : dt * 0.12;
  cage.rotation.x += still ? 0 : dt * 0.05;
  const coreIn = ease(t / 0.9);
  coreGroup.scale.setScalar(0.3 + 0.7 * coreIn);
  cageMat.opacity = coreIn * (state.focus === "core" ? 1 : 0.75);
  cageMat.color.copy(COL.orbit).lerp(COL.accent, Math.max(coreNode.lit * 0.8, state.retrieving ? 0.9 : 0));

  // atmosphere: stars, haze, the grid
  starUniforms.uTime.value = t;
  starUniforms.uMotion.value += ((still ? 0 : 1) - starUniforms.uMotion.value) * k;
  starUniforms.uOpacity.value = ease((t - 0.8) / 1.5) * 0.85;
  stars.rotation.y += still ? 0 : dt * 0.006 * (0.3 + state.spin);
  hazeNear.material.opacity = ease((t - 0.3) / 1.5) * (state.retrieving ? 0.14 : anyActive ? 0.09 : 0.06);
  hazeFar.material.opacity = ease((t - 0.3) / 1.5) * 0.035;
  gridUniforms.uOpacity.value = ease((t - 0.4) / 1.6) * 0.75;
  gridUniforms.uCursorOn.value += (state.cursorOn - gridUniforms.uCursorOn.value) * k * 0.5;

  // the sweep circles the rings; it rests while something is lit
  const sweepOn = still ? 0 : ease((t - 2) / 1.2) * (anyActive ? 0.25 : 1);
  state.sweepSpeed += ((state.retrieving ? 5 : 0.7) - state.sweepSpeed) * k;
  if (!still) state.sweepAngle += state.sweepSpeed * dt;
  sweep.rotation.y = state.sweepAngle;
  sweepMat.opacity = sweepOn;
  sweepEdgeMat.opacity = sweepOn * 0.45;
  const lead = wrap(-SWEEP_WIDTH - state.sweepAngle); // world angle of the leading edge

  // pulses spread from the core; a faint one every few seconds when idle
  if (!still && !anyActive && now > state.nextIdlePulse && t > 3) {
    pulse(0.35);
    state.nextIdlePulse = now + 7000;
  }
  pulses.forEach((p) => {
    if (p.start < 0) return;
    const u = (now - p.start) / 1700;
    if (u >= 1 || still) { p.start = -1; p.mesh.visible = false; return; }
    const r = 0.6 + ease(u) * (OUTER + 0.8);
    p.mesh.scale.setScalar(r);
    p.mat.opacity = Math.pow(1 - u, 2) * 0.75 * p.strength;
    if (p === lastPulse) {
      gridUniforms.uPulse.value = r * 1.25;
      gridUniforms.uPulseAmt.value = (1 - u) * p.strength;
    }
  });
  if (!lastPulse || lastPulse.start < 0) gridUniforms.uPulseAmt.value = 0;
  if (ripple.start >= 0) {
    const u = (now - ripple.start) / 1400;
    if (u >= 1) { ripple.start = -1; gridUniforms.uRippleAmt.value = 0; }
    else { gridUniforms.uRippleR.value = ease(u) * 5; gridUniforms.uRippleAmt.value = 1 - u; }
  }

  scene.updateMatrixWorld();
  camera.getWorldDirection(camDir);
  const hoverNeighbours = state.hover ? adjacency.get(state.hover) : null;

  for (const n of nodes.values()) {
    const p = world.get(n.id);
    n.mesh.getWorldPosition(p);

    let level;
    if (n.id === state.hover) level = 1;
    else if (anyActive) level = state.active.has(n.id) ? 1 : 0.16;
    else if (state.hover) level = hoverNeighbours.has(n.id) ? 0.85 : 0.3;
    else if (state.ringFocus && n.ring) level = state.ringFocus === n.ring ? 1 : 0.2;
    else if (state.lens.size && n.ring) level = state.lens.has(n.ring) ? 0.95 : 0.3;
    else level = 0.7;
    n.level += (level - n.level) * k;

    const lit = n.id === state.hover || n.id === state.focus || (anyActive && !state.focus && state.active.has(n.id));
    n.lit += ((lit ? 1 : 0) - n.lit) * k;

    // a point flashes as the sweep passes over it, then fades
    if (n.ring && sweepOn > 0.3) {
      const behind = wrap(Math.atan2(p.z, p.x) - lead);
      if (behind >= 0 && behind < 0.12) n.swept = 1;
    }
    n.swept = Math.max(0, n.swept - dt * 1.1);

    n.appear = n.id === "core" ? coreIn : ease((t - 0.55 - n.ri * 0.14 - n.order * 0.05) / 0.6);

    const base = n.id === "core" ? COL.core : COL.node;
    const glow = Math.max(n.lit, n.swept * 0.7 * sweepOn);
    n.mat.color.copy(base).lerp(COL.accent, glow);
    n.mat.opacity = (0.25 + Math.max(n.level, n.swept * 0.9) * 0.75) * n.appear;
    if (n.id !== "core") n.mesh.scale.setScalar((1 + n.lit * 0.35 + n.swept * 0.25) * (0.4 + 0.6 * n.appear));

    const breathe = still ? 1 : 1 + 0.25 * Math.sin(t * 1.6 + n.order * 1.3 + n.ri * 2);
    n.aura.material.color.copy(base).lerp(COL.accent, glow);
    n.aura.material.opacity = n.appear * ((n.ri <= 0 ? 0.12 : 0.05) * n.level * breathe + n.lit * 0.55 + n.swept * 0.4 * sweepOn);

    if (n.octa) {
      if (!still) n.octa.rotation.y += dt * 0.5;
      n.octa.material.color.copy(COL.node).lerp(COL.accent, glow);
      n.octa.material.opacity = n.appear * (0.2 + n.level * 0.6);
    }
    if (n.badge) {
      n.badge.material.color.copy(COL.node).lerp(COL.accent, glow);
      n.badge.material.opacity = n.appear * (0.12 + n.level * 0.5);
    }
    if (n.trailMat) n.trailMat.opacity = n.appear * state.spin * (n.ri === 0 ? 0.55 : 0.3) * n.level;

    n.bill.position.copy(p);
    n.bill.quaternion.copy(camera.quaternion);
    n.halo.material.opacity = n.lit * 0.9 * n.appear;

    // points on the far side of the map read quieter
    const depth = tmp.copy(p).sub(controls.target).dot(camDir) / OUTER;
    n.near = 1 - 0.55 * clamp01((depth + 1) / 2);
    n.el.classList.toggle("is-hot", n.lit > 0.5);
  }

  // label importance: lit and pointed-at first, then the work ring, then the rest
  for (const l of labels) {
    if (l.node) {
      const n = l.node;
      l.base = n.appear * clamp01(Math.max(n.level, n.swept * 0.8) * 1.1) * n.near;
      l.prio = n.lit * 10 + (n.id === state.hover ? 10 : 0) + n.level * 2 + (n.ri === 0 ? 1.5 : 0) + (n.id === "core" ? 2.5 : 0) + n.near;
    } else {
      l.base = l.ring.tagBase;
      l.prio = 0.4 * l.ring.emphasis;
    }
  }

  // drop lines: from each point straight down to the grid
  {
    const pos = dropGeo.attributes.position;
    const col = dropGeo.attributes.color;
    const fpos = footGeo.attributes.position;
    const fcol = footGeo.attributes.color;
    nodeList.forEach((n, i) => {
      const p = world.get(n.id);
      local.copy(p);
      root.worldToLocal(local);
      local.y = GRID_Y;
      root.localToWorld(local);
      pos.setXYZ(i * 2, p.x, p.y, p.z);
      pos.setXYZ(i * 2 + 1, local.x, local.y, local.z);
      const c = n.lit > 0.5 ? COL.accent : COL.node;
      const a = n.appear * (0.1 + n.level * 0.14 + n.lit * 0.5);
      col.setXYZW(i * 2, c.r, c.g, c.b, a);
      col.setXYZW(i * 2 + 1, c.r, c.g, c.b, 0);
      fpos.setXYZ(i, local.x, local.y, local.z);
      fcol.setXYZW(i, c.r, c.g, c.b, n.appear * (0.25 + n.level * 0.3 + n.lit * 0.6));
    });
    pos.needsUpdate = col.needsUpdate = fpos.needsUpdate = fcol.needsUpdate = true;
    dropMat.opacity = ease((t - 1.2) / 1);
    footMat.opacity = ease((t - 1.2) / 1);
  }

  // faint lines between related points, fading in after the rings
  const linksIn = clamp01((t - 1.5) / 0.8);
  writeSegments(edges, pairs, ([a, b]) => [world.get(a), world.get(b)]);
  edges.mat.opacity = linksIn * (anyActive || state.hover ? 0.08 : 0.2);
  writeSegments(hot, state.hotPairs, ([a, b]) => [world.get(a), world.get(b)]);

  // beams draw outward from the core, one after another
  const origin = world.get("core");
  const beamEnds = state.beamIds.map((id, i) => {
    const grow = still ? 1 : ease((now - state.beamStart - i * 90) / 650);
    return tmp2.copy(origin).lerp(world.get(id), grow).clone();
  });
  writeSegments(beams, state.beamIds, (id, i) => [origin, beamEnds[i]]);

  // packets of light moving inward along the links
  {
    const pos = packetGeo.attributes.position;
    const col = packetGeo.attributes.color;
    const pace = state.retrieving ? 3 : anyActive ? 1.7 : 1;
    packets.forEach((pk, i) => {
      if (!still) pk.t += pk.speed * dt * pace;
      if (!pk.route || pk.t >= 1) {
        pk.route = state.routes[Math.floor(Math.random() * state.routes.length)];
        if (pk.t >= 1) pk.t = 0;
      }
      const [from, to] = pk.route;
      tmp.copy(world.get(from)).lerp(world.get(to), pk.t);
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
      col.setXYZW(i, COL.accent.r, COL.accent.g, COL.accent.b, Math.sin(Math.PI * pk.t));
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
    packetMat.opacity = still ? 0 : linksIn * (anyActive || state.hover || state.retrieving ? 1 : 0.6);
  }

  // camera: drift toward what's lit, and turn to face it for a moment
  if (anyActive) {
    focusPoint.set(0, 0, 0);
    state.active.forEach((id) => focusPoint.add(world.get(id)));
    focusPoint.divideScalar(state.active.size).multiplyScalar(0.45);
  } else {
    focusPoint.set(0, 0, 0);
  }
  controls.target.lerp(focusPoint, k * 0.5);

  // the map centres itself in the free space between the introduction
  // column and the readout card, easing as either comes or goes
  state.curL += ((narrow ? 0 : state.insetL) - state.curL) * k * 0.55;
  state.curR += ((narrow ? 0 : state.insetR) - state.curR) * k * 0.55;
  home.dist = distanceFor(view.w - state.curL - state.curR * 0.5, view.h);

  offset.copy(camera.position).sub(controls.target);
  sph.setFromVector3(offset);
  const dist = (anyActive ? home.dist * 0.86 : home.dist) * (1 + state.exit * 0.2);
  sph.radius += (dist - sph.radius) * k * 0.5;
  if (state.turnTo !== null && now < state.turnUntil && !state.dragging) {
    sph.theta += wrap(state.turnTo - sph.theta) * k * 0.5;
  }
  offset.setFromSpherical(sph);
  camera.position.copy(controls.target).add(offset);
  controls.update();
  camera.setViewOffset(view.w, view.h, -(state.curL - state.curR) / 2, 0, view.w, view.h);
  writeHud(sph);

  scene.updateMatrixWorld();
  settleLabels(k);

  composer.render();
  labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* Render only while the map is on screen */
let onScreen = true;
function setRunning() {
  const should = onScreen && !document.hidden;
  if (should && !running) {
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  } else if (!should) {
    running = false;
  }
}
new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; setRunning(); }).observe(stage);
document.addEventListener("visibilitychange", setRunning);
if (document.fonts) document.fonts.ready.then(() => labels.forEach((l) => { l.w = 0; }));

placeCamera();
onScroll();
setRunning();

window.portfolioScene = { highlight, select, clear, setLens, focusRing, setInsets, retrieve };
stage.classList.add("is-ready");
document.dispatchEvent(new CustomEvent("portfolio:scene-ready"));
