#!/usr/bin/env node
// stills.mjs <edit.json> <aspect> <outDir> [--only substr] [--edges]: (--edges adds the first and last clean frame of every gameplay shot) one still per card midpoint, transition boundaries and logo morph points.
// Bundles once and uses the renderer API (cheaper than a CLI call per frame). Run under nice -n 19.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { bundleWithTakes, cleanupBundle, reniceChildren, readProps, browserExecutable } from './bundle-lib.mjs';
import { selectComposition, renderStill } from '@remotion/renderer';
import { buildTimeline } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '..');
const [editFile, aspect, outDir] = process.argv.slice(2);
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const inputProps = readProps(editFile, aspect); const edit = inputProps.edit;
const tl = buildTimeline(edit);
const frames = [];
for (const s of tl.shots) {
  if (s.type === 'card') {
    frames.push([`card_${s.id}_mid`, s.startFrame + Math.floor(s.frames * 0.55)]);
    if (s.kind === 'logo') for (const [n, f] of [['labs', 0.2], ['morph1', 0.4 + 3 / s.frames], ['games', 0.58], ['morph2', 0.72 + 3 / s.frames], ['wordmark', 0.92]]) frames.push([`logo_${n}`, s.startFrame + Math.floor(s.frames * f)]);
    if (s.kind === 'logo_end') frames.push([`logo_end_mid`, s.startFrame + Math.floor(s.frames * 0.5)]);
  } else {
    frames.push([`shot_${s.id}_mid`, s.startFrame + Math.floor(s.frames * 0.5)]);
    if (process.argv.includes('--edges')) {
      const nxt = tl.joins[s.index + 1];
      frames.push([`shot_${s.id}_first`, s.startFrame + (tl.joins[s.index] ? 5 : 0)], [`shot_${s.id}_last`, s.endFrame - 1 - (nxt ? 5 : 0)]);
    }
    if (s.pushin) frames.push([`shot_${s.id}_end`, s.endFrame - 1]);
  }
}
tl.joins.forEach((j, i) => { if (!j) return; const s = tl.shots[i]; frames.push([`join_${j.type}_${s.id}_peak`, j.boundary - (i === 0 ? 0 : 1)]); if (i > 0) frames.push([`join_${j.type}_${s.id}_after`, j.boundary + 1]); });
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundleWithTakes();
reniceChildren();
const comp = await selectComposition({ serveUrl, id: 'Teaser', inputProps, browserExecutable });
for (const [name, frame] of frames) {
  if (only && !only.split(',').some((o) => name.includes(o))) continue;
  const output = path.join(outDir, `${aspect.replace(':', 'x')}_${name}_f${frame}.png`);
  await renderStill({ composition: comp, serveUrl, output, frame: Math.min(frame, comp.durationInFrames - 1), inputProps, browserExecutable, imageFormat: 'png', logLevel: 'error' });
  console.log(output);
}
cleanupBundle(serveUrl);
