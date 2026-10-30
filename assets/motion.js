/*
  Shared motion system — tiny, dependency-free.
    data-reveal            fade/slide in when scrolled into view (add "left", "right", "scale", "wipe" for variants)
    data-reveal-stagger    on a container: its [data-reveal] children animate one after another
    data-tilt              3D tilt toward the cursor (mouse/trackpad only)
    data-spot              sets --mx/--my CSS vars to the cursor position (for spotlights)
    data-magnetic          button drifts slightly toward the cursor
    data-split             splits text into words that rise in sequence
  Everything is skipped for visitors who ask for reduced motion.
  Call Motion.scan() after injecting new [data-reveal] elements.
*/
(function () {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  root.classList.add(reduce ? "motion-off" : "motion-on");

  // ---- Reveal on scroll ----
  const io = !reduce && "IntersectionObserver" in window
    ? new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 })
    : null;

  function scan(scope) {
    const base = scope || document;
    base.querySelectorAll("[data-reveal-stagger]").forEach(group => {
      const step = parseFloat(group.dataset.revealStagger) || 70;
      group.querySelectorAll(":scope > [data-reveal], :scope > * > [data-reveal]").forEach((el, i) => {
        el.style.setProperty("--d", Math.min(i * step, 900) + "ms");
      });
    });
    base.querySelectorAll("[data-reveal]:not(.in):not([data-observed])").forEach(el => {
      el.setAttribute("data-observed", "");
      if (io) io.observe(el); else el.classList.add("in");
    });
    base.querySelectorAll("[data-split]:not([data-split-done])").forEach(splitWords);
    if (fine && !reduce) {
      base.querySelectorAll("[data-tilt]:not([data-tilt-on])").forEach(tilt);
      base.querySelectorAll("[data-magnetic]:not([data-mag-on])").forEach(magnetic);
    }
    base.querySelectorAll("[data-spot]:not([data-spot-on])").forEach(spot);
  }

  function splitWords(el) {
    el.setAttribute("data-split-done", "");
    if (reduce) return;
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map((w, i) =>
      `<span class="w" aria-hidden="true"><span style="--d:${i * 60}ms">${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span>`
    ).join(" ");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("split-in")));
  }

  function tilt(el) {
    el.setAttribute("data-tilt-on", "");
    const max = parseFloat(el.dataset.tilt) || 6;
    let raf = 0;
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
      });
    });
    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      el.style.transform = "";
    });
  }

  function magnetic(el) {
    el.setAttribute("data-mag-on", "");
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  }

  function spot(el) {
    el.setAttribute("data-spot-on", "");
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }

  // ---- Scroll progress bar (if present) ----
  const bar = document.querySelector("[data-progress]");
  if (bar) {
    const upd = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    };
    addEventListener("scroll", upd, { passive: true });
    upd();
  }

  window.Motion = { scan, reduce, fine };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => scan());
  else scan();
})();
