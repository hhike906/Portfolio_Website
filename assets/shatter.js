/*
  Glass-shatter page transition.
  Any link with data-shatter cracks the screen from the click point, the shards
  fall away, and the browser lands on the link's page.
  Skipped for "reduce motion", modified clicks (new tab), and keyboard-only users
  get it too (shatter starts from the link's centre).
*/
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("click", e => {
    const link = e.target.closest("a[data-shatter]");
    if (!link || reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    let x = e.clientX, y = e.clientY;
    if (!x && !y) { const r = link.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    shatter(x, y, link.href, link.dataset.shatter || "#f6f7f9");
  });

  function shatter(cx, cy, href, behind) {
    const W = innerWidth, H = innerHeight;
    try { sessionStorage.setItem("arrive-from-glass", "1"); } catch (e) {}

    // --- 1. Crack lines ---------------------------------------------------
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    Object.assign(svg.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", zIndex: 1001, pointerEvents: "none" });

    const SPOKES = 11, RINGS = 3;
    const reach = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.15;
    const angles = [];
    for (let i = 0; i < SPOKES; i++) angles.push((i / SPOKES) * Math.PI * 2 + (Math.random() - 0.5) * 0.35);
    angles.sort((a, b) => a - b);
    const radii = [0];
    for (let r = 1; r <= RINGS; r++) radii.push(reach * Math.pow(r / RINGS, 1.6) * (0.85 + Math.random() * 0.2));
    radii[RINGS] = reach;
    // jittered vertex grid: P[ring][spoke]
    const P = radii.map((rad, ri) => angles.map(a => {
      const j = ri === 0 ? 0 : rad * 0.08;
      return [cx + Math.cos(a) * rad + (Math.random() - 0.5) * j, cy + Math.sin(a) * rad + (Math.random() - 0.5) * j];
    }));

    const crack = document.createElementNS(NS, "path");
    let d = "";
    angles.forEach((_, s) => { d += `M${cx},${cy}`; for (let r = 1; r <= RINGS; r++) d += `L${P[r][s][0]},${P[r][s][1]}`; });
    for (let r = 1; r < RINGS; r++) { d += `M${P[r][0][0]},${P[r][0][1]}`; for (let s = 1; s <= SPOKES; s++) d += `L${P[r][s % SPOKES][0]},${P[r][s % SPOKES][1]}`; }
    crack.setAttribute("d", d);
    crack.setAttribute("fill", "none");
    crack.setAttribute("stroke", "white");
    crack.setAttribute("stroke-width", "1.6");
    crack.setAttribute("stroke-linejoin", "bevel");
    const len = 1; // with pathLength=1 the dash pattern is normalised (cheap to rasterise)
    // Soft blue halo drawn as a wider translucent stroke (cheaper than a CSS filter).
    const halo = crack.cloneNode();
    halo.setAttribute("stroke", "#9cc4ff");
    halo.setAttribute("stroke-width", "5");
    halo.setAttribute("stroke-opacity", ".35");
    [halo, crack].forEach(el => { el.setAttribute("pathLength", "1"); el.style.strokeDasharray = len; el.style.strokeDashoffset = len; svg.appendChild(el); });
    const flash = document.createElementNS(NS, "circle");
    flash.setAttribute("cx", cx); flash.setAttribute("cy", cy); flash.setAttribute("r", 0);
    flash.setAttribute("fill", "white");
    svg.appendChild(flash);
    document.body.appendChild(svg);

    flash.animate([{ r: 0, opacity: 0.95 }, { r: 90, opacity: 0 }], { duration: 380, easing: "ease-out", fill: "forwards" });
    [halo, crack].forEach(el => el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 420, easing: "cubic-bezier(.2,.9,.3,1)", fill: "forwards" }));
    document.body.animate(
      [{ transform: "translate(0,0)" }, { transform: "translate(-6px,3px)" }, { transform: "translate(5px,-4px)" }, { transform: "translate(-2px,2px)" }, { transform: "translate(0,0)" }],
      { duration: 260, easing: "linear" }
    );

    // --- 2. Shards ---------------------------------------------------------
    setTimeout(() => {
      // Freeze everything inside the shards: cloned animations must not restart (and cost nothing to render).
      if (!document.getElementById("shatter-freeze")) {
        const st = document.createElement("style");
        st.id = "shatter-freeze";
        st.textContent = ".shatter-stage *, .shatter-stage *::before, .shatter-stage *::after { animation: none !important; transition: none !important; will-change: auto !important; }"
          + ".shatter-stage .door, .shatter-stage [data-reveal], .shatter-stage [data-split] .w > span { opacity: 1 !important; transform: none !important; }";
        document.head.appendChild(st);
      }
      const stage = document.createElement("div");
      stage.className = "shatter-stage";
      Object.assign(stage.style, { position: "fixed", inset: "0", zIndex: 1000, background: behind, perspective: "1400px", overflow: "hidden" });
      // A faint engineering grid appears behind the glass.
      stage.style.backgroundImage = "linear-gradient(#13202c12 1px, transparent 1px), linear-gradient(90deg, #13202c12 1px, transparent 1px)";
      stage.style.backgroundSize = "32px 32px";

      // Snapshot of the current page, reused inside every shard.
      const snap = document.body.cloneNode(true);
      snap.querySelectorAll("script, svg").forEach(n => n.remove());
      const snapHTML = snap.innerHTML;
      const bodyBg = getComputedStyle(document.body).backgroundColor;

      for (let r = 0; r < RINGS; r++) {
        for (let s = 0; s < SPOKES; s++) {
          const s2 = (s + 1) % SPOKES;
          const pts = r === 0
            ? [[cx, cy], P[1][s], P[1][s2]]
            : [P[r][s], P[r + 1][s], P[r + 1][s2], P[r][s2]];
          // Each shard is only as big as its own bounding box (keeps GPU memory ~1 screen total).
          const minX = Math.max(0, Math.min(...pts.map(p => p[0]))), maxX = Math.min(W, Math.max(...pts.map(p => p[0])));
          const minY = Math.max(0, Math.min(...pts.map(p => p[1]))), maxY = Math.min(H, Math.max(...pts.map(p => p[1])));
          if (maxX - minX < 1 || maxY - minY < 1) continue;
          const shard = document.createElement("div");
          Object.assign(shard.style, {
            position: "absolute", left: minX + "px", top: minY + "px", width: (maxX - minX) + "px", height: (maxY - minY) + "px",
            overflow: "hidden", background: bodyBg,
            clipPath: `polygon(${pts.map(p => `${p[0] - minX}px ${p[1] - minY}px`).join(",")})`,
            transformOrigin: `${avg(pts, 0) - minX}px ${avg(pts, 1) - minY}px`, willChange: "transform, opacity"
          });
          const inner = document.createElement("div");
          inner.innerHTML = snapHTML;
          Object.assign(inner.style, { position: "absolute", left: -minX + "px", top: (-scrollY - minY) + "px", width: W + "px", pointerEvents: "none" });
          shard.appendChild(inner);
          shard.style.boxShadow = "inset 0 0 0 1px #ffffff55";
          stage.appendChild(shard);

          // Fly outward from the impact, tumble, and fall.
          const mx = avg(pts, 0), my = avg(pts, 1);
          const dx = mx - cx, dy = my - cy, dist = Math.hypot(dx, dy) || 1;
          const push = 120 + Math.random() * 260 + (r === 0 ? 80 : 0);
          const tx = (dx / dist) * push, ty = (dy / dist) * push * 0.6 + 380 + Math.random() * 420;
          const delay = (dist / reach) * 260 + Math.random() * 80;
          shard.animate([
            { transform: "translate3d(0,0,0) rotate3d(0,0,1,0deg)", opacity: 1 },
            { transform: `translate3d(${tx * 0.25}px,${ty * 0.05}px,${60 + Math.random() * 120}px) rotate3d(${Math.random()},${Math.random()},${Math.random() - 0.5},${10 + Math.random() * 20}deg)`, opacity: 1, offset: 0.25 },
            { transform: `translate3d(${tx}px,${ty}px,${-200 + Math.random() * 300}px) rotate3d(${Math.random()},${Math.random()},${Math.random() - 0.5},${80 + Math.random() * 160}deg)`, opacity: 0 }
          ], { duration: 1000 + Math.random() * 300, delay, easing: "cubic-bezier(.45,0,.85,.6)", fill: "forwards" });
        }
      }
      document.body.appendChild(stage);
      document.body.style.overflow = "hidden";
      svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
      setTimeout(() => { location.href = href; }, 1150);
    }, 430);
  }

  function avg(pts, i) { return pts.reduce((a, p) => a + p[i], 0) / pts.length; }

  // Coming back with the browser's Back button: clear any leftover overlay.
  addEventListener("pageshow", ev => {
    if (ev.persisted) location.reload();
  });
})();
