// Live proof for NPC carried items review R3 M1 and M2, driven through the real
// client against the keyless server. Deterministic (no wait on the needs AI): it
// calls the client's RoomStateSync carry actions directly, so the server path is
// exactly the one the needs system uses, and records every update_room status.
//   M1: a carry picks the object up from a room other than its scenario room.
//       Carry office_mugs from the office, put it down in the kitchen, then carry
//       it again FROM the kitchen (a non-scenario room). Expect 200, no 422.
//   M2: a reload mid-carry ends the carry. Carry office_mugs, reload (about:blank
//       then back), confirm the mug is back on the office floor exactly once and
//       the NPC is free to carry again.
//   node tools/playtest/npc-carry-live-m1m2.mjs <gameId> <port> <m1|m2> [outFile]
// Games: tools/playtest/new-game.rb test_needs_sims (m1 needs --unlock kitchen).
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3091', beat = 'm1', outFile = `./carry-${beat}-${process.argv[2]}.json`] = process.argv.slice(2);
if (!gid) { console.error('usage: npc-carry-live-m1m2.mjs <gameId> <port> <m1|m2> [outFile]'); process.exit(2); }
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [], reqs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
page.on('response', async r => {
    const q = r.request();
    if (q.method() !== 'POST' || !/update_room/.test(r.url())) return;
    let body = {}; try { body = JSON.parse(q.postData() || '{}'); } catch (e) { /* not json */ }
    reqs.push({ action: body.actionType, room: body.roomId, data: body.data, status: r.status() });
});
const t = ms => page.waitForTimeout(ms);
const report = { gid, beat, steps: {}, reqs, errs };

async function boot() {
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
    await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcNeedsSystem && window.RoomStateSync, null, { timeout: 90000 });
    await t(1500);
    for (let i = 0; i < 8; i++) {
        const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi || window.MinigameFramework?.currentMinigame); });
        if (!busy) break;
        await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} });
        await page.keyboard.press('Escape'); await t(300);
    }
    await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
}
const fetchRoom = rid => page.evaluate(async ([g, rid]) => {
    const r = await fetch(`/break_escape/games/${g}/room/${rid}`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return { status: r.status };
    const j = await r.json();
    const room = j.room || j;
    const objs = Array.isArray(room.objects) ? room.objects : Object.values(room.objects || {});
    const mugs = objs.filter(o => /mugs/.test(o.id || '')).map(o => o.id);
    const grace = (room.npcs || []).find(n => n.id === 'grace');
    return { status: r.status, mugs, graceHeld: grace ? (grace.itemsHeld || []).map(i => i.id) : null };
}, [gid, rid]);
const call = (fn, ...args) => page.evaluate(async ([fn, args]) => {
    try { const ok = await window.RoomStateSync[fn](...args); return { ok: ok === false ? false : (ok === null ? null : true) }; }
    catch (e) { return { err: String(e).slice(0, 120) }; }
}, [fn, args]);

await boot();
// Make the rooms known to the client
for (const r of ['kitchen', 'office']) await page.evaluate(r => window.__test.enterRoom(r), r).catch(() => {});
await t(500);

if (beat === 'm1') {
    report.steps.start = { office: await fetchRoom('office'), kitchen: await fetchRoom('kitchen') };
    report.steps.carryFromOffice = await call('carryObject', 'grace', 'office_mugs', 'office');
    await t(800);
    report.steps.putDownKitchen = await call('putDownObject', 'grace', 'office_mugs', 'kitchen', { px: 140, py: 140 });
    await t(800);
    report.steps.afterPutDown = { kitchen: await fetchRoom('kitchen'), office: await fetchRoom('office') };
    // THE M1 proof: pick the mug up again from the kitchen (not its scenario room)
    report.steps.carryFromKitchen = await call('carryObject', 'grace', 'office_mugs', 'kitchen');
    await t(800);
    report.steps.afterCrossRoomCarry = { kitchen: await fetchRoom('kitchen'), office: await fetchRoom('office') };
} else {
    report.steps.start = { office: await fetchRoom('office') };
    report.steps.carry = await call('carryObject', 'grace', 'office_mugs', 'office');
    await t(800);
    report.steps.midCarry = { office: await fetchRoom('office') };
    // Reload mid-carry
    await page.goto('about:blank');
    await boot();
    await t(500);
    report.steps.afterReload = { office: await fetchRoom('office') };
    // The NPC must be free to carry again
    report.steps.carryAgain = await call('carryObject', 'grace', 'office_mugs', 'office');
    await t(800);
    report.steps.afterCarryAgain = { office: await fetchRoom('office') };
}

const statuses = reqs.map(r => r.status);
report.summary = {
    actions: reqs.map(r => `${r.action}@${r.room}:${r.status}`),
    count200: statuses.filter(s => s === 200).length,
    count422: statuses.filter(s => s === 422).length,
    other: statuses.filter(s => s !== 200 && s !== 422),
    errs: errs.length
};
await page.screenshot({ path: outFile.replace(/\.json$/, '.png') });
fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report.summary, null, 1));
console.log('steps:', JSON.stringify(report.steps, null, 1));
await browser.close();
