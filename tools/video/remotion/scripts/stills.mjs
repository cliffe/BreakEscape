#!/usr/bin/env node
// stills.mjs <edit.json> <aspect> <outDir> [--only a,b] [--edges] [--at name=frame,name=frame]: one still per card midpoint, title (start/mid/end), end logos (labs/morph/games),
// join (three points per effect: glitch/blur/dissolve) and gameplay shot midpoint; --edges adds the first and last clean frame of every gameplay shot; --at renders exactly the named global frames.
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
const at = process.argv.includes('--at') ? process.argv[process.argv.indexOf('--at') + 1].split(',').map((x) => x.split('=')) : null;
if (at) for (const [n, f] of at) frames.push([n, Number(f)]);
else {
for (const s of tl.shots) {
  if (s.type === 'title') {
    frames.push([`title_${s.id}_start`, s.startFrame + 4], [`title_${s.id}_mid`, s.startFrame + 14], [`title_${s.id}_end`, s.startFrame + Math.min(s.frames - 1, 60)]);
  } else if (s.type === 'card') {
    if (s.kind === 'logo') {
      const c = s.logo || {}; const t1 = Math.round(s.frames * (c.morph_at ?? 0.5)), M = c.morph_frames ?? 12;
      for (const [n, f] of [['assemble', 10], ['labs', Math.max(12, t1 - 8)], ['morph', t1 + Math.floor(M / 2)], ['games', Math.min(s.frames - 1, t1 + M + 20)]]) frames.push([`logo_${n}`, s.startFrame + f]);
    } else if (s.kind === 'logo_end') frames.push([`logo_end_mid`, s.startFrame + Math.floor(s.frames * 0.5)]);
    else frames.push([`card_${s.id}_mid`, s.startFrame + Math.floor(s.frames * 0.55)]);
  } else {
    frames.push([`shot_${s.id}_mid`, s.startFrame + Math.floor(s.frames * 0.5)]);
    if (process.argv.includes('--edges')) {
      const nxt = tl.joins[s.index + 1];
      frames.push([`shot_${s.id}_first`, s.startFrame + (tl.joins[s.index] ? 5 : 0)], [`shot_${s.id}_last`, s.endFrame - 1 - (nxt ? 5 : 0)]);
    }
    if (s.pushin) frames.push([`shot_${s.id}_end`, s.endFrame - 1]);
  }
}
tl.joins.forEach((j, i) => {
  if (!j) return; const s = tl.shots[i];
  const pts = j.type === 'dissolve' ? [j.boundary, j.boundary + Math.floor((j.frames - 1) / 2), j.boundary + j.frames - 1] : [Math.max(0, j.from), j.boundary, j.to - 1];
  pts.forEach((f, n) => frames.push([`join_${j.type}_${s.id}_${'abc'[n]}`, f]));
});
}
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
