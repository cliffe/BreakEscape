// SIMS-1 live proof (OFFICE_LIFE_SIMS_BUILD_PLAN 5.1): drive scenarios/test_needs_attack
// beat by beat through the test bridge, attacking and knocking out needs NPCs and checking
// what the needs system and the server do, including across a reload.
//
//   node tools/playtest/needs-attack-probe.mjs <gameId> [port] [beat] [outDir]
//
// Games are made with tools/playtest/swap-scenario-game.rb (host test_needs_sims), not
// new-game.rb, because this folder has no Mission row. Each KO/reload beat is cleanest in its
// own fresh game, because a KO is saved to the server.
//
// beat: one of a b c d e f g h h2 i i2, or "all" (default). "all" runs only the
// non-destructive beats (e, d, i) in one game and warns that the KO/reload beats
// (a b c f g h h2 i2) each want a fresh game id.
//
// Movement and needs are driven only through window.__test (never a teleport). Beat (a)
// attacks Ava through the real player-combat punch path (window.playerCombat.attack), which
// converts her to hostile and emits npc_attacked:ava, exactly as a player's punch does; the
// calm-down afterwards is forced through npcHostileSystem because this scenario has no in-play
// calm route (no influence threshold, no ink hostile tag) — only the needs side (unblocked ->
// _goHome) is under test there. After popups, if the frame rate is low, Phaser's rAF is
// switched to setTimeout mode and physics throttled with fixed steps left ON.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';

const [gid, port = '3093', beat = 'all',
    outDir = '/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/officelife-sims/s1-fix-r1/'] = process.argv.slice(2);
if (!gid) { console.error('usage: needs-attack-probe.mjs <gameId> [port] [beat] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const clog = []; page.on('console', m => { const x = m.text(); if (/conversation_closed:eli|Not scheduling|fires in|eli_page|object_revealed/.test(x)) clog.push([Date.now(), x.slice(0, 160)]); });
const report = { gid, port, beat, beats: {}, errs };

async function load() {
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
    await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body, null, { timeout: 90000 });
    await page.waitForTimeout(2000);
    for (let i = 0; i < 6; i++) {
        const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
        if (!busy) break;
        await page.keyboard.press('Enter'); await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.waitForTimeout(400);
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    }
    await page.evaluate(() => {
        const loop = window.game.sys.game.loop, raf = loop.raf;
        if (!raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); }
        loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20);
    });
}
const t = ms => page.waitForTimeout(ms);
const shot = n => page.screenshot({ path: outDir + `${beat}-${n}-${gid}.png` });

// One client snapshot: needs modes/levels, the tail of the decision log, KO globals, revealed
// slots, and the completed and in-flight (completing) task lists.
const snap = () => page.evaluate(() => {
    const T = window.__test;
    const ids = T.needs.ids();
    const gv = (window.gameState && window.gameState.globalVariables) || {};
    const asList = x => Array.isArray(x) ? x : Object.values(x || {});
    const revealed = [];
    for (const [rid, room] of Object.entries(window.rooms || {})) {
        for (const o of asList(room && room.objects)) {
            if (o && o.id && o.revealOnGlobal && gv[o.revealOnGlobal]) revealed.push(`${rid}:${o.id}`);
        }
    }
    const tix = (window.objectivesManager && Object.values(window.objectivesManager.taskIndex || {})) || [];
    return {
        clock: window.npcNeedsSystem && window.npcNeedsSystem.clockMs,
        fps: window.game.sys.game.loop.actualFps,
        states: ids.map(id => { const s = T.needs.state(id) || {}; return { id, mode: s.mode, blocked: s.blocked, job: s.job && (s.job.need || s.job.kind) + ':' + (s.job.targetId || '') }; }),
        hostility: ids.reduce((m, id) => { m[id] = !!(window.npcHostileSystem && window.npcHostileSystem.isNPCHostile && window.npcHostileSystem.isNPCHostile(id)); return m; }, {}),
        ko: ids.reduce((m, id) => { m[id] = !!(window.npcHostileSystem && window.npcHostileSystem.isNPCKO && window.npcHostileSystem.isNPCKO(id)); return m; }, {}),
        globals: { ava_ko: gv.ava_ko, ben_ko: gv.ben_ko, eli_ko: gv.eli_ko, fran_ko: gv.fran_ko, gil_ko: gv.gil_ko, eli_asked: gv.eli_asked, eli_page_shown: gv.eli_page_shown },
        revealed,
        log: T.needs.log().slice(-24).map(e => `${e.t} ${e.npc} ${e.ev} ${e.target || e.objectId || ''}`.trim()),
        tasks: tix.filter(x => x.status === 'completed').map(x => x.taskId || x.id),
        tasksCompleting: tix.filter(x => x.status === 'completing').map(x => x.taskId || x.id)
    };
});

