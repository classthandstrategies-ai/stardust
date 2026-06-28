# Stardust — Build Plan

This plan is organised into phases. Each phase has a clear deliverable and an
exit check so progress is verifiable.

---

## Phase 0 — Foundations & docs ✅

- Repo + standalone git history.
- Foundational docs: `PROJECT.md`, `PLAN.md`, `DESIGN.md`, `KNOWLEDGE.md`,
  `README.md`.
- `.gitignore`.

**Exit check:** all five docs present and coherent before any application code.

---

## Phase 1 — Project scaffold

- Vite + React 18 single-page app.
- Tailwind CSS for UI chrome.
- Three.js via `@react-three/fiber`, with `@react-three/drei`
  (OrbitControls, helpers) and `@react-three/postprocessing` (bloom).
- `astronomy-engine` for ephemeris; `luxon` for timezone-correct local→UTC.
- Base HTML/CSS shell with deep-space background.

**Exit check:** `npm run dev` serves a black canvas; `npm run build` succeeds.

---

## Phase 2 — Astronomy data

- Bundle a real bright-star catalogue (HYG lineage): RA, Dec, apparent
  magnitude, proper name, HIP id, Bayer/Flamsteed designation. Filtered to
  naked-eye magnitude (≤ ~6.5) and stored as compact JSON in `src/data/`.
- Bundle a real constellation-line dataset (Stellarium "modern" / western
  star-pair lines, keyed by HIP id) as JSON.
- A one-off, committed-output fetch/transform script (`scripts/`) so the data
  is reproducible but the app needs **no** network at build or run time.

**Exit check:** datasets load in the app; star count and constellation count are
sane (hundreds of constell(ation segments, thousands of stars).

---

## Phase 3 — Astronomy engine layer

- `sky.js` module: given `{ date(UTC instant), latitude, longitude }`, compute:
  - Greenwich apparent sidereal time → local sidereal time.
  - Per-star hour angle → altitude/azimuth (vectorised over the catalogue).
  - Planet RA/Dec of date via `astronomy-engine` `Equator`, then `Horizon`
    for alt/az.
  - Moon position (alt/az) and illuminated fraction / phase angle / phase name.
- Map alt/az → unit vectors on the celestial dome (Y-up, North = −Z, East = +X).
- Horizon filtering helpers (which bodies have altitude > 0).
- Sky-summary generator (notable planets up, Moon phase sentence).

**Exit check:** a Node test reproduces known alt/az and Moon phase for the
reference case in `KNOWLEDGE.md` within tolerance.

---

## Phase 4 — 3D rendering

- Star field as a single `THREE.Points` cloud with a custom shader: per-star
  size from apparent magnitude, soft circular glow, additive blending, subtle
  colour from spectral hint.
- Constellation lines as thin, faint `LineSegments` built from the HIP pairs.
- Moon: a small sphere with a shader/material reproducing the correct phase
  terminator, placed at its real alt/az.
- Planets: glowing markers at real positions, colour-hinted.
- Post-processing bloom for the overall glow.
- Subtle horizon haze / ground fade so "below horizon" reads correctly.

**Exit check:** renders the reference sky; brighter stars are visibly larger;
constellation patterns are recognisable (e.g. Orion, the Big Dipper).

---

## Phase 5 — Ambient motion & interaction

- Continuous slow camera drift (gentle azimuthal + slight altitude sway),
  pausing briefly when the user interacts, then resuming.
- `OrbitControls` for manual exploration (damped, no jarring snaps).
- Hover/click labels for the Moon and planets: real name + one-line fact.

**Exit check:** motion is smooth and never jarring; manual drag works; labels
appear subtly.

---

## Phase 6 — UI & features

- Input form: date, optional time (defaults to noon with an "approximate"
  note), location via Open-Meteo city search or manual lat/long (+ UTC offset
  for manual mode).
- Minimal info panel: exact date/time/location used + one notable factual line.
- "Save this sky": render the WebGL canvas (with overlaid caption) to a
  downloadable high-resolution PNG.
- Intro / landing state before a sky is generated.

**Exit check:** full flow works from empty state → generated sky → saved image.

---

## Phase 7 — Release preparation

- Remove dead code & stray logs; inline comments only where non-obvious.
- Prettier + ESLint configured and clean.
- `.env.example`, robust `.gitignore`.
- `LICENSE` (MIT), `CONTRIBUTING.md`.
- GitHub Actions CI (install → lint → build) for push & PR.
- README badges (CI + deploy), one-click deploy config (`vercel.json`).

**Exit check:** CI config present; lint & build pass locally.

---

## Phase 8 — Final verification

- Simulate a fresh clone: clean install, `npm run build`, `npm run lint`.
- Confirm zero errors and that the astronomy verification still passes.

**Exit check:** clean install + build + lint all green; app ready to push public.
