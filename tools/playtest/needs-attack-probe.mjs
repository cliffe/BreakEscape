// SIMS-1 live proof (OFFICE_LIFE_SIMS_BUILD_PLAN 5.1): drive scenarios/test_needs_attack
// beat by beat through the test bridge, attacking and knocking out needs NPCs and checking
// what the needs system and the server do, including across a reload.
//
//   node tools/playtest/needs-attack-probe.mjs <gameId> [port] [beat] [outDir]
//
// beat: one of a b c d e f g h i, or "all" (default). Each KO/reload beat is cleanest in its
// own fresh game (make one with tools/playtest/new-game.rb), because a KO is saved to the
// server. "all" runs the non-destructive beats (d e f h i-print) in one game and warns that
// the KO beats (a b c g) and i-reload each want a fresh game id.
//
// Movement and needs are driven only through window.__test (never a teleport). After popups,
// if the frame rate is low, Phaser's rAF is switched to setTimeout mode and physics throttled
// with fixed steps left ON, exactly as tools/playtest/drive.mjs does.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';

const [gid, port = '3093', beat = 'all',
    outDir = '/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/officelife-sims/s1/'] = process.argv.slice(2);
if (!gid) { console.error('usage: needs-attack-probe.mjs <gameId> [port] [beat] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
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
// slots, and each NPC's room-local position.
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
    return {
        clock: window.npcNeedsSystem && window.npcNeedsSystem.clockMs,
        fps: window.game.sys.game.loop.actualFps,
        states: ids.map(id => { const s = T.needs.state(id) || {}; return { id, mode: s.mode, blocked: s.blocked, job: s.job && (s.job.need || s.job.kind) + ':' + (s.job.targetId || ''), pos: window.player && null }; }),
        hostility: ids.reduce((m, id) => { m[id] = !!(window.npcHostileSystem && window.npcHostileSystem.isNPCHostile && window.npcHostileSystem.isNPCHostile(id)); return m; }, {}),
        ko: ids.reduce((m, id) => { m[id] = !!(window.npcHostileSystem && window.npcHostileSystem.isNPCKO && window.npcHostileSystem.isNPCKO(id)); return m; }, {}),
        globals: { ava_ko: gv.ava_ko, ben_ko: gv.ben_ko, eli_ko: gv.eli_ko, fran_ko: gv.fran_ko, gil_ko: gv.gil_ko, eli_asked: gv.eli_asked, eli_page_shown: gv.eli_page_shown },
        revealed,
        log: T.needs.log().slice(-24).map(e => `${e.t} ${e.npc} ${e.ev} ${e.target || e.objectId || ''}`.trim()),
        tasks: (window.objectivesManager && Object.values(window.objectivesManager.taskIndex || {}).filter(x => x.status === 'completed').map(x => x.taskId || x.id)) || []
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

// One NPC's needs state plus its current room (npcPos), for the mid-job polling below.
const njob = (id) => page.evaluate(i => {
    const s = window.__test.needs.state(i);
    const p = window.npcNeedsSystem && window.npcNeedsSystem.world.npcPos(i);
    if (!s) return { reg: false, room: p && p.roomId };
    return { reg: true, mode: s.mode, atPost: s.atPost, scriptSuspended: s.scriptSuspended,
        job: s.job ? { kind: s.job.kind, phase: s.job.phase, targetId: s.job.targetId, carrying: s.job.carrying } : null,
        room: p && p.roomId, parked: (s.parked || []).map(x => x.reason) };
}, id);

// Poll fn() every stepMs until it returns truthy, or timeoutMs elapses (returns the value or null).
async function waitUntil(fn, timeoutMs = 40000, stepMs = 500) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) { const v = await fn(); if (v) return v; await t(stepMs); }
    return null;
}

// Walk the player into the kitchen so its objects (the cooler, the tray, the kettle) load and
// the kitchen NPCs register; both rooms then stay loaded, so an office NPC can route to a kitchen
// source. A cross-room need parks as `no_source` until the source room is loaded.
async function loadKitchen() {
    const a = await page.evaluate(() => window.__test.enterRoom('kitchen', { timeoutMs: 25000 })).catch(e => ({ ok: false, err: String(e).slice(0, 80) }));
    await t(1200);
    return { kitchen_ok: a && a.ok, rooms: await page.evaluate(() => Object.keys(window.rooms || {})) };
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
// (#exit_conversation, which emits conversation_closed:eli). Falls back to arming the print only
// if the chat genuinely will not open.
async function eliConversation() {
    const room = await page.evaluate(() => window.currentPlayerRoom);
    if (room && room !== 'office') { await page.evaluate(() => window.__test.enterRoom('office')).catch(() => {}); await t(1200); }
    let path = 'real';
    await page.evaluate(() => window.__test.moveToNear('eli', { timeoutMs: 20000 })).catch(() => {});
    await t(600);
    const opened = await page.evaluate(() => window.__test.interact('eli'));
    await t(1600);
    const chatUp = await page.evaluate(() => { try { return !!window.__test.minigame.getState(); } catch (e) { return false; } });
    let chA = null, chB = null;
    if (opened && opened.ok && chatUp) {
        // The intro line animates first; press Space to reveal the hub choices, retrying the
        // choice until it matches a rendered option.
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
        await t(1200);
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    } else {
        path = 'armed-fallback';
        await page.evaluate(() => window.gameState.globalVariables && (window.gameState.globalVariables.eli_asked = true));
        await page.evaluate(() => window.eventDispatcher && window.eventDispatcher.emit('conversation_closed:eli', { npcId: 'eli' }));
    }
    return { path, interact_ok: opened && opened.ok, chat_up: chatUp, choose_handover: chA && chA.ok, choose_exit: chB && chB.ok };
}

await load();
await snap().then(s => { report.start = s; });
await shot('00-start');

// (e) Cal: hostile from start in the back room, never starts a job, logs blocked once.
if (beat === 'all' || beat === 'e') await recordBeat('e_hostile_from_start', async () => {
    // Cal registers with the needs system only once the back room loads.
    await page.evaluate(() => window.__test.enterRoom('back_room')).catch(() => {});
    await t(8000);
    const before = await snap();
    const calLog = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'cal'));
    return {
        cal_hostile: before.hostility.cal, cal_blocked_count: calLog.filter(e => e.ev === 'blocked').length,
        cal_job_starts: calLog.filter(e => e.ev === 'job_start').length, cal_mode: (before.states.find(s => s.id === 'cal') || {}).mode
    };
});

