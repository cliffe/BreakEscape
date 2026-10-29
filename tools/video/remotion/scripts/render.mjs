#!/usr/bin/env node
// render.mjs <edit.json> <aspect> <out.mp4> : silent video render through the renderer API, concurrency 1 (run under nice -n 19).
import fs from 'node:fs'; import path from 'node:path';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { bundleWithTakes, cleanupBundle, reniceChildren, readProps, browserExecutable } from './bundle-lib.mjs';
const [editFile, aspect, out] = process.argv.slice(2);
const inputProps = readProps(editFile, aspect);
fs.mkdirSync(path.dirname(out), { recursive: true });
const serveUrl = await bundleWithTakes();
reniceChildren();
try {
  const composition = await selectComposition({ serveUrl, id: 'Teaser', inputProps, browserExecutable, logLevel: 'error' });
  console.log(`render: ${composition.width}x${composition.height} @${composition.fps} fps, ${composition.durationInFrames} frames -> ${out}`);
  let last = -1;
  await renderMedia({
    composition, serveUrl, inputProps, browserExecutable, outputLocation: out,
    codec: 'h264', crf: 14, pixelFormat: 'yuv420p', imageFormat: 'png', muted: true, concurrency: 1, logLevel: 'error',
    onProgress: ({ renderedFrames }) => { const p = Math.floor((renderedFrames / composition.durationInFrames) * 10); if (p !== last) { last = p; console.log(`  ${renderedFrames}/${composition.durationInFrames}`); } },
  });
} finally { cleanupBundle(serveUrl); }
