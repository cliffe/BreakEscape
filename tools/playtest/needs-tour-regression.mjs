// Regression check for scenarios/test_needs_sims README tour rows 1, 3, 5 and 6, in that order on
// one game (OFFICE_LIFE_STUCK_RETURN.md): the coffee queue, the coffee switched off at the wall
// socket, a chat at the water cooler and nobody chatting with the contractor. Every lever is used
// through its own UI (the notice or board is read, the socket's confirm is clicked). Headless,
// setFPS(20) with fixed steps on.
//   node tools/playtest/needs-tour-regression.mjs <gameId> [port] [outDir]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3093', outDir = './tmp/stuck-proof/'] = process.argv.slice(2);
if (!gid) { console.error('usage: needs-tour-regression.mjs <gameId> [port] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const t = ms => page.waitForTimeout(ms);
const report = { gid, errs, rows: {} };

await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcNeedsSystem, null, { timeout: 90000 });
await t(2000);
const closeUi = async () => {
    for (let i = 0; i < 10; i++) {
        const ui = await page.evaluate(() => ({ mg: !!window.MinigameFramework?.currentMinigame, blocking: window.__test.getState().blockingUi || null }));
        if (!ui.mg && !ui.blocking) return true;
        if (ui.mg) await page.evaluate(() => { try { window.MinigameFramework.endMinigame(true); } catch (e) {} });
        await page.keyboard.press('Escape'); await t(300);
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
        await t(300);
    }
    return false;
};
await closeUi();
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
const clock = () => page.evaluate(() => window.npcNeedsSystem.clockMs);
const done = () => page.evaluate(() => Object.values(window.objectivesManager?.taskIndex || {}).filter(x => x.status === 'completed' || x.status === 'completing').map(x => x.taskId || x.id));
/** Wait up to `ms` of needs clock (and 4x that of wall time) until every task in `want` has ticked. */
async function waitTasks(want, ms) {
    const c0 = await clock(), w0 = Date.now();
    while ((await clock()) - c0 < ms && Date.now() - w0 < ms * 4) {
        const d = await done();
        if (want.every(x => d.includes(x))) return { ok: true, s: Math.round(((await clock()) - c0) / 1000) };
        await t(1000);
    }
    const d = await done();
    return { ok: false, missing: want.filter(x => !d.includes(x)), s: Math.round(((await clock()) - c0) / 1000) };
}
const coffeeBusy = () => page.evaluate(() => ['amara', 'tom', 'marek', 'sanjay'].some(id => window.npcNeedsSystem.getState(id)?.job?.targetId === 'office_coffee'));
const read = async id => { await page.evaluate(id => window.__test.moveToNear(id, { timeoutMs: 20000 }), id).catch(() => null); await t(400); const r = await page.evaluate(id => window.__test.interact(id), id).catch(e => ({ err: String(e) })); await t(1200); await closeUi(); return r?.ok ?? r; };
const confirmClick = () => page.evaluate(() => { const b = document.querySelector('.game-confirm-ok'); if (b) { b.click(); return true; } return false; });

// Row 1: the queue at the office coffee, by itself after about a minute
await page.evaluate(() => window.__test.moveToNear('office_coffee', { timeoutMs: 20000 })).catch(() => null);
report.rows[1] = await waitTasks(['see_coffee', 'see_queue', 'see_queue_chat'], 150000);
console.log('row 1', JSON.stringify(report.rows[1]));

// Row 3: once the queue has cleared, a fresh one from the Activity Board; switch the coffee off while
// two wait in line, then back on
for (let i = 0; i < 120 && await coffeeBusy(); i++) await t(1000);
report.rows[3] = { board: await read('activity_board') };
await page.evaluate(() => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 20000 })).catch(() => null);
const cq = Date.now();
while (Date.now() - cq < 120000) {
    const n = await page.evaluate(() => ['amara', 'tom', 'marek'].filter(id => window.npcNeedsSystem.getState(id)?.job?.phase === 'queued').length);
    if (n >= 1) break;
    await t(500);
}
await page.evaluate(() => window.__test.interact('office_coffee_socket')).catch(() => null); await t(800);
report.rows[3].off = await confirmClick(); await t(500); await closeUi();
report.rows[3].wait = await waitTasks(['see_coffee_off'], 40000);
await page.evaluate(() => window.__test.interact('office_coffee_socket')).catch(() => null); await t(800);
report.rows[3].on = await confirmClick(); await t(500); await closeUi();
report.rows[3].ok = report.rows[3].wait.ok;
console.log('row 3', JSON.stringify(report.rows[3]));

// Open the kitchen and the lounge (walk into each and back)
report.rooms = [];
for (const r of ['kitchen', 'office', 'lounge', 'office']) report.rooms.push([r, (await page.evaluate(r => window.__test.enterRoom(r), r).catch(e => ({ err: String(e) })))?.ok ?? null]);

// Row 5: the Activity Board again, then stand by the water cooler in the kitchen
for (let i = 0; i < 120 && await coffeeBusy(); i++) await t(1000);
report.rows[5] = { board: await read('activity_board') };
await page.evaluate(() => window.__test.enterRoom('kitchen')).catch(() => null);
await page.evaluate(() => window.__test.moveToNear('water_cooler', { timeoutMs: 20000 })).catch(() => null);
report.rows[5].wait = await waitTasks(['see_chat', 'hear_rota_exchange'], 180000);
report.rows[5].ok = report.rows[5].wait.ok;
console.log('row 5', JSON.stringify(report.rows[5]));

// Row 6: the Kitchen Rota, then wait in the kitchen
report.rows[6] = { rota: await read('kitchen_rota') };
await page.evaluate(() => window.__test.moveToNear('water_cooler', { timeoutMs: 20000 })).catch(() => null);
report.rows[6].wait = await waitTasks(['see_outcast'], 180000);
report.rows[6].ok = report.rows[6].wait.ok;
console.log('row 6', JSON.stringify(report.rows[6]));

report.stuck = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => /^(return_stuck|walk_stuck)$/.test(e.ev)).map(e => ({ t: e.t, npc: e.npc, ev: e.ev, x: e.x, y: e.y })));
await page.screenshot({ path: `${outDir}/tour-${gid}.png` });
fs.writeFileSync(`${outDir}/tour-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ gid, row1: report.rows[1].ok, row3: report.rows[3].ok, row5: report.rows[5].ok, row6: report.rows[6].ok, rooms: report.rooms, stuck: report.stuck.length, errs: errs.length }));
await page.goto('about:blank');
await browser.close();
