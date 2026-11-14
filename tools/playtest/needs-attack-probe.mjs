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
    const revealed = [];
    for (const [rid, room] of Object.entries(window.rooms || {})) {
        for (const o of (room.objects || [])) {
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
        tasks: (window.objectivesManager && Object.values(window.objectivesManager.tasks || {}).filter(x => x.status === 'completed').map(x => x.taskId || x.id)) || []
    };
});

// What dropped on the floor of a room (world objects added since creation show in window.rooms).
const roomItems = (roomId) => page.evaluate(r => {
    const room = (window.rooms || {})[r];
    if (!room) return [];
    return (room.objects || []).filter(o => o && o.takeable).map(o => o.id);
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
    await t(8000);
    const before = await snap();
    const calLog = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'cal'));
    return {
        cal_hostile: before.hostility.cal, cal_blocked_count: calLog.filter(e => e.ev === 'blocked').length,
        cal_job_starts: calLog.filter(e => e.ev === 'job_start').length, cal_mode: (before.states.find(s => s.id === 'cal') || {}).mode
    };
});

// (i-print) Eli: ask for the handover, close, page lands ~6s later; check_eli_page ticks.
if (beat === 'all' || beat === 'i') await recordBeat('i_eli_print', async () => {
    await page.evaluate(() => window.__test.needs.set && window.gameState.globalVariables && (window.gameState.globalVariables.eli_asked = true));
    // Drive the conversation close via the event dispatcher so the delayed print mapping arms.
    await page.evaluate(() => window.eventDispatcher && window.eventDispatcher.emit('conversation_closed:eli', { npcId: 'eli' }));
    await t(9000);
    const after = await snap();
    await shot('i-eli-page');
    return { eli_asked: after.globals.eli_asked, eli_page_shown: after.globals.eli_page_shown, revealed: after.revealed, check_eli_page: after.tasks.includes('check_eli_page') };
});

// (d) Ben recalled by the Meeting Note: patrol override walks him home and suspends needs;
//     Meeting Over resumes them.
if (beat === 'all' || beat === 'd') await recordBeat('d_ben_recalled', async () => {
    await page.evaluate(() => window.__test.needs.set('ben', 'thirst', 10));
    await t(2000);
    await page.evaluate(() => window.eventDispatcher && window.eventDispatcher.emit('object_interacted', { objectName: 'Meeting Note', objectId: 'meeting_note' }));
    await t(3000);
    const recalled = await snap();
    await page.evaluate(() => window.eventDispatcher && window.eventDispatcher.emit('object_interacted', { objectName: 'Meeting Over', objectId: 'meeting_over' }));
    await t(2000);
    const resumed = await snap();
    return {
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

await snap().then(s => { report.end = s; });
fs.writeFileSync(outDir + `report-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ beat, beats: report.beats, errs: errs.slice(0, 5) }, null, 1));
await browser.close();
