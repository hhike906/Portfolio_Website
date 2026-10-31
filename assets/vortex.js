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
    // True RGB split: three copies, each keeping one colour channel, added back together
    // over black. Where they line up you see the page; where they drift apart, red/blue fringes.
    const NS = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(NS, "svg");
    defs.setAttribute("width", "0"); defs.setAttribute("height", "0");
    Object.assign(defs.style, { position: "absolute" });
    defs.innerHTML = [["r", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"], ["g", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"], ["b", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"]]
      .map(([id, m]) => `<filter id="fx-${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${m}"/></filter>`).join("");
    stage.appendChild(defs);
    stage.style.background = "#000";
    const base = copy({ filter: "url(#fx-g)", mixBlendMode: "screen" });
    const ghosts = ["r", "b"].map(c => copy({ filter: `url(#fx-${c})`, mixBlendMode: "screen" }));
    const jitter = (el, amp, dur, sign) => el.animate(
      Array.from({ length: 10 }, (_, i) => ({ transform: i === 0 ? `translate(${sign * 4}px,0)` : i === 9 ? "translate(0,0)" : `translate(${sign * (4 + Math.random() * amp)}px, ${(Math.random() - 0.5) * amp * 0.25}px)` })),
      { duration: dur, easing: "steps(1, end)", iterations: 2, fill: "forwards" });
    ghosts.forEach((g, i) => jitter(g, 28, 470 + i * 60, i ? 1 : -1));

    // Torn horizontal slices.
    const slices = [];
    for (let i = 0; i < 7; i++) {
      const top = Math.random() * 92, h = 2 + Math.random() * 9;
      const s = copy({ clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`, opacity: "0" });
      s.animate([
        { opacity: 0, transform: "translateX(0)" },
        { opacity: 1, transform: `translateX(${(Math.random() - 0.5) * 120}px)`, offset: 0.2 },
        { opacity: 1, transform: `translateX(${(Math.random() - 0.5) * 220}px)`, offset: 0.55 },
        { opacity: 0, transform: `translateX(${(Math.random() - 0.5) * 60}px)` }
      ], { duration: 260 + Math.random() * 300, delay: 120 + Math.random() * 650, easing: "steps(3, end)", iterations: 2 });
      slices.push(s);
    }

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
    stage.animate([{ filter: "none" }, { filter: "contrast(1.4) saturate(1.6)" }, { filter: "none" }, { filter: "invert(1) hue-rotate(180deg)" }, { filter: "none" }],
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

    // ---------- Phase 2: vortex (~950 – 1900ms) ----------
    setTimeout(() => {
      [base, ...ghosts, ...slices, scan, blocks, defs].forEach(n => n.remove());
      stage.style.background = `radial-gradient(circle at ${cx}px ${cy}px, #000 0, #000 6%, #1a0408 22%, #05070d 60%, #000 100%)`;
      const reach = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;
      const RINGS = 9;
      for (let i = 0; i < RINGS; i++) {
        // Ring i covers radius [r0, r1]; inner rings spin faster (like water down a drain).
        const r0 = (reach * i) / RINGS, r1 = (reach * (i + 1)) / RINGS + 1;
        const mask = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r0}px, #000 ${r0 + 0.5}px, #000 ${r1}px, transparent ${r1 + 0.5}px)`;
        const ring = copy({ maskImage: mask, WebkitMaskImage: mask, transformOrigin: `${cx}px ${cy}px` });
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
