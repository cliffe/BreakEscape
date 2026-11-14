// SIMS-3 live proof (OFFICE_LIFE_SIMS_BUILD_PLAN 5.3): Neil, the still NPC who prints by command
// (m02's Gary pattern). Drives scenarios/test_needs_sims through the test bridge; every
// conversation is opened and closed through its own UI (never a synthetic emit); objectives tick
// from the real npc_used / object_revealed events.
//
//   node tools/playtest/needs-sims-neil.mjs <gameId> [port] [beat] [outDir]
//
// Games come from tools/playtest/new-game.rb test_needs_sims (it has a Mission row). Each reload
// beat is cleanest in its own fresh game (a reveal/triggeredEvents key is saved to the server).
//
// beat: still_ask (default; stillness + sips + suspend/resume + ask-and-print + leave-within-6s,
//       all in one game), reload_after (reload after the page lands), reload_during (reload inside
//       the 6 s delay). The needs clock runs at ~1x, so the 10-minute stillness window and the two
//       natural sips (2:30, 7:30) are driven with the bridge's manual clock (needs.setManualClock +
//       needs.step); this is a clock control, not a trigger emit, and is noted in the report.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';

const [gid, port = '3093', beat = 'still_ask',
    outDir = '/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/officelife-sims/s3/'] = process.argv.slice(2);
if (!gid) { console.error('usage: needs-sims-neil.mjs <gameId> [port] [beat] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const clog = []; page.on('console', m => { const x = m.text(); if (/conversation_closed:neil|it_copier|it_out_a|object_revealed|fires in|Not scheduling|print/.test(x)) clog.push([Date.now(), x.slice(0, 160)]); });
const report = { gid, port, beat, beats: {}, errs };
const t = ms => page.waitForTimeout(ms);
const shot = n => page.screenshot({ path: outDir + `neil-${beat}-${n}-${gid}.png` });

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
    await page.evaluate(() => {
        const loop = window.game.sys.game.loop, raf = loop.raf;
        if (!raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); }
        loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20);
    });
    await page.evaluate(() => window.__test.enterRoom('it_room', { timeoutMs: 25000 })).catch(() => {});
    await t(1500);
}

const neilPos = () => page.evaluate(() => { const p = window.npcNeedsSystem.world.npcPos('neil'); return p && { x: Math.round(p.x), y: Math.round(p.y) }; });
const snap = () => page.evaluate(() => {
    const gv = (window.gameState && window.gameState.globalVariables) || {};
    const tix = (window.objectivesManager && Object.values(window.objectivesManager.taskIndex || {})) || [];
    const asList = x => Array.isArray(x) ? x : Object.values(x || {});
    const revealed = [];
    for (const [rid, room] of Object.entries(window.rooms || {})) for (const o of asList(room && room.objects)) if (o && o.id && o.revealOnGlobal && gv[o.revealOnGlobal]) revealed.push(`${rid}:${o.id}`);
    const st = window.__test.needs.state('neil') || {};
    return {
        clockMs: window.npcNeedsSystem && window.npcNeedsSystem.clockMs,
        neil: { mode: st.mode, atPost: st.atPost, scriptSuspended: st.scriptSuspended },
        globals: { neil_print_asked: gv.neil_print_asked, neil_ko: gv.neil_ko, it_out_a_shown: gv.it_out_a_shown },
        revealed,
        tasks: tix.filter(x => x.status === 'completed').map(x => x.taskId || x.id),
        tasksCompleting: tix.filter(x => x.status === 'completing').map(x => x.taskId || x.id),
        neilLog: window.__test.needs.log().filter(e => e.npc === 'neil').slice(-18).map(e => `${e.t} ${e.ev} ${e.target || e.objectId || ''}`.trim())
    };
});

async function waitUntil(fn, timeoutMs = 20000, stepMs = 400) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) { const v = await fn(); if (v) return v; await t(stepMs); }
    return null;
}

