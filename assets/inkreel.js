/*
  Silent video reel with ink-splatter transitions.
  InkReel.start(container, [{ video, poster }, ...])
  - Plays each clip once, then ink splats flood the frame, the next clip is swapped in
    underneath, and the ink bursts apart to reveal it. Loops forever.
  - Two <video> layers so the next clip is already buffered when the ink covers the swap.
  - Muted + playsinline so phones autoplay. Pauses off-screen and in background tabs.
  - Reduced motion: shows the first clip's poster, no autoplay.
*/
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#111111", RED = "#d1281f";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function splatPath(r) {
    const N = 20, pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + rnd(-0.1, 0.1);
      let rr = r * rnd(0.8, 1.12);
      if (Math.random() < 0.22) rr = r * rnd(1.35, 1.85);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }
  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  function start(box, items) {
    items = (items || []).filter(x => x && x.video);
    if (!box || !items.length || box.dataset.reel) return;
    box.dataset.reel = "1";

    const mk = () => {
      const v = document.createElement("video");
      v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
      v.disablePictureInPicture = true;
      box.appendChild(v);
      return v;
    };
    const A = mk(), B = mk();
    const ink = el("svg", { class: "reel-ink", "aria-hidden": "true" });
    box.appendChild(ink);

    let cur = 0, front = A, back = B, busy = false, visible = true, timer = 0;
    const load = (v, i) => { v.src = items[i].video; v.poster = items[i].poster || ""; v.load(); };

    load(front, 0);
    front.classList.add("on");
    if (reduce) { front.removeAttribute("src"); front.load(); return; }  // poster only
    if (items.length > 1) load(back, 1);

    const play = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const tryPlay = () => { if (visible && !document.hidden && !busy) play(front); };

    // When the current clip ends (or a safety timeout fires), run the ink transition.
    function armEnd() {
      clearTimeout(timer);
      front.onended = next;
      timer = setTimeout(next, ((front.duration && isFinite(front.duration) ? front.duration : 6) + 1.5) * 1000);
    }
    front.addEventListener("playing", armEnd, { once: true });

    function next() {
      if (busy) return;
      clearTimeout(timer); front.onended = null;
      if (items.length === 1) { front.currentTime = 0; play(front); armEnd(); return; }
      busy = true;
      const W = box.clientWidth, H = box.clientHeight;
      ink.setAttribute("viewBox", `0 0 ${W} ${H}`);
      ink.innerHTML = "";
      const reach = Math.hypot(W, H);
      // 1) ink floods in from a few splats
      const spots = Array.from({ length: 5 }, (_, i) => ({ x: rnd(W * 0.1, W * 0.9), y: rnd(H * 0.15, H * 0.85), r: rnd(40, 70), red: i === 2 }));
      const flood = spots.map((p, i) => {
        const g = el("g", { transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})` });
        const inner = el("g", {});
        inner.appendChild(el("path", { d: splatPath(p.r), fill: p.red ? RED : INK }));
        g.appendChild(inner); ink.appendChild(g);
        inner.animate([{ transform: "scale(0)" }, { transform: "scale(1.15)", offset: 0.35 }, { transform: `scale(${(reach / p.r * 0.75).toFixed(1)})` }],
          { duration: 620, delay: i * 55, easing: "cubic-bezier(.55,0,.35,1)", fill: "forwards" });
        return inner;
      });
      // flying droplets on the way in
      spots.forEach(p => {
        for (let k = 0; k < 6; k++) {
          const a = rnd(0, Math.PI * 2), d = rnd(p.r * 1.5, p.r * 3.5);
          const c = el("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: rnd(2.5, 7).toFixed(1), fill: k % 3 ? INK : RED });
          ink.appendChild(c);
          c.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${(Math.cos(a) * d).toFixed(1)}px,${(Math.sin(a) * d + 16).toFixed(1)}px)`, opacity: 1 }],
            { duration: rnd(320, 520), easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" });
        }
      });

      // 2) once covered, swap clips underneath
      setTimeout(() => {
        front.pause(); front.classList.remove("on");
        back.currentTime = 0; back.classList.add("on");
        play(back);
        [front, back] = [back, front];
        cur = (cur + 1) % items.length;
        load(back, (cur + 1) % items.length);       // buffer the one after

        // 3) ink bursts apart to reveal the new clip
        const C = { x: W / 2, y: H / 2 };
        const hole = el("circle", { cx: C.x, cy: C.y, r: 1 });
        const maskId = "reelmask" + Date.now();
        const defs = el("defs", {}), mask = el("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H });
        mask.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#fff" }));
        const holeGroup = el("g", { transform: `translate(${C.x},${C.y})` });
        const holePath = el("path", { d: splatPath(30), fill: "#000" });
        holeGroup.appendChild(holePath); mask.appendChild(holeGroup);
        defs.appendChild(mask); ink.insertBefore(defs, ink.firstChild);
        const cover = el("g", { mask: `url(#${maskId})` });
        [...ink.childNodes].filter(n => n !== defs && n !== cover).forEach(n => cover.appendChild(n));
        ink.appendChild(cover);
        holePath.animate([{ transform: "scale(0)" }, { transform: `scale(${(reach / 30 * 0.8).toFixed(1)})` }],
          { duration: 650, easing: "cubic-bezier(.6,0,.3,1)", fill: "forwards" });
        // a last red flick crossing the reveal
        const fg = el("g", { transform: `translate(${(C.x + rnd(-W * 0.25, W * 0.25)).toFixed(1)},${(C.y + rnd(-H * 0.2, H * 0.2)).toFixed(1)})` });
        const flick = el("path", { d: splatPath(14), fill: RED });
        fg.appendChild(flick); ink.appendChild(fg);
        flick.animate([{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1.2)", offset: 0.4 }, { opacity: 0, transform: "scale(1.6)" }],
          { duration: 600, easing: "ease-out", fill: "forwards" });

        setTimeout(() => { ink.innerHTML = ""; busy = false; armEnd(); tryPlay(); }, 700);
      }, 700);
    }

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? tryPlay() : front.pause(); }, { threshold: 0.15 }).observe(box);
    document.addEventListener("visibilitychange", () => (document.hidden ? front.pause() : tryPlay()));
    front.addEventListener("canplay", tryPlay, { once: true });
    tryPlay();
  }

  window.InkReel = { start };
})();