// (i-print) Eli: ask for the handover, close, page lands ~6s later; check_eli_page ticks.
// Real UI path (eliConversation): approach, open the person-chat, pick the handover choice
// (sets eli_asked via #set_global), pick the exit choice (#exit_conversation emits
// conversation_closed:eli). The completeTask under test (check_eli_page) fires on the real
// object_revealed:eli_page event ~6 s later.
if (beat === 'all' || beat === 'i') await recordBeat('i_eli_print', async () => {
    const conv = await eliConversation();
    const closed = await snap();
    // The print has a 6 s delay; then object_revealed:eli_page ticks check_eli_page through an
    // async server round-trip. Wait past the delay and the round-trip, then poll for the tick.
    await t(10000);
    const ticked = await waitUntil(async () => (await snap()).tasks.includes('check_eli_page'), 10000, 1000);
    const after = await snap();
    await shot('i-eli-page');
    return { ...conv, eli_asked_after_close: closed.globals.eli_asked, eli_page_shown: after.globals.eli_page_shown, revealed: after.revealed, check_eli_page: after.tasks.includes('check_eli_page'), check_eli_page_polled: !!ticked };
});

// (d) Ben recalled by the Meeting Note (real reads). Load the kitchen so his thirst can send him
//     to the cooler, walk back to the office, set thirst, let him leave post, then read the notes
//     (moveToNear + interact). Meeting Note suspends his needs and walks him home; Meeting Over
//     resumes them. scriptSuspended is the suspend/resume signal (mode stays idle either way).
if (beat === 'all' || beat === 'd') await recordBeat('d_ben_recalled', async () => {
    await loadKitchen();
    await page.evaluate(() => window.__test.enterRoom('office')).catch(() => {});
    await t(1200);
    await page.evaluate(() => window.__test.needs.set('ben', 'thirst', 10));
    const left = await waitUntil(async () => { const s = await njob('ben'); return (s.reg && s.atPost === false) ? s : null; }, 20000);
    const readNote = await readNoteObject('meeting_note');
    await t(2800);
    const recalled = await snap();
    const benAfterNote = await njob('ben');
    await shot('d-recalled');
    const readOver = await readNoteObject('meeting_over');
    await t(2500);
    const benAfterOver = await njob('ben');
    await shot('d-resumed');
    return {
        read_note_ok: readNote && readNote.ok, read_over_ok: readOver && readOver.ok,
        ben_left_post_before_recall: !!left,
        check_called_home: recalled.tasks.includes('check_called_home'),
        ben_suspended_after_note: benAfterNote.scriptSuspended,
        ben_resumed_after_over: benAfterOver.scriptSuspended
    };
});

