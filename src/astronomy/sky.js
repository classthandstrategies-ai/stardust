/**
 * sky.js — the real astronomy.
 *
 * Given an instant (UTC) and a location (lat/lon), compute where every star,
 * planet, and the Moon sat in the local sky, in coordinates the 3D scene can
 * render directly. Stars use a vectorised equatorial→horizontal transform;
 * Sun/Moon/planets use `astronomy-engine` end to end for of-date accuracy.
 *
 * See KNOWLEDGE.md for the full coordinate pipeline and accuracy notes.
 */

import * as Astronomy from 'astronomy-engine';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Radius of the celestial dome in scene units. */
export const SKY_RADIUS = 100;

// ---------------------------------------------------------------------------
// Core coordinate math
// ---------------------------------------------------------------------------

/** Local apparent sidereal time (hours, 0..24) at a longitude (deg, E+). */
export function localSiderealHours(date, longitudeDeg) {
  const gast = Astronomy.SiderealTime(date); // Greenwich apparent sidereal time, hours
  return (((gast + longitudeDeg / 15) % 24) + 24) % 24;
}

/**
 * Equatorial (RA hours, Dec deg) → horizontal (altitude/azimuth deg) for a
 * given latitude and local sidereal time. Azimuth is measured from North,
 * increasing toward East (matching astronomy-engine's convention).
 */
export function equatorialToHorizontal(raHours, decDeg, latDeg, lstHours) {
  const ha = (lstHours - raHours) * 15 * DEG; // hour angle, radians
  const dec = decDeg * DEG;
  const lat = latDeg * DEG;

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const az = Math.atan2(
    -Math.sin(ha) * Math.cos(dec),
    Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(ha)
  );

  return {
    altitude: alt * RAD,
    azimuth: (((az * RAD) % 360) + 360) % 360,
  };
}

/**
 * Altitude/azimuth (deg) → a point on the dome. Right-handed, Y-up, with
 * North = −Z and East = +X (so the viewer at the origin looks out at the sky).
 */
export function altAzToVector(altDeg, azDeg, radius = SKY_RADIUS) {
  const alt = altDeg * DEG;
  const az = azDeg * DEG;
  const cosAlt = Math.cos(alt);
  return [
    radius * cosAlt * Math.sin(az), // x — East
    radius * Math.sin(alt), // y — Up
    -radius * cosAlt * Math.cos(az), // z — North is −Z
  ];
}

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

/**
 * Project the whole star catalogue into scene space for the given sky.
 * Returns a flat Float32Array of XYZ plus parallel arrays of magnitude and
 * colour index, which is the shape the GPU point cloud wants.
 */
export function computeStarField(starRecords, latitude, longitude, date) {
  const lst = localSiderealHours(date, longitude);
  const n = starRecords.length;
  const positions = new Float32Array(n * 3);
  const magnitudes = new Float32Array(n);
  const colorIndices = new Float32Array(n);
  let aboveHorizon = 0;

  for (let i = 0; i < n; i++) {
    const [ra, dec, mag, ci] = starRecords[i];
    const { altitude, azimuth } = equatorialToHorizontal(ra, dec, latitude, lst);
    const [x, y, z] = altAzToVector(altitude, azimuth);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    magnitudes[i] = mag;
    colorIndices[i] = ci;
    if (altitude > 0) aboveHorizon++;
  }

  return { positions, magnitudes, colorIndices, count: n, aboveHorizon, lst };
}

/**
 * Build constellation line vertices in scene space. Returns a Float32Array of
 * paired endpoints suitable for THREE.LineSegments, dropping any segment whose
 * midpoint sits well below the horizon so we don't draw lines through the
 * ground.
 */
export function computeConstellationLines(constellations, latitude, longitude, date) {
  const lst = localSiderealHours(date, longitude);
  const verts = [];

  for (const con of constellations) {
    for (const polyline of con.lines) {
      for (let i = 0; i < polyline.length - 1; i++) {
        const a = polyline[i];
        const b = polyline[i + 1];
        const ha = equatorialToHorizontal(a[0], a[1], latitude, lst);
        const hb = equatorialToHorizontal(b[0], b[1], latitude, lst);
        // Skip segments fully below the horizon (both endpoints well under).
        if (ha.altitude < -8 && hb.altitude < -8) continue;
        verts.push(...altAzToVector(ha.altitude, ha.azimuth));
        verts.push(...altAzToVector(hb.altitude, hb.azimuth));
      }
    }
  }

  return new Float32Array(verts);
}

// ---------------------------------------------------------------------------
// Sun, Moon, planets (of-date, via astronomy-engine)
// ---------------------------------------------------------------------------

const PLANETS = [
  {
    body: Astronomy.Body.Mercury,
    name: 'Mercury',
    color: '#c9b8a0',
    fact: 'The smallest planet and the fastest, racing around the Sun every 88 days.',
  },
  {
    body: Astronomy.Body.Venus,
    name: 'Venus',
    color: '#fff6e0',
    fact: 'The brightest planet — a furnace world wrapped in reflective clouds.',
  },
  {
    body: Astronomy.Body.Mars,
    name: 'Mars',
    color: '#ff8c5a',
    fact: 'The red planet, its colour the rust of an entire desert world.',
  },
  {
    body: Astronomy.Body.Jupiter,
    name: 'Jupiter',
    color: '#e8d6b0',
    fact: 'The largest planet, a gas giant that could swallow 1,300 Earths.',
  },
  {
    body: Astronomy.Body.Saturn,
    name: 'Saturn',
    color: '#e6d9a8',
    fact: 'The ringed jewel — its rings are mostly ice, some chunks house-sized.',
  },
  {
    body: Astronomy.Body.Uranus,
    name: 'Uranus',
    color: '#bfe8e8',
    fact: 'An ice giant tipped on its side, rolling around the Sun like a barrel.',
  },
  {
    body: Astronomy.Body.Neptune,
    name: 'Neptune',
    color: '#9ab8ff',
    fact: 'The farthest planet, with the fiercest winds in the solar system.',
  },
];

