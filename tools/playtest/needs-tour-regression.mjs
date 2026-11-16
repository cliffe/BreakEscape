// Regression check for scenarios/test_needs_sims README tour rows 1, 3, 5 and 6, in that order on
// one game (OFFICE_LIFE_STUCK_RETURN.md): the coffee queue, the coffee switched off at the wall
// socket, a chat at the water cooler and nobody chatting with the contractor. Every lever is used
// through its own UI (the notice or board is read, the socket's confirm is clicked). Headless,
// setFPS(20) with fixed steps on.
//   node tools/playtest/needs-tour-regression.mjs <gameId> [port] [outDir]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { turnedBackOff, parksAfterOff } from './needs-tour-rows.mjs';
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
// Player path searches (sims tidy 5): each avoidNPCs search, the seated chairs at that moment, the
// path found, whether it was the rerun without seated chairs, and whether any path cell lies in a
// seated chair's box
await page.evaluate(() => {
    const pm = window.pathfindingManager; window.__psearch = []; const orig = pm.findWorldPath.bind(pm);
    pm.findWorldPath = (sx, sy, ex, ey, cb, avoidNPCs, opts) => {
        if (!avoidNPCs || window.__psearch.length >= 300) return orig(sx, sy, ex, ey, cb, avoidNPCs, opts);
        const seated = (window.chairs || []).filter(c => c?.seatedBy && c.body?.immovable).map(c => ({ by: c.seatedBy, box: [c.body.left, c.body.top, c.body.right, c.body.bottom].map(Math.round) }));
        const rec = { from: [Math.round(sx), Math.round(sy)], to: [Math.round(ex), Math.round(ey)], rerun: !!opts?.ignoreSeated, seated };
        window.__psearch.push(rec);
        return orig(sx, sy, ex, ey, p => {
            rec.len = p ? p.length : 0;
            if (p) { rec.path = p.map(q => [Math.round(q.x), Math.round(q.y)]); rec.through = seated.filter(c => p.some(q => q.x >= c.box[0] && q.x <= c.box[2] && q.y >= c.box[1] && q.y <= c.box[3])).map(c => c.by); }
            cb(p);
        }, avoidNPCs, opts);
    };
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
// DOORWAY_LOG=1 (sims tidy R6 M1): once a second of wall time, every NPC body within the kitchen
// doorway's neighbourhood (x -96..64, y 56..128) with its needs job, and at the end the needs log
if (process.env.DOORWAY_LOG === '1') await page.evaluate(() => {
    window.__door = [];
    setInterval(() => {
        try {
            if (window.__door.length >= 3000) return;
            const ns = window.npcNeedsSystem, out = [];
            for (const room of Object.values(window.rooms || {})) for (const sp of room.npcSprites || []) {
                const c = sp.body?.center; if (!c || c.x < -96 || c.x > 64 || c.y < 56 || c.y > 128) continue;
                const st = ns.getState(sp.npcId), j = st?.job;
                out.push({ npc: sp.npcId, at: [Math.round(c.x), Math.round(c.y)], v: [Math.round(sp.body.velocity.x), Math.round(sp.body.velocity.y)], held: !!sp.body.immovable, job: j ? `${j.need}:${j.targetId}:${j.phase}` : null });
            }
            const p = window.player?.body?.center;
            if (out.length) window.__door.push({ c: Math.round(ns.clockMs / 100) / 10, player: p && [Math.round(p.x), Math.round(p.y)], npcs: out });
        } catch (e) {}
    }, 1000);
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
// Row 3 (sims tidy item 1, probe on 5748): from (200,176) the straight walk up x 220 stops with the
// feet at y 134 (the sprite at y 103) against Amara, seated in her pulled-out chair at box
// 217..239 x 118..129. The path grid leaves seated NPCs and their chairs out, so the planner sees a
// clear column. Go up x 200, west of her, first: `front` may be a list of waypoints
// BOARD_ROUTE=direct (sims tidy 5): the old single front point, to show the engine's path grid fix
// (seated chairs avoided per search, 22724fa2f) does the work without the driver's waypoints.
// FRONT_CLICK=1 issues the front moves as real canvas clicks.
const BOARD_FRONT = process.env.BOARD_ROUTE === 'direct' ? [220, 76] : [[200, 104], [220, 76]];
const FRONT_CLICK = process.env.FRONT_CLICK === '1';
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
        let mv = null;
        if (front) for (const pt of (Array.isArray(front[0]) ? front : [front])) {
            mv = await page.evaluate(([x, y, click]) => window.__test.moveTo(x, y, { timeoutMs: 30000, pointer: click }), [...pt, FRONT_CLICK]).catch(e => ({ err: String(e) }));
        }
        mv = front
            ? mv
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
            // Item 1: static bodies and dynamic non-NPC bodies within 40 px of the player's box, and
            // the path grid in the player's column from y 56 to the player (1 walkable, 0 blocked)
            const pb = window.player.body, box = b => [Math.round(b.x), Math.round(b.y), Math.round(b.right), Math.round(b.bottom)];
            const close = b => b.right > pb.x - 40 && b.x < pb.right + 40 && b.bottom > pb.y - 40 && b.y < pb.bottom + 40;
            const w = window.game.scene.scenes[0]?.physics?.world || window.player.scene.physics.world;
            w.staticBodies.iterate(b => { if (close(b)) out.push({ static: b.gameObject?.objectId || b.gameObject?.name || b.gameObject?.texture?.key || '?', box: box(b) }); });
            for (const b of w.bodies.entries) {
                if (b === pb || !close(b) || b.gameObject?.npcId || (window.chairs || []).includes(b.gameObject)) continue;
                out.push({ body: b.gameObject?.objectId || b.gameObject?.texture?.key || '?', box: box(b), enable: b.enable, imm: b.immovable });
            }
            const pm = window.pathfindingManager, gb = pm?.worldGridBounds, g = pm?.worldGrid;
            if (gb && g) {
                const col = []; const cx = Math.floor((p.x - gb.minX) / gb.step);
                for (let y = 56; y <= p.y + 8; y += gb.step) { const cy = Math.floor((y - gb.minY) / gb.step); col.push(g[cy]?.[cx] === 0 ? 1 : 0); }
                out.push({ grid: { x: gb.minX + cx * gb.step, y0: 56, step: gb.step, col: col.join('') } });
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
// Sims tidy R2 m4: the needs clock and each of amara/tom/marek's caffeine and job phase at the board
// read and every 5 s of wall time until the switch-off, so a run with no queue says why
const needsSnap = () => page.evaluate(() => ({ clock: Math.round(window.npcNeedsSystem.clockMs / 1000), npcs: ['amara', 'tom', 'marek'].map(id => { const st = window.npcNeedsSystem.getState(id); return { id, caffeine: Math.round(st?.levels?.caffeine ?? -1), job: st?.job ? `${st.job.need}:${st.job.targetId}:${st.job.phase}` : null }; }) })).catch(() => null);
report.rows[3] = { board: await read('activity_board', [[200, 176], [264, 176], [232, 176]], BOARD_FRONT) };
report.rows[3].needs_at_read = await needsSnap();
report.rows[3].needs_samples = [];
let lastSnap = Date.now();
await page.evaluate(() => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 30000 })).catch(() => null);
// The README switches the socket off while Tom and Marek wait in line: wait for two in the queue
// (one after 90 s), and read the board again once if nobody has queued by then
const queued = () => page.evaluate(() => ['amara', 'tom', 'marek', 'sanjay'].filter(id => window.npcNeedsSystem.getState(id)?.job?.phase === 'queued'));
let cq = Date.now(), q = [];
while (Date.now() - cq < 150000) {
    q = await queued();
    if (q.length >= 2 || (q.length >= 1 && Date.now() - cq > 90000)) break;
    if (Date.now() - lastSnap >= 5000) { lastSnap = Date.now(); report.rows[3].needs_samples.push(await needsSnap()); }
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
// R2 m4: a turn-back is npc_turned_back with reason off; a park (npc_need_parked, say reason no_source)
// is a different thing and is listed apart, never counted
report.rows[3].turned_back = turnedBackOff(report.rows[3].after_off);
report.rows[3].parked = parksAfterOff(report.rows[3].after_off);
report.rows[3].no_queue_why = q.length ? null : { needs_at_read: report.rows[3].needs_at_read, last_sample: report.rows[3].needs_samples.at(-1) || null, parked: report.rows[3].parked };
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
// The kitchen doorway's one-body lane (the gap x -16..48 at y 84 and the kitchen's east column down
// to y 108): the passage box the head-on metric watches, widened to the gap's office end
const LANE = { x0: -70, x1: 48, y0: 64, y1: 108 };
async function parkByCooler() {
    return page.evaluate(async ({ off, lane }) => {
        const w = window.npcNeedsSystem.world, obj = w.getObject('water_cooler');
        const cell = obj ? w.approachCell(obj) : null;
        if (!cell) return { ok: false, reason: 'no_cooler' };
        const pm = window.pathfindingManager, sleep = ms => new Promise(res => setTimeout(res, ms));
        const inLane = c => c.x >= lane.x0 && c.x <= lane.x1 && c.y >= lane.y0 && c.y <= lane.y1;
        const laneNpcs = () => {
            const out = [];
            for (const room of Object.values(window.rooms || {})) for (const sp of room.npcSprites || []) {
                const c = sp.body?.center; if (c && inLane(c)) out.push(sp.npcId);
            }
            return out;
        };
        // R6 (game 6116): the scripted player walked into the lane while Tom and Grace stood in it, its
        // search (round NPC bodies) found nothing, and after one retry it stood in the lane for the
        // whole row 6 wait, so Sanjay and then Marek could not get through to the cooler. Each try
        // now waits (up to 20 s) for the lane to clear first, up to four tries, and a player still in
        // the lane at the end walks back to where it started (a real player steps out of the way).
        const waitClear = async () => { const t0 = Date.now(); while (laneNpcs().length && Date.now() - t0 < 20000) await sleep(250); return Math.round((Date.now() - t0) / 1000); };
        const aim = pm?.findNearestWalkableWorldCell?.(cell.x + off.x, cell.y + off.y, 3) || { x: cell.x + off.x, y: cell.y + off.y };
        // Fallback aims: the first walkable cell a tile west, north, south or east of the aim
        const goals = [aim];
        for (const [dx, dy] of [[-32, 0], [0, -32], [0, 32], [32, 0]]) {
            const c = pm?.findNearestWalkableWorldCell?.(aim.x + dx, aim.y + dy, 1);
            if (c && Math.hypot(c.x - aim.x, c.y - aim.y) >= 16) goals.push(c);
        }
        const start = { x: window.player.body.center.x, y: window.player.body.center.y };
        const tries = [];
        let p = start, goal = aim;
        for (let i = 0; i < 4; i++) {
            goal = goals[Math.min(i, goals.length - 1)];
            const waited = await waitClear();
            await window.__test.moveTo(goal.x, goal.y, { timeoutMs: 20000, pointer: false }).catch(e => ({ err: String(e) }));
            p = window.player.body.center;
            tries.push({ goal: [Math.round(goal.x), Math.round(goal.y)], waited, at: [Math.round(p.x), Math.round(p.y)] });
            if (Math.hypot(p.x - goal.x, p.y - goal.y) < 24) break;
            await sleep(3000);
        }
        const dist = Math.round(Math.hypot(p.x - goal.x, p.y - goal.y));
        let left_lane = null;
        if (dist >= 24 && inLane(p) && !inLane(start)) {
            await window.__test.moveTo(start.x, start.y, { timeoutMs: 20000, pointer: false }).catch(() => null);
            const q = window.player.body.center;
            left_lane = [Math.round(q.x), Math.round(q.y)];
            p = q;
        }
        return { retried: tries.length > 1, tries, ok: dist < 24, dist, cooler: [Math.round(cell.x), Math.round(cell.y)],
                 aim: [Math.round(aim.x), Math.round(aim.y)], left_lane, player: [Math.round(p.x), Math.round(p.y)] };
    }, { off: COOLER_OFFSET, lane: LANE }).catch(e => ({ ok: false, err: String(e).slice(0, 120) }));
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
// Sims tidy R1 (m1 and M1): every door sprite's doorProperties (the kitchen doorway has one sprite
// per room, so two worldX values), the gaps the doorway sweep works from after the merge, and the
// sweep's log lines so far (chair_out_of_doorway with its target and candidate index, and
// chair_in_doorway_no_spot)
report.rows[6].doors = await page.evaluate(async () => {
    const doors = [];
    for (const [rid, room] of Object.entries(window.rooms || {})) for (const d of room?.doorSprites || []) {
        const p = d?.doorProperties; if (!p) continue;
        doors.push({ room: rid, roomId: p.roomId, connectedRoom: p.connectedRoom, direction: p.direction, worldX: p.worldX, worldY: p.worldY, open: p.open ?? p.isOpen ?? null });
    }
    let gaps = null;
    try { const m = await import('/break_escape/js/systems/seating.js'); gaps = m.doorGapRects(doors); } catch (e) { gaps = String(e).slice(0, 120); }
    const lines = window.npcNeedsSystem.getLog().filter(e => e.ev === 'chair_out_of_doorway' || e.ev === 'chair_in_doorway_no_spot');
    return { doors, gaps, lines };
}).catch(e => ({ err: String(e) }));
// Sims tidy 5 (5793: every rota try stopped at x 41, the doorway's office end): the grid round the
// kitchen doorway (# blocked, . open), the seated chairs and the NPC bodies within 96 px of it
if (!report.rows[6].rota.ok) report.rows[6].doorway = await page.evaluate(() => {
    const pm = window.pathfindingManager, gb = pm.worldGridBounds, g = pm.worldGrid, rows = [];
    for (let y = 56; y <= 112; y += gb.step) { let line = ''; for (let x = -64; x <= 80; x += gb.step) line += g[Math.floor((y - gb.minY) / gb.step)]?.[Math.floor((x - gb.minX) / gb.step)] === 0 ? '.' : '#'; rows.push(`${y} ${line}`); }
    const box = b => [b.left, b.top, b.right, b.bottom].map(Math.round), npcs = [];
    for (const room of Object.values(window.rooms || {})) for (const sp of room.npcSprites || []) { const c = sp.body?.center; if (c && Math.hypot(c.x, c.y - 80) < 96) npcs.push({ npc: sp.npcId, box: box(sp.body), held: !!sp.body.immovable }); }
    const seated = (window.chairs || []).filter(c => c?.seatedBy).map(c => ({ by: c.seatedBy, chair: c.objectId, box: box(c.body), imm: !!c.body?.immovable }));
    return { x0: -64, step: gb.step, rows, npcs, seated, player: [Math.round(window.player.x), Math.round(window.player.y)] };
}).catch(e => ({ err: String(e) }));
// R6 (games 6116, 6117): the driver used to set Sanjay's social need to 35 here, before Marek had
// left his desk. Grace was drinking at the cooler, so Marek (who avoids everyone) waited; Sanjay
// went to chat with her, his npc_use_started armed Rosa's coupled cooler break, hers re-armed his,
// and the two held the cooler for most of the 180 s wait. The scenario already sets Sanjay's social
// need due when Marek leaves for the cooler (Sanjay's npc_left_post:marek mapping), which is the
// moment the row is about, so the driver no longer touches it and only records the level.
report.rows[6].sanjay_social = await page.evaluate(() => window.npcNeedsSystem.getState('sanjay')?.levels?.social ?? null);
report.rows[6].park = await parkByCooler();
report.rows[6].wait = await waitTasks(['see_outcast'], 180000);
report.rows[6].ok = report.rows[6].wait.ok;
console.log('row 6', JSON.stringify(report.rows[6]));

report.stalls = await page.evaluate(() => window.__stalls);
report.player_searches = await page.evaluate(() => window.__psearch);
report.doorway_sweeps = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => e.ev === 'chair_out_of_doorway' || e.ev === 'chair_in_doorway_no_spot'));
// Sims tidy R1 m4: how many direct player walks stalled and replanned through the grid
report.player_walk_replans = await page.evaluate(() => window.__playerWalkReplans || 0);
// Marek (sims tidy item 2): his chair, seat and facing, and a shot centred on him
report.marek = await page.evaluate(() => {
    const b = window.npcBehaviorManager?.getBehavior?.('marek'), sp = b?.sprite, st = b?._seat;
    return { feet: sp?.body ? [Math.round(sp.body.center.x), Math.round(sp.body.bottom)] : null, seated: !!st,
        chair: st?.chair?.objectId || null, facing: st?.facing || null, homeFacing: st?.homeFacing || null, direction: b?.direction || null,
        fetches: window.npcNeedsSystem.getLog().filter(e => e.npc === 'marek' && /^(fetch_start|fetch_end|seat_move_end|seat_gave_up)$/.test(e.ev)) };
});
fs.writeFileSync(`${outDir}/tour-${gid}.json`, JSON.stringify(report, null, 1));
await page.evaluate(() => { const sp = window.npcBehaviorManager?.getBehavior?.('marek')?.sprite, cam = window.player?.scene?.cameras?.main; if (sp && cam) { cam.stopFollow(); cam.centerOn(sp.x, sp.y); } }).catch(() => null);
await t(500);
await page.screenshot({ path: `${outDir}/marek-${gid}.png` });
await page.evaluate(() => { const cam = window.player?.scene?.cameras?.main; if (cam) cam.startFollow(window.player); }).catch(() => null);
report.stuck = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => /^(return_stuck|walk_stuck)$/.test(e.ev)).map(e => ({ t: e.t, npc: e.npc, ev: e.ev, x: e.x, y: e.y })));
// Seating: every NPC's first time seated (needs clock, s) and the fetch and seat-move ends (the
// needs log's t is in 250 ms ticks), for the sims tidy pass's Tom check
report.first_sat = await page.evaluate(() => { const o = {}; for (const e of window.__ev) if (e.ev === 'npc_sat' && !(e.npcId in o)) o[e.npcId] = Math.round(e.c / 1000); return o; });
report.seating = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => /^(fetch_start|fetch_end|seat_move_end|seat_gave_up)$/.test(e.ev)).map(e => ({ s: Math.round(e.t / 4), npc: e.npc, ev: e.ev, reason: e.reason, stage: e.stage, phase: e.phase, x: e.x, y: e.y })));
await page.screenshot({ path: `${outDir}/tour-${gid}.png` });
if (process.env.DOORWAY_LOG === '1') {
    report.doorway_samples = await page.evaluate(() => window.__door || []);
    report.needs_log = await page.evaluate(() => window.npcNeedsSystem.getLog());
}
fs.writeFileSync(`${outDir}/tour-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ gid, row1: report.rows[1].ok, row3: report.rows[3].ok, row3_queued: q, row3_turned_back: report.rows[3].turned_back, row3_grumbles: report.rows[3].grumbles, row5: report.rows[5].ok, row6: report.rows[6].ok, rooms: report.rooms, stuck: report.stuck, tom_sat: report.first_sat.tom ?? null, marek: { chair: report.marek.chair, facing: report.marek.facing }, sweeps: report.doorway_sweeps.length, replans: report.player_walk_replans, row6_doors: (report.rows[6].doors?.doors || []).map(d => `${d.room}:${d.direction}@${d.worldX},${d.worldY}`), seated_through: report.player_searches.filter(r => r.through?.length).length, reruns: report.player_searches.filter(r => r.rerun).length, errs: errs.length }));
await page.goto('about:blank');
await browser.close();
