# Tanatswa Mafume — 3-in-1 Website

One site, three doors:

| Path | What it is | Audience |
|---|---|---|
| `/` | Hub with three entry panels | Everyone |
| `/engineering/` | Industrial engineering portfolio + About | Recruiters & hiring managers |
| `/hovehuru/` | Hove Huru luxury house shop | Customers |
| `/ike/` | Art, tattoo journey, photography — email-gated | Fans, clients |

**Send recruiters straight to `/engineering/`**, not the hub.

## Admin (edit text and photos without code)

Open **/admin/** — or tap the small **✎ Admin** button at the bottom of any page.

- Every section has its own tab: Home page, Engineering, About page, Hove Huru, Ike, Settings.
- Edit any text, add/reorder/delete projects, products, orders, tattoo photos and art.
- **Upload photo** resizes to 1600px and strips camera/GPS data before publishing.
- Nothing goes live until you press **Publish**. Unpublished edits are kept on your device if you close the tab.
- First publish asks for a GitHub key (fine-grained token, *Contents: Read and write*, only this repository). It's stored in that browser only.
- Turn the footer Admin button off in **Settings** when the site is finished; /admin/ keeps working.

## Editing by hand (optional)

All content lives in plain data files. On github.com open the file, tap the ✏️ pencil, edit, then **Commit changes**. The site updates in about a minute.

| To change… | Edit this file |
|---|---|
| Email, LinkedIn, resume, Instagram, form endpoint | `assets/config.js` |
| Any page text (headlines, paragraphs, about page lists) | `data/text.js` |
| Engineering projects | `engineering/projects.js` |
| About page text | `engineering/about.html` |
| Products, prices, buy links | `hovehuru/products.js` |
| Ike art, tattoo story, photos | `ike/content.js` |

## Adding photos

1. Open the `images/` folder on GitHub → **Add file → Upload files**.
2. Put them in the right subfolder: `images/eng/`, `images/hh/`, `images/ike/`.
3. In the data file, set `img: "../images/hh/your-photo.jpg"`.

Keep photos under ~500 KB each (export at 1600px wide, JPG quality ~75).

## Turning things on

- **Email capture (Ike gate + shop inquiries):** free account at formspree.io → new form → paste the endpoint into `formEndpoint` in `assets/config.js`. Until then, the Ike gate unlocks but captures nothing, and shop inquiries open the visitor's email app.
- **Card payments:** Stripe → Payment Links → create one per product → paste into that product's `buyLink`. A product with `status: "available"` and a `buyLink` shows **Buy now**.
- **Resume:** upload your PDF to `assets/` and set `resumePdf` in `assets/config.js`.

## Limits worth knowing

- The Ike gate is a **lead-capture gate, not a lock.** Anyone technical can read `ike/content.js` directly. Fine for art and lifestyle work; do **not** put anything there that must stay private.
- Hosting is GitHub Pages: free, static, no server. That's why payments run through Stripe links and emails through Formspree.

## Motion & 3D

- `assets/bracelet.js` — the interactive 3D copper bracelet on the Hove Huru hero (Three.js, bundled in `assets/vendor/`, no CDN). Drag to spin; pauses when off-screen.
- `assets/motion.js` — scroll reveals, tilt, spotlights, text rise. Add `data-reveal` to any element to animate it in.
- Visitors with "reduce motion" turned on get a still, fully readable site.