// What dropped on the floor of a room (world objects added since creation show in window.rooms).
const roomItems = (roomId) => page.evaluate(r => {
    const room = (window.rooms || {})[r];
    if (!room) return [];
    const list = Array.isArray(room.objects) ? room.objects : Object.values(room.objects || {});
    return list.filter(o => o && o.takeable).map(o => o.id);
}, roomId);

async function recordBeat(name, fn) {
    try { report.beats[name] = await fn(); }
    catch (e) { report.beats[name] = { error: String(e).slice(0, 300) }; }
}

// One NPC's needs state, its current room and position (npcPos), and its sprite velocity, for
// the mid-job polling below. vel lets a beat pick the moment the NPC is actually walking.
const njob = (id) => page.evaluate(i => {
    const s = window.__test.needs.state(i);
    const p = window.npcNeedsSystem && window.npcNeedsSystem.world.npcPos(i);
    const sp = window.npcManager && window.npcManager.getNPC && window.npcManager.getNPC(i) && window.npcManager.getNPC(i)._sprite;
    const vel = sp && sp.body ? { vx: Math.round(sp.body.velocity.x), vy: Math.round(sp.body.velocity.y) } : null;
    const speed = vel ? Math.round(Math.hypot(vel.vx, vel.vy)) : 0;
    if (!s) return { reg: false, room: p && p.roomId, pos: p && { x: Math.round(p.x), y: Math.round(p.y) }, vel, speed };
    return { reg: true, mode: s.mode, atPost: s.atPost, scriptSuspended: s.scriptSuspended,
        job: s.job ? { kind: s.job.kind, phase: s.job.phase, targetId: s.job.targetId, carrying: s.job.carrying } : null,
        room: p && p.roomId, pos: p && { x: Math.round(p.x), y: Math.round(p.y) }, vel, speed, parked: (s.parked || []).map(x => x.reason) };
}, id);

// Poll fn() every stepMs until it returns truthy, or timeoutMs elapses (returns the value or null).
async function waitUntil(fn, timeoutMs = 40000, stepMs = 500) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) { const v = await fn(); if (v) return v; await t(stepMs); }
    return null;
}

// Walk the player into the kitchen so its objects (the cooler, the tray, the kettle) load and
// the kitchen NPCs register; both rooms then stay loaded, so an office NPC can route to a kitchen
// source. A cross-room need parks as `no_source` until the source room is loaded. Throws if the
// walk fails: a beat that needs the kitchen must not run on a half-loaded floor (design m5).
async function loadKitchen() {
    const a = await page.evaluate(() => window.__test.enterRoom('kitchen', { timeoutMs: 25000 })).catch(e => ({ ok: false, err: String(e).slice(0, 80) }));
    await t(1200);
    const rooms = await page.evaluate(() => Object.keys(window.rooms || {}));
    if (!(a && a.ok)) throw new Error(`loadKitchen failed: ${JSON.stringify(a)} rooms=${rooms}`);
    return { kitchen_ok: true, rooms };
}

