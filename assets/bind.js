/*
  Applies editable text from data/text.js (window.SITE_TEXT) to the page.
    data-t="key"      → element text is replaced with SITE_TEXT[key]
    data-img="key"    → element is replaced with <img> when SITE_TEXT[key] has a path
  Pages keep their own defaults, so a missing key never blanks anything.
  Edit everything from /admin/ — no code needed.
*/
(function () {
  const T = window.SITE_TEXT || {};
  const has = k => Object.prototype.hasOwnProperty.call(T, k) && T[k] !== null && T[k] !== undefined;

  document.querySelectorAll("[data-t]").forEach(el => {
    const k = el.getAttribute("data-t");
    if (!has(k) || typeof T[k] !== "string") return;
    el.textContent = T[k];
    if (el.hasAttribute("data-text")) el.setAttribute("data-text", T[k]);
  });

  document.querySelectorAll("[data-img]").forEach(el => {
    const k = el.getAttribute("data-img");
    if (!has(k) || !T[k]) return;
    const img = document.createElement("img");
    img.className = "media";
    img.src = T[k];
    img.alt = el.getAttribute("aria-label") || "";
    img.loading = "lazy";
    [...el.attributes].forEach(a => { if (a.name.startsWith("data-reveal") || a.name === "style") img.setAttribute(a.name, a.value); });
    el.replaceWith(img);
  });

  // Timeline lists: <ol data-list="key"> rebuilt from [{when, title, detail}]
  const esc = v => String(v || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  document.querySelectorAll("[data-list]").forEach(el => {
    const list = T[el.getAttribute("data-list")];
    if (!Array.isArray(list)) return;
    el.innerHTML = list.map(it =>
      `<li data-reveal>${it.when ? `<span class="when">${esc(it.when)}</span>` : ""}<b>${esc(it.title)}</b>${esc(it.detail)}</li>`
    ).join("");
  });

  window.siteText = (k, fallback) => (has(k) ? T[k] : fallback);
})();
