/**
 * build-star-data.mjs
 *
 * One-off data build: downloads open star + constellation datasets and
 * transforms them into the compact JSON the app bundles. The OUTPUT is
 * committed to `src/data/`, so the app itself never needs network access at
 * build or run time. Re-run with `npm run build:data` to refresh.
 *
 * Sources (all open data):
 *   - Stars (≤ mag 6) and B–V colour ........ ofrohn/d3-celestial  stars.6.json
 *   - Star proper names (by Hipparcos id) ... ofrohn/d3-celestial  starnames.json
 *   - Western constellation line figures .... ofrohn/d3-celestial  constellations.lines.json
 *
 * Coordinate convention in the sources: GeoJSON [RA°, Dec°] where RA is wrapped
 * to −180..180. We convert RA to hours (0..24) for the app's astronomy layer.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src', 'data');
const CACHE_DIR = join(__dirname, '.cache');

const BASE = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data';
const SOURCES = {
  stars: `${BASE}/stars.6.json`,
  names: `${BASE}/starnames.json`,
  lines: `${BASE}/constellations.lines.json`,
};

// IAU constellation abbreviation → full name (88).
const CONSTELLATION_NAMES = {
  And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aqr: 'Aquarius', Aql: 'Aquila',
  Ara: 'Ara', Ari: 'Aries', Aur: 'Auriga', Boo: 'Boötes', Cae: 'Caelum',
  Cam: 'Camelopardalis', Cnc: 'Cancer', CVn: 'Canes Venatici', CMa: 'Canis Major',
  CMi: 'Canis Minor', Cap: 'Capricornus', Car: 'Carina', Cas: 'Cassiopeia',
  Cen: 'Centaurus', Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon', Cir: 'Circinus',
  Col: 'Columba', Com: 'Coma Berenices', CrA: 'Corona Australis', CrB: 'Corona Borealis',
  Crv: 'Corvus', Crt: 'Crater', Cru: 'Crux', Cyg: 'Cygnus', Del: 'Delphinus',
  Dor: 'Dorado', Dra: 'Draco', Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax',
  Gem: 'Gemini', Gru: 'Grus', Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra',
  Hyi: 'Hydrus', Ind: 'Indus', Lac: 'Lacerta', Leo: 'Leo', LMi: 'Leo Minor',
  Lep: 'Lepus', Lib: 'Libra', Lup: 'Lupus', Lyn: 'Lynx', Lyr: 'Lyra', Men: 'Mensa',
  Mic: 'Microscopium', Mon: 'Monoceros', Mus: 'Musca', Nor: 'Norma', Oct: 'Octans',
  Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus', Per: 'Perseus',
  Phe: 'Phoenix', Pic: 'Pictor', Psc: 'Pisces', PsA: 'Piscis Austrinus', Pup: 'Puppis',
  Pyx: 'Pyxis', Ret: 'Reticulum', Sge: 'Sagitta', Sgr: 'Sagittarius', Sco: 'Scorpius',
  Scl: 'Sculptor', Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans', Tau: 'Taurus',
  Tel: 'Telescopium', Tri: 'Triangulum', TrA: 'Triangulum Australe', Tuc: 'Tucana',
  UMa: 'Ursa Major', UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo', Vol: 'Volans',
  Vul: 'Vulpecula',
};

// RA in degrees (−180..180) → hours (0..24).
const raDegToHours = (deg) => ((deg < 0 ? deg + 360 : deg) / 15);
const round = (n, p) => Number(n.toFixed(p));

async function fetchJson(name, url) {
  const cacheFile = join(CACHE_DIR, `${name}.json`);
  if (existsSync(cacheFile)) {
    return JSON.parse(await readFile(cacheFile, 'utf8'));
  }
  process.stdout.write(`  fetching ${url} … `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, text);
  console.log('ok');
  return JSON.parse(text);
}

async function main() {
  console.log('Building Stardust star data…');
  const [stars, names, lines] = await Promise.all([
    fetchJson('stars.6', SOURCES.stars),
    fetchJson('starnames', SOURCES.names),
    fetchJson('constellations.lines', SOURCES.lines),
  ]);

  // ---- Stars: [raHours, dec, mag, colorIndex, name?] ----
  const starRecords = stars.features.map((f) => {
    const [raDeg, dec] = f.geometry.coordinates;
    const mag = f.properties.mag;
    const bv = f.properties.bv === '' ? 0 : Number(f.properties.bv);
    const rec = [round(raDegToHours(raDeg), 5), round(dec, 4), round(mag, 2), round(bv, 2)];
    // Attach a proper name only for reasonably bright, actually-named stars,
    // so the bundle stays lean and labels stay meaningful.
    const named = names[String(f.id)];
    if (named && named.name && mag <= 3.0) rec.push(named.name);
    return rec;
  });
  starRecords.sort((a, b) => a[2] - b[2]); // brightest first

  // ---- Constellation lines: abbr, name, polylines in [raHours, dec] ----
  const constellations = lines.features.map((f) => {
    const abbr = f.id;
    const polylines = f.geometry.coordinates.map((seg) =>
      seg.map(([raDeg, dec]) => [round(raDegToHours(raDeg), 5), round(dec, 4)])
    );
    return { abbr, name: CONSTELLATION_NAMES[abbr] || abbr, lines: polylines };
  });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    join(OUT_DIR, 'stars.json'),
    JSON.stringify({
      note: 'Stars ≤ mag 6. Each: [raHours(J2000), decDeg(J2000), mag, colorIndexBV, name?]. Source: d3-celestial.',
      stars: starRecords,
    })
  );
  await writeFile(
    join(OUT_DIR, 'constellations.json'),
    JSON.stringify({
      note: 'Western constellation line figures. lines: array of polylines of [raHours, decDeg]. Source: d3-celestial / Stellarium.',
      constellations,
    })
  );

  const namedCount = starRecords.filter((r) => r.length === 5).length;
  const segCount = constellations.reduce((n, c) => n + c.lines.length, 0);
  console.log(`  stars:          ${starRecords.length} (${namedCount} named)`);
  console.log(`  constellations: ${constellations.length} (${segCount} line segments)`);
  console.log('Done → src/data/stars.json, src/data/constellations.json');
}

main().catch((err) => {
  console.error('Data build failed:', err.message);
  process.exit(1);
});
