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
            // npc_sat is emitted bare (seating.js) with no ":<id>" suffix, so allow end-of-string
            // after the event keyword as well as a colon.
            ed.emit = (ev, data) => { try { if (/^(npc_(chatted|exchange_heard|use_started|returned_post|sat|sat_at|used|left_post)|room_entered|conversation_closed)(:|$)/.test(ev)) window.__s4.push({ clockMs: (window.npcNeedsSystem && window.npcNeedsSystem.clockMs) || 0, ev, data }); } catch (e) {} return orig(ev, data); };
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
const npc = (id) => page.evaluate((id) => { const st = window.npcNeedsSystem.getState(id) || {}; const b = window.npcBehaviorManager && window.npcBehaviorManager.getBehavior(id); const sp = b && b.sprite; return { mode: st.mode, phase: st.job && st.job.phase, target: st.job && st.job.targetId, x: sp ? +sp.x.toFixed(0) : null, y: sp ? +sp.y.toFixed(0) : null, caffeine: st.levels && st.levels.caffeine != null ? +st.levels.caffeine.toFixed(0) : null, thirst: st.levels && st.levels.thirst != null ? +st.levels.thirst.toFixed(0) : null }; }, id);
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

// Step 5 / setup-failure fields shared by every beat: all object use-starts, the post returns and
// sits after breaks, and whether two starts on DIFFERENT objects fired within 5 s (a setup failure).
function stepFive(evs) {
    const starts = evs.filter(e => e.ev.startsWith('npc_use_started:')).map(e => ({ obj: e.ev.split(':')[1], npc: e.data.npcId, clock_s: +(e.clockMs / 1000).toFixed(1) }));
    // Setup failure (plan 5.4): two STAFF-ROOM break starts on different objects within 5 s, i.e. the
    // pair's two coupled breaks colliding. Office NPCs using their own objects are not staff breaks.
    const staff = starts.filter(s => s.obj.startsWith('staff_'));
    let setupFail = null;
    for (let i = 0; i < staff.length; i++) for (let j = i + 1; j < staff.length; j++) {
        if (staff[i].obj !== staff[j].obj && Math.abs(staff[i].clock_s - staff[j].clock_s) <= 5) setupFail = [staff[i], staff[j]];
    }
    return {
        all_use_starts: starts,
        returned_post: evs.filter(e => e.ev.startsWith('npc_returned_post:')).map(e => e.ev.split(':')[1]),
        sat_count: evs.filter(e => e.ev === 'npc_sat').length,
        setup_failure_diff_object_within_5s: setupFail
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
        ...stepFive(evs),
        ...analyse(evs)
    };
}

// B1: a break the player walks into must be started by leaving Neil (or entering the private office),
// not by the first visit. So load the staff room first, let the first-visit break settle, wait more
// than 120 s of needs clock since the last staff start with both NPCs home, then do the close/cross.
async function settleStaff(minGapMs = 125000, capMs = 280000) {
    const startReal = Date.now();
    while (Date.now() - startReal < capMs) {
        const evs = await events();
        const starts = evs.filter(e => e.ev.startsWith('npc_use_started:staff_'));
        const last = starts.length ? starts[starts.length - 1].clockMs : 0;
        const now = await clock();
        const k = await npc('keith'), j = await npc('jodie');
        const bothHome = !k.phase && !j.phase && k.mode !== 'using' && j.mode !== 'using';
        if (starts.length && bothHome && (now - last) > minGapMs) return { ok: true, now_ms: now, last_start_ms: last, gap_s: +((now - last) / 1000).toFixed(1) };
        await t(4000);
    }
    return { ok: false };
}

