/*
  Copper portal transition into Hove Huru.
  A link with data-portal: the copper ring on the panel flares and expands to fill
  the screen, darkness pours in through it, sparks burst, and the wordmark is
  forged at the centre before the browser lands on the shop.
  Skipped for reduced motion and modified clicks (new tab).
*/
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COPPER = "#c98b4f", DARK = "#0a0806";

  document.addEventListener("click", e => {
    const link = e.target.closest("a[data-portal]");
    if (!link || reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const ring = link.querySelector(".ring");
    let cx = e.clientX, cy = e.clientY, r0 = 70;
    if (ring) {
      const b = ring.getBoundingClientRect();
      if (b.width) { cx = b.left + b.width / 2; cy = b.top + b.height / 2; r0 = b.width / 2; }
    }
    if (!cx && !cy) { const b = link.getBoundingClientRect(); cx = b.left + b.width / 2; cy = b.top + b.height / 2; }
    const h2 = link.querySelector("h2");
    portal(cx, cy, r0, link.href, link.dataset.portal || (h2 && h2.textContent.trim()) || "Hove Huru", ring);
  });

  function portal(cx, cy, r0, href, word, ring) {
    try { sessionStorage.setItem("arrive-from-portal", "1"); } catch (e) {}
    const W = innerWidth, H = innerHeight;
    const reach = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 40;

    const stage = document.createElement("div");
    Object.assign(stage.style, { position: "fixed", inset: "0", zIndex: 1000, pointerEvents: "none", overflow: "hidden" });
    document.body.appendChild(stage);
    if (ring) ring.style.visibility = "hidden";

    // 1 — Darkness pours in through the ring.
    const dark = document.createElement("div");
    Object.assign(dark.style, { position: "absolute", inset: "0", background: `radial-gradient(circle at ${cx}px ${cy}px, #1b120b 0%, ${DARK} 55%)` });
    stage.appendChild(dark);
    dark.animate(
      [{ clipPath: `circle(${r0 * 0.8}px at ${cx}px ${cy}px)` }, { clipPath: `circle(${r0 * 0.8}px at ${cx}px ${cy}px)`, offset: 0.25 }, { clipPath: `circle(${reach}px at ${cx}px ${cy}px)` }],
      { duration: 1000, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" }
    );

    // 2 — The ring: double copper band that flares, spins and grows past the screen edge.
    const band = document.createElement("div");
    const d = r0 * 2;
    Object.assign(band.style, {
      position: "absolute", left: cx - r0 + "px", top: cy - r0 + "px", width: d + "px", height: d + "px",
      borderRadius: "50%", border: `${Math.max(6, r0 * 0.14)}px double ${COPPER}`,
      boxShadow: `0 0 24px ${COPPER}aa, inset 0 0 24px ${COPPER}66`, willChange: "transform, opacity"
    });
    stage.appendChild(band);
    const grow = (reach / r0) * 1.15;
    band.animate([
      { transform: "scale(1) rotate(0deg)", opacity: 1, filter: "brightness(1)" },
      { transform: "scale(.86) rotate(-40deg)", opacity: 1, filter: "brightness(2.2)", offset: 0.22 },
      { transform: `scale(${grow}) rotate(160deg)`, opacity: 0.9, filter: "brightness(1.4)", offset: 0.78 },
      { transform: `scale(${grow * 1.1}) rotate(190deg)`, opacity: 0 }
    ], { duration: 1150, easing: "cubic-bezier(.6,0,.25,1)", fill: "forwards" });

    // Flash at the moment the ring "ignites".
    const flash = document.createElement("div");
    Object.assign(flash.style, { position: "absolute", left: cx - 160 + "px", top: cy - 160 + "px", width: "320px", height: "320px", borderRadius: "50%",
      background: `radial-gradient(circle, #ffd9a8 0%, ${COPPER}88 30%, transparent 70%)`, opacity: 0 });
    stage.appendChild(flash);
    flash.animate([{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1)", offset: 0.4 }, { opacity: 0, transform: "scale(2.4)" }],
      { duration: 700, delay: 180, easing: "ease-out", fill: "forwards" });

    // 3 — Sparks (one small canvas, cheap on phones).
    const cv = document.createElement("canvas");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
    stage.appendChild(cv);
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const N = Math.min(160, Math.round((W * H) / 9000));
    const sparks = Array.from({ length: N }, () => {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 9;
      return { x: cx + Math.cos(a) * r0, y: cy + Math.sin(a) * r0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 1, decay: 0.012 + Math.random() * 0.02, size: 0.8 + Math.random() * 2.2 };
    });
    let t0 = performance.now(), raf = 0;
    (function loop(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      if (t > 200) {
        ctx.globalCompositeOperation = "lighter";
        sparks.forEach(s => {
          if (s.life <= 0) return;
          s.x += s.vx; s.y += s.vy; s.vy += 0.12; s.vx *= 0.985; s.life -= s.decay;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, ${150 + Math.round(80 * s.life)}, 90, ${Math.max(0, s.life)})`;
          ctx.lineWidth = s.size;
          ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2);
          ctx.stroke();
        });
      }
      if (t < 1700) raf = requestAnimationFrame(loop);
    })(t0);

    // 4 — The wordmark is forged at the centre.
    const mark = document.createElement("div");
    mark.textContent = word;
    Object.assign(mark.style, {
      position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", whiteSpace: "nowrap",
      fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 500, textTransform: "uppercase",
      fontSize: `clamp(2.4rem, ${Math.min(11, 1100 / Math.max(word.length, 1))}vw, 7rem)`,
      color: "transparent", opacity: 0,
      backgroundImage: `linear-gradient(100deg, #7a4a24 0%, ${COPPER} 35%, #ffe2bd 50%, ${COPPER} 65%, #7a4a24 100%)`,
      backgroundSize: "250% 100%", backgroundClip: "text", WebkitBackgroundClip: "text"
    });
    stage.appendChild(mark);
    mark.animate([
      { opacity: 0, letterSpacing: "0.7em", paddingLeft: "0.7em", filter: "blur(8px)", backgroundPosition: "100% 0" },
      { opacity: 1, letterSpacing: "0.16em", paddingLeft: "0.16em", filter: "blur(0)", backgroundPosition: "0% 0" }
    ], { duration: 900, delay: 620, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
    const line = document.createElement("div");
    Object.assign(line.style, { position: "absolute", left: "50%", top: "calc(50% + clamp(2.2rem, 6vw, 4.4rem))", width: "120px", height: "1px", marginLeft: "-60px", background: COPPER, transform: "scaleX(0)" });
    stage.appendChild(line);
    line.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 600, delay: 1050, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });

    document.documentElement.style.overflow = "hidden";
    setTimeout(() => { cancelAnimationFrame(raf); location.href = href; }, 1750);
  }

  // Coming back with the Back button: drop any leftover overlay.
  addEventListener("pageshow", ev => { if (ev.persisted) location.reload(); });
})();
