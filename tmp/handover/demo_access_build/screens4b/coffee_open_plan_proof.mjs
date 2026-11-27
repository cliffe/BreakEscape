// Slice 4 review fix M1 live proof: kitchen never visited, rota board sends Thandiwe and Yasmin to
// the open-plan coffee machine; their PCs open while they are away. Headless, setFPS(20), fixed steps.
//   node coffee_open_plan_proof.mjs <gameId> <port>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port] = process.argv.slice(2);
const OUT = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-build-access/tmp/handover/demo_access_build/screens4b';
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player?.body && window.npcNeedsSystem, null, { timeout: 90000 });
await page.waitForTimeout(2000);
await page.keyboard.press('Escape');
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
const log = [];
const route = await page.evaluate(async () => {
  try { window.__test.dismissBlockingUi?.(); } catch (e) {}
  const er = await window.__test.enterRoom('open_plan').catch(e => ({ err: String(e) })); await new Promise(r => setTimeout(r, 2500));
  let walked = window.currentPlayerRoom === 'open_plan', placed = false;
  if (!walked) {   // test shortcut: load the room and stand on its nearest walkable cell (not a solve)
    if (!window.rooms.open_plan) await window.loadRoom('open_plan');
    const rp = window.roomPositions?.open_plan || window.rooms.open_plan?.position || { x: 0, y: 0 };
    const map = window.rooms.open_plan?.map; const w = map?.widthInPixels || 320, h = map?.heightInPixels || 288;
    const cell = window.pathfindingManager?.findNearestWalkableStartCell?.(rp.x + w / 2, rp.y + h * 0.7);
    if (cell) { const p = window.player; p.body.reset(p.x + cell.x - p.body.center.x, p.y + cell.y - p.body.center.y); placed = true; }
  }
  return { er: JSON.stringify(er).slice(0, 200), walked, placed, room: window.currentPlayerRoom, loaded: Object.keys(window.rooms).join() };
});
log.push({ route });
await page.waitForTimeout(4000);
const snap = () => page.evaluate(() => { const s = window.npcNeedsSystem; const o = { t: Math.round(s.clockMs / 1000), room: window.currentPlayerRoom, loaded: Object.keys(window.rooms).join() };
  for (const id of ['thandiwe', 'yasmin']) { const st = s.getState(id), p = s.world.npcPos(id); if (!st) { o[id] = null; continue; } o[id] = { x: p && Math.round(p.x), y: p && Math.round(p.y), mode: st.mode, atPost: st.atPost, caffeine: Math.round(st.levels.caffeine), job: st.job ? (st.job.kind || st.job.type || JSON.stringify(st.job).slice(0, 80)) : null, blocked: st.blockedNeed || null }; }
  return o; });
console.log(JSON.stringify(log)); log.push({ before: await snap() });
await page.screenshot({ path: `${OUT}/coffee_1_before.png` });
let r = '';
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => window.__test.dismissBlockingUi?.()); await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  r = await page.evaluate(() => window.__test.interact('rota_board').then(x => JSON.stringify(x).slice(0, 160)));
  if (!/minigame-active/.test(r)) break;
  await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(); } catch (e) {} });
}
log.push({ interact: r });
let sawAway = false, pcShot = false, maxAway = 0; const away = {}, drank = {}, back = {};
const c0 = await page.evaluate(() => window.npcNeedsSystem.clockMs);
const w0 = Date.now();
while ((await page.evaluate(() => window.npcNeedsSystem.clockMs)) - c0 < 150000 && Date.now() - w0 < 400000) {
  await page.waitForTimeout(1000);
  const s = await snap(); log.push({ poll: s });
  for (const id of ['thandiwe', 'yasmin']) {
    if (!s[id].atPost) { away[id] = away[id] ?? s.t; if (/use|drink/i.test(String(s[id].mode) + s[id].job)) drank[id] = drank[id] ?? s.t; }
    if (away[id] !== undefined && s[id].atPost && back[id] === undefined) back[id] = s.t;
  }
  if (!pcShot && !s.thandiwe.atPost && !s.yasmin.atPost) {
    pcShot = true;
    await page.screenshot({ path: `${OUT}/coffee_2_both_away.png` });
    const pc = await page.evaluate(async () => { const out = {}; for (const id of ['thandiwe_laptop', 'yasmin_pc']) { document.querySelectorAll('.game-confirm-dialog').forEach(d => { out.dialogText = (d.innerText || '').slice(0, 120); const b = d.querySelector('button'); b && b.click(); d.remove(); }); await new Promise(r => setTimeout(r, 400));
 const r = await window.__test.interact(id).then(x => JSON.stringify(x).slice(0, 120)).catch(e => String(e)); await new Promise(r => setTimeout(r, 900)); out[id] = { r, text: (document.body.innerText.match(/using this PC[^\n]*/) || [null])[0], open: !!document.querySelector('.minigame-container, #minigame-container, .pc-desktop, .pc-minigame'), minigame: window.MinigameFramework?.currentMinigame?.constructor?.name || null, body: document.body.innerText.slice(0, 200).replace(/\n/g, ' | ') }; try { window.MinigameFramework?.endMinigame?.(); } catch (e) {} } return out; });
    log.push({ pcWhileAway: pc, at: s.t });
    await page.screenshot({ path: `${OUT}/coffee_3_pc_while_away.png` });
  }
  if (back.thandiwe !== undefined && back.yasmin !== undefined) break;
}
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/coffee_4_after.png` });
const evlog = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => /thandiwe|yasmin/.test(e.npc || '')).slice(-60));
fs.writeFileSync(`${OUT}/coffee_open_plan_run.json`, JSON.stringify({ gid, away, drank, back, errs, log, evlog }, null, 1));
console.log(JSON.stringify({ gid, away, drank, back, final: log.at(-1), errs }));
await browser.close();
