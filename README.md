[![CI](https://github.com/classthandstrategies-ai/stardust/actions/workflows/ci.yml/badge.svg)](https://github.com/classthandstrategies-ai/stardust/actions/workflows/ci.yml)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/classthandstrategies-ai/stardust)
[![License: MIT](https://img.shields.io/badge/License-MIT-8a7bff.svg)](LICENSE)

# ✦ Stardust

> The real night sky, exactly as it appeared the moment and place you were born —
> rendered as a slow-drifting, glowing constellation field.

Stardust takes a birth date, an optional birth time, and a location, then uses
**real astronomy** (computed entirely in your browser) to show which stars and
constellations were above the horizon, where the planets sat, and what phase the
Moon was in. It’s built to feel like a planetarium at 2 a.m. — not a data
dashboard.

---

## 📸 Screenshot / Demo

> **Add media here.** Drop a screenshot or short screen-capture GIF of a
> generated sky into `docs/` and reference it below, e.g.:
>
> ```md
> ![Stardust — a generated birth sky](docs/screenshot.png)
> ```
>
> A good capture: a generated sky with constellation lines faintly visible, the
> Moon at phase, and the info panel in the corner.

## 🌐 Live demo

**→ [stardust-two.vercel.app](https://stardust-two.vercel.app)**

---

## ✨ Features

- **Real astronomy, no API key** — star, planet, and Moon positions computed
  client-side with [`astronomy-engine`](https://github.com/cosinekitty/astronomy).
- **Your exact sky** — enter birth date, optional time, and location; the app
  computes the horizon for that precise instant.
- **Immersive 3D star field** — real stars from a bright-star catalogue, sized
  by true apparent magnitude, with soft glow/bloom.
- **Faint constellation lines** — real western constellation patterns, drawn
  thin and quiet.
- **Accurate Moon phase & planets** — the Moon at its real illuminated phase and
  position; visible planets correctly placed and labelled with a one-line fact.
- **Named bright stars** — hover or tap the brightest stars (Sirius, Vega,
  Arcturus…) to name them, with a short note on their colour and brightness.
- **Ambient drift** — a gentle, continuous camera glide you can just watch, plus
  orbit controls to explore manually.
- **City search or manual lat/long** — free Open-Meteo geocoding, or type
  coordinates directly.
- **Save your sky** — export a high-resolution, shareable PNG with an elegant
  caption.
- **Calm by design** — minimal UI, deep cosmic palette, respects
  `prefers-reduced-motion`.

## 🛠 Tech stack

| Area            | Tech                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | [React 18](https://react.dev) + [Vite](https://vitejs.dev)                                                                                                                                                 |
| Styling         | [Tailwind CSS](https://tailwindcss.com)                                                                                                                                                                    |
| 3D rendering    | [Three.js](https://threejs.org) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [drei](https://github.com/pmndrs/drei), [postprocessing](https://github.com/pmndrs/react-postprocessing) |
| Astronomy       | [astronomy-engine](https://github.com/cosinekitty/astronomy)                                                                                                                                               |
| Dates/timezones | [Luxon](https://moment.github.io/luxon/)                                                                                                                                                                   |
| Geocoding       | [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) (free, no key)                                                                                                                    |
| Star data       | HYG database + Stellarium constellation lines                                                                                                                                                              |

## ✅ Prerequisites

- **Node.js ≥ 18** (18, 20, or 22 LTS recommended) and npm ≥ 9.
- A modern browser with WebGL2.

## 🚀 Installation

```bash
# 1. Clone
git clone https://github.com/classthandstrategies-ai/stardust.git
cd stardust

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev
# open the printed http://localhost:5173
```

Build for production and preview:

```bash
npm run build     # outputs static site to dist/
npm run preview   # serves the production build locally
```

Other useful scripts:

```bash
npm run lint      # ESLint
npm run format    # Prettier (write)
npm run verify    # run the astronomy verification checks
```

## 🔐 Environment variables

Stardust needs **no secrets or API keys** to run — all astronomy is local and the
geocoding API is keyless. A `.env.example` is included documenting the few
_optional_ knobs (e.g. overriding the geocoding endpoint). To use them:

```bash
cp .env.example .env
# edit values as needed; all are optional
```

If you don’t create a `.env`, sensible defaults are used.

## 🧭 Usage

1. On load, enter a **birth date**.
2. Optionally add a **birth time**. If you leave it blank the app shows a
   representative evening sky (10pm local) and notes that the orientation is
   approximate without an exact time.
3. Choose a **location**: search for a city, or switch to manual mode and enter
   latitude/longitude (and a UTC offset).
4. Press **“Reveal the sky.”** The 3D field renders and begins to drift.
5. **Drag** to look around; let go and the ambient drift resumes.
6. **Hover/click** the Moon, a planet, or a bright named star for its name and a
   one-line fact.
7. Read the **info panel** (corner) for the exact date/time/location and a note
   about what’s notable in that sky.
8. Click **“Save this sky”** to download a shareable image.

## 📁 Project structure

```
stardust/
├── public/                 # static assets served as-is
├── src/
│   ├── components/         # React UI + R3F scene components
│   │   ├── scene/          # Three.js: StarField, ConstellationLines, Moon, Planets, CameraRig
│   │   └── ui/             # InputForm, InfoPanel, SaveButton, etc.
│   ├── astronomy/          # sky.js — astronomy-engine pipeline, alt/az, summaries
│   ├── data/               # bundled star + constellation JSON (generated, committed)
│   ├── lib/                # helpers (geocoding, image export, formatting)
│   ├── styles/             # Tailwind entry + globals
│   ├── App.jsx
│   └── main.jsx
├── scripts/                # data build + astronomy verification (Node)
├── docs/                   # screenshots / media for the README
├── PROJECT.md PLAN.md DESIGN.md KNOWLEDGE.md   # foundational docs
└── ...config (vite, tailwind, eslint, prettier, vercel)
```

## 🤝 Contributing

Contributions are very welcome — issues, fixes, and ideas alike. Please read
[CONTRIBUTING.md](CONTRIBUTING.md) for how to file issues, branch naming, and the
PR process. Be kind; keep the sky calm.

## 📄 License

[MIT](LICENSE) © Stardust contributors.

## 🙏 Credits & acknowledgments

- **[astronomy-engine](https://github.com/cosinekitty/astronomy)** by Don Cross —
  the real ephemeris powering every position and Moon phase.
- **[HYG database](https://github.com/astronexus/HYG-Database)** by David Nash /
  AstroNexus — the open star catalogue (Hipparcos + Yale BSC + Gliese lineage).
- **[Stellarium](https://stellarium.org/)** — western constellation line figures.
- **[Open-Meteo](https://open-meteo.com/)** — free, keyless city geocoding.
- **[Three.js](https://threejs.org)** and the **[Poimandres](https://pmnd.rs/)**
  ecosystem (react-three-fiber, drei, postprocessing).

Built with care to be accurate first and beautiful throughout. ✦
