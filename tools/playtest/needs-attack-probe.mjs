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
// Driven through the REAL UI path: interact to open the person-chat, pick the handover choice
// (sets eli_asked via #set_global), pick the exit choice (#exit_conversation closes the chat and
// emits conversation_closed:eli), then wait for the 6 s print and the object_revealed mapping.
if (beat === 'all' || beat === 'i') await recordBeat('i_eli_print', async () => {
    const opened = await page.evaluate(() => window.__test.interact('eli'));
    await t(1500);
    const chA = await page.evaluate(() => window.__test.minigames['person-chat'].choose('handover'));
    await t(1000);
    const chB = await page.evaluate(() => window.__test.minigames['person-chat'].choose('leave you be'));
    await t(1200);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    const closed = await snap();
    await t(9000);
    const after = await snap();
    await shot('i-eli-page');
    return { interact_ok: opened && opened.ok, choose_handover: chA && chA.ok, choose_exit: chB && chB.ok, eli_asked_after_close: closed.globals.eli_asked, eli_page_shown: after.globals.eli_page_shown, revealed: after.revealed, check_eli_page: after.tasks.includes('check_eli_page') };
});

// (d) Ben recalled by the Meeting Note: patrol override walks him home and suspends needs;
//     Meeting Over resumes them. Driven through the REAL UI path: interact with the note objects
//     in the office, which emit object_interacted with objectName from scenarioData.name.
if (beat === 'all' || beat === 'd') await recordBeat('d_ben_recalled', async () => {
    await page.evaluate(() => window.__test.needs.set('ben', 'thirst', 10));
    await t(2000);
    const readNote = await page.evaluate(() => window.__test.interact('meeting_note'));
    await t(800);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    await t(2500);
    const recalled = await snap();
    await shot('d-recalled');
    const readOver = await page.evaluate(() => window.__test.interact('meeting_over'));
    await t(800);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    await t(2000);
    const resumed = await snap();
    return {
        read_note_ok: readNote && readNote.ok, read_over_ok: readOver && readOver.ok,
        check_called_home: recalled.tasks.includes('check_called_home'),
        ben_suspended_mode: (recalled.states.find(s => s.id === 'ben') || {}).mode,
        ben_resumed_mode: (resumed.states.find(s => s.id === 'ben') || {}).mode
    };
});

// (a) Ava attacked mid-carry: turns hostile, job aborts, then calms and resumes.
if (beat === 'a') await recordBeat('a_ava_attacked', async () => {
    await page.evaluate(() => window.gameState.globalVariables && (window.__test.needs.set('ava', 'caffeine', 10)));
    // Give her the carry job by dropping the mugs in her notice, then set hostile mid-walk.
    await t(4000);
    await page.evaluate(() => window.npcHostileSystem && window.npcHostileSystem.setNPCHostile('ava', true));
    await t(1500);
    const hostile = await snap(); await shot('a-hostile');
    await page.evaluate(() => window.npcHostileSystem && window.npcHostileSystem.setNPCHostile('ava', false));
    await t(6000);
    const calm = await snap(); await shot('a-after');
    return { hostile_mid: hostile.hostility.ava, ava_mode_after: (calm.states.find(s => s.id === 'ava') || {}).mode, ava_log: calm.log.filter(l => l.includes('ava')) };
});

// (b) Ava knocked out: ava_ko + check_ko_drop fire once; folder drops; survives reload.
if (beat === 'b') await recordBeat('b_ava_ko', async () => {
    await page.evaluate(() => window.__test.needs.set('ava', 'caffeine', 10));
    await t(4000);
    const r = await page.evaluate(() => window.__test.debugKO('ava'));
    await t(2000);
    const down = await snap(); await shot('b-down');
    const officeBefore = await roomItems('office');
    await load();
    const after = await snap(); await shot('b-reload');
    const officeAfter = await roomItems('office');
    return { ko_ok: r.ok, ava_ko: after.globals.ava_ko, check_ko_drop: down.tasks.includes('check_ko_drop'), still_ko_after_reload: after.ko.ava, office_takeables_before: officeBefore, office_takeables_after: officeAfter };
});

