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
// Turn-backs, parks and spoken or pictured lines, for row 3's switch-off turn-back
await page.evaluate(() => {
    const ed = window.eventDispatcher; window.__ev = []; const orig = ed.emit.bind(ed);
    ed.emit = (ev, data) => { try { if (/^npc_(turned_back|need_parked|overheard|chatted|sat$)/.test(ev) && window.__ev.length < 400) window.__ev.push({ c: window.npcNeedsSystem.clockMs, ev, npcId: data?.npcId || data?.speakerId, reason: data?.reason, line: data?.line, picture: !!data?.picture, topic: data?.topic }); } catch (e) {} return orig(ev, data); };
});
// Stall snapshots (sims tidy item 2): on each stall line, what is within 64 px of the NPC: the
// player, other NPC bodies, chairs and static bodies, with their boxes
await page.evaluate(() => {
    const ns = window.npcNeedsSystem; window.__stalls = []; const orig = ns._log.bind(ns);
    const box = b => [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)];
    ns._log = (npc, ev, extra) => {
        try {
            if (/^(return_stuck|walk_stuck|walk_rerouted|return_resumed)$/.test(ev) && window.__stalls.length < 200) {
                const sp = window.npcBehaviorManager?.getBehavior?.(npc)?.sprite, c = sp?.body?.center;
                const near = []; const R = 64;
                if (c) {
                    const pb = window.player?.body;
                    if (pb && Math.hypot(pb.center.x - c.x, pb.center.y - c.y) < R) near.push({ player: box(pb) });
                    for (const room of Object.values(window.rooms || {})) for (const o of room.npcSprites || []) {
                        const b = o.body; if (o !== sp && b?.center && Math.hypot(b.center.x - c.x, b.center.y - c.y) < R) near.push({ npc: o.npcId, box: box(b), held: !!b.immovable, seated: !!window.npcBehaviorManager?.getBehavior?.(o.npcId)?._seat });
                    }
                    for (const ch of window.chairs || []) { const b = ch.body; if (b?.center && Math.hypot(b.center.x - c.x, b.center.y - c.y) < R) near.push({ chair: ch.objectId, box: box(b), seatedBy: ch.seatedBy || null }); }
                    window.game.physics.world.staticBodies.iterate(b => { if (b.enable && b.center && Math.hypot(b.center.x - c.x, b.center.y - c.y) < R) near.push({ static: b.gameObject?.objectId || b.gameObject?.name || b.gameObject?.texture?.key || '?', box: box(b) }); });
                }
                const p = window.player?.body?.center;
                window.__stalls.push({ c: Math.round(ns.clockMs / 100) / 10, npc, ev, at: c && [Math.round(c.x), Math.round(c.y)], room: window.npcBehaviorManager?.getBehavior?.(npc)?.roomId, player: p && [Math.round(p.x), Math.round(p.y)], playerRoom: window.currentPlayerRoom, near });
            }
        } catch (e) {}
        return orig(npc, ev, extra);
    };
});
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
// Read a lever, walking up to it first. From the coffee station (bottom right) a walk to the back
// wall can time out behind the staff at the station (game 5409: the Activity Board read returned
// false, so no fresh queue formed), so a failed walk or read is tried again, up to three times
// `mids` orders the mid-office points tried first (row 3 starts at 200,176: Amara's chair stands
// in the aisle north of 232,176 and stopped every first try there, the sims tidy pass)
// `front` (optional): a floor point in front of the lever to walk to instead of moveToNear. The
// Activity Board hangs on the back wall (x 210..250, y 13..65) and reads from the floor at about
// (212..220, 75), but moveToNear aims behind the wall (y 41) and stopped at y 103 to 104 in row 3
// on games 5657 and 5658 (sims tidy item 1)
const BOARD_FRONT = [220, 76];
const read = async (id, mids = [[232, 176], [200, 176], [264, 176]], front = null) => {
    const tries = [];
    for (let i = 0; i < 3; i++) {
        // Round 7 (5436: every read from the coffee station ended still-out-of-range): walk to open
        // floor mid-office first (the stuck-return driver's stand point, off the staff's routes),
        // so moveToNear's solver starts from a side of the board it can reach, not from behind the
        // queue at the station; then close in on the board
        // Code review R1 follow-up: 5454's row 3 and row 5 took this same approach (mid 232,176, aim
        // 222,41); row 3 stopped at (220,103) every try, so what stopped it moves (a body or a chair in
        // the aisle). Each try starts from a different mid point, and a short stop records what is near
        const [mx, my] = mids[i];
        const mid = await page.evaluate(([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 20000, pointer: false }), [mx, my]).catch(e => ({ err: String(e) }));
        await t(300);
        const mv = front
            ? await page.evaluate(([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 30000, pointer: false }), front).catch(e => ({ err: String(e) }))
            : await page.evaluate(id => window.__test.moveToNear(id, { timeoutMs: 30000 }), id).catch(e => ({ err: String(e) }));
        await t(400);
        const r = await page.evaluate(id => window.__test.interact(id), id).catch(e => ({ err: String(e) }));
        await t(1200); await closeUi();
        const pl = await page.evaluate(() => ({ x: Math.round(window.player.x), y: Math.round(window.player.y) }));
        const near = r?.ok ? undefined : await page.evaluate(() => {
            const p = window.player.body.center, out = [];
            for (const room of Object.values(window.rooms || {})) for (const sp of room.npcSprites || []) {
                const c = sp.body?.center; if (c && Math.hypot(c.x - p.x, c.y - p.y) < 48) out.push({ npc: sp.npcId, x: Math.round(c.x), y: Math.round(c.y), held: !!sp.body.immovable });
            }
            for (const ch of window.chairs || []) {
                const c = ch.body?.center; if (c && Math.hypot(c.x - p.x, c.y - p.y) < 48) out.push({ chair: ch.objectId, x: Math.round(c.x), y: Math.round(c.y), seatedBy: ch.seatedBy || null, fetchedBy: ch.fetchedBy || null });
            }
            return out;
        }).catch(() => null);
        tries.push({ from: [mx, my], near, mid: mid?.ok ?? mid?.reason ?? mid, move: mv?.ok ?? mv, move_reason: mv?.reason, aimed: mv?.aimedAt, arrived: mv?.arrivedAt, short: mv?.moveShortfall, nudges: mv?.nudges, player: pl, read: r?.ok ?? r, reason: r?.reason || r?.error || r?.err || undefined });
        if (r?.ok) return { ok: true, tries };
        await t(1500);
    }
    return { ok: false, tries };
};
const confirmClick = () => page.evaluate(() => { const b = document.querySelector('.game-confirm-ok'); if (b) { b.click(); return true; } return false; });