// (a) Ava attacked mid-carry: turns hostile, the carry aborts, then she calms and resumes.
//     The kitchen must be loaded so her interest can deliver office_mugs to the kitchen tray;
//     catch her carrying in the kitchen, then flip her hostile and back.
if (beat === 'a') await recordBeat('a_ava_attacked', async () => {
    await loadKitchen();
    const atCarry = await waitUntil(async () => {
        const s = await njob('ava');
        return (s.job && s.job.kind === 'carry' && s.job.carrying && s.room === 'kitchen') ? s : null;
    }, 45000) || await waitUntil(async () => {
        const s = await njob('ava'); return (s.job && s.job.kind === 'carry' && s.job.carrying) ? s : null;
    }, 8000);
    await page.evaluate(() => window.npcHostileSystem && window.npcHostileSystem.setNPCHostile('ava', true));
    await t(1500);
    const hostile = await snap(); await shot('a-hostile');
    await page.evaluate(() => window.npcHostileSystem && window.npcHostileSystem.setNPCHostile('ava', false));
    await t(8000);
    const calm = await snap(); await shot('a-after');
    const avaLog = calm.log.filter(l => l.includes('ava'));
    return {
        carrying_at_attack: !!atCarry, carry_room_at_attack: atCarry && atCarry.room,
        hostile_mid: hostile.hostility.ava,
        aborted: avaLog.some(l => l.includes('job_aborted')),
        blocked: avaLog.some(l => / blocked/.test(l)),
        unblocked: avaLog.some(l => l.includes('unblocked')),
        ava_mode_after: (calm.states.find(s => s.id === 'ava') || {}).mode, ava_log: avaLog
    };
});

// (b) Ava knocked out mid-carry in the kitchen: ava_ko + check_ko_drop fire once; the folder drops
//     where she fell (the kitchen), the carried mugs are refused. Verify via the server's
//     room_states.<room>.objects_added (tools/playtest, a rails runner) after this run.
if (beat === 'b') await recordBeat('b_ava_ko', async () => {
    await loadKitchen();
    const atCarry = await waitUntil(async () => {
        const s = await njob('ava');
        return (s.job && s.job.kind === 'carry' && s.job.carrying && s.room === 'kitchen') ? s : null;
    }, 45000) || await waitUntil(async () => {
        const s = await njob('ava'); return (s.job && s.job.kind === 'carry' && s.job.carrying) ? s : null;
    }, 8000);
    const r = await page.evaluate(() => window.__test.debugKO('ava'));
    await t(2000);
    const down = await snap(); await shot('b-down');
    const officeBefore = await roomItems('office'); const kitchenBefore = await roomItems('kitchen');
    await load();
    const after = await snap(); await shot('b-reload');
    return { ko_room: atCarry && atCarry.room, carrying_at_ko: !!atCarry, ko_ok: r.ok, ava_ko: after.globals.ava_ko, check_ko_drop: down.tasks.includes('check_ko_drop'), still_ko_after_reload: after.ko.ava, office_takeables_before: officeBefore, kitchen_takeables_before: kitchenBefore };
});

// (c) Ben knocked out at the kitchen cooler: notebook drops; survives reload. Load the kitchen so
//     his thirst can route there, wait until he reaches the cooler, then knock him out.
if (beat === 'c') await recordBeat('c_ben_ko', async () => {
    await loadKitchen();
    await page.evaluate(() => window.__test.needs.set('ben', 'thirst', 10));
    const atCooler = await waitUntil(async () => {
        const s = await njob('ben');
        return (s.room === 'kitchen' && s.job && s.job.targetId === 'water_cooler') ? s : null;
    }, 30000);
    const benWhen = atCooler || await njob('ben');
    const r = await page.evaluate(() => window.__test.debugKO('ben'));
    await t(2000);
    const down = await snap(); await shot('c-down');
    const kitchenBefore = await roomItems('kitchen');
    await load();
    const after = await snap(); await shot('c-reload');
    return { ben_room_when_ko: benWhen.room, ben_phase_when_ko: benWhen.job && benWhen.job.phase, ko_ok: r.ok, ben_ko: after.globals.ben_ko, check_held_drop: down.tasks.includes('check_held_drop'), still_ko_after_reload: after.ko.ben, kitchen_takeables_before: kitchenBefore };
});