// (c) Ben knocked out at the kitchen cooler: notebook drops; survives reload.
if (beat === 'c') await recordBeat('c_ben_ko', async () => {
    await page.evaluate(() => window.__test.needs.set('ben', 'thirst', 10));
    // let him walk to the kitchen cooler
    await t(9000);
    const walking = await snap();
    const r = await page.evaluate(() => window.__test.debugKO('ben'));
    await t(2000);
    const down = await snap(); await shot('c-down');
    const kitchenBefore = await roomItems('kitchen');
    await load();
    const after = await snap(); await shot('c-reload');
    const kitchenAfter = await roomItems('kitchen');
    return { ben_room_when_ko: walking.states.find(s => s.id === 'ben'), ko_ok: r.ok, ben_ko: after.globals.ben_ko, check_held_drop: down.tasks.includes('check_held_drop'), still_ko_after_reload: after.ko.ben, kitchen_takeables_before: kitchenBefore, kitchen_takeables_after: kitchenAfter };
});

// (g) Fran knocked out mid-walk to the cooler; Gil's next coupled break goes alone.
if (beat === 'g') await recordBeat('g_fran_ko_gil_solo', async () => {
    await page.evaluate(() => window.__test.needs.set('fran', 'thirst', 10));
    await t(3000);
    const r = await page.evaluate(() => window.__test.debugKO('fran'));
    await t(2000);
    // Send Gil on his break (the Break Time lever).
    await page.evaluate(() => window.eventDispatcher && window.eventDispatcher.emit('object_interacted', { objectName: 'Break Time', objectId: 'break_time' }));
    await t(10000);
    const after = await snap(); await shot('g-gil-alone');
    await load();
    const reloaded = await snap();
    return { ko_ok: r.ok, fran_ko: after.globals.fran_ko, check_solo_break: after.tasks.includes('check_solo_break'), gil_mode: (after.states.find(s => s.id === 'gil') || {}).mode, fran_still_ko_after_reload: reloaded.ko.fran };
});

// (h) Eli knocked out before any conversation: no page is ever revealed, reload reveals nothing.
if (beat === 'h') await recordBeat('h_eli_ko_no_page', async () => {
    const r = await page.evaluate(() => window.__test.debugKO('eli'));
    await t(3000);
    const down = await snap();
    await load();
    const after = await snap();
    return { ko_ok: r.ok, eli_ko: after.globals.eli_ko, eli_page_shown: after.globals.eli_page_shown, revealed_after_reload: after.revealed, check_eli_page_fired: after.tasks.includes('check_eli_page') };
});

// (f) Dee sees the player pick dee_drawer: the lockpick catch opens her conversation and
//     check_caught_walking ticks. The scenario grants no lockpick, so one is injected into the
//     inventory first (the catch itself checks line of sight, not possession); the key-mode
//     lockpicking minigame then exposes "Switch to Lockpicking", whose gate runs the catch.
if (beat === 'f') await recordBeat('f_dee_catch', async () => {
    await page.evaluate(() => {
        if (window.inventory && Array.isArray(window.inventory.items)) {
            window.inventory.items.push({ scenarioData: { id: 'probe_lockpick', type: 'lockpick', name: 'Lockpick Kit' } });
        }
    });
    const dee0 = await snap();
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
    const opened = await page.evaluate(() => window.__test.interact('eli'));
    await t(1500);
    await page.evaluate(() => window.__test.minigames['person-chat'].choose('handover'));
    await t(1000);
    await page.evaluate(() => window.__test.minigames['person-chat'].choose('leave you be'));
    await t(1000);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    const armed = await snap();
    // Reload well inside the 6 s delay.
    await t(2000);
    await load();
    await t(7000);
    const after = await snap();
    await shot('i2-after-reload');
    return {
        interact_ok: opened && opened.ok, eli_asked_before_reload: armed.globals.eli_asked,
        eli_page_shown_after_reload: after.globals.eli_page_shown, revealed_after_reload: after.revealed,
        check_eli_page_after_reload: after.tasks.includes('check_eli_page')
    };
});

await snap().then(s => { report.end = s; });
fs.writeFileSync(outDir + `report-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ beat, beats: report.beats, errs: errs.slice(0, 5) }, null, 1));
await browser.close();
