# Stardust — Project Overview

## Purpose

**Stardust** renders the real night sky exactly as it appeared at the moment and
place someone was born. Give it a birth date, an (optional) birth time, and a
birth location, and it computes — entirely in the browser, with real astronomy —
which stars and constellations stood above the horizon, where the visible planets
sat, and what phase the Moon was in. The result is presented as an immersive,
slowly drifting, glowing 3D constellation field.

The goal is emotional as much as technical: it should feel like standing under a
planetarium dome at 2 a.m., looking up at _your_ sky. Not a data dashboard — a
quiet, beautiful, shareable artifact.

## What makes it real (not decorative)

- **Genuine astronomical computation.** Star, planet, and Moon positions are
  computed with the [`astronomy-engine`](https://github.com/cosinekitty/astronomy)
  library and a real bright-star catalogue (HYG / Yale BSC lineage). Nothing is
  faked or randomly placed.
- **Accurate horizon.** The app converts each body's celestial coordinates into
  local horizontal coordinates (altitude/azimuth) for the exact instant and
  geographic location, so "above the horizon" means what it actually meant that
  night.
- **Real Moon phase & planet placement.** The Moon is drawn at its true
  illuminated fraction and sky position; planets are placed at their real
  apparent positions and labelled with their names.
- **Client-side & key-free.** All astronomy runs in the browser. The only network
  call is an optional free city-geocoding lookup (Open-Meteo), which the user can
  bypass entirely with manual latitude/longitude.

## Primary user flow

1. Enter birth date, optional time, and a location (city search or manual
   lat/long).
2. Stardust computes the sky for that exact instant.
3. An immersive 3D star field renders: stars sized by real apparent magnitude,
   faint constellation lines, the Moon at its true phase, and visible planets.
4. The camera drifts slowly and continuously; the viewer may also explore by
   dragging (orbit controls).
5. A minimal info panel summarises the date/time/location and one notable fact
   about that specific sky.
6. "Save this sky" exports a high-resolution shareable image.

## Non-goals

- Not an astrology app — no horoscopes, houses, or zodiac interpretation. Purely
  factual astronomy.
- Not a precision ephemeris tool for astronomers; accuracy targets _visual_
  fidelity (arc-minute scale), not sub-arc-second professional use.
- No accounts, no backend, no database. It is a single-page, static app.

## Audience

People who want a beautiful, accurate keepsake of a meaningful sky — a birthday,
an anniversary, a memory — and developers who want a clean reference for doing
real client-side astronomy with React + Three.js.

## Success criteria

- Positions verified against a known reference case (see `KNOWLEDGE.md`).
- 60 fps-class rendering with continuous ambient drift on a typical laptop.
- Builds cleanly from a fresh clone with zero errors and deploys with one click.

See `PLAN.md` for build phases, `DESIGN.md` for the visual direction,
`KNOWLEDGE.md` for technical notes and assumptions, and `README.md` for setup.
