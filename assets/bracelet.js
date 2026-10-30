/*
  Hove Huru — 3D braided copper bracelet (Three.js, no external CDN).
  Usage: <canvas id="bracelet"></canvas> + <script type="module" src="../assets/bracelet.js"></script>
  - Drag (mouse or touch) to spin it. Vertical swipes still scroll the page on phones.
  - Slow auto-rotation, cursor parallax, scroll-linked tilt, floating embers.
  - Pauses when off-screen or the tab is hidden. Honors "reduce motion".
*/
import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const canvas = document.getElementById("bracelet");
if (canvas) init(canvas);

function init(canvas) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    document.documentElement.classList.add("no-webgl");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Warm key + cool rim so the copper reads as metal, not plastic.
  const key = new THREE.DirectionalLight(0xffc89a, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9ab8ff, 0.8); rim.position.set(-5, -2, -4); scene.add(rim);

  // ---- Braid geometry: three strands plaited around a ring ----
  const R = 1.55;          // ring radius
  const CROSSINGS = 15;    // braid repeats around the ring
  const A = 0.2, B = 0.11; // radial / vertical braid amplitude
  const STRAND_R = 0.092;

  const copper = new THREE.MeshPhysicalMaterial({
    color: 0xc0784a, metalness: 1, roughness: 0.27,
    clearcoat: 0.35, clearcoatRoughness: 0.25
  });
  const copperDark = copper.clone();
  copperDark.color = new THREE.Color(0x9a5a33);
  copperDark.roughness = 0.34;

  const bracelet = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const pts = [];
    const N = 720;
    for (let j = 0; j < N; j++) {
      const t = (j / N) * Math.PI * 2;
      const phi = CROSSINGS * t + (i * Math.PI * 2) / 3;
      const r = R + A * Math.sin(phi);
      const z = B * Math.sin(2 * phi);
      pts.push(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), z));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    const geo = new THREE.TubeGeometry(curve, 1100, STRAND_R, 14, true);
    bracelet.add(new THREE.Mesh(geo, i === 1 ? copperDark : copper));
  }
  // Two terminal caps — read as a crafted cuff closure.
  const capGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.34, 32);
  const cap = new THREE.Mesh(capGeo, copper);
  cap.position.set(0, -R, 0);
  cap.rotation.z = Math.PI / 2;
  bracelet.add(cap);
  const ringGeo = new THREE.TorusGeometry(0.205, 0.028, 12, 48);
  [-0.17, 0.17].forEach(x => {
    const ring = new THREE.Mesh(ringGeo, copperDark);
    ring.position.set(x, -R, 0);
    ring.rotation.y = Math.PI / 2;
    bracelet.add(ring);
  });

  const holder = new THREE.Group(); // receives scroll + pointer tilt
  holder.add(bracelet);
  scene.add(holder);
  bracelet.rotation.x = -0.95;

  // ---- Embers ----
  const EMBERS = 140;
  const eGeo = new THREE.BufferGeometry();
  const ePos = new Float32Array(EMBERS * 3);
  const eSpeed = new Float32Array(EMBERS);
  for (let i = 0; i < EMBERS; i++) {
    ePos[i * 3] = (Math.random() - 0.5) * 9;
    ePos[i * 3 + 1] = (Math.random() - 0.5) * 6;
    ePos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    eSpeed[i] = 0.12 + Math.random() * 0.35;
  }
  eGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
  const eMat = new THREE.PointsMaterial({
    color: 0xe0904e, size: 0.035, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const embers = new THREE.Points(eGeo, eMat);
  scene.add(embers);

  // ---- Sizing ----
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the bracelet fully in frame on narrow phones.
    camera.position.z = w < h ? 11 + (h / w - 1) * 6 : 11.5;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // ---- Interaction ----
  let spinVel = reduce ? 0 : 0.0035;   // idle auto-spin (rad/frame)
  const idleVel = spinVel;
  let dragging = false, lastX = 0, lastY = 0, tiltX = 0, tiltTarget = 0;
  let parX = 0, parY = 0, parTX = 0, parTY = 0;

  canvas.style.touchAction = "pan-y"; // vertical swipes scroll the page
  canvas.addEventListener("pointerdown", e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("grabbing");
  });
  canvas.addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    parTX = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
    parTY = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    spinVel = dx * 0.006;
    tiltTarget = Math.max(-0.7, Math.min(0.7, tiltTarget + dy * 0.004));
  });
  const end = () => { dragging = false; canvas.classList.remove("grabbing"); };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => { parTX = 0; parTY = 0; });

  // Scroll: bracelet tilts toward the viewer and sinks as you leave the hero.
  let scrollP = 0;
  const hero = canvas.closest("section") || canvas;
  function onScroll() {
    const r = hero.getBoundingClientRect();
    scrollP = Math.min(1, Math.max(0, -r.top / (r.height || 1)));
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Loop (pauses off-screen) ----
  let visible = true, raf = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); }).observe(canvas);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loop(); });

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!dragging) {
      spinVel += (idleVel - spinVel) * 0.03;   // ease back to idle spin
      tiltTarget *= 0.97;
    }
    bracelet.rotation.z += spinVel;
    tiltX += (tiltTarget - tiltX) * 0.1;
    parX += (parTX - parX) * 0.06;
    parY += (parTY - parY) * 0.06;

    holder.rotation.x = tiltX + parY + scrollP * 0.9;
    holder.rotation.y = parX;
    holder.position.y = 0.05 + (reduce ? 0 : Math.sin(t * 0.8) * 0.06) - scrollP * 1.2;
    const s = 1 - scrollP * 0.25;
    holder.scale.setScalar(s);

    if (!reduce) {
      const p = eGeo.attributes.position.array;
      for (let i = 0; i < EMBERS; i++) {
        p[i * 3 + 1] += eSpeed[i] * dt;
        p[i * 3] += Math.sin(t + i) * 0.002;
        if (p[i * 3 + 1] > 3.2) p[i * 3 + 1] = -3.2;
      }
      eGeo.attributes.position.needsUpdate = true;
      eMat.opacity = 0.55 + Math.sin(t * 2) * 0.15;
    }

    renderer.render(scene, camera);
  }
  function loop() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (!visible || document.hidden) return;
      frame();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  frame();
  canvas.classList.add("ready");
  loop();
}
