/**
 * Star colour from the B–V colour index.
 *
 * Real stars range from hot blue-white (negative B–V) to cool amber-red (high
 * B–V). We map the index through a small set of perceptual stops and keep the
 * result desaturated so the field reads as starlight, not confetti (per
 * DESIGN.md). Returns [r, g, b] in 0..1.
 */
const STOPS = [
  { bv: -0.33, rgb: [0.61, 0.74, 1.0] }, // hot blue (e.g. Spica)
  { bv: 0.0, rgb: [0.79, 0.86, 1.0] }, // blue-white (Vega)
  { bv: 0.3, rgb: [0.95, 0.96, 1.0] }, // white
  { bv: 0.58, rgb: [1.0, 0.96, 0.9] }, // yellow-white (Sun-like)
  { bv: 0.81, rgb: [1.0, 0.9, 0.76] }, // pale gold
  { bv: 1.4, rgb: [1.0, 0.78, 0.56] }, // orange (Arcturus)
  { bv: 2.0, rgb: [1.0, 0.66, 0.46] }, // amber-red (Betelgeuse)
];

export function bvToRGB(bv) {
  const x = Math.max(STOPS[0].bv, Math.min(STOPS[STOPS.length - 1].bv, bv));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (x >= a.bv && x <= b.bv) {
      const t = (x - a.bv) / (b.bv - a.bv);
      return [
        a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t,
        a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t,
        a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t,
      ];
    }
  }
  return [1, 1, 1];
}