// Read a wall note through the real interaction path (moveToNear + interact), then fully close the
// readable popup it opens (Escape + dismissBlockingUi) so the next interaction is not blocked.
async function readNoteObject(id) {
    await page.evaluate(i => window.__test.moveToNear(i, { timeoutMs: 20000 }), id).catch(() => {});
    const r = await page.evaluate(i => window.__test.interact(i), id);
    await t(900);
    for (let i = 0; i < 3; i++) {
        const busy = await page.evaluate(() => { try { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); } catch (e) { return false; } });
        if (!busy) break;
        await page.keyboard.press('Escape'); await t(400);
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
        await t(300);
    }
    return r;
}

// Real conversation with Eli through the person-chat UI: approach (moveToNear), interact to open
// the chat, pick the handover choice (#set_global eli_asked), then the exit choice
// (#exit_conversation, which emits conversation_closed:eli). The chat only truly closes a moment
// after the exit choice; this returns only once MinigameFramework.currentMinigame is null AND the
// conversation_closed:eli emit has been seen (design M6), with the measured close time.
async function eliConversation() {
    const room = await page.evaluate(() => window.currentPlayerRoom);
    if (room && room !== 'office') { await page.evaluate(() => window.__test.enterRoom('office')).catch(() => {}); await t(1200); }
    let path = 'real';
    const clogBase = clog.length;
    await page.evaluate(() => window.__test.moveToNear('eli', { timeoutMs: 20000 })).catch(() => {});
    await t(600);
    const opened = await page.evaluate(() => window.__test.interact('eli'));
    await t(1600);
    const chatUp = await page.evaluate(() => { try { return !!window.__test.minigame.getState(); } catch (e) { return false; } });
    let chA = null, chB = null;
    if (opened && opened.ok && chatUp) {
        for (let i = 0; i < 8 && !(chA && chA.ok); i++) {
            chA = await page.evaluate(() => window.__test.minigame.choose('handover'));
            if (chA && chA.ok) break;
            await page.keyboard.press('Space'); await t(500);
        }
        await t(1000);
        for (let i = 0; i < 8 && !(chB && chB.ok); i++) {
            chB = await page.evaluate(() => window.__test.minigame.choose('leave you be'));
            if (chB && chB.ok) break;
            await page.keyboard.press('Space'); await t(500);
        }
        await t(600);
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    } else {
        path = 'armed-fallback';
        await page.evaluate(() => window.gameState.globalVariables && (window.gameState.globalVariables.eli_asked = true));
        await page.evaluate(() => window.eventDispatcher && window.eventDispatcher.emit('conversation_closed:eli', { npcId: 'eli' }));
    }
    // Wait for the chat to really close and the close event to fire before returning.
    const closedByUi = await waitUntil(async () => (await page.evaluate(() => !window.MinigameFramework?.currentMinigame)) ? true : null, 10000, 300);
    const closedEmit = await waitUntil(async () => clog.slice(clogBase).find(c => /conversation_closed:eli/.test(c[1])) || null, 6000, 300);
    const closedAt = Date.now();
    return { path, interact_ok: opened && opened.ok, chat_up: chatUp, choose_handover: chA && chA.ok, choose_exit: chB && chB.ok,
        chat_closed_before_return: !!closedByUi, close_emit_seen: !!closedEmit, closedAt };
}

await load();
await snap().then(s => { report.start = s; });
await shot('00-start');

// (e) Cal: hostile from start in the back room, never starts a job, logs blocked once.
if (beat === 'all' || beat === 'e') await recordBeat('e_hostile_from_start', async () => {
    await page.evaluate(() => window.__test.enterRoom('back_room')).catch(() => {});
    await t(8000);
    const before = await snap();
    const calLog = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'cal'));
    return {
        cal_hostile: before.hostility.cal, cal_blocked_count: calLog.filter(e => e.ev === 'blocked').length,
        cal_job_starts: calLog.filter(e => e.ev === 'job_start').length, cal_mode: (before.states.find(s => s.id === 'cal') || {}).mode
    };
});

