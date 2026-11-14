// SIMS-4 live proof (OFFICE_LIFE_SIMS_BUILD_PLAN 5.4): the staff-room pair (Keith and Jodie,
// m02's night porter and domestic). Drives scenarios/test_needs_sims through the test bridge; the
// conversations with Neil are opened and closed through their own UI and the doors walked through,
// never emitted. Records, per the brief: pool lines spent unheard (E7), the hand-written cooler cell
// (E8), any exchange marked heard with 0 heard lines (E9), and whether needs chatter is held or laned
// by the HUD (npc-barks.js / hud-lanes.js).
//   node tools/playtest/needs-sims-staff-room.mjs <gameId> [port] [beat] [outDir]
// beats: first_visit (default), job_beat, boiler_cross, cooler_cross, schedule <minutes>, speechlock <minutes>
// A run whose setup did not happen (no Neil close after two tries, no waiting exchange on the first
// visit) writes setup_failure and exits 3: count it as a probe failure, not an engine result.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3094', beat = 'first_visit', outDir = '/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/officelife-sims/s4/'] = process.argv.slice(2);
if (!gid) { console.error('usage: needs-sims-staff-room.mjs <gameId> [port] [beat] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
// GL=1 launches with SwiftShader WebGL so window.lightingSystem exists (the light beats need it).
const browser = await chromium.launch({ headless: true, executablePath: EXEC, args: process.env.GL ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
page.on('crash', () => { errs.push('PAGE CRASHED'); console.log('PAGE CRASHED'); });
browser.on('disconnected', () => console.log('BROWSER DISCONNECTED'));
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

async function talkNeilOnce({ reportLight = false } = {}) {
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
}
// The close counts only when a conversation_closed:neil event arrives after this call (game 4570:
// the chat never opened, and the old fallback took the call's own clock time as the close). One
// retry once Neil has finished any sip; otherwise { ok: false } and the run is a setup failure.
async function talkNeil(opts = {}) {
    for (let attempt = 1; attempt <= 2; attempt++) {
        const n0 = (await events()).filter(e => e.ev === 'conversation_closed:neil').length;
        await talkNeilOnce(opts);
        await t(500);
        const closes = (await events()).filter(e => e.ev === 'conversation_closed:neil');
        if (closes.length > n0) return { ok: true, closeMs: closes[closes.length - 1].clockMs, attempts: attempt };
        const t1 = Date.now();
        while (Date.now() - t1 < 45000) { const n = await npc('neil'); if (n.mode !== 'using' && !n.phase) break; await t(1000); }
        await t(1500);
    }
    return { ok: false, attempts: 2 };
}
function setupFailure(why) {
    report.setup_failure = why;
    fs.writeFileSync(outDir + `report-sr-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
    console.log('SETUP FAILURE', gid, why);
    return browser.close().then(() => process.exit(3));
}
const light = () => page.evaluate(() => { const st = window.lightingSystem?.rooms?.get('staff_room'); if (!st) return null; return { variantIdx: st.variantIdx, flicker: !!st.cfg?.flicker, faulty: st.panels.filter(p => p.faulty).length, levels: st.panels.map(p => +(p.level ?? 0).toFixed(2)) }; }).catch(() => null);
// m3: freeze the loop on the frame where the faulty panel dips, so a screenshot shows the blink.
async function shotDip(name, capMs = 30000) {
    const got = await page.evaluate((capMs) => new Promise(res => {
        const st = window.lightingSystem?.rooms?.get('staff_room'); const p = st && st.panels.find(q => q.faulty);
        if (!p) return res({ ok: false, why: 'no faulty panel' });
        const t0 = Date.now();
        const iv = setInterval(() => {
            if ((p.level ?? 1) < 0.75) { clearInterval(iv); window.game.loop.sleep(); return res({ ok: true, level: +p.level.toFixed(2), x: Math.round(p.x), y: Math.round(p.y) }); }
            if (Date.now() - t0 > capMs) { clearInterval(iv); res({ ok: false, why: 'no dip in cap' }); }
        }, 5);
    }), capMs).catch(e => ({ ok: false, why: String(e) }));
    if (got.ok) { await shot(name); await page.evaluate(() => window.game.loop.wake()); }
    return got;
}
// Only what a player hears on the crossing: the staff pair's turns at objId from fromMs on (not the
// first visit, not office NPCs). Pool lines and exchange lines are counted apart.
const STAFF = new Set(['keith', 'jodie']);
function crossing(evs, fromMs, objId) {
    const w = evs.filter(e => e.clockMs >= fromMs - 100);
    const chat = w.filter(e => e.ev === `npc_chatted:${objId}` && STAFF.has(e.data.speakerId));
    const pool = chat.filter(e => !e.data.exchange && e.data.line);
    const heard = pool.filter(e => e.data.overheard);
    const starts = w.filter(e => e.ev === `npc_use_started:${objId}`);
    return {
        pair: new Set(starts.map(e => e.data.npcId)).size >= 2,
        pair_starts: starts.map(e => ({ npc: e.data.npcId, clock_s: +(e.clockMs / 1000).toFixed(1) })),
        pool_lines_heard: heard.length,
        pool_lines_spoken_unheard: pool.length - heard.length,
        picture_turns: chat.filter(e => !e.data.exchange && e.data.picture).length,
        pool_heard_lines: heard.map(e => ({ clock_s: +(e.clockMs / 1000).toFixed(1), who: e.data.speakerId, line: e.data.line })),
        exchange_lines: chat.filter(e => e.data.exchange).map(e => ({ knot: e.data.exchange, who: e.data.speakerId, heard: !!e.data.overheard, line: e.data.line })),
        line_heard: heard.length > 0
    };
}
// M1: the first visit as the tour plays it: stand by the boiler until the waiting exchange is heard,
// so no exchange is left over for the crossing.
async function firstVisitHeard(capMs = 150000) {
    await enterRoom('staff_room'); await standNear('staff_boiler');
    const t0 = Date.now();
    while (Date.now() - t0 < capMs) { if ((await events()).some(e => e.ev === 'npc_exchange_heard:exchange_waiting')) return true; await t(2000); }
    return false;
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
// not by the first visit. So hear the first visit out (M1), wait more than 120 s of needs clock since
// the last staff start with both NPCs home, then do the close/cross.
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

async function talkJodie(pattern) {
    await page.evaluate(() => window.__test.moveToNear('jodie', { timeoutMs: 20000 })).catch(() => {});
    await t(600);
    await page.evaluate(() => window.__test.interact('jodie')).catch(() => null);
    for (let i = 0; i < 25; i++) { if (await page.evaluate(() => !!window.MinigameFramework?.currentMinigame)) break; await t(100); }
    await t(1200);
    const out = { opened: await page.evaluate(() => !!window.MinigameFramework?.currentMinigame) };
    const st0 = await page.evaluate(() => window.__test.minigame.getState()).catch(() => null);
    out.choices = (st0 && st0.choices || []).map(c => c.text || c);
    for (let i = 0; i < 8; i++) { const r = await page.evaluate((p) => window.__test.minigame.choose(p), pattern).catch(() => null); if (r && r.ok) { out.picked = true; break; } await page.keyboard.press('Space'); await t(400); }
    await t(1500);
    const st1 = await page.evaluate(() => window.__test.minigame.getState()).catch(() => null);
    out.reply = st1 && st1.dialogue ? st1.dialogue.text : null;
    await shot('06-jodie-reply');
    for (let i = 0; i < 8; i++) { const r = await page.evaluate(() => window.__test.minigame.choose('let you get on')).catch(() => null); if (r && r.ok) break; await page.keyboard.press('Space'); await t(400); }
    for (let i = 0; i < 30; i++) { if (!(await page.evaluate(() => !!window.MinigameFramework?.currentMinigame))) break; await page.keyboard.press('Space'); await t(300); }
    return out;
}

if (beat === 'job_beat' || beat === 'boiler_cross') {
    const reportLight = beat === 'job_beat';
    if (!(await firstVisitHeard())) { await setupFailure('first visit: exchange_waiting not heard'); }
    const settled = await settleStaff();                    // both home, > 120 s since the last start
    const before = (await events()).filter(e => e.ev.startsWith('npc_use_started:staff_')).length;
    const neil = await talkNeil({ reportLight });            // leaving Neil starts Keith's break
    if (!neil.ok) { await setupFailure('no conversation_closed:neil after two tries'); }
    const closeMs = neil.closeMs;
    await enterRoom('staff_room'); await standNear('staff_boiler');
    const light0 = await light();
    for (let i = 0; i < 20; i++) { if (i === 4) await shot('01-in-staff-room'); await t(1800); }
    let evs = await events();
    const after = evs.filter(e => e.ev.startsWith('npc_use_started:staff_') && e.clockMs >= closeMs - 100);
    const firstAfter = after[0] || null;
    const firstVisitInWindow = evs.some(e => e.ev === 'room_entered:staff_room' && e.data && e.data.firstVisit && e.clockMs >= closeMs - 100);
    const r = report[beat] = {
        settled, staff_starts_before_close: before, neil_close: neil,
        job_called: await page.evaluate(() => (window.gameState.globalVariables || {}).job_called),
        neil_close_ms: closeMs,
        first_staff_start_after_close_ms: firstAfter ? firstAfter.clockMs : null,
        first_start_npc: firstAfter ? firstAfter.data.npcId : null,
        gap_close_to_start_s: firstAfter ? +((firstAfter.clockMs - closeMs) / 1000).toFixed(1) : null,
        start_from_neil_close: !!(firstAfter && (firstAfter.clockMs - closeMs) <= 5000 && (firstAfter.clockMs - closeMs) >= -200),
        no_firstvisit_in_window: !firstVisitInWindow,
        crossing: crossing(evs, closeMs, 'staff_boiler'),
        job_called_exchange_heard: evs.filter(e => e.ev === 'npc_exchange_heard:exchange_job_called').map(e => e.data),
        light_at_crossing: light0
    };
    if (beat === 'job_beat') {
        // M2: Jodie takes the job in the exchange, then walks to the lockers; the light steadies when
        // she finishes there. Then ask her, and hear the cleared exchange on the next (cooler) break.
        const t0 = Date.now(); let shotLockers = false;
        while (Date.now() - t0 < 150000) {
            evs = await events();
            if (!shotLockers && evs.some(e => e.ev === 'npc_use_started:staff_lockers')) { await t(1500); await shot('02-jodie-at-lockers'); r.light_while_at_lockers = await light(); r.dip_before_fix = await shotDip('03-flicker-dip', 20000); shotLockers = true; }
            if (evs.some(e => e.ev === 'npc_used:staff_lockers')) break;
            await t(1000);
        }
        const used = evs.find(e => e.ev === 'npc_used:staff_lockers');
        const callHeard = evs.find(e => e.ev === 'npc_exchange_heard:exchange_job_called');
        const lockerStart = evs.find(e => e.ev === 'npc_use_started:staff_lockers');
        r.lockers = {
            use_started_by: lockerStart ? lockerStart.data.npcId : null,
            start_after_call_s: (lockerStart && callHeard) ? +((lockerStart.clockMs - callHeard.clockMs) / 1000).toFixed(1) : null,
            used_by: used ? used.data.npcId : null,
            used_ms: used ? used.clockMs : null
        };
        await t(1500);
        r.job_cleared = await page.evaluate(() => (window.gameState.globalVariables || {}).job_cleared);
        const samples = []; for (let i = 0; i < 40; i++) { const L = await light(); if (L) samples.push(Math.min(...L.levels)); await t(150); }
        r.light_after_fix = { ...(await light()), min_level_over_6s: samples.length ? Math.min(...samples) : null };
        await shot('04-steady-after-fix');
        r.jodie_chat = await talkJodie('sorted');
        // The next break: the private office starts the cooler break; the cleared exchange should play.
        const c0 = await clock();
        await enterRoom('it_room'); await t(400); await enterRoom('manager_office'); await t(900);
        await enterRoom('it_room'); await t(400); await enterRoom('staff_room'); await standNear('staff_cooler');
        const t1 = Date.now(); let shotEx = false;
        while (Date.now() - t1 < 70000) {
            evs = await events();
            if (!shotEx && evs.some(e => e.ev === 'npc_chatted:staff_cooler' && e.data.exchange === 'exchange_job_cleared' && e.clockMs >= c0)) { await shot('05-cleared-exchange'); shotEx = true; }
            if (evs.some(e => e.ev === 'npc_exchange_heard:exchange_job_cleared')) break;
            await t(1500);
        }
        r.cleared_exchange = {
            heard: evs.filter(e => e.ev === 'npc_exchange_heard:exchange_job_cleared').map(e => e.data),
            lines: crossing(evs, c0, 'staff_cooler').exchange_lines
        };
    }
    r.tasks = await tasks();
    Object.assign(r, stepFive(evs));
}

if (beat === 'cooler_cross') {
    // Hear the first visit out (M1), settle (> 120 s, m4), then cross IT -> manager_office -> IT ->
    // staff_room so the private-office entry (not the first visit) starts the cooler break.
    if (!(await firstVisitHeard())) { await setupFailure('first visit: exchange_waiting not heard'); }
    const settled = await settleStaff();
    await enterRoom('it_room'); await t(400);
    const before = (await events()).filter(e => e.ev.startsWith('npc_use_started:staff_')).length;
    await enterRoom('manager_office'); await t(900);
    const entryClock = await clock();
    await enterRoom('it_room'); await t(400); await enterRoom('staff_room'); await standNear('staff_cooler');
    for (let i = 0; i < 22; i++) { if (i === 5) await shot('01-at-staff_cooler'); await t(1800); }
    const evs = await events();
    const entry = evs.filter(e => e.ev === 'room_entered:manager_office').slice(-1)[0] || null;
    const entryMs = entry ? entry.clockMs : entryClock;
    const after = evs.filter(e => e.ev.startsWith('npc_use_started:staff_cooler') && e.clockMs >= entryMs - 100);
    const firstAfter = after[0] || null;
    const firstVisitInWindow = evs.some(e => e.ev === 'room_entered:staff_room' && e.data && e.data.firstVisit && e.clockMs >= entryMs - 100);
    report.cooler_cross = {
        settled, staff_starts_before_entry: before,
        office_entry_ms: entryMs, office_entry_event_seen: !!entry,
        first_cooler_start_after_entry_ms: firstAfter ? firstAfter.clockMs : null,
        gap_entry_to_start_s: firstAfter ? +((firstAfter.clockMs - entryMs) / 1000).toFixed(1) : null,
        start_from_private_office: !!(firstAfter && (firstAfter.clockMs - entryMs) <= 5000 && (firstAfter.clockMs - entryMs) >= -200),
        no_firstvisit_in_window: !firstVisitInWindow,
        crossing: crossing(evs, entryMs, 'staff_cooler'),
        tasks: await tasks(), ...stepFive(evs)
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
    // Plan 5.4 step 7, re-scoped for E7 (an unheard pool line is never spoken, so it cannot take the
    // speech lock). The player stands in the office in earshot of the coffee pair (Amara and Tom)
    // while Keith and Jodie take breaks in the staff room out of earshot. Both pairs' breaks are
    // started by setting caffeine to 20 through window.__test.needs (said in the report). Counts: office
    // coffee turns, office turns blocked (a wait, or a picture while a voiced line holds the lock) by a
    // staff-room line, and staff-room lines spoken at all. It proves that a pair out of earshot holds no
    // speech lock against the pair the player is listening to.
    const minutes = Number(process.argv[6]) || 10;
    await enterRoom('it_room'); await t(600);
    await enterRoom('staff_room'); await t(1800);        // register Keith & Jodie
    await enterRoom('it_room'); await t(600);
    await enterRoom('office'); await t(1500);
    await standNear('office_coffee');
    await page.evaluate(() => {
        const ns = window.npcNeedsSystem; const STAFF = new Set(['keith', 'jodie']);
        window.__s4sl = { lock: null, officeTurns: 0, officeLines: 0, officePictures: 0, officeWaits: 0, blocked: 0, blockedByOffice: 0, staffSpoken: 0, staffSpokenHeard: 0 };
        if (ns && !ns.__s4slwrapped) {
            const origSpeak = ns._speak.bind(ns);
            ns._speak = function (npcId, line, until, info) {
                const r = origSpeak(npcId, line, until, info);
                const staff = STAFF.has(npcId);
                window.__s4sl.lock = { npcId, overheard: !!(info && info.overheard), until, staff };
                if (staff) { window.__s4sl.staffSpoken++; if (info && info.overheard) window.__s4sl.staffSpokenHeard++; }
                return r;
            };
            const origPick = ns._pickBark.bind(ns);
            ns._pickBark = function (s, topic, opts) {
                const pick = origPick(s, topic, opts);
                try {
                    if (s && !STAFF.has(s.npcId) && topic === 'coffee' && pick) {
                        const S = window.__s4sl; S.officeTurns++;
                        if (pick.line) S.officeLines++; else if (pick.picture) S.officePictures++; else if (pick.wait) S.officeWaits++;
                        if (pick.picture || pick.wait) {
                            const L = S.lock;
                            if (this.clockMs < this._speechUntil && L && this.clockMs < L.until) { if (L.staff) S.blocked++; else S.blockedByOffice++; }
                        }
                    }
                } catch (e) {}
                return pick;
            };
            ns.__s4slwrapped = true;
        }
    });
    const start = await clock();
    report.speechlock_forced = [];
    await shot('01-office');
    let shotMid = false;
    while (true) {
        const c = await clock(); if (c - start > minutes * 60000) break;
        // Start breaks when a pair is idle (needs set through the bridge: setup, not proof).
        const pairs = [['keith', 'jodie'], ['amara', 'tom']];
        for (const [a, b] of pairs) {
            const A = await npc(a), B = await npc(b);
            if (!A.phase && !B.phase && A.mode !== 'using' && B.mode !== 'using') {
                await page.evaluate(([a, b]) => { window.__test.needs.set(a, 'caffeine', 20); window.__test.needs.set(b, 'caffeine', 20); }, [a, b]);
                report.speechlock_forced.push({ clock_s: +(c / 1000).toFixed(0), pair: a + '+' + b });
            }
        }
        if (!shotMid && c - start > 120000) { await shot('02-office-mid'); shotMid = true; }
        if ((await playerRoom()) !== 'office') { await enterRoom('office'); await standNear('office_coffee'); }
        await t(8000);
    }
    await shot('03-after');
    const evs = await events();
    const sl = await page.evaluate(() => window.__s4sl);
    const staffChats = evs.filter(e => e.ev.startsWith('npc_chatted:staff_') && e.clockMs >= start);
    const officeChats = evs.filter(e => e.ev === 'npc_chatted:office_coffee' && e.clockMs >= start);
    report.speechlock = {
        minutes, ...sl,
        ratio: sl.officeTurns ? +(sl.blocked / sl.officeTurns).toFixed(4) : 0,
        threshold_1_in_20: sl.officeTurns ? sl.blocked > sl.officeTurns / 20 : false,
        enough_turns: sl.officeTurns >= 20,
        staff_chat_turns: staffChats.length,
        staff_chat_lines: staffChats.filter(e => e.data.line).length,
        staff_chat_pictures: staffChats.filter(e => e.data.picture).length,
        office_chat_events: officeChats.length,
        office_lines_heard: officeChats.filter(e => e.data.line && e.data.overheard).length,
        tasks: await tasks()
    };
}

report.hud_after = await hudState();
fs.writeFileSync(outDir + `report-sr-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1).slice(0, 7000));
await browser.close();
