// Shared helpers for the m01 office-life live probes (office_life/PLAN.md section 8).
// Headless, setFPS(20) with fixed steps on. Never setManualClock, never fixedStep=false.
import { createRequire } from 'node:module';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/');
const { chromium } = require('playwright-core');
export const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';

export async function open(gid, port = '3094', { skipResume = false } = {}) {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
  const url = `http://127.0.0.1:${port}/break_escape/games/${gid}` + (skipResume ? '?skip_resume=1' : '');
  const h = { browser, page, errs, gid, port, url, t: ms => page.waitForTimeout(ms) };
  await load(h, url);
  return h;
}

export async function load(h, url) {
  const { page } = h;
  await page.goto(url || h.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcNeedsSystem, null, { timeout: 90000 });
  await h.t(2000);
  await dismiss(h);
  await page.evaluate(() => {
    const loop = window.game.sys.game.loop, raf = loop.raf;
    if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); }
    loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20);
  });
}

export async function dismiss(h) {
  const { page } = h;
  for (let i = 0; i < 6; i++) {
    const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
    if (!busy) break;
    await page.keyboard.press('Enter'); await h.t(400); await page.keyboard.press('Escape'); await h.t(400);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
  }
}

// Poll a needs NPC until at post (null state counts as at post). Times out and returns the last state.
export async function waitAtPost(h, id, timeoutMs = 120000) {
  const t0 = Date.now(); let st = null;
  while (Date.now() - t0 < timeoutMs) {
    st = await h.page.evaluate(i => { const s = window.__test.needs.state(i); return s ? { atPost: !!s.atPost, mode: s.mode, job: s.job ? (s.job.kind || s.job.type || 'job') : null } : null; }, id);
    if (!st || (st.atPost && !st.job)) return { ok: true, st };
    await h.t(500);
  }
  return { ok: false, st };
}

export const ev = (h, fn, arg) => h.page.evaluate(fn, arg);
export const dlg = h => h.page.evaluate(() => {
  const s = window.__test.minigame.getState();
  return { active: window.__test.minigame.isActive(), which: s?.id || null, text: s?.text || null, controls: (s?.controls || []).map(c => c.label || c.text || c.name || String(c)).slice(0, 12) };
});

// Drive an open person-chat: advance lines with Space; pick the first choice matching `pick` (regex source) when
// choices show; stop when the minigame closes or `maxSteps` pass. Returns the lines seen and why it stopped.
export async function converse(h, pick, maxSteps = 30) {
  const lines = []; let picked = false;
  for (let i = 0; i < maxSteps; i++) {
    const d = await dlg(h);
    if (!d.active) return { closed: true, lines, picked };
    const body = (d.text || '').split('\n').filter(x => x.trim() && !/^(×|Skip)/.test(x.trim()));
    const last = body[body.length - 1] || '';
    if (!lines.includes(last) && last) lines.push(last);
    const hasChoice = d.controls.some(c => /^\d\./.test(c));
    if (hasChoice) {
      if (!pick) return { closed: false, lines, picked, choices: d.controls };
      const r = await h.page.evaluate(p => window.__test.minigame.chooseMatching(p), pick);
      if (r?.ok) picked = true; else return { closed: false, lines, picked, choices: d.controls, fail: r?.reason };
      await h.t(900); continue;
    }
    await h.page.keyboard.press('Space'); await h.t(900);
  }
  return { closed: false, lines, picked, timeout: true };
}
