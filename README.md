# FitFuel — Gym Equipment E-Commerce Catalog

A modular front-end capstone project: static HTML/CSS/JS single-page app with
client-side hash routing, a searchable/filterable product catalog, a
localStorage-backed cart, and dark mode — no framework, no build dependency
required to run it.

## Project structure

```
fitfuel/
├── index.html          # single HTML shell; SPA views toggle inside it
├── css/style.css        # design tokens + all styles (light & dark)
├── js/app.js             # router, cart, catalog rendering, dark mode
├── data/products.json     # product catalog — the single source of truth
├── images/*.svg             # lightweight reused category thumbnails
├── build.js                  # generates the production build
├── dist/                       # ⚠️ GENERATED — do not hand-edit, run `npm run build`
└── netlify.toml
```

## Run locally

No build step needed for development:

```
npx serve .
```

Then open the printed local URL.

## Production build

```
npm install
npm run build
```

This regenerates `dist/` — minified HTML/CSS/JS, ~30% smaller — which is what
actually gets deployed. `dist/` is generated output; always edit the source
files (`index.html`, `css/`, `js/`, `data/`) and rebuild, never edit `dist/`
directly.

## Routes

All navigation is client-side hash routing (`js/app.js` → `router()`):

| Hash            | View               |
|-----------------|--------------------|
| `#home`         | Home                |
| `#/products`     | Full catalog (search + filter) |
| `#/product/:id`  | Single product detail |
| `#/cart`          | Cart                |
| `#/about`          | About page            |
| `#/contact`         | Contact page           |

## Connecting the contact form

The Contact page form (`#contact-form` in `index.html`) currently just validates
and shows a success message in `setupContactForm()` (`js/app.js`) — nothing is
actually sent anywhere yet. To make it real, pick one:

**Option A — Netlify Forms (no backend code, since you're already deploying there):**
1. In `index.html`, add `data-netlify="true"` and a hidden `<input type="hidden" name="form-name" value="contact">` to the `<form id="contact-form">` element.
2. Netlify auto-detects it on deploy and gives you submissions in the dashboard/email — no JS changes needed, though you can still keep the `preventDefault` UX and instead let it POST normally, or fetch-submit to `/` with `Content-Type: application/x-www-form-urlencoded`.

**Option B — Formspree (works on Vercel/Netlify/anywhere):**
1. Create a free endpoint at formspree.io, e.g. `https://formspree.io/f/xxxxxxx`.
2. In `setupContactForm()`, replace the "simulates a successful send" block with:
   ```js
   const res = await fetch("https://formspree.io/f/xxxxxxx", {
     method: "POST",
     headers: { Accept: "application/json" },
     body: new FormData(form),
   });
   status.textContent = res.ok ? "Thanks — message sent!" : "Something went wrong, try again.";
   ```

**Option C — your own backend/serverless function:** point the `fetch()` call above at your own `/api/contact` endpoint instead.

## Deploy

**Netlify (drag & drop):** run `npm run build`, then drag the `dist/` folder
onto https://app.netlify.com/drop.

**Netlify (CLI):**
```
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

**Vercel (CLI):**
```
npm i -g vercel
npm run build
vercel --prod dist
```

Both platforms serve `dist/` as a static site; `netlify.toml` is already
configured to redirect all routes to `index.html` so hash-based navigation
and page refreshes on `#/products` etc. work correctly.


## Live Demo

https://fitfuelecom.netlify.app/