// Row 1: the queue at the office coffee, by itself after about a minute
await page.evaluate(() => window.__test.moveToNear('office_coffee', { timeoutMs: 20000 })).catch(() => null);
report.rows[1] = await waitTasks(['see_coffee', 'see_queue', 'see_queue_chat'], 150000);
console.log('row 1', JSON.stringify(report.rows[1]));

// Row 3: once the queue has cleared, a fresh one from the Activity Board; switch the coffee off while
// two wait in line, then back on
for (let i = 0; i < 120 && await coffeeBusy(); i++) await t(1000);
report.rows[3] = { board: await read('activity_board', [[200, 176], [264, 176], [232, 176]], BOARD_FRONT) };
await page.evaluate(() => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 30000 })).catch(() => null);
// The README switches the socket off while Tom and Marek wait in line: wait for two in the queue
// (one after 90 s), and read the board again once if nobody has queued by then
const queued = () => page.evaluate(() => ['amara', 'tom', 'marek', 'sanjay'].filter(id => window.npcNeedsSystem.getState(id)?.job?.phase === 'queued'));
let cq = Date.now(), q = [];
while (Date.now() - cq < 150000) {
    q = await queued();
    if (q.length >= 2 || (q.length >= 1 && Date.now() - cq > 90000)) break;
    if (!q.length && Date.now() - cq > 75000 && !report.rows[3].board2) {
        report.rows[3].board2 = await read('activity_board', [[200, 176], [264, 176], [232, 176]], BOARD_FRONT);
        await page.evaluate(() => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 30000 })).catch(() => null);
    }
    await t(500);
}
report.rows[3].queued_at_off = q;
const offAt = await clock();
await page.evaluate(() => window.__test.interact('office_coffee_socket')).catch(() => null); await t(800);
report.rows[3].off = await confirmClick(); await t(500); await closeUi();
report.rows[3].wait = await waitTasks(['see_coffee_off'], 40000);
await t(3000);
// The switch-off turn-back: who in the queue turned back or parked, and what was said or pictured
report.rows[3].after_off = await page.evaluate(c => window.__ev.filter(e => e.c >= c), offAt);
report.rows[3].turned_back = [...new Set(report.rows[3].after_off.filter(e => e.ev.startsWith('npc_turned_back') || e.ev.startsWith('npc_need_parked')).map(e => e.npcId))];
report.rows[3].grumbles = report.rows[3].after_off.filter(e => /^npc_(overheard|chatted)/.test(e.ev) && /grumble/.test(e.topic || '')).map(e => ({ npc: e.npcId, line: e.line || null, picture: e.picture }));
await page.evaluate(() => window.__test.interact('office_coffee_socket')).catch(() => null); await t(800);
report.rows[3].on = await confirmClick(); await t(500); await closeUi();
report.rows[3].ok = report.rows[3].board.ok && q.length > 0 && report.rows[3].wait.ok && q.every(id => report.rows[3].turned_back.includes(id));
console.log('row 3', JSON.stringify(report.rows[3]));

