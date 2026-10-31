/*
  "Infected" glitch → vortex transition into Ike.
  A link with data-vortex: the screen glitches with red/blue channel split, torn
  slices, scanlines and flicker, then the whole page is twisted and sucked into
  a vortex at the tap point before the browser lands on Ike.
  Skipped for reduced motion and modified clicks (new tab).
*/
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const RED = "#ff1f3d", BLUE = "#1fb8ff";

  document.addEventListener("click", e => {
    const link = e.target.closest("a[data-vortex]");
    if (!link || reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    let x = e.clientX, y = e.clientY;
    if (!x && !y) { const b = link.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top + b.height / 2; }
    run(x, y, link.href);
  });

  function freezeStyle() {
    if (document.getElementById("fx-freeze")) return;
    const st = document.createElement("style");
    st.id = "fx-freeze";
    st.textContent = ".fx-clone *, .fx-clone *::before, .fx-clone *::after { animation: none !important; transition: none !important; will-change: auto !important; }"
      + ".fx-clone .door, .fx-clone [data-reveal], .fx-clone [data-split] .w > span { opacity: 1 !important; transform: none !important; }";
    document.head.appendChild(st);
  }

  function run(cx, cy, href) {
    try { sessionStorage.setItem("arrive-from-vortex", "1"); } catch (e) {}
    freezeStyle();
    const W = innerWidth, H = innerHeight;
    const snap = document.body.cloneNode(true);
    snap.querySelectorAll("script").forEach(n => n.remove());
    const html = snap.innerHTML, bg = getComputedStyle(document.body).backgroundColor, sy = scrollY;

    const stage = document.createElement("div");
    Object.assign(stage.style, { position: "fixed", inset: "0", zIndex: 1000, overflow: "hidden", pointerEvents: "none", background: bg });
    document.body.appendChild(stage);
    document.documentElement.style.overflow = "hidden";

    // A full-screen copy of the page, optionally clipped / masked.
    function copy(extra) {
      const box = document.createElement("div");
      box.className = "fx-clone";
      Object.assign(box.style, { position: "absolute", inset: "0", overflow: "hidden", background: bg }, extra || {});
      const inner = document.createElement("div");
      inner.innerHTML = html;
      Object.assign(inner.style, { position: "absolute", left: "0", top: -sy + "px", width: W + "px" });
      box.appendChild(inner);
      stage.appendChild(box);
      return box;
    }

    // ---------- Phase 1: infection (0 – ~1000ms) ----------
    // Red/blue split on everything with text — one copy of the page, fringes jumping
    // every few frames (cheap: no SVG filters, no stacked full-page blends).
    const st = document.getElementById("fx-chroma-style") || Object.assign(document.createElement("style"), { id: "fx-chroma-style" });
    st.textContent = ".fx-chroma, .fx-chroma * { text-shadow: var(--cr, -4px) 0 0 rgba(255,31,61,.9), var(--cb, 4px) 0 0 rgba(31,184,255,.9) !important; }"
      + ".fx-chroma .door, .fx-chroma header { box-shadow: var(--cr, -4px) 0 0 rgba(255,31,61,.8), var(--cb, 4px) 0 0 rgba(31,184,255,.8); }";
    document.head.appendChild(st);
    const base = copy();
    base.classList.add("fx-chroma");
    const ghosts = [];
    const chroma = setInterval(() => {
      const a = 2 + Math.random() * 12;
      base.style.setProperty("--cr", -a + "px");
      base.style.setProperty("--cb", a * (0.6 + Math.random() * 0.8) + "px");
      base.style.transform = Math.random() < 0.35 ? `translate(${(Math.random() - 0.5) * 18}px, ${(Math.random() - 0.5) * 6}px)` : "none";
    }, 70);
    setTimeout(() => clearInterval(chroma), 950);

    // Torn horizontal slices.
    const slices = [];
    for (let i = 0; i < 3; i++) setTimeout(() => {
      if (!stage.isConnected || phase2) return;
      const top = Math.random() * 92, h = 2 + Math.random() * 9;
      const s = copy({ clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`, opacity: "0" });
      s.animate([
        { opacity: 0, transform: "translateX(0)" },
        { opacity: 1, transform: `translateX(${(Math.random() - 0.5) * 120}px)`, offset: 0.2 },
        { opacity: 1, transform: `translateX(${(Math.random() - 0.5) * 220}px)`, offset: 0.55 },
        { opacity: 0, transform: `translateX(${(Math.random() - 0.5) * 60}px)` }
      ], { duration: 260 + Math.random() * 300, easing: "steps(3, end)", iterations: 2 });
      slices.push(s);
    }, 140 + i * 230);

    // Scanlines, noise blocks and flicker.
    const scan = document.createElement("div");
    Object.assign(scan.style, { position: "absolute", inset: "0", background: "repeating-linear-gradient(0deg, #0000 0 2px, #00000055 2px 3px)", mixBlendMode: "multiply" });
    stage.appendChild(scan);
    const blocks = document.createElement("div");
    Object.assign(blocks.style, { position: "absolute", inset: "0" });
    stage.appendChild(blocks);
    for (let i = 0; i < 16; i++) {
      const b = document.createElement("div");
      const w = 30 + Math.random() * 260, h = 6 + Math.random() * 40;
      Object.assign(b.style, { position: "absolute", left: Math.random() * (W - w) + "px", top: Math.random() * (H - h) + "px", width: w + "px", height: h + "px",
        background: [RED, BLUE, "#fff", "#000"][i % 4], opacity: 0, mixBlendMode: i % 4 === 2 ? "difference" : "normal" });
      blocks.appendChild(b);
      b.animate([{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0 }], { duration: 90 + Math.random() * 120, delay: 150 + Math.random() * 800, easing: "steps(1, end)", iterations: 1 + Math.floor(Math.random() * 3) });
    }
    const flash = document.createElement("div");
    Object.assign(flash.style, { position: "absolute", inset: "0", background: "#fff", mixBlendMode: "difference", opacity: 0 });
    stage.appendChild(flash);
    flash.animate([{ opacity: 0 }, { opacity: 1, offset: .5 }, { opacity: 0, offset: .56 }, { opacity: 1, offset: .8 }, { opacity: 0, offset: .84 }],
      { duration: 1000, easing: "steps(1, end)" });
    // Whole-screen shake.
    stage.animate(Array.from({ length: 12 }, (_, i) => ({ transform: i === 0 || i === 11 ? "none" : `translate(${(Math.random() - 0.5) * 16}px, ${(Math.random() - 0.5) * 8}px)` })),
      { duration: 900, delay: 100, easing: "steps(1, end)" });

    // Big glitch "IKE" stamped across the middle.
    const word = document.createElement("div");
    word.textContent = "IKE";
    Object.assign(word.style, { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", fontFamily: '"Archivo Black", Impact, sans-serif',
      fontSize: "clamp(6rem, 26vw, 20rem)", lineHeight: "1", color: "#fff", mixBlendMode: "difference", letterSpacing: "-.04em", opacity: 0,
      textShadow: `-8px 0 ${RED}, 8px 0 ${BLUE}` });
    stage.appendChild(word);
    word.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }, { opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0 }],
      { duration: 700, delay: 420, easing: "steps(1, end)", fill: "forwards" });

    // ---------- Phase 2 prep: build the vortex rings gradually while the glitch plays ----------
    let phase2 = false;
    const reach = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;
    const RINGS = 7, rings = [];
    for (let i = 0; i < RINGS; i++) setTimeout(() => {
      const r0 = (reach * i) / RINGS, r1 = (reach * (i + 1)) / RINGS + 1;
      const mask = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r0}px, #000 ${r0 + 0.5}px, #000 ${r1}px, transparent ${r1 + 0.5}px)`;
      const ring = copy({ maskImage: mask, WebkitMaskImage: mask, transformOrigin: `${cx}px ${cy}px`, opacity: "0.001", zIndex: "-1" });
      rings[i] = ring;
    }, 120 + i * 100);

    // ---------- Phase 2: vortex (~950 – 1900ms) ----------
    setTimeout(() => {
      phase2 = true;
      [base, ...slices, scan, blocks, flash].forEach(n => n.remove()); clearInterval(chroma);
      stage.style.background = `radial-gradient(circle at ${cx}px ${cy}px, #000 0, #000 6%, #1a0408 22%, #05070d 60%, #000 100%)`;
      for (let i = 0; i < RINGS; i++) {
        const ring = rings[i];
        if (!ring) continue;
        ring.style.opacity = "1"; ring.style.zIndex = "";
        const spin = 260 + (RINGS - i) * 70;
        const dir = i % 2 ? 1 : 1; // same direction reads as one swirl
        ring.animate([
          { transform: "rotate(0deg) scale(1)", opacity: 1, filter: "none" },
          { transform: `rotate(${dir * spin * 0.35}deg) scale(.82)`, opacity: 1, offset: 0.35 },
          { transform: `rotate(${dir * spin}deg) scale(0)`, opacity: 0.2, filter: "blur(2px)" }
        ], { duration: 900 + i * 35, delay: (RINGS - i) * 18, easing: "cubic-bezier(.55,0,.75,.4)", fill: "forwards" });
      }
      // Chromatic rim around the drain.
      const rim = document.createElement("div");
      Object.assign(rim.style, { position: "absolute", left: cx - 60 + "px", top: cy - 60 + "px", width: "120px", height: "120px", borderRadius: "50%",
        boxShadow: `0 0 0 3px ${RED}, 0 0 0 7px ${BLUE}, 0 0 60px 20px #ff1f3d55`, opacity: 0 });
      stage.appendChild(rim);
      rim.animate([{ opacity: 0, transform: "scale(3) rotate(0deg)" }, { opacity: 1, transform: "scale(1) rotate(180deg)", offset: 0.6 }, { opacity: 0, transform: "scale(0) rotate(360deg)" }],
        { duration: 1000, easing: "cubic-bezier(.5,0,.8,.5)", fill: "forwards" });
    }, 950);

    setTimeout(() => { location.href = href; }, 1950);
  }

  addEventListener("pageshow", ev => { if (ev.persisted) location.reload(); });
})();