// (i) Eli: ask for the handover, close, page lands ~6s later; check_eli_page ticks. Then reload
// AFTER the page has landed (design m4, server M1): the tray is filed, eli_page_shown persists,
// and a second real conversation + close prints no second page (the mapping is onceOnly and saved
// server-side). The server-side triggeredEvents key is dumped separately by the rails runner.
if (beat === 'all' || beat === 'i') await recordBeat('i_eli_print', async () => {
    const conv = await eliConversation();
    const closed = await snap();
    await t(10000);
    const ticked = await waitUntil(async () => (await snap()).tasks.includes('check_eli_page'), 10000, 1000);
    const printed = await snap();
    await shot('i-eli-page');
    // Reload after the page landed: the revealed slot is re-filed and nothing re-prints.
    await t(2000);
    await load();
    await t(3000);
    const reloaded = await snap();
    await shot('i-reloaded');
    const conv2 = await eliConversation();
    await t(10000);
    const second = await snap();
    await shot('i-second');
    return { ...conv, eli_asked_after_close: closed.globals.eli_asked, eli_page_shown: printed.globals.eli_page_shown,
        revealed_printed: printed.revealed, check_eli_page: printed.tasks.includes('check_eli_page'), check_eli_page_polled: !!ticked,
        reload_eli_page_shown: reloaded.globals.eli_page_shown, reload_revealed: reloaded.revealed,
        second_conv_path: conv2.path, second_eli_page_shown: second.globals.eli_page_shown, second_revealed: second.revealed,
        second_print_log: second.log.filter(l => /eli|copier|print/.test(l)) };
});

// (d) Ben recalled by the Meeting Note (real reads). He must be AT or walking to the kitchen
// cooler when the note is read (design M5), so the recall is a real cross-room patrolOverride, not
// a step off his own desk. Wait for him in the kitchen (ideally using the cooler), read the note,
// then assert he walks back to his office post tile (4,7) and is scriptSuspended there.
if (beat === 'all' || beat === 'd') await recordBeat('d_ben_recalled', async () => {
    await loadKitchen();
    await page.evaluate(() => window.__test.needs.set('ben', 'thirst', 10));
    const atCooler = await waitUntil(async () => {
        const s = await njob('ben');
        return (s.room === 'kitchen' && s.job && s.job.targetId === 'water_cooler' && (s.job.phase === 'using' || s.job.phase === 'goto_target')) ? s : null;
    }, 30000);
    if (!atCooler) throw new Error('ben never reached the kitchen cooler');
    const benAtCooler = atCooler;
    const readNote = await readNoteObject('meeting_note');
    const recalled = await snap();
    // The patrol override must walk him across rooms back to his office post tile (4,7).
    const home = await waitUntil(async () => {
        const s = await njob('ben');
        return (s.room === 'office' && s.pos && Math.abs(s.pos.x / 32 - 4) < 1.2 && Math.abs(s.pos.y / 32 - 7) < 1.2 && s.scriptSuspended) ? s : null;
    }, 20000);
    const benAfterNote = home || await njob('ben');
    await shot('d-recalled');
    const readOver = await readNoteObject('meeting_over');
    await t(2500);
    const benAfterOver = await njob('ben');
    await shot('d-resumed');
    return {
        read_note_ok: readNote && readNote.ok, read_over_ok: readOver && readOver.ok,
        ben_at_cooler_room: benAtCooler.room, ben_at_cooler_phase: benAtCooler.job && benAtCooler.job.phase,
        check_called_home: recalled.tasks.includes('check_called_home'), check_called_home_completing: recalled.tasksCompleting.includes('check_called_home'),
        ben_walked_home: !!home, ben_home_pos: benAfterNote.pos, ben_home_room: benAfterNote.room,
        ben_suspended_at_home: benAfterNote.scriptSuspended, ben_resumed_after_over: benAfterOver.scriptSuspended
    };
});

