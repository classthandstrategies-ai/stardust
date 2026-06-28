/**
 * exportImage.js — turn the live WebGL canvas into a shareable PNG.
 *
 * The R3F Canvas is created with `preserveDrawingBuffer: true` (see SkyScene),
 * so its backing pixels are readable. We copy them into a 2D canvas, paint an
 * elegant caption block in the lower-left — place, date, one line of sky fact,
 * hairline-separated, per DESIGN.md — and download the result. A print, not a
 * screenshot.
 */

/**
 * @param {HTMLCanvasElement} glCanvas  the live WebGL canvas.
 * @param {Object} caption
 * @param {string} caption.place        e.g. "London, England, United Kingdom".
 * @param {string} caption.when         e.g. "1 January 2000 · 12:00 am".
 * @param {string} caption.fact         the one-line sky summary.
 * @param {string} [filename]
 */
export function saveSkyImage(glCanvas, { place, when, fact }, filename = 'stardust.png') {
  const w = glCanvas.width;
  const h = glCanvas.height;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');

  // Pure void, then the rendered sky on top.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(glCanvas, 0, 0, w, h);

  // A soft bottom scrim for caption legibility — a gentle gradient into the void
  // rather than a per-glyph drop shadow (DESIGN.md: no shadows).
  const scrim = ctx.createLinearGradient(0, h * 0.55, 0, h);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // Scale the caption with the export resolution so it reads on any size.
  const s = w / 1280;
  const pad = Math.round(48 * s);
  const x = pad;
  let y = h - pad;

  const font = (size, weight) => `${weight} ${Math.round(size * s)}px Inter, system-ui, sans-serif`;

  ctx.textBaseline = 'alphabetic';

  // Fact (lowest line).
  ctx.font = font(15, 400);
  ctx.fillStyle = 'rgba(154,154,154,0.95)'; // smoke
  const factLines = wrapText(ctx, fact, Math.min(w - pad * 2, Math.round(620 * s)));
  for (let i = factLines.length - 1; i >= 0; i--) {
    ctx.fillText(factLines[i], x, y);
    y -= Math.round(22 * s);
  }

  y -= Math.round(10 * s);

  // When.
  ctx.font = font(16, 400);
  ctx.fillStyle = 'rgba(189,189,189,1)'; // ash
  ctx.fillText(when, x, y);
  y -= Math.round(30 * s);

  // Place (title).
  ctx.font = font(28, 600);
  ctx.fillStyle = '#ffffff'; // bone
  ctx.fillText(place, x, y);
  y -= Math.round(40 * s);

  // Wordmark.
  ctx.font = font(11, 600);
  ctx.fillStyle = 'rgba(128,82,255,0.95)'; // plum-voltage
  ctx.fillText('✦ STARDUST', x, y);

  out.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/** Greedy word-wrap into lines that fit `maxWidth` for the current ctx font. */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
