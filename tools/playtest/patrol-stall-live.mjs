// Patrol stand-still live check (T100 minors, section 4 of docs/achitechture/PATROL_MINORS.md).
// Usage: node patrol-stall-live.mjs <gameId> <port> <out.json>   env: SECS (default 60), MODE=park|ahead, PX, PY
// park: the player is reset to (PX,PY) every second. ahead: every 500 ms the player is put on the walker's
// current patrol target (standing in its path), so the player-collision and player-wait code is exercised.
// Headless, setFPS(20) with fixed steps on. Never presses Escape blindly (it pauses the scene).
// Prints the longest stand-still of waypoint_fast and whether a settle/avoidance flag was set during it.
// Exit status: 0 clean; 1 a stall over STALL_SECS (default 20, or --stall-secs=N), a page error or a stopped
// clock; 2 the scene is still paused. Playwright and Chromium resolve as in the other tools/playtest scripts.
import fs from 'node:fs';
import { chromium } from 'playwright';
const flag = process.argv.find(a => a.startsWith('--stall-secs='));
const STALL_SECS = flag ? +flag.split('=')[1] : (+process.env.STALL_SECS || 20);
const [gid, port, out] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
let exitCode = 0;
try {
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const logs = { stuck: [], reached: {}, detour: 0, other: [] };
page.on('console', m => {
    const s = m.text();
    if (s.includes('No progress for')) logs.stuck.push(s.slice(0, 160));
    else if (s.includes('Reached waypoint')) { const id = (s.match(/\[([^\]]+)\]/) || [])[1]; logs.reached[id] = (logs.reached[id] || 0) + 1; }
    else if (s.includes('Detoured round')) logs.detour++;
});
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcBehaviorManager, null, { timeout: 90000 });
await page.waitForTimeout(2000);
// Escape toggles the game menu, which pauses the scene (game-menu.js open()). Never press it blindly.
for (let i = 0; i < 3; i++) { await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {}); await page.waitForTimeout(300); }
for (let i = 0; i < 3 && await page.evaluate(() => window.npcBehaviorManager.behaviors.get('waypoint_fast').scene.sys.isPaused()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
if (await page.evaluate(() => window.npcBehaviorManager.behaviors.get('waypoint_fast').scene.sys.isPaused())) { console.log('SCENE STILL PAUSED'); exitCode = 2; throw new Error('paused'); }
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });

const fixed = await page.evaluate(() => window.game.physics.world.fixedStep);
const snap = (id) => page.evaluate((id) => { const b = window.npcBehaviorManager.behaviors.get(id); const c = b.sprite.body.center; const a = b._avoid;
  return { x: Math.round(c.x), y: Math.round(c.y), st: b.currentState, tgt: b.patrolTarget && [b.patrolTarget.x, b.patrolTarget.y], av: a ? { g: !!a.gaveUp, sq: a.squeezeUntil > 0 } : null }; }, id);

if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
const MODE = process.env.MODE || 'park';
const PX = +process.env.PX || 156, PY = +process.env.PY || 169, SECS = +process.env.SECS || 60;
await page.evaluate(([x, y]) => { window.player.body.reset(x, y); }, [PX, PY]);

await page.evaluate(() => { const b = window.npcBehaviorManager.behaviors.get('waypoint_fast'); window.__ring = [];
  const push = (...a) => { window.__ring.push([Math.round(b.scene.time.now), ...a]); if (window.__ring.length > 600) window.__ring.shift(); };
  for (const m of ['_handleBlockerAhead', 'chooseNewPatrolTarget', '_checkPathStuck', '_planMovePath', '_patrolStalled', 'triggerSettling', '_requestDetour']) { const o = b[m]; if (!o) continue; b[m] = function (...args) { const r = o.apply(this, args); push(m, typeof r === 'object' ? 'obj' : r, 'pl' + this.currentPath.length, 'pi' + this.pathIndex, 'nr' + (this._needsPathRecalc ? 1 : 0), 'prog' + (this._pathfindingInProgress ? 1 : 0), 'ret' + Math.round((this._pathRetryAfter || 0) - this.scene.time.now)); return r; }; }
  const up = b.updatePatrol; b.updatePatrol = function (t, d) { const pre = this.sprite.body.velocity.x; push('UP', 'pl' + this.currentPath.length, 'pi' + this.pathIndex, 'nr' + (this._needsPathRecalc ? 1 : 0), 'prog' + (this._pathfindingInProgress ? 1 : 0), 'ff' + (this.pathFollowingActive ? 1 : 0), 'set' + (this.isSettling ? 1 : 0), 'ret' + Math.round((this._pathRetryAfter || 0) - t), 'tg' + (this.patrolTarget ? 1 : 0), this.currentState); return up.call(this, t, d); }; });