// (a) Ava attacked mid-carry in the kitchen through the real punch path: she turns hostile
// (npc_attacked:ava, damage), the needs system blocks her, the carry aborts and drops the mugs.
// The calm-down is forced through npcHostileSystem (no in-play calm route in this scenario); the
// needs side (unblocked -> resume/_goHome) is what is under test. With the mugs off Ben's row the
// carry is deterministic, so this fails rather than silently flipping her where she stands.
if (beat === 'a') await recordBeat('a_ava_attacked', async () => {
    await loadKitchen();
    const atCarry = await waitUntil(async () => {
        const s = await njob('ava');
        return (s.job && s.job.kind === 'carry' && s.job.carrying && s.room === 'kitchen') ? s : null;
    }, 60000);
    if (!atCarry) throw new Error('ava never carried the mugs into the kitchen');
    // Real punch: approach, then attack facing Ava. One jab converts her to hostile.
    await page.evaluate(() => window.__test.moveToNear('ava', { timeoutMs: 15000 })).catch(() => {});
    await t(500);
    let punched = false;
    for (let i = 0; i < 10; i++) {
        punched = await page.evaluate(() => {
            const p = window.npcManager && window.npcManager.getNPC && window.npcManager.getNPC('ava');
            const sp = p && p._sprite;
            if (!sp || !window.playerCombat) return false;
            window.playerCombat.attack({ x: sp.x, y: sp.y });
            return true;
        });
        await t(500);
        const h = await page.evaluate(() => !!(window.npcHostileSystem && window.npcHostileSystem.isNPCHostile('ava')));
        if (h) break;
        await page.evaluate(() => window.__test.moveToNear('ava', { timeoutMs: 8000 })).catch(() => {});
    }
    const attackedEvt = await page.evaluate(() => window.__test.needs.log().some(e => e.npc === 'ava' && /attack/i.test(e.ev)));
    await t(1200);
    const hostile = await snap(); await shot('a-hostile');
    // No in-play calm route (reviewed): force calm through the hostile system so the needs side
    // (unblocked -> resume) can be observed.
    await page.evaluate(() => window.npcHostileSystem && window.npcHostileSystem.setNPCHostile('ava', false));
    await t(9000);
    const calm = await snap(); await shot('a-after');
    const avaLog = calm.log.filter(l => l.includes('ava'));
    return {
        carrying_at_attack: !!atCarry, carry_room_at_attack: atCarry && atCarry.room,
        punch_path: punched, hostile_mid: hostile.hostility.ava, npc_attacked_logged: attackedEvt,
        calm_via: 'npcHostileSystem.setNPCHostile(false) — no in-play calm route in this scenario',
        aborted: avaLog.some(l => l.includes('job_aborted')),
        blocked: avaLog.some(l => / blocked/.test(l)),
        unblocked: avaLog.some(l => l.includes('unblocked')),
        ava_hostile_after: calm.hostility.ava,
        ava_mode_after: (calm.states.find(s => s.id === 'ava') || {}).mode, ava_log: avaLog
    };
});

// (b) Ava knocked out mid-carry in the kitchen: ava_ko + check_ko_drop fire once; the folder drops
//     where she fell (the kitchen), the carried mugs are refused by the server's KO drop gate.
//     After the reload (M1, M2): the mugs come BACK on the office floor (authored object rebuilt,
//     no objects_removed recorded for a needs carry), and Ava's body is at her office spawn while
//     the folder stays in the kitchen (server saves isKO/currentHP, no position). Both are recorded
//     engine faults; the probe measures them rather than asserting the old "mugs gone" claim.
if (beat === 'b') await recordBeat('b_ava_ko', async () => {
    await loadKitchen();
    const atCarry = await waitUntil(async () => {
        const s = await njob('ava');
        return (s.job && s.job.kind === 'carry' && s.job.carrying && s.room === 'kitchen') ? s : null;
    }, 60000);
    if (!atCarry) throw new Error('ava never carried the mugs into the kitchen');
    const r = await page.evaluate(() => window.__test.debugKO('ava'));
    await t(2000);
    const down = await snap(); await shot('b-down');
    const officeBefore = await roomItems('office'); const kitchenBefore = await roomItems('kitchen');
    await load();
    await t(1500);
    const after = await snap(); await shot('b-reload');
    const officeAfter = await roomItems('office'); const kitchenAfter = await roomItems('kitchen');
    const avaAfter = await njob('ava');
    return { ko_room: atCarry.room, carrying_at_ko: !!atCarry, ko_ok: r.ok, ava_ko: after.globals.ava_ko,
        check_ko_drop: down.tasks.includes('check_ko_drop'), still_ko_after_reload: after.ko.ava,
        office_takeables_before: officeBefore, kitchen_takeables_before: kitchenBefore,
        office_takeables_after_reload: officeAfter, kitchen_takeables_after_reload: kitchenAfter,
        ava_body_room_after_reload: avaAfter.room, ava_body_pos_after_reload: avaAfter.pos };
});

