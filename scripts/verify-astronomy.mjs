/**
 * verify-astronomy.mjs — confirm the astronomy is real, not just plausible.
 *
 * Each check uses an anchor that does NOT depend on the same code path being
 * correct (see KNOWLEDGE.md):
 *   1. Greenwich sidereal time at a known epoch.
 *   2. Polaris altitude ≈ observer latitude (validates the star transform).
 *   3. Moon illuminated fraction at a real full moon (a total lunar eclipse).
 *   4. Sirius near its transit altitude for the reference sky.
 *
 * Run with `npm run verify`. Exits non-zero if any check fails.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Astronomy from 'astronomy-engine';
import {
  localSiderealHours,
  equatorialToHorizontal,
  computeBodies,
  moonPhaseName,
} from '../src/astronomy/sky.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stars = JSON.parse(
  await readFile(join(__dirname, '..', 'src', 'data', 'stars.json'), 'utf8')
).stars;

let failures = 0;
const lines = [];
function check(label, pass, detail) {
  const mark = pass ? '✓' : '✗';
  const line = `  ${mark} ${label}${detail ? ` — ${detail}` : ''}`;
  console.log(line);
  lines.push(`- ${mark} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failures++;
}

console.log('\nStardust astronomy verification\n');

// 1. Greenwich apparent sidereal time at 2000-01-01 00:00 UTC ≈ 6.664 h.
const epoch = new Date('2000-01-01T00:00:00Z');
const gast = localSiderealHours(epoch, 0);
check(
  'Greenwich sidereal time @ J2000.0 epoch ≈ 6.664 h',
  Math.abs(gast - 6.664) < 0.02,
  `got ${gast.toFixed(4)} h`
);

// 2. Polaris altitude ≈ latitude (within ~1°) at several latitudes, any time.
const polaris = stars.find((s) => s[4] === 'Polaris');
if (!polaris) {
  check('Polaris present in catalogue', false, 'not found');
} else {
  const when = new Date('1987-08-17T09:30:00Z');
  for (const lat of [0, 40, 51.4779, -33]) {
    const lst = localSiderealHours(when, 0);
    const { altitude } = equatorialToHorizontal(polaris[0], polaris[1], lat, lst);
    // Polaris is ~0.7° from the pole; at lat 0 it grazes the horizon.
    const expected = lat;
    check(
      `Polaris altitude ≈ latitude ${lat}°`,
      Math.abs(altitude - expected) < 1.0,
      `alt ${altitude.toFixed(2)}° vs lat ${expected}°`
    );
  }
}

// 3. Moon ~100% illuminated at the 2000-01-21 total lunar eclipse (real full moon).
const fullMoon = new Date('2000-01-21T04:40:00Z');
const illum = Astronomy.Illumination(Astronomy.Body.Moon, fullMoon);
const phase = Astronomy.MoonPhase(fullMoon);
check(
  'Moon ~fully lit at 2000-01-21 lunar eclipse',
  illum.phase_fraction > 0.985 && moonPhaseName(phase) === 'Full Moon',
  `${(illum.phase_fraction * 100).toFixed(1)}% lit, ${moonPhaseName(phase)}`
);

// 4. Sirius near transit altitude for the reference sky (Greenwich, J2000 epoch).
const sirius = stars.find((s) => s[4] === 'Sirius');
const lstRef = localSiderealHours(epoch, -0.0015);
const sPos = equatorialToHorizontal(sirius[0], sirius[1], 51.4779, lstRef);
// Transit altitude = 90 − |lat − dec| = 90 − |51.48 − (−16.72)| ≈ 21.8°, due south.
check(
  'Sirius near transit altitude at Greenwich, J2000',
  sPos.altitude > 20 && sPos.altitude < 23 && sPos.azimuth > 168 && sPos.azimuth < 192,
  `alt ${sPos.altitude.toFixed(2)}°, az ${sPos.azimuth.toFixed(2)}°`
);

// ---- Reference sky snapshot (for KNOWLEDGE.md) ----
console.log('\nReference sky — Royal Observatory Greenwich, 2000-01-01 00:00 UTC:');
const bodies = computeBodies({ date: epoch, latitude: 51.4779, longitude: -0.0015 });
console.log(
  `  Moon: ${bodies.moon.phaseName}, ${(bodies.moon.illumination * 100).toFixed(0)}% lit, ` +
    `alt ${bodies.moon.altitude.toFixed(1)}° (${bodies.moon.visible ? 'up' : 'down'})`
);
const planetReport = bodies.planets
  .map(
    (p) =>
      `${p.name} ${p.magnitude.toFixed(1)}m alt ${p.altitude.toFixed(0)}° ${p.visible ? 'up' : 'down'}`
  )
  .join('\n        ');
console.log(`  Planets: ${planetReport}`);
console.log(`  Sun alt: ${bodies.sun.altitude.toFixed(1)}° (${bodies.sun.isDay ? 'day' : 'night'})`);

console.log('');
if (failures > 0) {
  console.error(`✗ ${failures} check(s) failed.\n`);
  process.exit(1);
}
console.log('✓ All astronomy checks passed.\n');

// Emit a compact markdown block (handy for pasting into KNOWLEDGE.md).
const md = [
  '```',
  ...lines.map((l) => l.replace(/^- /, '')),
  '',
  `Reference sky (Greenwich, 2000-01-01 00:00 UTC):`,
  `  Moon: ${bodies.moon.phaseName}, ${(bodies.moon.illumination * 100).toFixed(0)}% lit, alt ${bodies.moon.altitude.toFixed(1)}°`,
  `  Sun alt: ${bodies.sun.altitude.toFixed(1)}°`,
  '```',
].join('\n');
console.log(md);
