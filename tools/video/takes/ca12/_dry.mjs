#!/usr/bin/env node
// Dry run for a ca12 take script: headless Chromium, no display, no ffmpeg, no audio capture. Loads the game, passes the title
// like record-take.mjs does, runs the take's setup() and body with a mark() that logs take-relative seconds, and saves a screenshot
// at every mark labelled 'frame:...' (the editor's "check this frame" marks). Exit 0 only if the take ran to its end.
//   NODE_PATH=<repo>/node_modules node tools/video/takes/ca12/_dry.mjs <take.mjs> <game url> <out dir> [--hide-hud] [--zoom-step 1] [--no-throttle]
// The harness throttles headless physics (window.__test.throttleFps(20)); the real capture does not, so walking takes must
// use distances, not times, to stop (keyLegs does). Never touches a port: the caller passes the url.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { HUD_CSS } from '../../capture/launch.mjs';
import { makeBridge } from '../../capture/record-take.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join((process.env.NODE_PATH || '').split(':')[0] || '.', 'playwright'));
const argv = process.argv.slice(2);
const [takeFile, url, outDir] = argv;
const flag = (n) => argv.includes('--' + n);
const val = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined; };
if (!takeFile || !url || !outDir) { console.error('usage: _dry.mjs <take.mjs> <game url> <out dir> [--hide-hud] [--zoom-step N]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const id = path.basename(takeFile, '.mjs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
if (flag('hide-hud')) await ctx.addInitScript((css) => { const add = () => { const st = document.createElement('style'); st.id = 'be-hide-hud'; st.textContent = css; (document.head || document.documentElement).appendChild(st); }; if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add); }, HUD_CSS);
const zs = val('zoom-step');
await ctx.addInitScript(({ zs }) => { try { localStorage.setItem('be_music_vol', '0'); if (zs !== undefined) { let s = {}; try { s = JSON.parse(localStorage.getItem('be_display_settings') || '{}') || {}; } catch (_) {} s.zoomStep = Number(zs); localStorage.setItem('be_display_settings', JSON.stringify(s)); } } catch (_) {} }, { zs });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
page.on('dialog', d => d.accept().catch(() => {}));
const marks = []; let T0 = null; let shotN = 0;
const result = { take: id, ok: false, marks, errors: errs };
try {
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'skip_resume=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 120000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 60000 })).catch(() => {});
  if (!flag('no-throttle')) await page.evaluate(() => window.__test.throttleFps(20)).catch(() => {});
  for (let i = 0; i < 20; i++) {                        // pass the title with clicks, as record-take does
    const t = await page.evaluate(() => { try { const m = window.__test.getState().activeMinigame; return !!(m && /title/i.test(String(m.id || m.type || m))); } catch (_) { return false; } }).catch(() => false);
    if (!t) break; await page.mouse.click(960, 540); await sleep(500);
  }
  const bridge = makeBridge(page);
  const mod = await import(pathToFileURL(path.resolve(takeFile)).href);
  const tSetup = Date.now();
  if (mod.setup) await mod.setup(page, bridge);
  result.setupS = +((Date.now() - tSetup) / 1000).toFixed(1);
  T0 = Date.now();
  const mark = (label, data, atEpochMs) => {
    const t = ((atEpochMs || Date.now()) - T0) / 1000;
    marks.push({ t: +t.toFixed(2), label, ...(data ? { data } : {}) });
    if (label.startsWith('frame:')) { const f = path.join(outDir, `${id}_${String(++shotN).padStart(2, '0')}_${label.slice(6).replace(/[^a-z0-9]+/gi, '_')}.png`); page.screenshot({ path: f }).catch(() => {}); }
  };
  await mod.default(page, bridge, mark);
  result.bodyS = +((Date.now() - T0) / 1000).toFixed(1);
  await page.screenshot({ path: path.join(outDir, `${id}_end.png`) });
  result.ok = true;
} catch (e) {
  result.error = String(e && e.stack || e).slice(0, 900);
  try { await page.screenshot({ path: path.join(outDir, `${id}_FAIL.png`) }); } catch (_) {}
}
fs.writeFileSync(path.join(outDir, `${id}.dry.json`), JSON.stringify(result, null, 1));
console.log(JSON.stringify({ take: id, ok: result.ok, setupS: result.setupS, bodyS: result.bodyS, marks: marks.length, error: result.error }));
await browser.close();
process.exit(result.ok ? 0 : 1);