// (c) Ben knocked out at the kitchen cooler: notebook drops; survives reload. Wait for phase
//     'using' at the cooler and fail on timeout (design m3), so the KO really lands at the cooler.
//     After the reload the body is at his office spawn while the notebook stays in the kitchen (M2).
if (beat === 'c') await recordBeat('c_ben_ko', async () => {
    await loadKitchen();
    await page.evaluate(() => window.__test.needs.set('ben', 'thirst', 10));
    const atCooler = await waitUntil(async () => {
        const s = await njob('ben');
        return (s.room === 'kitchen' && s.job && s.job.targetId === 'water_cooler' && s.job.phase === 'using') ? s : null;
    }, 35000);
    if (!atCooler) throw new Error('ben never reached phase=using at the kitchen cooler');
    const r = await page.evaluate(() => window.__test.debugKO('ben'));
    await t(2000);
    const down = await snap(); await shot('c-down');
    const kitchenBefore = await roomItems('kitchen');
    await load();
    await t(1500);
    const after = await snap(); await shot('c-reload');
    const kitchenAfter = await roomItems('kitchen');
    const benAfter = await njob('ben');
    return { ben_room_when_ko: atCooler.room, ben_phase_when_ko: atCooler.job.phase, ko_ok: r.ok, ben_ko: after.globals.ben_ko,
        check_held_drop: down.tasks.includes('check_held_drop'), still_ko_after_reload: after.ko.ben,
        kitchen_takeables_before: kitchenBefore, kitchen_takeables_after_reload: kitchenAfter,
        ben_body_room_after_reload: benAfter.room, ben_body_pos_after_reload: benAfter.pos };
});

// (g) Fran knocked out mid-walk to the cooler; Gil's next break goes alone. Assert Gil enters
//     `using` at the kettle within his walk time, that no `paired`/coupling line forms, and that
//     Fran's state stays `blocked` (design m1). check_solo_break ticks on npc_left_post:gil.
if (beat === 'g') await recordBeat('g_fran_ko_gil_solo', async () => {
    await loadKitchen();
    await page.evaluate(() => window.__test.needs.set('fran', 'thirst', 10));
    const franWalking = await waitUntil(async () => { const s = await njob('fran'); return (s.reg && s.atPost === false && s.job) ? s : null; }, 20000);
    const r = await page.evaluate(() => window.__test.debugKO('fran'));
    await t(1500);
    await page.evaluate(() => window.__test.needs.set('gil', 'caffeine', 10));
    const gilUsing = await waitUntil(async () => { const s = await njob('gil'); return (s.job && s.job.phase === 'using' && s.job.targetId === 'kitchen_kettle') ? s : null; }, 20000);
    const after = await snap(); await shot('g-gil-alone');
    const gil = gilUsing || await njob('gil');
    const franState = await njob('fran');
    const gilLog = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'gil').map(e => e.ev));
    await load();
    const reloaded = await snap();
    return { fran_walking_before_ko: !!franWalking, ko_ok: r.ok, fran_ko: after.globals.fran_ko,
        check_solo_break: after.tasks.includes('check_solo_break'),
        gil_using_at_kettle: !!gilUsing, gil_phase: gil.job && gil.job.phase, gil_target: gil.job && gil.job.targetId,
        no_paired_line: !gilLog.some(ev => /pair/i.test(ev)), fran_state_blocked: franState.blocked === true || franState.mode === 'idle',
        fran_still_ko_after_reload: reloaded.ko.fran };
});

