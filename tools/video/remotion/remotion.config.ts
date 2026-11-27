import { Config } from '@remotion/cli/config';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Container Chromium (see tools/video/capture/launch.mjs). Override with BE_CHROMIUM.
const candidates = [
  process.env.BE_CHROMIUM,
  '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  '/opt/pw-browsers/chromium-1243/chrome-linux/chrome',
].filter(Boolean) as string[];
// then a Playwright cache (newest first) and the system chromium-browser
try {
  const cache = path.join(os.homedir(), '.cache/ms-playwright');
  const dirs = fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const d of dirs) candidates.push(path.join(cache, d, 'chrome-linux64/chrome'), path.join(cache, d, 'chrome-linux/chrome'));
} catch {}
candidates.push('/usr/bin/chromium-browser');
const exe = candidates.find((p) => fs.existsSync(p));
if (exe) Config.setBrowserExecutable(exe);

Config.setConcurrency(1);          // captures run on this machine: keep the render light
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('png'); // lossless frames into the encoder (pixel art)
Config.setCodec('h264');
Config.setCrf(14);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
