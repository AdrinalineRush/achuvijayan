# Achu Vijayan — Personal Portfolio Website

Official cinematic portfolio for **Achu Vijayan** — Film Director, Editor, Producer, VFX Artist & Colorist (Kerala, India).

A static site with no build step, deployed on Vercel.

---

## Structure

```
AchuVijayan/
├── index.html      # Page structure, copy and SEO / social metadata
├── style.css       # Design system, layouts, and the no-JS / reduced-motion fallback
├── app.js          # Renders films + campaigns from data.js, archive, dialog, scroll motion
├── data.js         # Filmography (FEATURE_FILMS) and AI campaigns (AI_CAMPAIGNS)
├── vendor/         # GSAP 3.15 (+ ScrollTrigger, SplitText) and Lenis 1.3.26, self-hosted
├── assets/
│   ├── icons/      # Logo and favicons
│   └── images/     # Portrait, film posters, campaign images
└── vercel.json     # Headers and caching
```

## The page

1. **Opening** — film-leader loader, then the name parts as the portrait frame opens to full height.
2. **Statement** — words light up as they scroll past; a marquee follows scroll speed and direction.
3. **01 Upcoming work** — House For Sale and Boom Bang, revealed with poster wipes and parallax.
4. **02 The film archive** — a pinned horizontal timeline of every title (oldest → newest) under a playhead, then the filterable complete filmography with a poster preview.
5. **03 About** — the page turns to paper.
6. **04 Beyond the frame** — AI campaign cards that stack as you scroll.
7. **05 Contact** — the lime panel floods in from below.

Motion is skipped for visitors who prefer reduced motion; every section still reads as a static page without JavaScript.

## Editing content

- **Add or change a film:** edit `FEATURE_FILMS` in `data.js` (newest first). Put the poster in `assets/images/`
  and add its pixel size to `POSTER_SIZE` in `app.js` so the timeline can lay out before images load.
  A film with an empty `poster` gets a clapperboard slate instead.
- **Upcoming films:** the `UPCOMING` list in `app.js`.
- After changing `data.js`, `style.css` or `app.js`, bump the `?v=` query on its tag in `index.html`.

## Local preview

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