// (h) Eli knocked out before any conversation: no page is ever revealed, reload reveals nothing.
if (beat === 'h') await recordBeat('h_eli_ko_no_page', async () => {
    const r = await page.evaluate(() => window.__test.debugKO('eli'));
    await t(3000);
    const down = await snap(); await shot('h-down');
    await load();
    const after = await snap(); await shot('h-reload');
    return { ko_ok: r.ok, eli_ko: after.globals.eli_ko, eli_page_shown: after.globals.eli_page_shown, revealed_after_reload: after.revealed, check_eli_page_fired: after.tasks.includes('check_eli_page') };
});

// (h2) Eli KO'd INSIDE the 6 s print delay after a real close: the mapping re-checks
//      eli_ko !== true when the delay ends, so no page lands, nothing ticks, and a reload keeps it
//      empty server-side (design m2). The real close is awaited first (eliConversation), then the
//      KO is landed within the delay.
if (beat === 'h2') await recordBeat('h2_eli_ko_in_delay', async () => {
    const conv = await eliConversation();
    const armed = await snap();
    let r = null; const tries = [];
    for (let k = 0; k < 12; k++) {
        r = await page.evaluate(() => window.__test.debugKO('eli'));
        tries.push(r && (r.ok ? 'ok' : (r.reason || r.error || JSON.stringify(r).slice(0, 60))));
        if (r && r.ok) break;
        await page.keyboard.press('Escape');
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
        await t(250);
    }
    const koAfterCloseMs = Date.now() - conv.closedAt;
    await t(10000);
    const afterDelay = await snap(); await shot('h2-after-delay');
    await load();
    await t(1500);
    const reloaded = await snap(); await shot('h2-reload');
    return { ...conv, ko_ok: r && r.ok, ko_tries: tries, ko_after_close_ms: koAfterCloseMs, eli_asked: armed.globals.eli_asked,
        eli_ko: afterDelay.globals.eli_ko, eli_page_shown_after_delay: afterDelay.globals.eli_page_shown, revealed_after_delay: afterDelay.revealed,
        check_eli_page: afterDelay.tasks.includes('check_eli_page'),
        reload_eli_page_shown: reloaded.globals.eli_page_shown, reload_revealed: reloaded.revealed };
});

