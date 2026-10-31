#!/usr/bin/env python3
"""Cache-busting for GitHub Pages (which tells browsers to reuse files for 10 minutes).

- Code and styles (local .js/.css) get ?v=<build stamp>, refreshed on every commit.
- Data files the admin edits (config, text, projects, products, content) are loaded with a
  per-minute stamp at page load, so admin publishes show up within a minute without a rebuild.
Run before committing:  python3 tools/stamp.py
"""
import re, time, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["index.html", "engineering/index.html", "engineering/about.html", "hovehuru/index.html", "ike/index.html", "admin/index.html"]
DATA = ("assets/config.js", "data/text.js", "engineering/projects.js", "hovehuru/products.js", "ike/content.js", "projects.js", "products.js", "content.js")
STAMP = time.strftime("%Y%m%d%H%M%S")

def is_data(src):
    clean = src.split("?")[0]
    return any(clean.endswith(d) for d in DATA) and not clean.endswith("inkreel.js")

for rel in PAGES:
    p = ROOT / rel
    s = p.read_text()
    # 1) data scripts → live loader (idempotent: only converts plain <script src> tags)
    def to_live(m):
        src = m.group(1).split("?")[0]
        if not is_data(src):
            return m.group(0)
        return ("<script data-live=\"%s\">document.write('<script src=\"%s?t='+Math.floor(Date.now()/6e4)+'\"><\\/script>')</script>" % (src, src))
    s = re.sub(r'<script src="((?!https?:)[^"]+\.js(?:\?[^"]*)?)"></script>', to_live, s)
    # 2) code + styles → build stamp
    s = re.sub(r'(<script(?: type="module")? src="(?!https?:)[^"?]+\.js)(?:\?v=\d+)?(")', r'\1?v=%s\2' % STAMP, s)
    s = re.sub(r'(<link rel="stylesheet" href="(?!https?:)[^"?]+\.css)(?:\?v=\d+)?(")', r'\1?v=%s\2' % STAMP, s)
    p.write_text(s)
print("stamped", STAMP)
