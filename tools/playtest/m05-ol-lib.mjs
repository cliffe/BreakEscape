import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-m05/node_modules/');
const { chromium } = require('playwright-core');
export const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
export const OUT = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-m05/scenarios/m05_insider_trading/office_life/screenshots/';
export const PORT = '3092';
export async function start(gid, { reload = false, init = null } = {}) {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  const t = ms => page.waitForTimeout(ms);
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
  if (init) await page.addInitScript(init);
  await page.route(u => /\/tts$/.test(new URL(u).pathname), r => r.abort());
  await page.goto(`http://127.0.0.1:${PORT}/break_escape/games/${gid}${reload ? '' : '?skip_resume=1'}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body, null, { timeout: 90000 });
  await t(2000);
  const clear = async () => { for (let i = 0; i < 6; i++) {
    const busy = await page.evaluate(() => { try { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); } catch (e) { return false; } });
    if (!busy) break;
    await page.evaluate(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(() => {}); await t(400);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {}); await t(300); } };
  if (!process.env.NOCLEAR) await clear();
  await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
  await page.evaluate(() => {
    window.__ev = [];
    const sys = window.npcNeedsSystem; const ed = window.eventDispatcher; const o = ed.emit.bind(ed);
    const T0 = Date.now();
    ed.emit = (ev, data) => { try { if (/^(npc_|room_entered|conversation_|global_variable_changed|item_|object_revealed)/.test(ev)) window.__ev.push({ ts: Date.now(), w: Date.now() - T0, c: sys ? Math.round(sys.clockMs) : null, ev, d: data ? JSON.parse(JSON.stringify(data, (k, v) => (typeof v === 'object' && v && v.scene) ? undefined : v, 0).slice(0, 400) ? JSON.stringify(data, (k, v) => (typeof v === 'object' && v && v.scene) ? undefined : v).slice(0, 300) : 'null') : null }); } catch (e) { try { window.__ev.push({ w: Date.now() - T0, ev, err: String(e).slice(0,50) }); } catch (e2) {} } return o(ev, data); };
  });
  const api = {
    browser, page, errs, t, clear,
    enter: rid => page.evaluate(r => window.__test.enterRoom(r, { timeoutMs: 25000 }), rid).catch(e => ({ ok: false, err: String(e).slice(0, 80) })),
    near: o => page.evaluate(o => window.__test.moveToNear(o, { timeoutMs: 20000 }), o).catch(e => ({ ok: false, err: String(e).slice(0, 80) })),
    moveTo: (x, y) => page.evaluate(([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 20000 }), [x, y]).catch(e => ({ ok: false, err: String(e).slice(0, 80) })),
    interact: id => page.evaluate(i => window.__test.interact(i), id).catch(e => ({ ok: false, err: String(e).slice(0, 80) })),
    gv: k => page.evaluate(k => { const g = window.gameState && window.gameState.globalVariables; return g ? g[k] : 'nogs'; }, k),
    setN: (id, n, v) => page.evaluate(([i, nn, x]) => window.__test.needs.set(i, nn, x), [id, n, v]),
    st: id => page.evaluate(i => { const s = window.npcNeedsSystem.getState(i); return s && { mode: s.mode, phase: s.job && s.job.phase, target: s.job && s.job.targetId, need: s.job && s.job.need, lv: s.levels || s.needs }; }, id),
    pos: id => page.evaluate(i => { try { const b = window.npcBehaviorManager.getBehavior(i); const s = b && b.sprite; return s ? [Math.round(s.x * 10) / 10, Math.round(s.y * 10) / 10] : null; } catch (e) { return null; } }, id),
    me: () => page.evaluate(() => [Math.round(window.player.x), Math.round(window.player.y), window.currentPlayerRoom]),
    clockS: () => page.evaluate(() => Math.round(window.npcNeedsSystem.clockMs / 1000)),
    evs: (re, since = 0) => page.evaluate(([r, s]) => window.__ev.filter(e => e.w >= s && new RegExp(r).test(e.ev)), [re.source || re, since]),
    now: () => page.evaluate(() => window.__ev.length ? window.__ev[window.__ev.length - 1].w : 0),
    shot: n => page.screenshot({ path: OUT + n + '.png' }),
    until: async (pred, ms, step = 400) => { const e = Date.now() + ms; while (Date.now() < e) { if (await pred()) return true; await t(step); } return false; },
    ev: expr => page.evaluate(expr),
  };
  return api;
}
export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
export async function converse(g, prefs = [], maxSteps = 80, onStep) {
  const tr = [];
  for (let i = 0; i < maxSteps; i++) {
    await g.page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 8000 })).catch(() => {});
    const st = await g.ev(() => { const m = window.MinigameFramework && window.MinigameFramework.currentMinigame; if (!m) return null; return window.__test.getState().dialogue || { none: true }; });
    if (!st) { tr.push('<closed>'); break; }
    if (st.ended && !st.choices?.length && !st.canContinue) { tr.push('<ended>'); await g.page.evaluate(() => window.__test.minigame.close()).catch(() => {}); await g.t(500); break; }
    if (st.choices && st.choices.length) {
      const txt = st.choices.map(c => c.text || c);
      let pick = -1; for (const p of prefs) { const k = txt.findIndex(x => new RegExp(p, 'i').test(x)); if (k >= 0) { pick = k; break; } }
      if (pick < 0) pick = 0;
      tr.push('?' + txt[pick].slice(0, 40));
      await g.page.evaluate(n => window.__test.minigame.chooseIndex(n), pick + 1).catch(() => {});
    } else if (st.canContinue) { await g.page.evaluate(() => window.__test.minigame.continue()).catch(() => {}); }
    else await g.t(400);
    if (onStep) await onStep(i, st);
    await g.t(150);
  }
  return tr;
}
export async function reload(gid, init = null) {
  const g = await start(gid, { reload: true, init });
  await g.page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => {}); await g.t(2500);
  for (let i = 0; i < 4; i++) {
    const act = await g.ev(() => { const s = window.__test.getState(); return s.activeMinigame ? s.activeMinigame.id : (s.blockingUi ? 'blocking' : null); });
    if (!act) break;
    if (act === 'title-screen') await g.page.keyboard.press('Space'); else await g.clear();
    await g.t(1500);
  }
  await g.t(500);
  return g;
}
export async function leave(g) { try { await g.page.goto('about:blank'); await g.t(1500); } catch (e) {} await g.browser.close(); }
