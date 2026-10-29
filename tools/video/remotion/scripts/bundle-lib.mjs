// Shared by render.mjs / stills.mjs: bundle once, then link the (large) takes into the bundle's public folder.
// Remotion's own public-dir copy drops symlinks, and copying GBs of capture into the bundle would be wasteful.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
const here = path.dirname(fileURLToPath(import.meta.url)); export const root = path.resolve(here, '..');
export const browserExecutable = [process.env.BE_CHROMIUM, '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].filter(Boolean).find((p) => fs.existsSync(p));
export function readProps(editFile, aspect) {
  const edit = JSON.parse(fs.readFileSync(editFile, 'utf8'));
  const man = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.json'), 'utf8'));
  const available = {}; for (const k of Object.keys(man.takes)) available[`takes/${k}`] = true;
  return { edit, aspect, available };
}
export async function bundleWithTakes() {
  return bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
}
/** Removes only the bundle this process created. */
export function cleanupBundle(serveUrl) { try { if (serveUrl && path.basename(serveUrl).startsWith('remotion-webpack-bundle-')) fs.rmSync(serveUrl, { recursive: true, force: true }); } catch {} }
/** Chromium raises its own renderer priority (nice -8 as root); push this process's descendants back to nice 19 every few seconds. */
import { execSync } from 'node:child_process';
export function reniceChildren() {
  const tick = () => { try {
    const out = execSync('ps -eo pid=,ppid=', { encoding: 'utf8' }).trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
    const kids = new Map(); for (const [p, pp] of out) { if (!kids.has(pp)) kids.set(pp, []); kids.get(pp).push(p); }
    const all = []; const walk = (p) => { for (const c of kids.get(p) || []) { all.push(c); walk(c); } }; walk(process.pid);
    if (all.length) execSync(`renice -n 19 -p ${all.join(' ')}`, { stdio: 'ignore' });
  } catch {} };
  tick(); const t = setInterval(tick, 4000); t.unref(); return t;
}
