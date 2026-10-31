/*
  Site admin — edits the site's data files and images, then publishes them to GitHub.
  The live site (GitHub Pages) rebuilds about a minute after each publish.

  Nothing here is secret: the page only works for someone holding a GitHub key
  with write access to this repository. The key is kept in this browser only.
*/
(function () {
  "use strict";

  // ---------------------------------------------------------------- settings
  const OWNER = "hhike906", REPO = "Portfolio_Website", BRANCH = "main";
  const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
  const TOKEN_KEY = "hh-admin-token", DRAFT_KEY = "hh-admin-draft-v1";

  // Each data file and the globals it defines.
  const FILES = [
    { path: "assets/config.js", globals: ["SITE_CONFIG"], about: "Contact details, links and the email-capture form." },
    { path: "data/text.js", globals: ["SITE_TEXT"], about: "Every editable line of text on the site." },
    { path: "engineering/projects.js", globals: ["PROJECTS"], about: "Engineering projects." },
    { path: "hovehuru/products.js", globals: ["PRODUCTS", "CLANS"], about: "Hove Huru products and the six orders." },
    { path: "ike/content.js", globals: ["IKE"], about: "Ike: featured piece, art, tattoo journey, photography." }
  ];
  const fileOf = g => FILES.find(f => f.globals.includes(g));

  // ---------------------------------------------------------------- state
  const D = {};                 // global name → data
  const sha = {};               // path → blob sha on GitHub
  const dirty = new Set();      // paths with unsaved changes
  const dirtyTabs = new Set();  // tabs the edits were made from (for the sidebar dots)
  const pending = new Map();    // repo path → { blob, url } images/files waiting to upload
  let token = safeGet(TOKEN_KEY) || "";
  let current = "home";

  const $ = s => document.querySelector(s);
  const view = $("#view");

  // ---------------------------------------------------------------- helpers
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function toast(msg, ms) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), ms || 2600);
  }
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach(c => c != null && n.append(c.nodeType ? c : document.createTextNode(c)));
    return n;
  }
  const b64ToText = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), c => c.charCodeAt(0)));
  function textToB64(str) {
    const bytes = new TextEncoder().encode(str); let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  const blobToB64 = blob => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob);
  });
  function runData(code) {           // evaluates a data file in a sandboxed fake window
    const w = {}; new Function("window", code)(w); return w;
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  const slug = s => String(s || "image").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";

  // ---------------------------------------------------------------- GitHub
  async function gh(path, opts) {
    const headers = { Accept: "application/vnd.github+json" };
    if (token) headers.Authorization = "Bearer " + token;
    if (opts && opts.body) headers["Content-Type"] = "application/json";
    const res = await fetch(API + path, Object.assign({ headers, cache: "no-store" }, opts));
    let body = null; try { body = await res.json(); } catch (e) {}
    if (!res.ok) { const e = new Error((body && body.message) || res.statusText); e.status = res.status; throw e; }
    return body;
  }
  async function getFile(path) {
    const b = await gh(`/contents/${path}?ref=${BRANCH}&t=${Date.now()}`);
    return { text: b64ToText(b.content), sha: b.sha };
  }
  async function putFile(path, b64, message, knownSha) {
    const body = { message, content: b64, branch: BRANCH };
    if (knownSha) body.sha = knownSha;
    try {
      const r = await gh(`/contents/${path}`, { method: "PUT", body: JSON.stringify(body) });
      return r.content.sha;
    } catch (e) {
      // File changed on GitHub since we loaded it (or new file needs no sha): refresh sha and retry once.
      if (e.status === 409 || e.status === 422) {
        let fresh = null;
        try { fresh = (await gh(`/contents/${path}?ref=${BRANCH}&t=${Date.now()}`)).sha; } catch (_) {}
        if (fresh) body.sha = fresh; else delete body.sha;
        const r = await gh(`/contents/${path}`, { method: "PUT", body: JSON.stringify(body) });
        return r.content.sha;
      }
      throw e;
    }
  }

  // ---------------------------------------------------------------- load
  async function loadAll() {
    let fromApi = true;
    for (const f of FILES) {
      let text;
      try {
        const r = await getFile(f.path); text = r.text; sha[f.path] = r.sha;
      } catch (e) {
        fromApi = false;
        text = await (await fetch(`../${f.path}?t=${Date.now()}`, { cache: "no-store" })).text();
      }
      const w = runData(text);
      f.globals.forEach(g => (D[g] = w[g] !== undefined ? w[g] : (g === "CLANS" || g === "PRODUCTS" || g === "PROJECTS" ? [] : {})));
    }
    // Restore an unsaved draft from this device, if there is one.
    const raw = safeGet(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d && d.data && d.dirty && d.dirty.length) {
          showNotice(`You have unpublished edits from ${new Date(d.at).toLocaleString()}.`, [
            ["Restore them", () => { Object.assign(D, d.data); d.dirty.forEach(p => dirty.add(p)); (d.tabs || []).forEach(t => dirtyTabs.add(t)); hideNotice(); refresh(); }],
            ["Throw away", () => { safeSet(DRAFT_KEY, null); hideNotice(); }]
          ]);
        }
      } catch (e) { safeSet(DRAFT_KEY, null); }
    }
    if (!fromApi) showNotice("Loaded from the live site (GitHub was unreachable). You can still edit; connect your GitHub key to publish.", null, "info");
  }

  // ---------------------------------------------------------------- change tracking
  function touch(global) {
    dirty.add(fileOf(global).path);
    dirtyTabs.add(current);
    safeSet(DRAFT_KEY, JSON.stringify({ at: Date.now(), data: D, dirty: [...dirty], tabs: [...dirtyTabs] }));
    updateSavebar();
  }
  function updateSavebar() {
    const n = dirty.size + pending.size;
    $("#savebar").hidden = n === 0;
    $("#dirtyText").textContent = n === 0 ? "" :
      `${dirty.size} file${dirty.size === 1 ? "" : "s"} changed` + (pending.size ? ` · ${pending.size} new upload${pending.size === 1 ? "" : "s"}` : "") + " — not live yet";
    document.querySelectorAll(".tabs button").forEach(b => {
      const t = TABS.find(x => x.id === b.dataset.tab);
      b.classList.toggle("dirty", !!t && dirtyTabs.has(t.id) && t.globals.some(g => dirty.has(fileOf(g).path)));
    });
  }

  // ---------------------------------------------------------------- images
  async function resizeImage(file, maxDim) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch (e) {
      bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    }
    const w = bmp.width, h = bmp.height, s = Math.min(1, maxDim / Math.max(w, h));
    const c = document.createElement("canvas"); c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(res, "image/jpeg", 0.82)); // re-encoding also strips camera/GPS data
  }
  function previewSrc(v) {
    if (!v) return "";
    const repoPath = v.replace(/^\.\.\//, "");
    if (pending.has(repoPath)) return pending.get(repoPath).url;
    return /^https?:/.test(v) ? v : "../" + repoPath;
  }

  // ---------------------------------------------------------------- field builders
  function textField(label, get, set, opts) {
    opts = opts || {};
    const input = opts.multi ? el("textarea", { rows: opts.rows || 4 }) : el("input", { type: opts.type || "text", inputmode: opts.inputmode });
    input.value = get() == null ? "" : get();
    if (opts.placeholder) input.placeholder = opts.placeholder;
    input.addEventListener("input", () => { set(input.value); opts.onchange && opts.onchange(); });
    return el("label", { class: "field" + (opts.full ? " full" : "") }, el("span", { text: label }), input, opts.hint ? el("span", { class: "hint", text: opts.hint }) : null);
  }
  function selectField(label, options, get, set, opts) {
    const sel = el("select");
    options.forEach(o => sel.append(el("option", { value: o, text: o === "" ? "— none —" : o })));
    sel.value = get() || "";
    sel.addEventListener("change", () => { set(sel.value); opts && opts.onchange && opts.onchange(); });
    return el("label", { class: "field" }, el("span", { text: label }), sel);
  }
  function boolField(label, get, set, opts) {
    const cb = el("input", { type: "checkbox" }); cb.checked = !!get();
    cb.addEventListener("change", () => { set(cb.checked); opts && opts.onchange && opts.onchange(); });
    return el("label", { class: "check" }, cb, label);
  }
  function imageField(label, folder, get, set, opts) {
    opts = opts || {};
    const thumb = el("div", { class: "thumb" });
    const path = el("input", { type: "text", placeholder: "No image yet" });
    const paint = () => {
      const v = get() || ""; path.value = v;
      thumb.style.backgroundImage = v ? `url("${previewSrc(v)}")` : "";
      thumb.classList.toggle("pending", pending.has(v.replace(/^\.\.\//, "")));
    };
    const file = el("input", { type: "file", accept: opts.accept || "image/*", hidden: true });
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0]; if (!f) return;
      try {
        let blob = f, ext = (f.name.split(".").pop() || "bin").toLowerCase();
        if (!opts.raw) { toast("Resizing…"); blob = await resizeImage(f, opts.max || 1600); ext = "jpg"; }
        const repoPath = `${folder}/${slug(f.name)}-${Date.now().toString(36)}.${ext}`;
        pending.set(repoPath, { blob, url: URL.createObjectURL(blob) });
        set((opts.prefix === undefined ? "../" : opts.prefix) + repoPath);
        paint(); opts.onchange && opts.onchange(); updateSavebar();
        toast(opts.raw ? "File ready — publish to make it live" : `Photo ready (${Math.round(blob.size / 1024)} KB) — publish to make it live`);
      } catch (e) { toast("Couldn't read that file: " + e.message, 4000); }
      file.value = "";
    });
    path.addEventListener("change", () => { set(path.value.trim()); paint(); opts.onchange && opts.onchange(); });
    paint();
    return el("div", { class: "field" + (opts.full === false ? "" : " full") },
      el("span", { text: label }),
      el("div", { class: "imgfield" },
        thumb,
        el("div", { class: "imgbtns" },
          el("button", { type: "button", class: "btn", onclick: () => file.click(), text: opts.raw ? "Upload file" : "Upload photo" }),
          el("button", { type: "button", class: "btn ghost", onclick: () => { set(""); paint(); opts.onchange && opts.onchange(); }, text: "Remove" }),
          path, file)));
  }

  // Generic field from a schema entry, bound to obj[key].
  function fieldFor(f, obj, global, refreshHeader) {
    const get = () => obj[f.key], set = v => { obj[f.key] = v; touch(global); };
    const onchange = refreshHeader;
    switch (f.type) {
      case "textarea": return textField(f.label, get, set, { multi: true, full: true, hint: f.hint, onchange });
      case "select": return selectField(f.label, typeof f.options === "function" ? f.options() : f.options, get, set, { onchange });
      case "bool": return boolField(f.label, get, set, { onchange });
      case "image": return imageField(f.label, f.folder, get, set, { onchange });
      case "price": return textField(f.label, () => (obj[f.key] == null ? "" : obj[f.key]), v => { const n = parseFloat(v); obj[f.key] = v.trim() === "" || isNaN(n) ? null : n; touch(global); }, { inputmode: "decimal", hint: f.hint || "Leave empty for “Price on request”", onchange });
      case "focus": return textField(f.label, () => { const v = obj[f.key] || {}; return v.x == null ? "" : `${v.x}, ${v.y}, ${v.zoom == null ? 1.8 : v.zoom}`; },
        v => { const n = v.split(/[ ,]+/).map(parseFloat).filter(x => !isNaN(x)); obj[f.key] = n.length >= 2 ? Object.assign({}, obj[f.key], { x: n[0], y: n[1], zoom: n[2] || 1.8 }) : undefined; touch(global); },
        { hint: f.hint, onchange });
      case "tags": return textField(f.label, () => (obj[f.key] || []).join(", "), v => { obj[f.key] = v.split(",").map(s => s.trim()).filter(Boolean); touch(global); }, { hint: "Separate with commas", full: true, onchange });
      default: return textField(f.label, get, set, { full: f.full, hint: f.hint, placeholder: f.placeholder, onchange });
    }
  }

  // ---------------------------------------------------------------- list editor
  function listEditor(global, getArr, schema, opts) {
    const box = el("div", { class: "list" });
    const titleOf = opts.title, subOf = opts.sub || (() => ""), imgOf = opts.img || (() => "");
    function render(openIndex) {
      box.innerHTML = "";
      const arr = getArr();
      arr.forEach((item, i) => {
        const mini = el("div", { class: "mini" });
        const ttl = el("div", { class: "ttl" }, el("b"), el("small"));
        const head = () => {
          ttl.firstChild.textContent = titleOf(item) || "(untitled)";
          ttl.lastChild.textContent = subOf(item);
          const im = imgOf(item); mini.style.backgroundImage = im ? `url("${previewSrc(im)}")` : "";
        };
        head();
        const body = el("div", { class: "body" }, el("div", { class: "grid2" }, schema.map(f => fieldFor(f, item, global, head))));
        const card = el("div", { class: "item" + (i === openIndex ? " open" : "") });
        const move = d => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; touch(global); render(j); };
        const ctrls = el("div", { class: "ctrls", onclick: e => e.stopPropagation() },
          el("button", { type: "button", class: "iconbtn", title: "Move up", "aria-label": "Move up", onclick: () => move(-1), text: "↑" }),
          el("button", { type: "button", class: "iconbtn", title: "Move down", "aria-label": "Move down", onclick: () => move(1), text: "↓" }),
          el("button", { type: "button", class: "iconbtn dup", title: "Duplicate", "aria-label": "Duplicate", onclick: () => { arr.splice(i + 1, 0, clone(item)); touch(global); render(i + 1); }, text: "⧉" }),
          el("button", { type: "button", class: "iconbtn del", title: "Delete", "aria-label": "Delete", onclick: () => {
            if (!confirm(`Delete “${titleOf(item) || "this item"}”?`)) return;
            arr.splice(i, 1); touch(global); render(-1);
          }, text: "✕" }));
        card.append(el("header", { onclick: () => card.classList.toggle("open") }, mini, ttl, ctrls), body);
        box.append(card);
      });
      if (!arr.length) box.append(el("p", { class: "small", text: "Nothing here yet." }));
    }
    render(-1);
    const add = el("div", { class: "addrow" },
      el("button", { type: "button", class: "btn", onclick: () => { const arr = getArr(); arr.push(clone(opts.blank)); touch(global); render(arr.length - 1); }, text: "+ " + (opts.addLabel || "Add") }));
    return el("div", null, box, add);
  }

  // ---------------------------------------------------------------- text groups (data/text.js)
  function textCard(title, sub, fields) {
    const T = D.SITE_TEXT;
    return el("section", { class: "card" },
      el("h2", { text: title }), sub ? el("p", { class: "sub", text: sub }) : null,
      el("div", { class: "grid2" }, fields.map(([key, label, kind]) => {
        if (kind === "image") return imageField(label, key.startsWith("hh.") ? "images/hh" : "images/eng", () => T[key], v => { T[key] = v; touch("SITE_TEXT"); });
        return textField(label, () => T[key], v => { T[key] = v; touch("SITE_TEXT"); }, { multi: kind === "long", full: kind === "long" || kind === "wide" });
      })));
  }
  function textList(title, sub, key, addLabel) {
    const T = D.SITE_TEXT;
    if (!Array.isArray(T[key])) T[key] = [];
    return el("section", { class: "card" }, el("h2", { text: title }), el("p", { class: "sub", text: sub }),
      listEditor("SITE_TEXT", () => T[key], [
        { key: "when", label: "When (optional)" }, { key: "title", label: "Title" },
        { key: "detail", label: "Detail", full: true }
      ], { title: x => x.title, sub: x => [x.when, x.detail].filter(Boolean).join(" · "), blank: { when: "", title: "", detail: "" }, addLabel }));
  }

  // ---------------------------------------------------------------- tabs
  const TYPES = ["Work", "Senior Design", "Class", "Fabrication"];
  const CATS = ["Bracelets", "Rings", "Furniture", "Metalwork", "Textiles"];
  const STATUS = ["available", "made-to-order", "coming-soon", "sold-out"];

  const TABS = [
    { id: "home", icon: "⌂", name: "Home page", page: "../", globals: ["SITE_TEXT"], render: () => [
      textCard("Header", "Top of the landing page.", [["hub.name", "Name"], ["hub.tagline", "Tagline", "wide"]]),
      textCard("Engineering panel", null, [["hub.eng.label", "Small label"], ["hub.eng.title", "Title"], ["hub.eng.text", "Text", "long"], ["hub.eng.cta", "Button text"]]),
      textCard("Hove Huru panel", null, [["hub.hh.label", "Small label"], ["hub.hh.title", "Title"], ["hub.hh.text", "Text", "long"], ["hub.hh.cta", "Button text"]]),
      textCard("Ike panel", null, [["hub.ike.label", "Small label"], ["hub.ike.badge", "Badge"], ["hub.ike.title", "Title"], ["hub.ike.text", "Text", "long"], ["hub.ike.cta", "Button text"]])
    ]},
    { id: "engineering", icon: "⚙", name: "Engineering", page: "../engineering/", globals: ["SITE_TEXT", "PROJECTS"], render: () => [
      textCard("Top of the page", null, [["eng.eyebrow", "Small line above headline", "wide"], ["eng.headline", "Headline", "wide"], ["eng.lede", "Intro paragraph", "long"]]),
      textCard("Four highlight boxes", null, [1, 2, 3, 4].flatMap(n => [[`eng.stat${n}.title`, `Box ${n} — title`], [`eng.stat${n}.sub`, `Box ${n} — small text`]])),
      el("section", { class: "card" }, el("h2", { text: "Projects" }),
        el("p", { class: "sub", text: "Order here is the order on the site (featured ones show first). Results are hidden until you fill them — use real numbers." }),
        listEditor("PROJECTS", () => D.PROJECTS, [
          { key: "title", label: "Title", full: true }, { key: "type", label: "Type", type: "select", options: TYPES },
          { key: "when", label: "When" }, { key: "org", label: "Organisation / where", full: true },
          { key: "summary", label: "One-line summary", type: "textarea" }, { key: "problem", label: "Problem", type: "textarea" },
          { key: "approach", label: "What I did", type: "textarea" },
          { key: "result", label: "Result (a number)", type: "textarea", hint: "e.g. “Cut changeover time 22% (18 → 14 min)”. Leave empty to hide." },
          { key: "skills", label: "Skills", type: "tags" }, { key: "img", label: "Photo", type: "image", folder: "images/eng" },
          { key: "featured", label: "Featured (shows first)", type: "bool" }
        ], { title: p => p.title, sub: p => [p.type, p.when].filter(Boolean).join(" · "), img: p => p.img,
             blank: { title: "New project", type: "Work", org: "", when: "", summary: "", problem: "", approach: "", result: "", skills: [], img: "", featured: false }, addLabel: "Add project" }))
    ]},
    { id: "about", icon: "☺", name: "About page", page: "../engineering/about.html", globals: ["SITE_TEXT"], render: () => [
      textCard("Portrait & headline", null, [["about.portrait", "Portrait photo", "image"], ["about.availability", "Line under the portrait", "wide"], ["about.headline", "Headline", "wide"]]),
      textCard("Your story", "Three paragraphs.", [["about.p1", "Paragraph 1", "long"], ["about.p2", "Paragraph 2", "long"], ["about.p3", "Paragraph 3", "long"], ["about.lookingFor", "What I'm looking for", "long"]]),
      textList("Experience", "Newest first.", "about.experience", "Add job"),
      textList("Education", null, "about.education", "Add education"),
      textList("Leadership", null, "about.leadership", "Add role"),
      textCard("Contact box", null, [["about.contactTitle", "Title"], ["about.contactText", "Text", "long"]])
    ]},
    { id: "hovehuru", icon: "◈", name: "Hove Huru", page: "../hovehuru/", globals: ["SITE_TEXT", "PRODUCTS", "CLANS"], render: () => [
      textCard("Hero", "Text around the 3D bracelet.", [["hh.eyebrow", "Small line above the name", "wide"], ["hh.quote", "Quote", "long"]]),
      el("section", { class: "card" }, el("h2", { text: "Products" }),
        el("p", { class: "sub", text: "To take card payments, paste a Stripe Payment Link into “Buy link” and set status to available." }),
        listEditor("PRODUCTS", () => D.PRODUCTS, [
          { key: "name", label: "Name", full: true }, { key: "category", label: "Category", type: "select", options: CATS },
          { key: "clan", label: "Order", type: "select", options: () => [""].concat((D.CLANS || []).map(c => c.name)) },
          { key: "price", label: "Price (USD)", type: "price" }, { key: "status", label: "Status", type: "select", options: STATUS },
          { key: "edition", label: "Edition (optional)" }, { key: "description", label: "Description", type: "textarea" },
          { key: "img", label: "Photo", type: "image", folder: "images/hh" },
          { key: "buyLink", label: "Buy link (Stripe)", full: true, placeholder: "https://buy.stripe.com/…" },
          { key: "featured", label: "Featured at the top of the shop", type: "bool" }
        ], { title: p => p.name, sub: p => [p.category, p.price != null ? "$" + p.price : "price on request", p.status].join(" · "), img: p => p.img,
             blank: { name: "New product", category: "Bracelets", clan: "", price: null, status: "coming-soon", edition: "", description: "", img: "", buyLink: "", featured: false }, addLabel: "Add product" })),
      el("section", { class: "card" }, el("h2", { text: "The six orders" }),
        listEditor("CLANS", () => D.CLANS, [
          { key: "name", label: "Name" }, { key: "animal", label: "Animal / symbol" }, { key: "role", label: "Who they are", type: "textarea" }
        ], { title: c => c.name, sub: c => c.animal, blank: { name: "New order", animal: "", role: "" }, addLabel: "Add order" })),
      textCard("Workshop section", null, [["hh.workshopImg", "Workshop photo", "image"], ["hh.ordersNote", "Line under “The Six Orders”", "wide"], ["hh.craftTitle", "Title", "wide"], ["hh.craftP1", "Paragraph 1", "long"], ["hh.craftP2", "Paragraph 2", "long"]])
    ]},
    { id: "ike", icon: "✶", name: "Ike", page: "../ike/", globals: ["SITE_TEXT", "IKE"], render: () => {
      const I = D.IKE; I.featured = I.featured || { title: "", note: "", cover: "", shots: [] };
      ["art", "tattoos", "photography"].forEach(k => (I[k] = I[k] || []));
      return [
        textCard("Email gate", "What visitors see before they enter.", [["ike.gateText", "Gate text", "long"], ["ike.gateTitle", "Form title"], ["ike.gateFine", "Small print", "wide"]]),
        el("section", { class: "card" }, el("h2", { text: "Intro" }),
          el("div", { class: "grid2" }, textField("Intro paragraph (after unlocking)", () => I.intro, v => { I.intro = v; touch("IKE"); }, { multi: true, full: true }))),
        el("section", { class: "card" }, el("h2", { text: "Featured piece" }),
          el("p", { class: "sub", text: "The interactive cover people play with. Clicking it opens every photo in the list below." }),
          el("div", { class: "grid2" },
            textField("Title", () => I.featured.title, v => { I.featured.title = v; touch("IKE"); }),
            textField("Short note", () => I.featured.note, v => { I.featured.note = v; touch("IKE"); }),
            imageField("Cover photo", "images/ike", () => I.featured.cover, v => { I.featured.cover = v; touch("IKE"); })),
          el("h2", { text: "Gallery photos", style: "margin-top:18px" }),
          listEditor("IKE", () => I.featured.shots, [
            { key: "img", label: "Photo", type: "image", folder: "images/ike" }, { key: "caption", label: "Caption" },
            { key: "focus", label: "Tattoo position", type: "focus", hint: "x %, y %, zoom — e.g. “50, 74, 2” = centre, 74% down, 2× zoom. Empty = centre." }
          ], { title: s => s.caption, img: s => s.img, blank: { img: "", caption: "" }, addLabel: "Add photo" })),
        el("section", { class: "card" }, el("h2", { text: "Art" }),
          listEditor("IKE", () => I.art, [
            { key: "title", label: "Title" }, { key: "medium", label: "Medium" }, { key: "year", label: "Year" },
            { key: "img", label: "Image", type: "image", folder: "images/ike" }
          ], { title: a => a.title, sub: a => [a.medium, a.year].filter(Boolean).join(" · "), img: a => a.img, blank: { title: "", medium: "", year: "", img: "" }, addLabel: "Add artwork" })),
        el("section", { class: "card" }, el("h2", { text: "Tattoo journey" }), el("p", { class: "sub", text: "Oldest first." }),
          listEditor("IKE", () => I.tattoos, [
            { key: "when", label: "When" }, { key: "title", label: "Title" }, { key: "story", label: "Story", type: "textarea" },
            { key: "img", label: "Photo", type: "image", folder: "images/ike" }
          ], { title: t => t.title, sub: t => t.when, img: t => t.img, blank: { when: "", title: "", story: "", img: "" }, addLabel: "Add chapter" })),
        el("section", { class: "card" }, el("h2", { text: "Photography (Life)" }),
          listEditor("IKE", () => I.photography, [
            { key: "title", label: "Title" }, { key: "place", label: "Place" }, { key: "img", label: "Photo", type: "image", folder: "images/ike" }
          ], { title: p => p.title, sub: p => p.place, img: p => p.img, blank: { title: "", place: "", img: "" }, addLabel: "Add photo" }))
      ];
    }},
    { id: "settings", icon: "⚑", name: "Settings", page: "../", globals: ["SITE_CONFIG"], render: () => {
      const C = D.SITE_CONFIG; C.instagram = C.instagram || {};
      const set = (k) => v => { C[k] = v; touch("SITE_CONFIG"); };
      return [
        el("section", { class: "card" }, el("h2", { text: "Contact & links" }),
          el("div", { class: "grid2" },
            textField("Your name", () => C.name, set("name")),
            textField("Email (shown on the site)", () => C.email, set("email"), { type: "email" }),
            textField("Location", () => C.location, set("location")),
            textField("LinkedIn URL", () => C.linkedin, set("linkedin"), { type: "url", placeholder: "https://linkedin.com/in/…", hint: "Empty hides the button." }),
            textField("Instagram — Hove Huru", () => C.instagram.hovehuru, v => { C.instagram.hovehuru = v.replace(/^@/, ""); touch("SITE_CONFIG"); }, { placeholder: "handle, no @" }),
            textField("Instagram — Ike", () => C.instagram.ike, v => { C.instagram.ike = v.replace(/^@/, ""); touch("SITE_CONFIG"); }, { placeholder: "handle, no @" }),
            imageField("Resume (PDF)", "assets", () => C.resumePdf, set("resumePdf"), { raw: true, accept: "application/pdf", prefix: "" }))),
        el("section", { class: "card" }, el("h2", { text: "Email capture" }),
          el("p", { class: "sub", text: "Paste your Formspree form endpoint so the Ike gate and shop inquiries reach your inbox." }),
          el("div", { class: "grid2" },
            textField("Form endpoint", () => C.formEndpoint, set("formEndpoint"), { full: true, type: "url", placeholder: "https://formspree.io/f/…" }))),
        el("section", { class: "card" }, el("h2", { text: "Admin button" }),
          el("p", { class: "sub", text: "The small “Admin” link in every page footer. Turn it off once the site is finished — this page stays at /admin/." }),
          boolField("Show the Admin link in footers", () => C.showAdminLink !== false, v => { C.showAdminLink = v; touch("SITE_CONFIG"); }))
      ];
    }}
  ];

  // ---------------------------------------------------------------- navigation
  function buildTabs() {
    const nav = $("#tabs"); nav.innerHTML = "";
    TABS.forEach(t => nav.append(el("button", { type: "button", "data-tab": t.id, onclick: () => go(t.id) },
      el("span", { class: "ico", text: t.icon, "aria-hidden": "true" }), t.name, el("span", { class: "dot", "aria-hidden": "true" }))));
  }
  function go(id) {
    current = TABS.some(t => t.id === id) ? id : "home";
    if (location.hash !== "#" + current) history.replaceState(null, "", "#" + current);
    refresh();
    scrollTo(0, 0);
  }
  function refresh() {
    const t = TABS.find(x => x.id === current);
    $("#pageTitle").textContent = t.name;
    $("#crumb").textContent = "Admin · " + t.globals.map(g => fileOf(g).path).filter((v, i, a) => a.indexOf(v) === i).join(", ");
    $("#openPage").href = t.page;
    document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-current", String(b.dataset.tab === current)));
    view.innerHTML = "";
    try { view.append(...t.render()); }
    catch (e) { view.append(el("div", { class: "card" }, el("h2", { text: "This section couldn't load" }), el("p", { class: "sub", text: e.message }))); console.error(e); }
    updateSavebar();
  }
  addEventListener("hashchange", () => go(location.hash.slice(1)));

  // ---------------------------------------------------------------- notices
  function showNotice(msg, actions, kind) {
    const n = $("#notice"); n.className = "notice" + (kind ? " " + kind : ""); n.hidden = false; n.innerHTML = "";
    n.append(el("span", { text: msg }));
    if (actions) n.append(el("div", { style: "display:flex;gap:8px" }, actions.map(([label, fn]) => el("button", { type: "button", class: "btn", onclick: fn, text: label }))));
  }
  function hideNotice() { $("#notice").hidden = true; }

  // ---------------------------------------------------------------- token
  function setConn() {
    const s = $("#connState");
    s.textContent = token ? "Connected to GitHub" : "Not connected — can't publish";
    s.classList.toggle("on", !!token);
  }
  function openToken() { $("#tokenInput").value = ""; $("#tokenMsg").textContent = token ? "A key is saved on this device." : ""; $("#tokenMsg").className = "small"; $("#tokenDlg").showModal(); }
  $("#openToken").addEventListener("click", openToken);
  $("#closeToken").addEventListener("click", () => $("#tokenDlg").close());
  $("#forgetToken").addEventListener("click", () => { token = ""; safeSet(TOKEN_KEY, null); setConn(); $("#tokenMsg").textContent = "Key removed from this device."; });
  $("#saveToken").addEventListener("click", async () => {
    const v = $("#tokenInput").value.trim(); const m = $("#tokenMsg");
    if (!v) { m.textContent = "Paste your key first."; m.className = "small bad"; return; }
    m.textContent = "Checking…"; m.className = "small";
    const prev = token; token = v;
    try {
      const repo = await gh("");
      if (!repo.permissions || !repo.permissions.push) throw new Error("This key can read the site but can't edit it. Give it Contents: Read and write.");
      safeSet(TOKEN_KEY, v); setConn();
      m.textContent = "Connected. You can publish now."; m.className = "small ok";
      setTimeout(() => $("#tokenDlg").close(), 700);
    } catch (e) {
      token = prev;
      m.textContent = e.status === 401 ? "GitHub didn't accept that key. Copy it again." : e.status === 404 ? "That key can't see the Portfolio_Website repository. Check “Repository access”." : e.message;
      m.className = "small bad";
    }
  });

  // ---------------------------------------------------------------- publish
  function serialize(f) {
    const head = `/*\n  ${f.about}\n  Edited from the site admin (/admin/). You can also edit this file by hand.\n*/\n`;
    return head + f.globals.map(g => `window.${g} = ${JSON.stringify(D[g], null, 2)};`).join("\n\n") + "\n";
  }
  function usedPaths() {
    const s = JSON.stringify([D.SITE_CONFIG, D.SITE_TEXT, D.PROJECTS, D.PRODUCTS, D.IKE]);
    return [...pending.keys()].filter(p => s.includes(p));
  }
  $("#publish").addEventListener("click", async () => {
    if (!token) { openToken(); return; }
    const btn = $("#publish"); btn.disabled = true; $("#discard").disabled = true;
    const uploads = usedPaths(), files = FILES.filter(f => dirty.has(f.path));
    const total = uploads.length + files.length; let done = 0;
    const tick = label => { btn.textContent = `${label} ${++done}/${total}`; };
    try {
      for (const p of uploads) {
        btn.textContent = `Uploading ${done + 1}/${total}`;
        await putFile(p, await blobToB64(pending.get(p).blob), `Admin: upload ${p.split("/").pop()}`);
        pending.delete(p); tick("Saved");
      }
      [...pending.keys()].forEach(p => pending.delete(p)); // uploads that were replaced or removed before publishing
      for (const f of files) {
        btn.textContent = `Saving ${done + 1}/${total}`;
        sha[f.path] = await putFile(f.path, textToB64(serialize(f)), `Admin: update ${f.path}`, sha[f.path]);
        dirty.delete(f.path); tick("Saved");
      }
      safeSet(DRAFT_KEY, null); dirtyTabs.clear();
      showNotice("Published. The live site updates in about a minute — refresh it then.", [["Open site", () => open(TABS.find(t => t.id === current).page, "_blank")]], "ok");
      toast("Published ✓");
      refresh();
    } catch (e) {
      toast(e.status === 401 || e.status === 403 ? "GitHub refused the save — your key may have expired. Reconnect it." : "Publish failed: " + e.message, 6000);
      if (e.status === 401) openToken();
    } finally {
      btn.disabled = false; $("#discard").disabled = false; btn.textContent = "Publish"; updateSavebar();
    }
  });
  $("#discard").addEventListener("click", async () => {
    if (!confirm("Throw away all unpublished changes?")) return;
    dirty.clear(); dirtyTabs.clear(); pending.clear(); safeSet(DRAFT_KEY, null);
    await loadAll(); refresh(); toast("Changes discarded");
  });
  addEventListener("beforeunload", e => { if (dirty.size || pending.size) { e.preventDefault(); e.returnValue = ""; } });

  // ---------------------------------------------------------------- start
  (async function start() {
    buildTabs(); setConn();
    try { await loadAll(); }
    catch (e) { showNotice("Couldn't load the site data: " + e.message); return; }
    go(location.hash.slice(1) || "home");
    if (!token) showNotice("You can edit everything now. To publish, connect your GitHub key once (about 2 minutes).", [["Connect GitHub", openToken]], "info");
  })();
})();
