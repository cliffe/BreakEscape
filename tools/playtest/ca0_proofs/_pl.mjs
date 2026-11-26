// Shared launcher for the CA0 live proofs: headless Chromium, tutorial declined, resume skipped, physics throttled to 20 fps.
// Node 24 (~/.cache/ms-playwright-go/1.57.0/node). Playwright comes from the main checkout's node_modules.
import fs from 'node:fs';
import { chromium } from '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/playwright/index.mjs';
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function launch(gid, port, out, { fps = 20 } = {}) {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const log = [], errs = [], posts = [];
  page.on('console', m => { const t = m.text(); log.push(`[${m.type()}] ${t.slice(0, 300)}`); });
  page.on('pageerror', e => { errs.push(String(e).slice(0, 300)); log.push('[pageerror] ' + String(e).slice(0, 300)); });
  page.on('request', r => { if (r.method() === 'POST') posts.push({ t: Date.now(), url: r.url().replace(/^https?:\/\/[^/]+/, ''), body: (r.postData() || '').slice(0, 200) }); });
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
  await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player?.body, null, { timeout: 90000 });
  await sleep(2500);
  for (let i = 0; i < 6; i++) { // clear title/brief/ringer
    const s = await page.evaluate(() => window.__test.getState?.() ?? null).catch(() => null);
    await page.evaluate(() => { try { window.phoneRinger?.close?.(); } catch (_) {} });
    if (s?.blockingUi) { await page.evaluate(b => window.__test.dismissBlockingUi(/tutorial/i.test((b.classes || '') + b.text) ? 'figure it out' : null), s.blockingUi).catch(() => {}); await sleep(700); continue; }
    if (s?.activeMinigame) { await page.evaluate(() => window.__test.minigame.close()).catch(() => {}); await sleep(700); continue; }
    break;
  }
  await page.keyboard.press('Escape');
  const thr = await page.evaluate(f => window.__test.throttleFps(f), fps);
  return { browser, page, log, errs, posts, thr, out, shot: async n => { const f = `${out}/${n}.png`; await page.screenshot({ path: f }); return f; },
    save: (name, obj) => fs.writeFileSync(`${out}/${name}`, typeof obj === 'string' ? obj : JSON.stringify(obj, null, 1)) };
}