// Open the kitchen and the lounge (walk into each and back)
report.rooms = [];
for (const r of ['kitchen', 'office', 'lounge', 'office']) report.rooms.push([r, (await page.evaluate(r => window.__test.enterRoom(r), r).catch(e => ({ err: String(e) })))?.ok ?? null]);

// Rows 5 and 6 watch the water cooler from a few tiles off, not beside it: parked at the cooler the
// player stood in its approach and Sanjay's return stalled against him (SIMS_TIDY_LOG.md item 2,
// tour 5658: return_stuck at (-244,254) next to the player at (-248,244))
const COOLER_OFFSET = { x: 80, y: 16 };
async function parkByCooler() {
    return page.evaluate(async off => {
        const w = window.npcNeedsSystem.world, obj = w.getObject('water_cooler');
        const cell = obj ? w.approachCell(obj) : null;
        if (!cell) return { ok: false, reason: 'no_cooler' };
        const pm = window.pathfindingManager;
        const aim = pm?.findNearestWalkableWorldCell?.(cell.x + off.x, cell.y + off.y, 3) || { x: cell.x + off.x, y: cell.y + off.y };
        const r = await window.__test.moveTo(aim.x, aim.y, { timeoutMs: 20000, pointer: false }).catch(e => ({ err: String(e) }));
        const p = window.player.body.center;
        return { ok: !!r?.ok || Math.hypot(p.x - aim.x, p.y - aim.y) < 24, cooler: [Math.round(cell.x), Math.round(cell.y)],
                 aim: [Math.round(aim.x), Math.round(aim.y)], player: [Math.round(p.x), Math.round(p.y)] };
    }, COOLER_OFFSET).catch(e => ({ ok: false, err: String(e).slice(0, 120) }));
}

// Row 5: the Activity Board again, then stand by the water cooler in the kitchen
for (let i = 0; i < 120 && await coffeeBusy(); i++) await t(1000);
report.rows[5] = { board: await read('activity_board', undefined, BOARD_FRONT) };
await page.evaluate(() => window.__test.enterRoom('kitchen')).catch(() => null);
report.rows[5].park = await parkByCooler();
report.rows[5].wait = await waitTasks(['see_chat', 'hear_rota_exchange'], 180000);
report.rows[5].ok = report.rows[5].wait.ok;
console.log('row 5', JSON.stringify(report.rows[5]));

// Row 6: the Kitchen Rota, then wait in the kitchen
report.rows[6] = { rota: await read('kitchen_rota') };
// The row 5 chat met Sanjay's social need, and the README says row 6 will not tick straight after
// it: wait a few minutes, or read the rota when his S bar turns amber. Rather than wait, set his
// social need just under its urgentAt (40) with the scenario's own needs command, as the Activity
// Board mapping does, so it falls due while Marek holds the cooler.
report.rows[6].sanjay_social = await page.evaluate(() => {
    window.npcNeedsSystem.control('sanjay', { set: { social: 35 } });
    return window.npcNeedsSystem.getState('sanjay')?.levels?.social ?? null;
});
report.rows[6].park = await parkByCooler();
report.rows[6].wait = await waitTasks(['see_outcast'], 180000);
report.rows[6].ok = report.rows[6].wait.ok;
console.log('row 6', JSON.stringify(report.rows[6]));

report.stalls = await page.evaluate(() => window.__stalls);
report.stuck = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => /^(return_stuck|walk_stuck)$/.test(e.ev)).map(e => ({ t: e.t, npc: e.npc, ev: e.ev, x: e.x, y: e.y })));
// Seating: every NPC's first time seated (needs clock, s) and the fetch and seat-move ends (the
// needs log's t is in 250 ms ticks), for the sims tidy pass's Tom check
report.first_sat = await page.evaluate(() => { const o = {}; for (const e of window.__ev) if (e.ev === 'npc_sat' && !(e.npcId in o)) o[e.npcId] = Math.round(e.c / 1000); return o; });
report.seating = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => /^(fetch_start|fetch_end|seat_move_end|seat_gave_up)$/.test(e.ev)).map(e => ({ s: Math.round(e.t / 4), npc: e.npc, ev: e.ev, reason: e.reason, stage: e.stage, phase: e.phase, x: e.x, y: e.y })));
await page.screenshot({ path: `${outDir}/tour-${gid}.png` });
fs.writeFileSync(`${outDir}/tour-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ gid, row1: report.rows[1].ok, row3: report.rows[3].ok, row3_queued: q, row3_turned_back: report.rows[3].turned_back, row3_grumbles: report.rows[3].grumbles, row5: report.rows[5].ok, row6: report.rows[6].ok, rooms: report.rooms, stuck: report.stuck, tom_sat: report.first_sat.tom ?? null, errs: errs.length }));
await page.goto('about:blank');
await browser.close();
