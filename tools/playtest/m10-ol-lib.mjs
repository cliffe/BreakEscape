// m10 office-life live probes (Playwright, headless). Reusable by later scripted runs.
//
//   import { start, probe, dist } from './m10-ol-lib.mjs';
//   const g = await start(gameId);              // keyless server port from M10_PORT (default 3099)
//   console.log(await probe(g));                // both extras: needs levels, mode, job, home, position (px and tiles), distance apart
//
// Needs node_modules (playwright-core) in the worktree: symlink the main checkout's, unlink at the end.
// Headless, setFPS(20) with fixed steps ON (never fixedStep = false). /tts is aborted (keyless server).
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '../../node_modules/'));
const { chromium } = require('playwright-core');
export const EXEC = process.env.PW_EXEC || '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
export const PORT = process.env.M10_PORT || '3099';
export const EXTRAS = ['darren_price', 'sofia_marchetti'];
export const dist = (a, b) => (a && b ? Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) * 10) / 10 : null);

export async function start(gid, { reload = false } = {}) {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = [], logs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('console', m => { const x = m.text(); if (/table group|warn|overlaps/i.test(x) || m.type() === 'error') logs.push(m.type() + ': ' + x.slice(0, 240)); });
  const t = ms => page.waitForTimeout(ms);
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
  await page.route(u => /\/tts$/.test(new URL(u).pathname), r => r.abort());
  await page.goto(`http://127.0.0.1:${PORT}/break_escape/games/${gid}${reload ? '' : '?skip_resume=1'}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body, null, { timeout: 90000 });
  await t(2000);
  for (let i = 0; i < 6; i++) {
    const busy = await page.evaluate(() => { try { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); } catch (e) { return false; } });
    if (!busy) break;
    await page.evaluate(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(() => {}); await t(400);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {}); await t(300);
  }
  await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
  await page.evaluate(() => {
    window.__ev = [];
    const ed = window.eventDispatcher, o = ed.emit.bind(ed), T0 = Date.now();
    ed.emit = (ev, data) => { try { if (/^(npc_|room_entered|conversation_|global_variable_changed)/.test(ev)) window.__ev.push({ w: Date.now() - T0, c: window.npcNeedsSystem ? Math.round(window.npcNeedsSystem.clockMs) : null, ev, d: data ? JSON.stringify(data, (k, v) => (typeof v === 'object' && v && v.scene) ? undefined : v).slice(0, 300) : null }); } catch (e) {} return o(ev, data); };
  });
  return {
    browser, page, errs, logs, t,
    ev: (fn, arg) => page.evaluate(fn, arg),
    setNeed: (id, n, v) => page.evaluate(([i, nn, x]) => window.__test.needs.set(i, nn, x), [id, n, v]),
    evs: (re, since = 0) => page.evaluate(([r, s]) => window.__ev.filter(e => e.w >= s && new RegExp(r).test(e.ev)), [re, since]),
    now: () => page.evaluate(() => Date.now()),
    wall: () => page.evaluate(() => (window.__ev.length ? window.__ev[window.__ev.length - 1].w : 0)),
    probe: () => probe({ page }),
    settle: () => settle(page, t),
    shot: (p, clip) => page.screenshot({ path: p, ...(clip ? { clip } : {}) }),
    close: async () => { try { await page.goto('about:blank'); } catch (e) {} await browser.close(); },
  };
}

// Both extras at once: needs levels, mode, job, home (tiles-snapped px from the engine), sprite position
// in px and in room tiles, and the distance between them. Room origin is read from the room's world position.
export async function probe(g) {
  const page = g.page || g;
  return page.evaluate(ids => {
    const room = window.rooms && window.rooms.forward_post;
    const ox = room ? room.position.x : 0, oy = room ? room.position.y : 0;
    const out = { clockS: Math.round(window.npcNeedsSystem.clockMs / 1000), room: { ox, oy } };
    for (const id of ids) {
      const s = window.npcNeedsSystem.getState(id);
      let sp = null; try { sp = window.npcBehaviorManager.getBehavior(id).sprite; } catch (e) {}
      const p = sp ? [Math.round(sp.x * 10) / 10, Math.round(sp.y * 10) / 10] : null;
      out[id] = s && {
        mode: s.mode, levels: s.levels, atPost: s.atPost, home: s.home,
        job: s.job && { need: s.job.need, phase: s.job.phase, target: s.job.targetId },
        px: p, tiles: p && [Math.round(((p[0] - ox) / 32) * 100) / 100, Math.round(((p[1] - oy) / 32) * 100) / 100],
      };
    }
    const a = out[ids[0]] && out[ids[0]].px, b = out[ids[1]] && out[ids[1]].px;
    out.apart = a && b ? Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) * 10) / 10 : null;
    out.player = window.player ? [Math.round(window.player.x), Math.round(window.player.y), window.currentPlayerRoom] : null;
    return out;
  }, EXTRAS);
}

// m10 opens a Netherton person-chat a few seconds after load (and the Mission Brief first). A delayed
// event mapping (Sofia's coupling) waits while any minigame is open, and closing the chat early only
// re-queues the opening conversation, so play it through: first choice each time, Continue otherwise,
// then close it once it has ended. Closing the Netherton chat emits conversation_closed:director_netherton,
// which starts Darren's first mapped brew (PLAN 2.3, L3): a measurement that needs a quiet kettle waits
// for that brew to finish. Returns a trace of what was done.
export async function settle(page, t, maxMs = 90000) {
  const end = Date.now() + maxMs; let quiet = 0; const tr = [];
  while (Date.now() < end && quiet < 8) {
    const info = await page.evaluate(() => {
      try {
        const st = window.__test.getState();
        if (st.blockingUi) return { kind: 'blocking' };
        if (!st.activeMinigame) return null;
        const d = window.MinigameFramework.currentMinigame && st.dialogue;
        return { kind: st.activeMinigame.type, d: d || null };
      } catch (e) { return null; }
    });
    if (!info) { quiet++; await t(500); continue; }
    quiet = 0;
    if (info.kind === 'blocking') { await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {}); tr.push('dismiss'); }
    else if (info.d && info.d.choices && info.d.choices.length) { tr.push('choose1'); await page.evaluate(() => window.__test.minigame.chooseIndex(1)).catch(() => {}); }
    else if (info.d && info.d.canContinue) { tr.push('cont'); await page.evaluate(() => window.__test.minigame.continue()).catch(() => {}); }
    else { tr.push('close:' + info.kind); await page.evaluate(() => window.__test.minigame.close && window.__test.minigame.close()).catch(() => {}); }
    await t(250);
  }
  return tr;
}