/** Horizontal position (and of-date RA/Dec) for any body. */
function horizontalOf(body, date, observer) {
  const eq = Astronomy.Equator(body, date, observer, true, true);
  const hor = Astronomy.Horizon(date, observer, eq.ra, eq.dec, 'normal');
  return { altitude: hor.altitude, azimuth: hor.azimuth, ra: eq.ra, dec: eq.dec };
}

/** Name the Moon's phase from its ecliptic phase angle (0=new … 180=full). */
export function moonPhaseName(phaseAngleDeg) {
  const a = ((phaseAngleDeg % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'New Moon';
  if (a < 67.5) return 'Waxing Crescent';
  if (a < 112.5) return 'First Quarter';
  if (a < 157.5) return 'Waxing Gibbous';
  if (a < 202.5) return 'Full Moon';
  if (a < 247.5) return 'Waning Gibbous';
  if (a < 292.5) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Compute the full sky for an instant + location.
 *
 * @param {Object} opts
 * @param {Date}   opts.date       UTC instant of the observation.
 * @param {number} opts.latitude   degrees North.
 * @param {number} opts.longitude  degrees East.
 * @returns a structured description of Sun, Moon, and visible planets.
 */
export function computeBodies({ date, latitude, longitude }) {
  const observer = new Astronomy.Observer(latitude, longitude, 0);

  // Sun — needed for daylight context and to light the Moon correctly.
  const sun = horizontalOf(Astronomy.Body.Sun, date, observer);
  const sunVec = altAzToVector(sun.altitude, sun.azimuth);

  // Moon — position, phase, and illuminated fraction.
  const moonHor = horizontalOf(Astronomy.Body.Moon, date, observer);
  const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, date);
  const phaseAngle = Astronomy.MoonPhase(date); // ecliptic, 0..360
  const moon = {
    name: 'Moon',
    altitude: moonHor.altitude,
    azimuth: moonHor.azimuth,
    position: altAzToVector(moonHor.altitude, moonHor.azimuth),
    illumination: moonIllum.phase_fraction, // 0..1
    phaseAngle,
    phaseName: moonPhaseName(phaseAngle),
    visible: moonHor.altitude > 0,
  };

  // Planets — position, apparent magnitude, visibility.
  const planets = PLANETS.map((p) => {
    const hor = horizontalOf(p.body, date, observer);
    const illum = Astronomy.Illumination(p.body, date);
    return {
      name: p.name,
      color: p.color,
      fact: p.fact,
      altitude: hor.altitude,
      azimuth: hor.azimuth,
      position: altAzToVector(hor.altitude, hor.azimuth),
      magnitude: illum.mag,
      visible: hor.altitude > 0,
      // Naked-eye planets only get bright; Uranus/Neptune are effectively invisible.
      nakedEye: illum.mag <= 6.0,
    };
  });

  const sunObj = {
    name: 'Sun',
    altitude: sun.altitude,
    azimuth: sun.azimuth,
    position: sunVec,
    isDay: sun.altitude > -6, // civil-ish: sky not fully dark
  };

  return { sun: sunObj, moon, planets };
}

// ---------------------------------------------------------------------------
// Human-readable summary
// ---------------------------------------------------------------------------

/** A short, factual sentence about what was notable in this specific sky. */
export function summarizeSky({ moon, planets, sun }) {
  const parts = [];

  // Moon phase is always worth a word.
  const pct = Math.round(moon.illumination * 100);
  if (moon.visible) {
    parts.push(`A ${moon.phaseName.toLowerCase()} (${pct}% lit) hung above the horizon`);
  } else {
    parts.push(`The Moon was a ${moon.phaseName.toLowerCase()} (${pct}% lit), below the horizon`);
  }

  // Bright planets that were up.
  const visiblePlanets = planets
    .filter((p) => p.visible && p.nakedEye)
    .sort((a, b) => a.magnitude - b.magnitude)
    .map((p) => p.name);

  if (visiblePlanets.length === 1) {
    parts.push(`${visiblePlanets[0]} shared the sky`);
  } else if (visiblePlanets.length === 2) {
    parts.push(`${visiblePlanets[0]} and ${visiblePlanets[1]} shared the sky`);
  } else if (visiblePlanets.length > 2) {
    const last = visiblePlanets[visiblePlanets.length - 1];
    parts.push(`${visiblePlanets.slice(0, -1).join(', ')}, and ${last} shared the sky`);
  } else {
    parts.push('no bright planets stood above the horizon');
  }

  let sentence = parts.join(', and ') + '.';
  if (sun.isDay) {
    sentence += ' (The Sun was up — these stars were there, just hidden by daylight.)';
  }
  return sentence;
}

/**
 * One call to compute everything the app needs for a sky.
 * `starRecords` and `constellations` are the bundled datasets.
 */
export function buildSky({ date, latitude, longitude, starRecords, constellations }) {
  const stars = computeStarField(starRecords, latitude, longitude, date);
  const lines = computeConstellationLines(constellations, latitude, longitude, date);
  const bodies = computeBodies({ date, latitude, longitude });
  const summary = summarizeSky(bodies);
  return { stars, lines, ...bodies, summary };
}