const rows = [];
if (process.env.NPCX) await page.evaluate(([x, y]) => { const b = window.npcBehaviorManager.behaviors.get('waypoint_fast'); b.sprite.body.reset(x, y); b.currentPath = []; b.patrolTarget = null; }, [+process.env.NPCX, +process.env.NPCY]);
for (let i = 0; i < SECS; i++) {
  if (MODE === 'ahead') await page.evaluate(() => { const b = window.npcBehaviorManager.behaviors.get('waypoint_fast'); const t = b.patrolTarget; if (t) window.player.body.reset(t.x, t.y); });
  else await page.evaluate(([x, y]) => window.player.body.reset(x, y), [PX, PY]);
  rows.push(await page.evaluate(() => { const m = window.npcBehaviorManager.behaviors; const o = {};
    for (const id of ['waypoint_fast', 'waypoint_with_face']) { const b = m.get(id); const c = b.sprite.body.center; const a = b._avoid;
      o[id] = { sett: b.isSettling, grace: Math.round((b._settleGraceUntil||0)-b.scene.time.now), nr: b._needsPathRecalc, ws: !!b._stuckWatch, p: [Math.round(c.x), Math.round(c.y)], v: [Math.round(b.sprite.body.velocity.x), Math.round(b.sprite.body.velocity.y)], st: b.currentState, tgt: b.patrolTarget && [b.patrolTarget.x, b.patrolTarget.y], pl: b.currentPath?.length, pi: b.pathIndex, fol: b.pathFollowingActive, av: a ? Object.keys(a).filter(k => a[k]).join('|') : null, sw: b._stuckWatch ? 1 : 0, clk: { run: window.game.sys.game.loop.running, paused: window.game.sys.game.isPaused, hid: document.hidden, foc: document.hasFocus(), st: b.scene.sys.settings.status, fps: Math.round(window.game.sys.game.loop.actualFps), raf: window.game.sys.game.loop.raf.isSetTimeOut, ts: Math.round(window.game.sys.game.loop.delta) }, thr: b.sprite.body.touching && Object.values(b.sprite.body.touching).some(Boolean) ? 1 : 0, ret: b._pathRetryAfter, prog: !!b._pathfindingInProgress, now: Math.round(b.scene.time.now), rect: window.npcBehaviorManager.behaviors.get('waypoint_rectangle').sprite.body.center.x|0, pb: b._playerBeside ? b._playerBeside(c.x, c.y) : null, lp: Math.round((b.scene.time.now - b.lastPatrolChange)/100)/10, dpl: Math.round(Math.hypot(window.player.body.center.x - c.x, window.player.body.center.y - c.y)), pa: (b.currentPath||[]).slice(b.pathIndex, b.pathIndex+3).map(p => [p.x, p.y]) }; }
    return o; }));
  if (MODE === 'ahead') { await sleep(500); await page.evaluate(() => { const b = window.npcBehaviorManager.behaviors.get('waypoint_fast'); const t = b.patrolTarget; if (t) window.player.body.reset(t.x, t.y); }); await sleep(500); } else await sleep(1000);
}
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
let best = { len: 0, start: 0 }, cur = 0;
const still = (a, b) => a.p[0] === b.p[0] && a.p[1] === b.p[1] && a.v[0] === 0 && a.v[1] === 0;
for (let i = 0; i < rows.length; i++) { const r = rows[i].waypoint_fast; if (i > 0 && still(r, rows[i-1].waypoint_fast)) cur++; else cur = 0; if (cur > best.len) best = { len: cur, start: i - cur }; }
const seg = rows.slice(best.start, best.start + best.len + 1).map(r => r.waypoint_fast);
const clockAdvanced = rows.length > 1 && rows[rows.length-1].waypoint_fast.now > rows[0].waypoint_fast.now + (rows.length - 2) * 500;
const summary = { mode: MODE, secs: rows.length, clockAdvanced, longestStillSecs: best.len, startedAtRow: best.start,
  settleOrGraceDuringStill: seg.some(r => r.sett || r.grace > 0), recalcDuringStill: seg.some(r => r.nr), avoidDuringStill: seg.some(r => r.av),
  playerBesideDuringStill: seg.some(r => r.pb), minPlayerDist: seg.length ? Math.min(...seg.map(r => r.dpl)) : null };
console.log('SUMMARY', JSON.stringify(summary));
console.log('errs', errs, 'detours', logs.detour, logs.stuck.slice(0, 3));
const fails = [];
if (best.len > STALL_SECS) fails.push(`stand-still ${best.len} s over ${STALL_SECS} s`);
if (errs.length) fails.push(`${errs.length} page error(s)`);
if (!clockAdvanced) fails.push('game clock did not advance');
if (fails.length) { console.log('FAIL', fails.join('; ')); exitCode = 1; } else console.log('PASS');
} catch (e) {
  if (!exitCode) { console.log('ERROR', String(e).slice(0, 300)); exitCode = 1; }
} finally {
  await browser.close();
}
process.exit(exitCode);
