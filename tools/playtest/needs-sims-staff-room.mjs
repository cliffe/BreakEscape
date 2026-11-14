// SIMS-4 live proof (OFFICE_LIFE_SIMS_BUILD_PLAN 5.4): the staff-room pair (Keith and Jodie,
// m02's night porter and domestic). Drives scenarios/test_needs_sims through the test bridge; the
// conversations with Neil are opened and closed through their own UI and the doors walked through,
// never emitted. Records, per the brief: pool lines spent unheard (E7), the hand-written cooler cell
// (E8), any exchange marked heard with 0 heard lines (E9), and whether needs chatter is held or laned
// by the HUD (npc-barks.js / hud-lanes.js).
//   node tools/playtest/needs-sims-staff-room.mjs <gameId> [port] [beat] [outDir]
// beats: first_visit (default), job_beat, boiler_cross, cooler_cross, schedule <minutes>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3094', beat = 'first_visit', outDir = '/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/officelife-sims/s4/'] = process.argv.slice(2);
if (!gid) { console.error('usage: needs-sims-staff-room.mjs <gameId> [port] [beat] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const report = { gid, port, beat, errs };
const t = ms => page.waitForTimeout(ms);
const shot = n => page.screenshot({ path: outDir + `sr-${beat}-${n}-${gid}.png` });

async function load() {
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
    await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body, null, { timeout: 90000 });
    await t(2000);
    for (let i = 0; i < 6; i++) {
        const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
        if (!busy) break;
        await page.keyboard.press('Enter'); await t(400); await page.keyboard.press('Escape'); await t(400);
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    }
    await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
    // Capture every needs event we care about, with the needs-clock time. Both _emit and the direct
    // world.emit (npc_use_started) funnel through window.eventDispatcher.emit, so wrap that.
    await page.evaluate(() => {
        const ed = window.eventDispatcher; window.__s4 = [];
        if (ed && !ed.__s4wrapped) {
            const orig = ed.emit.bind(ed);
            ed.emit = (ev, data) => { try { if (/^(npc_(chatted|exchange_heard|use_started|returned_post|sat|sat_at|used|left_post)|room_entered):/.test(ev)) window.__s4.push({ clockMs: (window.npcNeedsSystem && window.npcNeedsSystem.clockMs) || 0, ev, data }); } catch (e) {} return orig(ev, data); };
            ed.__s4wrapped = true;
        }
    });
}
const enterRoom = async (rid) => { const r = await page.evaluate((r) => window.__test.enterRoom(r, { timeoutMs: 25000 }), rid).catch(() => null); await t(1200); return !!(r && r.ok); };
// Stand within OVERHEAR_RADIUS (160 px) of a chatter object so the pair have an audience.
const standNear = async (objId) => { const r = await page.evaluate((o) => window.__test.moveToNear(o, { timeoutMs: 20000 }), objId).catch(() => null); await t(800); return r; };
const playerRoom = () => page.evaluate(() => window.currentPlayerRoom);
const clock = () => page.evaluate(() => window.npcNeedsSystem.clockMs);
const events = () => page.evaluate(() => window.__s4.slice());
const npc = (id) => page.evaluate((id) => { const st = window.npcNeedsSystem.getState(id) || {}; const b = window.npcBehaviorManager && window.npcBehaviorManager.getBehavior(id); const sp = b && b.sprite; return { mode: st.mode, phase: st.job && st.job.phase, target: st.job && st.job.targetId, x: sp ? +sp.x.toFixed(0) : null, y: sp ? +sp.y.toFixed(0) : null, caffeine: st.levels && +st.levels.caffeine.toFixed(0), thirst: st.levels && +st.levels.thirst.toFixed(0) }; }, id);
const tasks = () => page.evaluate(() => Object.values((window.objectivesManager && window.objectivesManager.taskIndex) || {}).filter(x => x.status === 'completed' || x.status === 'completing').map(x => x.taskId || x.id));
const hudState = () => page.evaluate(() => ({
    npcBarks: !!window.npcBarks, hudLanes: !!(window.hud && window.hud.lanes) || !!window.hudLanes,
    heldBarks: (window.npcBarks && window.npcBarks._held && window.npcBarks._held.length) || 0,
    laneCount: (window.hudLanes && window.hudLanes.lanes && window.hudLanes.lanes.length) || 0
}));

// Both NPCs "using" the named object at once, and the overlap in needs-clock seconds.
function bothUsing(evs, objectId) {
    // use_started events for both, then returned/left after
    const uses = evs.filter(e => e.ev === `npc_use_started:${objectId}`);
    return uses;
}
// E7/E9 from captured npc_chatted/exchange events.
function analyse(evs) {
    const chat = evs.filter(e => e.ev.startsWith('npc_chatted:'));
    const poolLines = chat.filter(e => e.data.line && !e.data.picture && !e.data.exchange);
    const poolUnheard = poolLines.filter(e => !e.data.overheard);
    const exHeard = evs.filter(e => e.ev.startsWith('npc_exchange_heard:'));
    // per-knot heard-line count from the exchange chat turns
    const byKnot = {};
    for (const e of chat.filter(c => c.data.exchange)) { const k = e.data.exchange; byKnot[k] = byKnot[k] || { turns: 0, overheard: 0 }; byKnot[k].turns++; if (e.data.overheard) byKnot[k].overheard++; }
    const e9 = exHeard.map(e => { const k = e.data.knot; const b = byKnot[k] || { turns: 0, overheard: 0 }; return { knot: k, complete: e.data.complete, heardLines: b.overheard, turnsSeen: b.turns, marked_heard_with_0_heard: e.data.complete && b.overheard === 0 }; });
    return {
        pool_lines_total: poolLines.length, pool_lines_spent_unheard_E7: poolUnheard.length,
        pool_unheard_samples: poolUnheard.slice(0, 6).map(e => ({ clock_s: +(e.clockMs / 1000).toFixed(1), who: e.data.speakerId, line: e.data.line })),
        exchanges_heard: exHeard.map(e => ({ knot: e.data.knot, complete: e.data.complete })),
        E9_exchange_heard_detail: e9
    };
}

await load();
report.hud_before = await hudState();
await enterRoom('it_room'); await t(800);

async function talkNeil({ reportLight = false } = {}) {
    if ((await playerRoom()) !== 'it_room') await enterRoom('it_room');
    await page.evaluate(() => window.__test.moveToNear('neil', { timeoutMs: 20000 })).catch(() => {});
    await t(600);
    await page.evaluate(() => window.__test.interact('neil')).catch(() => null);
    for (let i = 0; i < 25; i++) { if (await page.evaluate(() => !!window.MinigameFramework?.currentMinigame)) break; await t(100); }
    await t(900);
    if (reportLight) { for (let i = 0; i < 8; i++) { const r = await page.evaluate(() => window.__test.minigame.choose('flickering')).catch(() => null); if (r && r.ok) break; await page.keyboard.press('Space'); await t(400); } await t(700); }
    for (let i = 0; i < 8; i++) { const r = await page.evaluate(() => window.__test.minigame.choose('let you get on')).catch(() => null); if (r && r.ok) break; await page.keyboard.press('Space'); await t(400); }
    for (let i = 0; i < 30; i++) { if (!(await page.evaluate(() => !!window.MinigameFramework?.currentMinigame))) break; await page.keyboard.press('Space'); await t(300); }
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    return !(await page.evaluate(() => !!window.MinigameFramework?.currentMinigame));
}

if (beat === 'first_visit') {
    // Walk into the staff room and stand by the boiler ~45 s. Neither NPC should stand within 1.5 s.
    const tEnter = await clock();
    const standNorth0 = { keith: await npc('keith'), jodie: await npc('jodie') };
    await enterRoom('staff_room');
    const enterClock = await clock();
    // Watch the 1.5 s window: sample modes just after entry.
    await t(1600);
    const at1_5 = { keith: await npc('keith'), jodie: await npc('jodie') };
    // Stand within earshot of the boiler so the pair have an audience for the exchange.
    await standNear('staff_boiler');
    const samples = [];
    for (let i = 0; i < 24; i++) { samples.push({ clock: await clock(), keith: await npc('keith'), jodie: await npc('jodie') }); if (i === 6) await shot('01-pair-at-boiler'); await t(1800); }
    await shot('02-after');
    const evs = await events();
    const roomEntered = evs.filter(e => e.ev === 'room_entered:staff_room' && e.data && e.data.firstVisit);
    const firstBoiler = bothUsing(evs, 'staff_boiler')[0];
    report.first_visit = {
        enter_clock_ms: enterClock,
        first_visit_room_entered_ms: roomEntered[0] ? roomEntered[0].clockMs : null,
        first_boiler_use_ms: firstBoiler ? firstBoiler.clockMs : null,
        delay_room_entered_to_first_use_ms: (roomEntered[0] && firstBoiler) ? firstBoiler.clockMs - roomEntered[0].clockMs : null,
        pair_did_not_stand_within_1_5s: (roomEntered[0] && firstBoiler) ? (firstBoiler.clockMs - roomEntered[0].clockMs) >= 1500 : null,
        modes_at_1_5s: { keith: at1_5.keith.mode, jodie: at1_5.jodie.mode },
        boiler_use_starts: bothUsing(evs, 'staff_boiler').map(e => ({ clock_s: +(e.clockMs / 1000).toFixed(1), npc: e.data.npcId })),
        both_used_boiler: new Set(bothUsing(evs, 'staff_boiler').map(e => e.data.npcId)).size >= 2,
        returned_post: evs.filter(e => e.ev.startsWith('npc_returned_post:')).map(e => e.ev),
        sat: evs.filter(e => /^npc_sat/.test(e.ev)).map(e => e.ev),
        tasks: await tasks(),
        ...analyse(evs)
    };
}

if (beat === 'job_beat') {
    // Report the flickering light to Neil, close, walk straight into the staff room.
    report.closed = await talkNeil({ reportLight: true });
    report.job_called = await page.evaluate(() => (window.gameState.globalVariables || {}).job_called);
    await enterRoom('staff_room');
    await standNear('staff_boiler');
    const samples = [];
    for (let i = 0; i < 20; i++) { samples.push({ clock: await clock(), keith: await npc('keith'), jodie: await npc('jodie') }); if (i === 4) await shot('01-in-staff-room'); await t(1800); }
    const evs = await events();
    report.job_beat = {
        job_called: await page.evaluate(() => (window.gameState.globalVariables || {}).job_called),
        boiler_use_starts: bothUsing(evs, 'staff_boiler').map(e => ({ clock_s: +(e.clockMs / 1000).toFixed(1), npc: e.data.npcId })),
        job_called_exchange_heard: evs.filter(e => e.ev === 'npc_exchange_heard:exchange_job_called').map(e => e.data),
        tasks: await tasks(), ...analyse(evs)
    };
}

if (beat === 'boiler_cross' || beat === 'cooler_cross') {
    // boiler: talk to Neil (no report), close, walk into staff room.
    // cooler: from IT walk into manager_office then straight back through IT into staff room.
    if (beat === 'boiler_cross') { report.closed = await talkNeil({ reportLight: false }); await enterRoom('staff_room'); await standNear('staff_boiler'); }
    else {
        // Load the staff room first (register Jodie), let the first-visit break pass, then cross
        // IT -> manager_office -> IT -> staff_room so the private-office entry starts the cooler break.
        await enterRoom('staff_room'); await t(45000); await enterRoom('it_room'); await t(400);
        await enterRoom('manager_office'); await t(900); await enterRoom('it_room'); await t(400); await enterRoom('staff_room'); await standNear('staff_cooler');
    }
    const obj = beat === 'boiler_cross' ? 'staff_boiler' : 'staff_cooler';
    const samples = [];
    for (let i = 0; i < 22; i++) { samples.push({ clock: await clock(), keith: await npc('keith'), jodie: await npc('jodie') }); if (i === 5) await shot(`01-at-${obj}`); await t(1800); }
    const evs = await events();
    report[beat] = {
        use_starts: bothUsing(evs, obj).map(e => ({ clock_s: +(e.clockMs / 1000).toFixed(1), npc: e.data.npcId })),
        both_used: new Set(bothUsing(evs, obj).map(e => e.data.npcId)).size >= 2,
        tasks: await tasks(), ...analyse(evs)
    };
}

if (beat === 'schedule') {
    const minutes = Number(process.argv[6]) || 20;
    await enterRoom('staff_room');
    const start = await clock();
    const starts = [];
    const end = Date.now() + minutes * 60000 + 30000;
    while (Date.now() < end) {
        const evs = await events();
        const cur = evs.filter(e => e.ev.startsWith('npc_use_started:')).map(e => ({ clock_min: +((e.clockMs - start) / 60000).toFixed(2), npc: e.data.npcId, obj: e.ev.split(':')[1] }));
        report.schedule_live = cur;
        const c = await clock(); if (c - start > minutes * 60000) break;
        await t(5000);
    }
    const evs = await events();
    report.schedule = {
        minutes, start_ms: start,
        use_starts: evs.filter(e => e.ev.startsWith('npc_use_started:')).map(e => ({ clock_min: +((e.clockMs - start) / 60000).toFixed(2), npc: e.data.npcId, obj: e.ev.split(':')[1] })),
        microwave_used: evs.filter(e => e.ev === 'npc_used:staff_microwave').map(e => +((e.clockMs - start) / 60000).toFixed(2)),
        tasks: await tasks(), ...analyse(evs)
    };
}

report.hud_after = await hudState();
fs.writeFileSync(outDir + `report-sr-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1).slice(0, 7000));
await browser.close();