if (beat === 'job_beat' || beat === 'boiler_cross') {
    const reportLight = beat === 'job_beat';
    await enterRoom('staff_room'); await t(1500);           // the first visit (first-visit break)
    const settled = await settleStaff();                    // both home, > 120 s since the last start
    const before = (await events()).filter(e => e.ev.startsWith('npc_use_started:staff_')).length;
    report.closed = await talkNeil({ reportLight });        // leaving Neil starts Keith's break
    const closeClock = await clock();
    await enterRoom('staff_room'); await standNear('staff_boiler');
    const samples = [];
    for (let i = 0; i < 20; i++) { samples.push({ clock: await clock(), keith: await npc('keith'), jodie: await npc('jodie') }); if (i === 4) await shot('01-in-staff-room'); await t(1800); }
    const evs = await events();
    const close = evs.filter(e => e.ev === 'conversation_closed:neil').slice(-1)[0] || null;
    const closeMs = close ? close.clockMs : closeClock;
    const after = evs.filter(e => e.ev.startsWith('npc_use_started:staff_') && e.clockMs >= closeMs - 100);
    const firstAfter = after[0] || null;
    const firstVisitInWindow = evs.some(e => e.ev === 'room_entered:staff_room' && e.data && e.data.firstVisit && e.clockMs >= closeMs - 100);
    report[beat] = {
        settled, staff_starts_before_close: before,
        job_called: await page.evaluate(() => (window.gameState.globalVariables || {}).job_called),
        neil_close_ms: closeMs,
        first_staff_start_after_close_ms: firstAfter ? firstAfter.clockMs : null,
        first_start_npc: firstAfter ? firstAfter.data.npcId : null,
        gap_close_to_start_s: firstAfter ? +((firstAfter.clockMs - closeMs) / 1000).toFixed(1) : null,
        start_from_neil_close: !!(firstAfter && (firstAfter.clockMs - closeMs) <= 5000 && (firstAfter.clockMs - closeMs) >= -200),
        no_firstvisit_in_window: !firstVisitInWindow,
        job_called_exchange_heard: evs.filter(e => e.ev === 'npc_exchange_heard:exchange_job_called').map(e => e.data),
        boiler_use_starts: bothUsing(evs, 'staff_boiler').map(e => ({ clock_s: +(e.clockMs / 1000).toFixed(1), npc: e.data.npcId })),
        tasks: await tasks(), ...stepFive(evs), ...analyse(evs)
    };
}

