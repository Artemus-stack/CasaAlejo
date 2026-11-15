// Casa Alejo — the logo, cut into layers and rebuilt in 3D.
// Sombrero, skull and wordmark each get their own extruded stack so the emblem
// has real depth when it turns toward the pointer.
import * as THREE from '../vendor/three/three.module.min.js';

const ASPECT = 960 / 1670;          // logo artwork crop
const LOGO_W = 4;                   // world units
const LOGO_H = LOGO_W * ASPECT;

const PARTS = [
  // name, front z, layer count, side colours (near → far), intro offset
  { name: 'hat',      z: 0.00, layers: 16, near: 0x5a2436, far: 0x1f0914, from: { z: -2.2, y: 0.5 } },
  { name: 'wordmark', z: 0.14, layers: 7,  near: 0x5c2226, far: 0x3d1418, from: { z: 0.4, y: -0.9 } },
  { name: 'skull',    z: 0.30, layers: 12, near: 0xb98a8a, far: 0x6b3a45, from: { z: 3.0, y: 0 } },
];
const STEP = 0.013;

const easeOut = (t) => 1 - Math.pow(1 - t, 4);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export async function initLogo3D({ canvas, stage, hero, reduced = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const CAM_Z = 11;
  camera.position.z = CAM_Z;

  // ── textures ──
  const loader = new THREE.TextureLoader();
  const load = (file, srgb = true) => loader.loadAsync(`assets/logo/${file}`).then((t) => {
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  });
  const [hat, skull, wordmark, bump, shadowTex] = await Promise.all([
    load('hat.webp'), load('skull.webp'), load('wordmark.webp'), load('bump.webp', false), load('shadow.png'),
  ]);
  const maps = { hat, skull, wordmark };

  // ── lights ──
  scene.add(new THREE.AmbientLight(0xfff1ec, 2.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-2.5, 3.5, 5);
  scene.add(key);
  const glint = new THREE.PointLight(0xffc7a0, 14, 14, 1.6);
  glint.position.set(0, 1, 3);
  scene.add(glint);

  // ── logo ──
  const root = new THREE.Group();     // sized + positioned to sit over the DOM stage
  const tilt = new THREE.Group();     // rotates with the pointer
  root.add(tilt);
  scene.add(root);

  const plane = new THREE.PlaneGeometry(LOGO_W, LOGO_H);
  const parts = PARTS.map((def) => {
    const group = new THREE.Group();
    const map = maps[def.name];
    for (let i = def.layers - 1; i >= 0; i--) {
      let material;
      if (i === 0) {
        material = new THREE.MeshStandardMaterial({
          map, bumpMap: bump, bumpScale: 2.2, roughness: 0.62, metalness: 0.08,
          alphaTest: 0.22, alphaToCoverage: true,
        });
      } else {
        const k = (i - 1) / Math.max(1, def.layers - 2);
        material = new THREE.MeshBasicMaterial({
          map, color: new THREE.Color(def.near).lerp(new THREE.Color(def.far), k),
          alphaTest: 0.3, alphaToCoverage: true,
        });
      }
      const mesh = new THREE.Mesh(plane, material);
      mesh.position.z = -i * STEP;
      group.add(mesh);
    }
    tilt.add(group);
    return { def, group };
  });

  // soft contact shadow on the "plaster" behind the emblem
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(LOGO_W * 1.3, LOGO_H * 1.4),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.34, depthWrite: false })
  );
  shadow.position.set(0, -0.14, -0.7);
  shadow.renderOrder = -1;
  root.add(shadow);

  // ── drifting rose petals (the skull's rose eyes, set loose) ──
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, -0.5);
  petalShape.bezierCurveTo(0.55, -0.35, 0.5, 0.35, 0, 0.5);
  petalShape.bezierCurveTo(-0.5, 0.35, -0.55, -0.35, 0, -0.5);
  const petalGeo = new THREE.ShapeGeometry(petalShape, 8);
  const pos = petalGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.pow(pos.getX(i), 2) * 0.9 + Math.pow(pos.getY(i), 2) * 0.35);
  petalGeo.computeVertexNormals();
  const PETALS = reduced ? 0 : 30;
  const petals = new THREE.InstancedMesh(
    petalGeo,
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.75 }),
    Math.max(1, PETALS)
  );
  petals.visible = PETALS > 0;
  const palette = [0x992049, 0xb42a5a, 0x7a2a33, 0xd3806d, 0xc04a6e];
  const petalData = [];
  const tmpColor = new THREE.Color();
  for (let i = 0; i < PETALS; i++) {
    petalData.push({
      x: (Math.random() * 2 - 1), y: Math.random() * 2 - 1,
      z: Math.random() < 0.5 ? 1.2 + Math.random() * 2.2 : -1.2 - Math.random() * 3,
      s: 0.07 + Math.random() * 0.09,
      vy: 0.035 + Math.random() * 0.06, sway: 0.3 + Math.random() * 0.6, phase: Math.random() * 6.28,
      rx: Math.random() * 6.28, ry: Math.random() * 6.28, rz: Math.random() * 6.28,
      vrx: (Math.random() - 0.5) * 1.4, vry: (Math.random() - 0.5) * 1.4, vrz: (Math.random() - 0.5) * 0.8,
    });
    petals.setColorAt(i, tmpColor.setHex(palette[i % palette.length]));
  }
  scene.add(petals);
  const dummy = new THREE.Object3D();

  // ── layout: keep the emblem centred on the DOM stage ──
  let viewW = 1, viewH = 1, baseScale = 1;
  function resize() {
    const rect = hero.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    viewW = viewH * camera.aspect;
    const unit = viewH / h; // world units per CSS pixel at z = 0

    const s = stage.getBoundingClientRect();
    const fitW = Math.min(s.width * (w < 700 ? 1.08 : 0.96), 980);
    const fitH = s.height * 0.98;
    const pxW = Math.min(fitW, fitH / ASPECT);
    baseScale = (pxW * unit) / LOGO_W;
    root.position.x = ((s.left + s.width / 2) - (rect.left + w / 2)) * unit;
    root.position.y = -((s.top + s.height / 2) - (rect.top + h / 2)) * unit;
  }
  resize();
  new ResizeObserver(resize).observe(hero);
  window.addEventListener('orientationchange', resize);

  // ── interaction ──
  const pointer = { x: 0, y: 0, active: false };
  const canHover = window.matchMedia('(hover: hover)').matches;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    pointer.x = clamp01((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = clamp01((e.clientY - r.top) / r.height) * 2 - 1;
    pointer.active = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; });

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 }).observe(hero);

  const cur = { rx: 0, ry: 0, lx: 0, ly: 1 };
  const clock = new THREE.Clock();
  let introStart = null;
  const INTRO = reduced ? 0 : 2.4;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (introStart === null) introStart = t;
    const intro = INTRO ? easeOut(clamp01((t - introStart) / INTRO)) : 1;
    const scroll = clamp01(window.scrollY / Math.max(1, hero.offsetHeight));

    // target tilt: pointer when there is one, a slow sway otherwise
    let ty, tx;
    if (pointer.active && canHover) {
      ty = pointer.x * 0.52; tx = pointer.y * 0.3;
    } else if (!reduced) {
      ty = Math.sin(t * 0.55) * 0.38; tx = Math.sin(t * 0.4 + 1) * 0.1;
    } else { ty = -0.28; tx = 0.08; }
    const ease = 1 - Math.pow(0.001, dt);
    cur.ry += (ty - cur.ry) * ease * 0.9;
    cur.rx += (tx - cur.rx) * ease * 0.9;

    tilt.rotation.y = cur.ry + (1 - intro) * -1.5;
    tilt.rotation.x = cur.rx + (1 - intro) * 0.5 - scroll * 0.75;
    tilt.rotation.z = (1 - intro) * -0.12;
    const float = reduced ? 0 : Math.sin(t * 0.9) * 0.035;
    tilt.position.y = float + scroll * 0.35;
    root.scale.setScalar(baseScale * (0.72 + 0.28 * intro) * (1 - scroll * 0.12));

    // the layers fly together on load, and drift apart again as you scroll away
    for (const { def, group } of parts) {
      const spread = def.name === 'skull' ? 0.55 : def.name === 'hat' ? -0.3 : 0.12;
      group.position.z = def.z + (1 - intro) * def.from.z + scroll * spread;
      group.position.y = (1 - intro) * def.from.y;
    }
    if (!reduced) parts[2].group.position.z += Math.sin(t * 1.3) * 0.015; // the skull breathes

    shadow.position.x = -cur.ry * 0.42;
    shadow.position.y = -0.14 + tilt.rotation.x * 0.35 - float;
    shadow.material.opacity = 0.34 * intro * (1 - scroll);

    // warm glint follows the pointer across the embroidery
    const lx = pointer.active ? pointer.x : Math.sin(t * 0.5) * 0.7;
    const ly = pointer.active ? -pointer.y : 0.5 + Math.cos(t * 0.37) * 0.3;
    cur.lx += (lx - cur.lx) * ease; cur.ly += (ly - cur.ly) * ease;
    glint.position.set(root.position.x + cur.lx * viewW * 0.4, root.position.y + cur.ly * viewH * 0.3, 2.6);

    for (let i = 0; i < PETALS; i++) {
      const p = petalData[i];
      p.y -= p.vy * dt;
      if (p.y < -1.15) { p.y = 1.15; p.x = Math.random() * 2 - 1; }
      p.rx += p.vrx * dt; p.ry += p.vry * dt; p.rz += p.vrz * dt;
      const depth = (CAM_Z - p.z) / CAM_Z;
      dummy.position.set(
        (p.x + Math.sin(t * p.sway + p.phase) * 0.06) * viewW * 0.5 * depth - cur.ry * p.z * 0.25,
        p.y * viewH * 0.5 * depth + scroll * p.z * 0.6,
        p.z
      );
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.setScalar(p.s * Math.min(1.25, viewW / 6) * intro);
      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
    }
    if (PETALS) petals.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }
  frame();
  return true;
}
