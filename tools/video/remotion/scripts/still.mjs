#!/usr/bin/env node
// still.mjs <edit.json> <aspect> <out.png> [frame] : one frame as PNG (default: the last frame), for mock-ups and quick checks without a full render. Run under nice -n 19.
import fs from 'node:fs'; import path from 'node:path';
import { selectComposition, renderStill } from '@remotion/renderer';
import { bundleWithTakes, cleanupBundle, reniceChildren, readProps, browserExecutable } from './bundle-lib.mjs';
const [editFile, aspect, out, frameArg] = process.argv.slice(2);
const inputProps = readProps(editFile, aspect);
fs.mkdirSync(path.dirname(out), { recursive: true });
const serveUrl = await bundleWithTakes();
reniceChildren();
try {
  const composition = await selectComposition({ serveUrl, id: 'Teaser', inputProps, browserExecutable, logLevel: 'error' });
  const frame = frameArg === undefined ? composition.durationInFrames - 1 : Number(frameArg);
  await renderStill({ composition, serveUrl, inputProps, browserExecutable, output: out, frame, imageFormat: 'png', logLevel: 'error' });
  console.log(`still: frame ${frame} of ${composition.durationInFrames} -> ${out}`);
} finally { cleanupBundle(serveUrl); }
