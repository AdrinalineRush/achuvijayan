# Achu Vijayan — Personal Portfolio Website

Official cinematic portfolio for **Achu Vijayan** — Film Director, Editor, Certified DaVinci Resolve Colorist, and AI Video Producer (Ernakulam, Kerala).

Built as a lightweight, zero-dependency, ultra-fast static site ready to deploy directly to Vercel, Cloudflare Pages, GitHub Pages, or Firebase Hosting.

---

## 📽️ Features & Structure

* **Design Aesthetic**: Cinematic Dark & Editorial (`#0A0A0D` obsidian background, warm amber/brass `#E8A04C`, colorist teal `#3A8B8C`, Fraunces & JetBrains Mono typography).
* **NLE Timeline Scrubber**: Real-time read-progress bar styled after a video editor playhead.
* **Verified Filmography**: Complete filmography across 17 titles including *Vichithram* (Directorial debut), *Aattam* (Co-Producer, 3× National Film Awards), *Charles Enterprises*, *Mukundan Unni Associates*, *Boom Bang*, and *Second Show*.
* **Dynamic Role Filtering**: Instant client-side filtering by **All / Directing / Editing / Producing / VFX**.
* **Dual View Modes**: Interactive **Poster Grid** and **Master Filmography Table**.
* **Film Detail Lightbox Modal**: Click any card or row to open high-res artwork, cast, director, production banner, and synopsis.
* **AI Video & Campaigns**: Case studies for *Allwyn ("Possible is Beautiful" / The Gate Worldwide)*, *Breeze (25th Anniversary)*, *SC Banca 2.0*, and *Aistory*.
* **Toolkit & Color Bay**: DaVinci Resolve Studio color grading workflow, ACES color management, and AI generative pipelines.
* **SEO & Social Previews**: Clean Open Graph and Twitter Card tags with zero third-party platform branding.

---

## 📂 Project Structure

```
AchuVijayan/
├── index.html              # Core semantic layout & SEO metadata
├── robots.txt              # Search engine crawling rules
├── vercel.json             # Vercel deployment & caching headers
├── css/
│   └── style.css           # Complete cinematic dark design system
├── js/
│   ├── filmography-data.js # Verified production credits & campaign data
│   └── main.js             # Filtering, modal lightbox, & scroll interactions
└── assets/
    ├── icons/
    │   └── favicon.svg     # Anamorphic AV monogram SVG icon
    └── images/             # Real film posters and portrait assets
```

---

## 🚀 Local Preview

Run any lightweight local server:

```bash
# Option 1: Python built-in server
python3 -m http.server 3000

# Option 2: Node npx serve
npx serve .
```

Then open `http://localhost:3000` in your browser.