// (f) Dee sees the player pick dee_drawer while she is WALKING to the coffee: the catch opens her
//     conversation and check_caught_walking ticks. A real Lock Pick Set is picked up from the
//     office floor (design m6), her caffeine is set low so she leaves her post, and the pick is
//     made only once she is in phase goto_target with real velocity (design M4). Then the catch's
//     onceOnly key is proved to persist: after the conversation closes and a reload, picking the
//     drawer again does not reopen the catch (server m2). Her tail (freeze, then resume) is checked.
if (beat === 'f') await recordBeat('f_dee_catch', async () => {
    const pickup = await page.evaluate(async () => {
        await window.__test.moveToNear('office_lockpick', { timeoutMs: 15000 }).catch(() => {});
        return window.__test.interact('office_lockpick');
    });
    const hasPick = await page.evaluate(() => (window.inventory && window.inventory.items || []).some(it => it && it.scenarioData && it.scenarioData.type === 'lockpick'));
    await page.evaluate(() => window.__test.needs.set('dee', 'caffeine', 10));
    // Position the player at the drawer with the lock UI ready, then wait for Dee to be walking.
    await page.evaluate(() => window.__test.moveToNear('dee_drawer', { timeoutMs: 15000 })).catch(() => {});
    const walking = await waitUntil(async () => {
        const s = await njob('dee');
        return (s.reg && s.atPost === false && s.job && s.job.phase === 'goto_target' && s.speed > 5) ? s : null;
    }, 20000);
    if (!walking) throw new Error('dee never walked to the coffee (no goto_target with velocity)');
    const open = await page.evaluate(() => window.__test.interact('dee_drawer'));
    await t(2000);
    await shot('f-caught');
    const after = await snap();
    const caught = after.tasks.includes('check_caught_walking') || after.tasksCompleting.includes('check_caught_walking');
    // Close the catch conversation, let Dee resume, and check she returns to her post.
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Escape'); await t(400); await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {}); await t(300); }
    const resumed = await waitUntil(async () => { const s = await njob('dee'); return (s.reg && (s.job || s.mode === 'idle')) ? s : null; }, 15000);
    // onceOnly persistence: reload, then pick the drawer again — no second catch.
    await load();
    await t(1500);
    const reHasPick = await page.evaluate(() => (window.inventory && window.inventory.items || []).some(it => it && it.scenarioData && it.scenarioData.type === 'lockpick'));
    await page.evaluate(() => window.__test.needs.set('dee', 'caffeine', 10));
    await page.evaluate(() => window.__test.moveToNear('dee_drawer', { timeoutMs: 12000 })).catch(() => {});
    const open2 = await page.evaluate(() => window.__test.interact('dee_drawer'));
    await t(2000);
    const mg2 = await page.evaluate(() => { try { return window.__test.minigame.getState(); } catch (e) { return null; } });
    const reopened = !!(mg2 && /person|chat|dialog/i.test(JSON.stringify(mg2.id || mg2.type || '')));
    await shot('f-after-reload');
    return {
        lockpick_picked_up: pickup && pickup.ok, has_lockpick: hasPick,
        dee_phase_at_pick: walking.job.phase, dee_speed_at_pick: walking.speed, dee_room_at_pick: walking.room,
        interact_ok: open && open.ok, check_caught_walking: caught,
        dee_resumed: !!resumed, dee_resume_mode: resumed && resumed.mode,
        reload_has_lockpick: reHasPick, reopen_interact_ok: open2 && open2.ok, catch_reopened_after_reload: reopened,
        tasks: after.tasks
    };
});

// (i2) Reload within the 6 s print delay, measured from the schedule. eliConversation returns only
//      after the real close, so the delayed mapping is genuinely pending; the reload happens a
//      measured 2-3 s after the "fires in" schedule line and before the delay ends (design M6).
if (beat === 'i2') await recordBeat('i2_reload_within_delay', async () => {
    const clogBase = clog.length;
    const conv = await eliConversation();
    const scheduled = await waitUntil(async () => clog.slice(clogBase).find(c => /fires in/.test(c[1])) || null, 6000, 200);
    const scheduledAt = scheduled ? scheduled[0] : null;
    // Reload 2-3 s after the schedule, well inside the 6 s delay.
    await t(2500);
    const reloadAt = Date.now();
    const armed = await snap();
    await load();
    await t(7000);
    const after = await snap();
    await shot('i2-after-reload');
    return {
        ...conv, scheduled_seen: !!scheduled, schedule_to_reload_ms: scheduledAt ? reloadAt - scheduledAt : null,
        close_to_reload_ms: reloadAt - conv.closedAt, eli_asked_before_reload: armed.globals.eli_asked,
        eli_page_shown_after_reload: after.globals.eli_page_shown, revealed_after_reload: after.revealed,
        check_eli_page_after_reload: after.tasks.includes('check_eli_page'),
        clog: clog.slice(clogBase).map(c => [c[0] - conv.closedAt, c[1]]) };
});

await snap().then(s => { report.end = s; });
fs.writeFileSync(outDir + `report-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ beat, beats: report.beats, errs: errs.slice(0, 5) }, null, 1).slice(0, 7000));
await browser.close();
