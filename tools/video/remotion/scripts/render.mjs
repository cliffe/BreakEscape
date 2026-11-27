#!/usr/bin/env node
// render.mjs <edit.json> <aspect> <out.mp4> : silent video render through the renderer API, concurrency 1 (BE_CONCURRENCY overrides; run under nice -n 19).
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
    codec: 'h264', crf: 14, pixelFormat: 'yuv420p', imageFormat: 'png', muted: true, concurrency: Math.max(1, Number(process.env.BE_CONCURRENCY) || 1), logLevel: 'error',
    // The compositor's decoded-frame cache grows without a cap and was OOM-killed under the 6 GB node memory cap on the
    // desktop host (m02 v2, frame 595). 1 GB keeps it well inside; BE_VIDEO_CACHE_MB overrides.
    offthreadVideoCacheSizeInBytes: (Number(process.env.BE_VIDEO_CACHE_MB) || 1024) * 1024 * 1024,
    onProgress: ({ renderedFrames }) => { const p = Math.floor((renderedFrames / composition.durationInFrames) * 10); if (p !== last) { last = p; console.log(`  ${renderedFrames}/${composition.durationInFrames}`); } },
  });
} finally { cleanupBundle(serveUrl); }
