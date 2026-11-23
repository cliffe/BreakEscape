/**
 * The compromise bolt: a 7 by 11 pixel lightning bolt, yellow with a dark outline, drawn from a
 * bitmap in code (no image file). One shape for every place that shows a compromised host: the
 * world sprites' mark (systems/compromise-marks.js), the network view's host rows and the
 * desktop's remote-view line (ops core plan 5.4). This module imports nothing.
 *
 *   BOLT_WIDTH, BOLT_HEIGHT        7 and 11 (native pixels)
 *   BOLT_COLOURS                   { outline, fill } CSS colours
 *   BOLT_ROWS                      the bitmap: 11 strings of 7 chars; '.' empty, 'o' outline, 'y' fill
 *   boltPixels()                   [{ x, y, kind }] for every set pixel, kind 'outline' or 'fill'
 *   drawBolt(ctx, x, y, scale = 1) fill the bolt's pixels on a 2d context (or any object with
 *                                  fillStyle and fillRect); whole-pixel scale; returns { width, height }
 *   createBoltCanvas(doc, scale = 1)  a canvas element sized for the bolt with it drawn; returns
 *                                  null when the document cannot make a canvas or a 2d context
 */

export const BOLT_WIDTH = 7;
export const BOLT_HEIGHT = 11;

export const BOLT_COLOURS = Object.freeze({ outline: '#3a2a00', fill: '#ffd62e' });

export const BOLT_ROWS = Object.freeze([
  '..ooooo',
  '.oyyyyo',
  '.oyyyo.',
  'oyyyyo.',
  'oyyyoo.',
  'ooyyyyo',
  '.ooyyyo',
  '..oyyo.',
  '..oyo..',
  '...oo..',
  '...o...'
]);

export function boltPixels() {
  const out = [];
  BOLT_ROWS.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === 'o') out.push({ x, y, kind: 'outline' });
      else if (c === 'y') out.push({ x, y, kind: 'fill' });
    }
  });
  return out;
}

function wholeScale(scale) {
  const n = Math.floor(Number(scale));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function drawBolt(ctx, x = 0, y = 0, scale = 1) {
  const s = wholeScale(scale);
  const ox = Math.round(Number(x) || 0);
  const oy = Math.round(Number(y) || 0);
  if (ctx) {
    for (const p of boltPixels()) {
      ctx.fillStyle = p.kind === 'fill' ? BOLT_COLOURS.fill : BOLT_COLOURS.outline;
      ctx.fillRect(ox + p.x * s, oy + p.y * s, s, s);
    }
  }
  return { width: BOLT_WIDTH * s, height: BOLT_HEIGHT * s };
}

export function createBoltCanvas(doc, scale = 1) {
  if (!doc || typeof doc.createElement !== 'function') return null;
  const s = wholeScale(scale);
  const canvas = doc.createElement('canvas');
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  canvas.width = BOLT_WIDTH * s;
  canvas.height = BOLT_HEIGHT * s;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  drawBolt(ctx, 0, 0, s);
  return canvas;
}
