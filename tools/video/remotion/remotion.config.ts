import { Config } from '@remotion/cli/config';
import fs from 'node:fs';

// Container Chromium (see tools/video/capture/launch.mjs). Override with BE_CHROMIUM.
const candidates = [
  process.env.BE_CHROMIUM,
  '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  '/opt/pw-browsers/chromium-1243/chrome-linux/chrome',
].filter(Boolean) as string[];
const exe = candidates.find((p) => fs.existsSync(p));
if (exe) Config.setBrowserExecutable(exe);

Config.setConcurrency(1);          // captures run on this machine: keep the render light
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('png'); // lossless frames into the encoder (pixel art)
Config.setCodec('h264');
Config.setCrf(14);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