if (beat === 'cooler_cross') {
    // Load the staff room first, settle (> 120 s, m4), then cross IT -> manager_office -> IT ->
    // staff_room so the private-office entry (not the first visit) starts the cooler break.
    await enterRoom('staff_room'); await t(1500);
    const settled = await settleStaff();
    await enterRoom('it_room'); await t(400);
    const before = (await events()).filter(e => e.ev.startsWith('npc_use_started:staff_')).length;
    await enterRoom('manager_office'); await t(900);
    const entryClock = await clock();
    await enterRoom('it_room'); await t(400); await enterRoom('staff_room'); await standNear('staff_cooler');
    const samples = [];
    for (let i = 0; i < 22; i++) { samples.push({ clock: await clock(), keith: await npc('keith'), jodie: await npc('jodie') }); if (i === 5) await shot('01-at-staff_cooler'); await t(1800); }
    const evs = await events();
    const entry = evs.filter(e => e.ev === 'room_entered:manager_office').slice(-1)[0] || null;
    const entryMs = entry ? entry.clockMs : entryClock;
    const after = evs.filter(e => e.ev.startsWith('npc_use_started:staff_cooler') && e.clockMs >= entryMs - 100);
    const firstAfter = after[0] || null;
    const firstVisitInWindow = evs.some(e => e.ev === 'room_entered:staff_room' && e.data && e.data.firstVisit && e.clockMs >= entryMs - 100);
    report.cooler_cross = {
        settled, staff_starts_before_entry: before,
        office_entry_ms: entryMs,
        first_cooler_start_after_entry_ms: firstAfter ? firstAfter.clockMs : null,
        gap_entry_to_start_s: firstAfter ? +((firstAfter.clockMs - entryMs) / 1000).toFixed(1) : null,
        start_from_private_office: !!(firstAfter && (firstAfter.clockMs - entryMs) <= 5000 && (firstAfter.clockMs - entryMs) >= -200),
        no_firstvisit_in_window: !firstVisitInWindow,
        use_starts: bothUsing(evs, 'staff_cooler').map(e => ({ clock_s: +(e.clockMs / 1000).toFixed(1), npc: e.data.npcId })),
        both_used: new Set(bothUsing(evs, 'staff_cooler').map(e => e.data.npcId)).size >= 2,
        tasks: await tasks(), ...stepFive(evs), ...analyse(evs)
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

if (beat === 'speechlock') {
    // Plan 5.4 Regressions / step 7: over 15 min of office play with the IT and staff-room doors
    // open, count office `_pickBark` turns that return a picture or `wait` while `_speechUntil` is
    // held by a staff-room line (keith/jodie) whose `overheard` is false.
    const minutes = Number(process.argv[6]) || 15;
    // Load every room-set so office, staff-room, kitchen and lounge NPCs tick for the whole run
    // (m2: the kitchen and lounge doors must be open or their cooler pair never chats).
    await enterRoom('it_room'); await t(600);
    await enterRoom('staff_room'); await t(1800);        // register Keith & Jodie
    await enterRoom('it_room'); await t(600);
    await enterRoom('office'); await t(800);
    await enterRoom('kitchen'); await t(1400);            // register the kitchen cooler pair
    await enterRoom('lounge'); await t(1400);             // register the lounge
    await enterRoom('office'); await t(1500);             // office NPCs active; park the player here
    await page.evaluate(() => {
        const ns = window.npcNeedsSystem; const STAFF = new Set(['keith', 'jodie']);
        window.__s4sl = { lock: null, officeTurns: 0, blocked: 0 };
        if (ns && !ns.__s4slwrapped) {
            const origSpeak = ns._speak.bind(ns);
            ns._speak = function (npcId, line, until, info) {
                const r = origSpeak(npcId, line, until, info);
                window.__s4sl.lock = { npcId, overheard: !!(info && info.overheard), until, staff: STAFF.has(npcId) };
                return r;
            };
            const origPick = ns._pickBark.bind(ns);
            ns._pickBark = function (s, topic, opts) {
                const pick = origPick(s, topic, opts);
                try {
                    const isOffice = s && s.npcId && !STAFF.has(s.npcId);
                    const isTurn = pick && (pick.line || pick.picture || pick.wait);
                    if (isOffice && isTurn) {
                        window.__s4sl.officeTurns++;
                        if (pick.picture || pick.wait) {
                            const L = window.__s4sl.lock;
                            if (this.clockMs < this._speechUntil && L && L.staff && !L.overheard && this.clockMs < L.until) window.__s4sl.blocked++;
                        }
                    }
                } catch (e) {}
                return pick;
            };
            ns.__s4slwrapped = true;
        }
    });
    const neil0 = await npc('neil');
    const start = await clock();
    await shot('01-office');
    while (true) { const c = await clock(); if (c - start > minutes * 60000) break; await t(10000); }
    await shot('02-after');
    const evs = await events();
    const sl = await page.evaluate(() => window.__s4sl);
    const neil1 = await npc('neil');
    const neilMoved = (neil0.x != null && neil1.x != null) ? +Math.hypot(neil1.x - neil0.x, neil1.y - neil0.y).toFixed(1) : null;
    report.speechlock = {
        minutes, office_turns: sl.officeTurns, blocked_by_unheard_staff_line: sl.blocked,
        ratio: sl.officeTurns ? +(sl.blocked / sl.officeTurns).toFixed(4) : 0,
        threshold_1_in_20: sl.officeTurns ? sl.blocked > sl.officeTurns / 20 : false,
        staff_pool_lines: evs.filter(e => e.ev.startsWith('npc_chatted:staff_')).length,
        // Office-beats-with-doors-open regression: needs-driven office beats still fire, cooler pair
        // meets, Neil stays still.
        office_regression: {
            neil_moved_px: neilMoved, neil_still: neilMoved != null && neilMoved <= 2,
            cooler_chats: evs.filter(e => e.ev === 'npc_chatted:water_cooler').length,
            office_chatted_objects: [...new Set(evs.filter(e => e.ev.startsWith('npc_chatted:') && !e.ev.includes('staff_')).map(e => e.ev.split(':')[1]))],
            office_tasks_ticked: await tasks()
        },
        ...analyse(evs)
    };
}

report.hud_after = await hudState();
fs.writeFileSync(outDir + `report-sr-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1).slice(0, 7000));
await browser.close();