// (g) Fran knocked out mid-walk to the cooler; Gil's next break goes alone. Load the kitchen so
//     fran and gil register and their sources load; set fran's thirst so she walks, knock her out
//     mid-walk, then send Gil on his break with a need level (allowed beat-start, not the synthetic
//     Break Time emit). check_solo_break ticks on npc_left_post:gil while fran_ko is true.
if (beat === 'g') await recordBeat('g_fran_ko_gil_solo', async () => {
    await loadKitchen();
    await page.evaluate(() => window.__test.needs.set('fran', 'thirst', 10));
    const franWalking = await waitUntil(async () => { const s = await njob('fran'); return (s.reg && s.atPost === false && s.job) ? s : null; }, 20000);
    const r = await page.evaluate(() => window.__test.debugKO('fran'));
    await t(1500);
    await page.evaluate(() => window.__test.needs.set('gil', 'caffeine', 10));
    await t(10000);
    const after = await snap(); await shot('g-gil-alone');
    const gil = await njob('gil');
    await load();
    const reloaded = await snap();
    return { fran_walking_before_ko: !!franWalking, ko_ok: r.ok, fran_ko: after.globals.fran_ko, check_solo_break: after.tasks.includes('check_solo_break'), gil_mode: gil.mode, gil_room: gil.room, fran_still_ko_after_reload: reloaded.ko.fran };
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

// (f) Dee sees the player pick dee_drawer while she is off her post: the lockpick catch opens her
//     conversation and check_caught_walking ticks. Her caffeine is set low first so she leaves her
//     post for the office coffee (the catch then lands on a moving NPC). A lockpick is injected
//     (the catch checks line of sight, not possession); "Switch to Lockpicking" runs the catch gate.
if (beat === 'f') await recordBeat('f_dee_catch', async () => {
    await page.evaluate(() => {
        if (window.inventory && Array.isArray(window.inventory.items)) {
            window.inventory.items.push({ scenarioData: { id: 'probe_lockpick', type: 'lockpick', name: 'Lockpick Kit' } });
        }
    });
    await page.evaluate(() => window.__test.needs.set('dee', 'caffeine', 10));
    const walking = await waitUntil(async () => { const s = await njob('dee'); return (s.reg && s.atPost === false) ? s : null; }, 15000);
    const open = await page.evaluate(() => window.__test.interact('dee_drawer'));
    await t(1500);
    const mgState = await page.evaluate(() => { try { return window.__test.minigame.getState(); } catch (e) { return { err: String(e).slice(0, 120) }; } });
    // Trigger the switch-to-pick gate, which is where catchLockpickInView runs.
    const sw = await page.evaluate(() => {
        const m = window.__test.minigame;
        for (const label of ['Switch to Lockpicking', 'Switch to Lockpick', 'Lockpick', 'Pick']) {
            try { const r = m.clickText(label); if (r && r.ok) return { label, r }; } catch (e) {}
        }
        return { tried: true };
    });
    await t(2500);
    await shot('f-caught');
    const after = await snap();
    return {
        dee_off_post_at_pick: !!walking, dee_mode_at_pick: walking && walking.mode,
        lockpick_injected: true, interact_ok: open && open.ok, mg_id: mgState && mgState.id,
        switch_attempt: sw,
        caught_log: after.log.filter(l => l.includes('dee')),
        check_caught_walking: after.tasks.includes('check_caught_walking'),
        tasks: after.tasks
    };
});

// (i2) Reload within the 6 s print delay: the pending delayed mapping is lost, so no page and no
//      reveal global. Expected and recorded as such. Real UI path to arm the print, then reload fast.
if (beat === 'i2') await recordBeat('i2_reload_within_delay', async () => {
    const conv = await eliConversation();
    const armed = await snap();
    // Reload well inside the 6 s delay.
    await t(2000);
    await load();
    await t(7000);
    const after = await snap();
    await shot('i2-after-reload');
    return {
        ...conv, eli_asked_before_reload: armed.globals.eli_asked,
        eli_page_shown_after_reload: after.globals.eli_page_shown, revealed_after_reload: after.revealed,
        check_eli_page_after_reload: after.tasks.includes('check_eli_page')
    };
});

await snap().then(s => { report.end = s; });
fs.writeFileSync(outDir + `report-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ beat, beats: report.beats, errs: errs.slice(0, 5) }, null, 1));
await browser.close();
