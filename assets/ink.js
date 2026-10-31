/*
  Ink transition into Ike.
  A link with data-ink: a tattoo machine glides to the tap point, buzzes and draws
  an ink line, ink splatters out of the line (black, plus one red), droplets fly,
  and the ink floods the screen before the browser lands on Ike.
  Everything is vector shapes in one SVG — no page copies, no filters — so it stays
  smooth on phones and tablets. Skipped for reduced motion and new-tab clicks.
*/
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const INK = "#111111", RED = "#d1281f";
  const NS = "http://www.w3.org/2000/svg";

  document.addEventListener("click", e => {
    const link = e.target.closest("a[data-ink]");
    if (!link || reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    let x = e.clientX, y = e.clientY;
    if (!x && !y) { const b = link.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top + b.height / 2; }
    run(x, y, link.href, link.getBoundingClientRect());
  });

  const svgEl = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Organic ink splat: wobbly circle with a few thin "arms", smoothed with Catmull-Rom.
  function splatPath(r) {
    const N = 22, pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + rnd(-0.08, 0.08);
      let rr = r * rnd(0.78, 1.12);
      if (Math.random() < 0.18) rr = r * rnd(1.35, 1.9);   // splatter arm
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }

  // Original rotary "pen" tattoo machine, drawn needle-down with the tip at (0,0).
  function machine() {
    const g = svgEl("g", {});
    const parts = [
      ["path", { d: "M-1.2,0 L1.2,0 L2.2,-14 L-2.2,-14 Z", fill: "#bfc4ca" }],                                // needle
      ["path", { d: "M-7,-14 L7,-14 L10,-46 L-10,-46 Z", fill: "#e7e2da", stroke: "#111", "stroke-width": "2" }], // cartridge
      ["rect", { x: -13, y: -96, width: 26, height: 52, rx: 9, fill: "#1a1a1a" }],                                   // grip
      ...Array.from({ length: 6 }, (_, i) => ["rect", { x: -13, y: -90 + i * 7.5, width: 26, height: 2.2, fill: "#2e2e2e" }]), // grip ridges
      ["rect", { x: -15, y: -168, width: 30, height: 76, rx: 12, fill: RED }],                                       // body
      ["rect", { x: -15, y: -150, width: 30, height: 4, fill: "#8f1913" }],
      ["rect", { x: -9, y: -186, width: 18, height: 22, rx: 5, fill: "#2a2a2a" }],                                   // motor cap
      ["path", { d: "M0,-186 C0,-230 40,-250 90,-300", fill: "none", stroke: "#1a1a1a", "stroke-width": "5", "stroke-linecap": "round" }] // cable
    ];
    parts.forEach(([t, a]) => g.appendChild(svgEl(t, a)));
    return g;
  }

  function run(cx, cy, href, box) {
    try { sessionStorage.setItem("arrive-from-ink", "1"); } catch (e) {}
    const W = innerWidth, H = innerHeight;
    const reach = Math.hypot(W, H);

    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    Object.assign(svg.style, { position: "fixed", inset: "0", zIndex: 1000, pointerEvents: "none", overflow: "visible" });
    document.body.appendChild(svg);
    document.documentElement.style.overflow = "hidden";

    // ----- the stroke the needle draws: a confident swoosh starting at the tap point
    // Keep the line on the (light) panel that was tapped so the black ink reads.
    const bx0 = Math.max(0, box.left), bx1 = Math.min(W, box.right);
    const dir = cx < (bx0 + bx1) / 2 ? 1 : -1;
    const room = dir > 0 ? bx1 - cx - 30 : cx - bx0 - 30;
    const ex = cx + dir * Math.max(120, Math.min(room, 320));
    const ey = Math.min(H - 60, Math.max(60, cy + rnd(30, 90)));
    const d = `M${cx},${cy} C${cx + dir * 70},${cy - 90} ${ex - dir * 110},${ey + 100} ${ex},${ey}`;
    const stroke = svgEl("path", { d, fill: "none", stroke: INK, "stroke-width": Math.max(7, Math.min(W, H) * 0.014), "stroke-linecap": "round" });
    svg.appendChild(stroke);
    const L = stroke.getTotalLength();
    stroke.style.strokeDasharray = L; stroke.style.strokeDashoffset = L;

    const splats = svgEl("g", {}); svg.insertBefore(splats, stroke);
    const drops = svgEl("g", {}); svg.appendChild(drops);

    // ----- tattoo machine, tilted like it's held in a hand
    const tool = machine();
    const holder = svgEl("g", {});
    holder.appendChild(tool);
    svg.appendChild(holder);
    const tilt = dir > 0 ? -28 : 28;
    tool.setAttribute("transform", `rotate(${tilt}) scale(${Math.max(0.75, Math.min(1.15, W / 1100))})`);
    holder.setAttribute("transform", `translate(${cx + dir * -260},${cy - 220})`);

    const DRAW_START = 260, DRAW_MS = 620;
    let raf = 0;
    const t0 = performance.now();
    (function loop(now) {
      const t = now - t0;
      let x, y;
      if (t < DRAW_START) {                                   // glide in to the tap point
        const k = 1 - Math.pow(1 - t / DRAW_START, 3);
        x = cx + dir * -260 * (1 - k); y = cy - 220 * (1 - k);
      } else if (t < DRAW_START + DRAW_MS) {                  // draw the line, buzzing
        const k = (t - DRAW_START) / DRAW_MS, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const p = stroke.getPointAtLength(L * e);
        x = p.x + rnd(-1.2, 1.2); y = p.y + rnd(-1.2, 1.2);
        stroke.style.strokeDashoffset = L * (1 - e);
      } else {                                                // lift away
        const k = Math.min(1, (t - DRAW_START - DRAW_MS) / 380);
        x = ex + dir * 220 * k * k; y = ey - 260 * k * k;
        holder.style.opacity = String(1 - k);
      }
      holder.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      if (t < DRAW_START + DRAW_MS + 400) raf = requestAnimationFrame(loop);
    })(t0);

    // ----- splatters bloom out of the line
    const SPLAT_AT = DRAW_START + DRAW_MS - 120;
    const spots = [0.08, 0.35, 0.62, 0.98].map(f => stroke.getPointAtLength(L * f));
    spots.push({ x: rnd(W * 0.15, W * 0.85), y: rnd(H * 0.15, H * 0.85) });
    spots.forEach((p, i) => {
      const r = rnd(38, 70) * (i === 3 ? 1.5 : 1);
      const blob = svgEl("path", { d: splatPath(r), fill: i === 1 ? RED : INK });
      blob.setAttribute("transform", `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
      const inner = svgEl("g", {}); inner.appendChild(blob);
      splats.appendChild(inner);
      inner.style.transformBox = "fill-box"; inner.style.transformOrigin = "center";
      inner.animate([{ transform: "scale(0)" }, { transform: "scale(1.08)", offset: 0.6 }, { transform: "scale(1)" }],
        { duration: 380, delay: SPLAT_AT + i * 70, easing: "cubic-bezier(.2,.9,.3,1.2)", fill: "both" });
      // flying droplets
      for (let k = 0; k < 7; k++) {
        const a = rnd(0, Math.PI * 2), dist = rnd(r * 1.4, r * 3.2), sz = rnd(2.5, 8);
        const c = svgEl("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: sz.toFixed(1), fill: i === 1 && k % 2 ? RED : INK });
        drops.appendChild(c);
        c.style.transformBox = "fill-box"; c.style.transformOrigin = "center";
        c.animate([{ transform: "translate(0,0) scale(.3)", opacity: 1 }, { transform: `translate(${(Math.cos(a) * dist).toFixed(1)}px, ${(Math.sin(a) * dist + 18).toFixed(1)}px) scale(1)`, opacity: 1 }],
          { duration: rnd(260, 420), delay: SPLAT_AT + i * 70 + 40, easing: "cubic-bezier(.15,.7,.3,1)", fill: "both" });
      }
    });

    // ----- the flood: ink spreads from the biggest splat until the screen is covered
    const FLOOD_AT = SPLAT_AT + 380;
    const fp = spots[3];
    const flood = svgEl("path", { d: splatPath(60), fill: INK });
    flood.setAttribute("transform", `translate(${fp.x.toFixed(1)},${fp.y.toFixed(1)})`);
    const fg = svgEl("g", {}); fg.appendChild(flood);
    svg.insertBefore(fg, drops);
    fg.style.transformBox = "fill-box"; fg.style.transformOrigin = "center";
    const cover = (reach / 60) * 1.6;
    fg.animate([{ transform: "scale(0)" }, { transform: "scale(1.2)", offset: 0.15 }, { transform: `scale(${cover.toFixed(1)})` }],
      { duration: 720, delay: FLOOD_AT, easing: "cubic-bezier(.6,0,.4,1)", fill: "both" });

    // ----- a final red drop lands in the black just before the page opens
    const last = svgEl("circle", { cx: W / 2, cy: H / 2, r: Math.min(W, H) * 0.035, fill: RED, opacity: 0 });
    svg.appendChild(last);
    last.animate([{ opacity: 0, transform: "translateY(-40px) scale(.4)" }, { opacity: 1, transform: "translateY(0) scale(1)", offset: 0.5 }, { opacity: 1, transform: "scale(1.15, .85)" }],
      { duration: 360, delay: FLOOD_AT + 560, easing: "cubic-bezier(.3,0,.3,1)", fill: "both" });
    last.style.transformBox = "fill-box"; last.style.transformOrigin = "center";

    setTimeout(() => { cancelAnimationFrame(raf); location.href = href; }, FLOOD_AT + 960);
  }

  addEventListener("pageshow", ev => { if (ev.persisted) location.reload(); });
})();