// A real conversation with Neil: approach, open, pick the change-log choice (if ask), then exit.
async function neilConversation({ ask = true } = {}) {
    const room = await page.evaluate(() => window.currentPlayerRoom);
    if (room && room !== 'it_room') { await page.evaluate(() => window.__test.enterRoom('it_room')).catch(() => {}); await t(1200); }
    const clogBase = clog.length;
    await page.evaluate(() => window.__test.moveToNear('neil', { timeoutMs: 20000 })).catch(() => {});
    await t(600);
    const opened = await page.evaluate(() => window.__test.interact('neil'));
    await t(1600);
    const chatUp = await page.evaluate(() => { try { return !!window.__test.minigame.getState(); } catch (e) { return false; } });
    let chA = null, chB = null;
    if (opened && opened.ok && chatUp) {
        if (ask) {
            for (let i = 0; i < 8 && !(chA && chA.ok); i++) {
                chA = await page.evaluate(() => window.__test.minigame.choose('change log'));
                if (chA && chA.ok) break;
                await page.keyboard.press('Space'); await t(500);
            }
            await t(900);
        }
        for (let i = 0; i < 8 && !(chB && chB.ok); i++) {
            chB = await page.evaluate(() => window.__test.minigame.choose('let you get on'));
            if (chB && chB.ok) break;
            await page.keyboard.press('Space'); await t(500);
        }
        await t(600);
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    }
    const closedByUi = await waitUntil(async () => (await page.evaluate(() => !window.MinigameFramework?.currentMinigame)) ? true : null, 10000, 300);
    const closedEmit = await waitUntil(async () => clog.slice(clogBase).find(c => /conversation_closed:neil/.test(c[1])) || null, 6000, 300);
    return { interact_ok: opened && opened.ok, chat_up: chatUp, choose_ask: ask ? (chA && chA.ok) : 'n/a', choose_exit: chB && chB.ok, chat_closed: !!closedByUi, close_emit_seen: !!closedEmit, closedAt: Date.now() };
}

await load();
await shot('00-start');

if (beat === 'still_ask') {
    // Stillness + natural sips at 2:30 and 7:30, driven on the manual needs clock.
    report.beats.still = await (async () => {
        const spawn = await neilPos();
        await page.evaluate(() => window.__test.needs.setManualClock(true));
        const samples = []; const sips = [];
        let maxDrift = 0;
        // Advance to 10 min of needs clock in 10 s chunks, sampling Neil's position each chunk.
        for (let ms = 0; ms < 600000; ms += 10000) {
            await page.evaluate(() => window.__test.needs.step(10000));
            await t(60);
            const p = await neilPos();
            const d = p && spawn ? Math.round(Math.hypot(p.x - spawn.x, p.y - spawn.y)) : 0;
            maxDrift = Math.max(maxDrift, d);
            samples.push({ d });
        }
        const s = await snap();
        for (const e of s.neilLog) { const m = /^(\d+) used neil_mug/.exec(e); if (m) sips.push(+m[1]); }
        // Read every sip clock time from the full log (ticks are 250 ms).
        const sipTicks = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'neil' && e.ev === 'used' && e.target === 'neil_mug').map(e => e.t));
        const sipClockMin = sipTicks.map(tk => +(tk * 250 / 60000).toFixed(2));
        const moves = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'neil' && /left_post|goto|returning/.test(e.ev)).length);
        await page.evaluate(() => window.__test.needs.setManualClock(false));
        await shot('01-sipping');
        return { spawn, maxDriftPx: maxDrift, still_ok: maxDrift <= 2, sip_count: sipTicks.length, sip_clock_min: sipClockMin, first_sip: sipClockMin[0], second_sip: sipClockMin[1], move_events: moves, see_neil_sip: s.tasks.includes('see_neil_sip') };
    })();

    // Suspend then resume: he must stay on his spawn (resume walks home unless within HOME_EPS).
    report.beats.suspend_resume = await (async () => {
        const before = await neilPos();
        await page.evaluate(() => window.npcNeedsSystem.control('neil', 'suspend'));
        await t(1500);
        const suspended = await page.evaluate(() => window.__test.needs.state('neil').scriptSuspended);
        await page.evaluate(() => window.npcNeedsSystem.control('neil', 'resume'));
        await t(4000);
        const after = await neilPos();
        const drift = (before && after) ? Math.round(Math.hypot(before.x - after.x, before.y - after.y)) : null;
        return { before, after, suspended, drift_px: drift, stayed_ok: drift != null && drift <= 2 };
    })();

    // A conversation where he is NOT asked prints nothing.
    report.beats.no_ask_no_print = await (async () => {
        const conv = await neilConversation({ ask: false });
        await t(9000);
        const s = await snap();
        return { conv_closed: conv.chat_closed, it_out_a_shown: s.globals.it_out_a_shown, revealed: s.revealed };
    })();

    // Ask Neil, close: the copier runs ~6 s later, one slot revealed, no fetch; Neil never moves.
    report.beats.ask_and_print = await (async () => {
        const posBefore = await neilPos();
        const conv = await neilConversation({ ask: true });
        const asked = await snap();
        const ticked = await waitUntil(async () => (await snap()).globals.it_out_a_shown ? true : null, 12000, 500);
        await t(1500);
        const printed = await snap();
        const posAfter = await neilPos();
        const drift = (posBefore && posAfter) ? Math.round(Math.hypot(posBefore.x - posAfter.x, posBefore.y - posAfter.y)) : null;
        const fetch = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'neil' && /print_fetched|job_start/.test(e.ev)).length);
        await shot('02-page-on-tray');
        const closeToReveal = printed.clockMs;
        return { conv_ask_ok: conv.choose_ask, neil_print_asked: asked.globals.neil_print_asked, page_landed: !!ticked, it_out_a_shown: printed.globals.it_out_a_shown, revealed: printed.revealed, see_neils_page: printed.tasks.includes('see_neils_page') || printed.tasksCompleting.includes('see_neils_page'), neil_drift_px: drift, neil_still_ok: drift != null && drift <= 2, fetch_events: fetch };
    })();

    // Leave IT within 6 s of a (second) close: the page is still there on return. Use a fresh ask is
    // onceOnly-blocked, so this checks the already-landed page persists across a room change.
    report.beats.leave_keeps_page = await (async () => {
        await page.evaluate(() => window.__test.enterRoom('office')).catch(() => {});
        await t(3000);
        await page.evaluate(() => window.__test.enterRoom('it_room')).catch(() => {});
        await t(1500);
        const s = await snap();
        return { back_in_it: await page.evaluate(() => window.currentPlayerRoom), it_out_a_shown: s.globals.it_out_a_shown, revealed: s.revealed };
    })();
}

