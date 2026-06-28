# Stardust — Technical Notes & Assumptions

Reference notes for anyone (human or AI) working on the astronomy and rendering.
Captures _why_ things are done a certain way, and the assumptions that bound
accuracy.

---

## Coordinate pipeline

Input: civil birth date + local time + location (lat, lon, and a timezone /
UTC offset).

1. **Local time → UTC instant.** Civil local time is converted to a UTC instant
   with [Luxon](https://moment.github.io/luxon/), using the IANA timezone
   returned by geocoding (handles historical DST correctly via the host's tz
   database). For manual lat/long entry the user supplies a UTC offset (defaulted
   from longitude); this is approximate and noted in the UI.

2. **Sidereal time.** `astronomy-engine`'s `SiderealTime(time)` gives Greenwich
   **apparent** sidereal time (GAST) in sidereal hours. Local sidereal time:

   ```
   LST_hours = (GAST + longitude_deg / 15) mod 24
   ```

3. **Stars → altitude/azimuth.** For each catalogue star with right ascension
   `ra` (hours) and declination `dec` (degrees):

   ```
   H   = LST_hours - ra            (hour angle, hours → radians via ×15°)
   alt = asin( sin(dec)·sin(lat) + cos(dec)·cos(lat)·cos(H) )
   az  = atan2( -sin(H)·cos(dec),
                 sin(dec)·cos(lat) - cos(dec)·sin(lat)·cos(H) )   // from North, E+
   ```

   This is the standard equatorial→horizontal transform. It is vectorised over
   the whole catalogue in plain JS for speed (thousands of stars per frame-free
   recompute, done once per generated sky).

4. **Planets & Moon → alt/az.** Use `astronomy-engine` end to end:
   `Equator(body, time, observer, ofdate=true, aberration=true)` for apparent
   RA/Dec of date, then `Horizon(time, observer, ra, dec, 'normal')` for
   refraction-corrected alt/az. The Moon also uses `Illumination(Body.Moon,
time)` for the illuminated fraction and phase angle, and `MoonPhase(time)`
   for the ecliptic phase angle (0=new, 90=first quarter, 180=full, 270=last).

5. **alt/az → 3D dome.** Right-handed, Y-up, with North = −Z, East = +X:

   ```
   x =  cos(alt)·sin(az)
   y =  sin(alt)
   z = -cos(alt)·cos(az)
   ```

   Points are placed on a sphere of fixed radius around the camera at the
   origin. Stars with `alt < 0` are below the horizon plane (`y < 0`) and fade
   into the ground haze.

## Star catalogue

- Source: HYG database lineage (Hipparcos + Yale BSC + Gliese), the de-facto
  open star catalogue. Filtered to apparent magnitude ≤ 6.5 (naked-eye limit),
  yielding a few thousand stars — enough for every recognisable pattern without
  overwhelming the GPU.
- Fields kept: `ra` (hours, J2000), `dec` (deg, J2000), `mag`, `ci` (B−V colour
  index, for tint), `hip` (Hipparcos id, to join constellation lines), and
  `proper` (name, where it exists).
- **Precession assumption:** positions are J2000 mean coordinates and are _not_
  precessed to the date of the sky. Over ±100 years precession moves stars by up
  to ~1.4°, which is below visual significance for this experience. Planets and
  the Moon _are_ computed of-date and are the parts where accuracy matters most.

## Constellation lines

- Source: Stellarium "modern" / western sky-culture line definitions — lists of
  star pairs by Hipparcos id. Each pair becomes a line segment between the two
  stars' computed dome positions.
- Lines reference stars by HIP id; any pair whose endpoints aren't in the
  bundled magnitude-limited catalogue is dropped (rare for bright patterns).

## Star size & colour

- Apparent size follows a perceptual magnitude curve roughly
  `size ∝ 10^(-0.2·mag)` (each magnitude ≈ 2.512× flux), clamped to a min/max so
  the faintest are still a visible pixel and the brightest don't dominate.
- Colour tint derived from the B−V colour index: blue-white for hot stars,
  warm amber for cool stars, desaturated to keep a starlight feel.

## Bloom / glow

- A single additive-blended point shader gives each star a soft circular
  falloff; an `UnrealBloom`-style post pass adds the overall planetarium glow.
  Bloom threshold/intensity tuned so only genuinely bright points bloom.

## Timezone & "approximate" handling

- If birth time is unknown, it defaults to **12:00 noon local**, and the UI
  states that without an exact time the sky (especially Moon and fast bodies) is
  approximate. The dominant effect of an unknown time is the rotation of the
  whole sky (LST changes 15°/hour), so the _set_ of visible constellations is
  roughly right but their orientation/horizon membership can shift.

## Accuracy targets

- Visual fidelity at the arc-minute level for planets/Moon, ~degree level for
  stars (precession-limited). This is a keepsake, not an ephemeris tool.

---

## Verification

A Node script (`scripts/verify-astronomy.mjs`, run via `npm run verify`) checks
the math against independent anchors that do **not** depend on the same code
path being correct:

1. **Greenwich sidereal time** at `2000-01-01T00:00:00Z` ≈ **6.664 h**
   (well-known epoch value). Validates the sidereal-time call.
2. **Polaris altitude ≈ observer latitude.** Polaris sits ~0.7° from the
   celestial pole, so its altitude must equal the latitude within ~1° at _any_
   time. Validates the full HA → alt/az transform independently of the planet
   path. Checked at several latitudes.
3. **Moon illuminated fraction** for a date of a known full/new moon matches
   `astronomy-engine`'s `Illumination` (and a real almanac value) within a few
   percent.
4. **A planet is where the engine says.** Cross-check that our `Horizon` wrapper
   agrees with a direct `astronomy-engine` call.

### Reference sky used in the app demo

- **Place:** Royal Observatory, Greenwich (lat 51.4779°, lon −0.0015°)
- **Instant:** 2000-01-01 00:00 UTC

Measured verification output (from `npm run verify`):

```
✓ Greenwich sidereal time @ J2000.0 epoch ≈ 6.664 h — got 6.6643 h
✓ Polaris altitude ≈ latitude 0°       — alt  0.25° vs lat 0°
✓ Polaris altitude ≈ latitude 40°      — alt 40.25° vs lat 40°
✓ Polaris altitude ≈ latitude 51.4779° — alt 51.73° vs lat 51.4779°
✓ Polaris altitude ≈ latitude -33°     — alt -32.74° vs lat -33°
✓ Moon ~fully lit at 2000-01-21 lunar eclipse — 100.0% lit, Full Moon
✓ Sirius near transit altitude at Greenwich, J2000 — alt 21.80°, az 178.63°
```

(The Polaris altitude sits ~0.25–0.74° off latitude precisely because Polaris is
~0.74° from the true pole — the residual _is_ the expected real-sky offset, which
confirms the transform rather than contradicting it. Sirius transits at 21.80°
due south, matching the analytic transit altitude 90 − |lat − dec| ≈ 21.82°.)

Reference sky — Royal Observatory Greenwich, 2000-01-01 00:00 UTC:

```
Moon:   Waning Crescent, 27% lit, altitude −23.9° (below horizon)
Planets: Jupiter (−2.5m, alt 15°, up) and Saturn (0.0m, alt 28°, up) visible;
         Venus/Mars/Mercury below the horizon; Uranus/Neptune not naked-eye.
Sun:    altitude −61.4° (deep night)
```

These match the real winter-2000 evening sky, in which Jupiter and Saturn were
the prominent naked-eye planets.
