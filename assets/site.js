/* Shared helpers: image-or-placeholder, form posting, footer year. */
(function () {
  const cfg = window.SITE_CONFIG || {};

  // Returns an <img> if a path is given, otherwise a labelled placeholder.
  window.mediaHTML = function (src, alt, label) {
    if (src) {
      return `<img class="media" src="${src}" alt="${escapeHTML(alt || "")}" loading="lazy">`;
    }
    return `<div class="ph" role="img" aria-label="${escapeHTML(alt || "Photo coming")}">${escapeHTML(label || "Photo coming")}</div>`;
  };

  window.escapeHTML = escapeHTML;
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Sends form data to the configured endpoint. Resolves true/false; never throws.
  window.submitLead = async function (data) {
    if (!cfg.formEndpoint) return false;
    try {
      const res = await fetch(cfg.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  window.safeStore = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
    document.querySelectorAll("[data-email]").forEach(el => {
      if (cfg.email) { el.href = "mailto:" + cfg.email; if (!el.textContent.trim()) el.textContent = cfg.email; }
    });
    document.querySelectorAll("[data-linkedin]").forEach(el => {
      if (cfg.linkedin) el.href = cfg.linkedin; else el.remove();
    });
    document.querySelectorAll("[data-resume]").forEach(el => {
      if (cfg.resumePdf) el.href = (el.dataset.resume || "") + cfg.resumePdf; else el.remove();
    });
    document.querySelectorAll("[data-ig]").forEach(el => {
      const h = (cfg.instagram || {})[el.dataset.ig];
      if (h) { el.href = "https://instagram.com/" + h; el.textContent = "@" + h; } else el.remove();
    });
  });
})();