if (beat === 'reload_after') {
    // Ask, close, wait for the page, reload: the tray is filed empty and nothing reprints.
    report.beats.reload_after = await (async () => {
        const conv = await neilConversation({ ask: true });
        const landed = await waitUntil(async () => (await snap()).globals.it_out_a_shown ? true : null, 12000, 500);
        const before = await snap();
        await shot('01-before-reload');
        await load();
        await t(2500);
        const after = await snap();
        await shot('02-after-reload');
        // A second ask must print nothing (the mapping is onceOnly and saved server-side).
        const conv2 = await neilConversation({ ask: true });
        await t(9000);
        const second = await snap();
        return { page_landed: !!landed, before_revealed: before.revealed, after_reload_shown: after.globals.it_out_a_shown, after_reload_revealed: after.revealed, second_ask_ok: conv2.choose_ask, second_shown: second.globals.it_out_a_shown, second_revealed: second.revealed };
    })();
}

if (beat === 'reload_during') {
    // Ask, close, reload within the 6 s delay: no page, nothing reprints after the reload (expected).
    report.beats.reload_during = await (async () => {
        const conv = await neilConversation({ ask: true });
        const closeAt = conv.closedAt;
        // reload ~2.5 s after the close, well inside the 6 s delay
        await t(2500);
        const sinceClose = Date.now() - closeAt;
        const armed = await snap();
        await load();
        await t(8000);
        const after = await snap();
        await shot('01-after-reload');
        return { close_to_reload_ms: sinceClose, neil_print_asked_before: armed.globals.neil_print_asked, after_reload_shown: after.globals.it_out_a_shown, after_reload_revealed: after.revealed, note: 'expected: a reload during the delay loses the pending print' };
    })();
}

fs.writeFileSync(outDir + `report-neil-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ beat, beats: report.beats, errs: errs.slice(0, 5) }, null, 1).slice(0, 7000));
await browser.close();
