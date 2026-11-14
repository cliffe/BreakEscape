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
// beats (each wants its own fresh game):
//   still_ask (default): stillness on the REAL needs clock (~10.5 min, no manual clock, sprite
//             sampled), two natural sips with the gulp sound read from npcOfficeVisuals.playLog,
//             five conversation opens incl. one mid-sip, suspend/resume, a no-ask close prints
//             nothing, then an ask-and-print with the player STAYING in IT: the copier runs ~6 s
//             after the close, its run sound plays in IT, one slot is revealed, no fetch, Neil never
//             moves. (M1/M2 R1: the manual clock is gone; the real clock is what a drift would show
//             up on.)
//   leave_after: ask, then leave IT within 6 s of the close; the page lands while the player is in
//             the office (the run sound is suppressed outside IT, played:false) and is still on the
//             tray on return.
//   reload_after: ask, wait for the page, reload: the tray is filed empty and a later close reprints
//             nothing (the onceOnly key is saved server-side once it fired).
//   reload_during: ask, reload ~2.5 s after the close (inside the 6 s delay): the pending print is
//             lost, but neil_print_asked is saved, so the NEXT close (a plain, no-ask close) prints
//             the page (R1 M3).
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
        if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); }
        loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20);
    });
}
const enterIT = async () => { const r = await page.evaluate(() => window.__test.enterRoom('it_room', { timeoutMs: 25000 })).catch(() => null); await t(1400); return !!(r && r.ok); };

// Sample Neil's real sprite (not npcPos), his mode and caffeine, and the needs clock.
const neil = () => page.evaluate(() => {
    const b = window.npcBehaviorManager && window.npcBehaviorManager.getBehavior('neil');
    const sp = b && b.sprite;
    const st = window.__test.needs.state('neil') || {};
    return sp ? { x: Math.round(sp.x * 10) / 10, y: Math.round(sp.y * 10) / 10, mode: st.mode, atPost: st.atPost, clockMs: window.npcNeedsSystem.clockMs } : null;
});
const neilLog = () => page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'neil').map(e => ({ t: e.t, ev: e.ev, target: e.target || e.objectId || e.item })));
// npcOfficeVisuals.playLog: the use/output sounds the engine fired, with whether they were audible.
const playLog = () => page.evaluate(() => ((window.npcOfficeVisuals && window.npcOfficeVisuals.playLog) || [])
    .filter(e => /neil|it_copier/.test(String(e.npcId) + String(e.objectId) + String(e.producerId)))
    .map(e => ({ t: e.t, key: e.key, objectId: e.objectId, producerId: e.producerId, played: e.played, volume: e.volume, room: e.roomId })));
const gv = () => page.evaluate(() => { const g = (window.gameState && window.gameState.globalVariables) || {}; return { asked: g.neil_print_asked, a: g.it_out_a_shown }; });
const revealed = () => page.evaluate(() => {
    const g = (window.gameState && window.gameState.globalVariables) || {};
    const asList = x => Array.isArray(x) ? x : Object.values(x || {});
    const out = [];
    for (const [rid, room] of Object.entries(window.rooms || {})) for (const o of asList(room && room.objects)) { const sd = o && o.scenarioData; if (sd && sd.id && sd.revealOnGlobal && g[sd.revealOnGlobal]) out.push(`${rid}:${sd.id}`); }
    return out;
});
const tasks = () => page.evaluate(() => Object.values((window.objectivesManager && window.objectivesManager.taskIndex) || {}).filter(x => x.status === 'completed' || x.status === 'completing').map(x => x.taskId || x.id));
const playerRoom = () => page.evaluate(() => window.currentPlayerRoom);

// A real conversation: approach, open, optionally pick the change-log choice, then exit.
async function talk({ ask = true } = {}) {
    const r = { ask };
    if ((await playerRoom()) !== 'it_room') { await enterIT(); }
    await page.evaluate(() => window.__test.moveToNear('neil', { timeoutMs: 20000 })).catch(() => {});
    await t(600);
    const t0 = Date.now();
    r.interact = await page.evaluate(() => window.__test.interact('neil')).catch(() => null);
    r.chatUp = await (async () => { for (let i = 0; i < 25; i++) { if (await page.evaluate(() => !!window.MinigameFramework?.currentMinigame)) return Date.now() - t0; await t(100); } return null; })();
    r.modeAtOpen = (await neil())?.mode;
    await t(1000);
    if (ask) { for (let i = 0; i < 8 && !(r.chA && r.chA.ok); i++) { r.chA = await page.evaluate(() => window.__test.minigame.choose('change log')).catch(() => null); if (r.chA && r.chA.ok) break; await page.keyboard.press('Space'); await t(500); } await t(900); }
    for (let i = 0; i < 8 && !(r.chB && r.chB.ok); i++) { r.chB = await page.evaluate(() => window.__test.minigame.choose('let you get on')).catch(() => null); if (r.chB && r.chB.ok) break; await page.keyboard.press('Space'); await t(500); }
    for (let i = 0; i < 30; i++) { if (!(await page.evaluate(() => !!window.MinigameFramework?.currentMinigame))) break; await page.keyboard.press('Space'); await t(300); }
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    r.closedAt = Date.now();
    r.closed = !(await page.evaluate(() => !!window.MinigameFramework?.currentMinigame));
    return r;
}
async function waitFor(fn, timeoutMs = 12000, stepMs = 250) { const end = Date.now() + timeoutMs; while (Date.now() < end) { if (await fn()) return true; await t(stepMs); } return false; }

await load();
await enterIT();
const spawn = await neil();
report.spawn = spawn;
await shot('00-start');

if (beat === 'still_ask') {
    // Real clock: ~10.5 min, sampling the sprite every 2 s; five opens at planned needs-seconds plus
    // one mid-sip; the first two sips are screenshotted and their gulp sound read from playLog.
    report.beats.still = await (async () => {
        const samples = []; const chats = [];
        const clock0 = spawn.clockMs; const realStart = Date.now();
        const plan = [70, 190, 330, 430, 560].map(s => s * 1000); let next = 0; let wantMidSip = true; let sipShots = 0; let maxDrift = 0;
        while (true) {
            const n = await neil(); if (!n) break;
            const el = n.clockMs - clock0;
            const d = Math.hypot(n.x - spawn.x, n.y - spawn.y); maxDrift = Math.max(maxDrift, d);
            samples.push({ el, d: Math.round(d * 10) / 10, mode: n.mode });
            const sipping = /using|job/.test(String(n.mode));
            if (sipping && sipShots < 2) { sipShots++; await shot(`0${sipShots}-sipping`); }
            if (sipping && wantMidSip) { wantMidSip = false; const c = await talk({ ask: false }); c.at = el; c.midSip = true; chats.push(c); continue; }
            if (next < plan.length && el >= plan[next]) { next++; const c = await talk({ ask: false }); c.at = el; chats.push(c); }
            if (el >= 630000 || Date.now() - realStart > 1500000) break;
            await t(2000);
        }
        const log = await neilLog();
        const sipTicks = log.filter(e => e.ev === 'used' && e.target === 'neil_mug').map(e => e.t);
        const moves = log.filter(e => /left_post|goto|returning/.test(e.ev)).length;
        const play = (await playLog()).filter(e => e.key === 'drink_gulp');
        return {
            realMs: Date.now() - realStart, needsMs: (await neil()).clockMs - clock0,
            spawn, maxDriftPx: Math.round(maxDrift * 10) / 10, still_ok: maxDrift <= 2,
            move_events: moves, sip_count: sipTicks.length,
            sip_clock_min: sipTicks.map(tk => +(tk * 250 / 60000).toFixed(2)),
            gulp_sounds: play.map(e => ({ played: e.played, volume: e.volume, room: e.room })),
            opens: chats.map(c => ({ at_ms: c.at, mid_sip: !!c.midSip, mode_at_open: c.modeAtOpen, chat_up_ms: c.chatUp, closed: c.closed })),
            opens_count: chats.length,
            // m7: the mid-sip open counts only when the mode at open really was a sip (job/using),
            // not merely that the sampler flagged it before talk() walked over and the sip ended.
            mid_sip_open: chats.some(c => c.midSip && /job|using/.test(String(c.modeAtOpen))),
            see_neil_sip: (await tasks()).includes('see_neil_sip')
        };
    })();

    // Suspend then resume: he must stay on his spawn (resume walks home unless within HOME_EPS).
    report.beats.suspend_resume = await (async () => {
        const before = await neil();
        await page.evaluate(() => window.npcNeedsSystem.control('neil', 'suspend')); await t(1500);
        const suspended = (await neil()).mode;
        await page.evaluate(() => window.npcNeedsSystem.control('neil', 'resume')); await t(4000);
        const after = await neil();
        const drift = Math.round(Math.hypot(before.x - after.x, before.y - after.y) * 10) / 10;
        return { before, after, suspended, drift_px: drift, stayed_ok: drift <= 2 };
    })();

    // A conversation where he is NOT asked prints nothing.
    report.beats.no_ask_no_print = await (async () => {
        const conv = await talk({ ask: false }); await t(9000);
        return { conv_closed: conv.closed, it_out_a_shown: (await gv()).a, revealed: await revealed() };
    })();

    // Ask, close, STAY in IT: the copier runs ~6 s later (its run sound audible here), one slot
    // revealed, no fetch, Neil never moves.
    report.beats.ask_and_print = await (async () => {
        const p0 = await neil();
        const conv = await talk({ ask: true });
        const asked = (await gv()).asked;
        const landed = await waitFor(async () => (await gv()).a, 12000, 300);
        const closeToRevealMs = Date.now() - conv.closedAt;
        await t(1200);
        const p1 = await neil();
        const drift = Math.round(Math.hypot(p1.x - p0.x, p1.y - p0.y) * 10) / 10;
        const fetches = (await neilLog()).filter(e => e.ev === 'print_fetched').length;
        const copierRun = (await playLog()).filter(e => e.producerId === 'it_copier' || /copier/.test(String(e.key)));
        await page.evaluate(() => window.__test.moveToNear('it_out_a', { timeoutMs: 15000 })).catch(() => {});
        await t(800); await shot('03-page-on-tray');
        return {
            conv_ask_ok: conv.chA && conv.chA.ok, neil_print_asked: asked, page_landed: landed,
            close_to_reveal_ms: landed ? closeToRevealMs : null, player_room_at_reveal: await playerRoom(),
            it_out_a_shown: (await gv()).a, revealed: await revealed(),
            see_neils_page: (await tasks()).includes('see_neils_page'),
            copier_run: copierRun, neil_drift_px: drift, neil_still_ok: drift <= 2, fetch_events: fetches
        };
    })();
}

if (beat === 'leave_after') {
    // Ask, then leave IT within 6 s of the close: the page lands while the player is in the office
    // (run sound suppressed outside IT), and is still on the tray on return.
    report.beats.leave_after = await (async () => {
        const conv = await talk({ ask: true });
        const left = await page.evaluate(() => window.__test.enterRoom('office', { timeoutMs: 15000 })).catch(() => null);
        const leftAfterMs = Date.now() - conv.closedAt;
        const roomAfter = await playerRoom();
        const landed = await waitFor(async () => (await gv()).a, 12000, 250);
        const closeToRevealMs = Date.now() - conv.closedAt;
        const roomAtReveal = await playerRoom();
        const copierRun = (await playLog()).filter(e => e.producerId === 'it_copier' || /copier/.test(String(e.key)));
        await shot('01-page-landed-away');
        await enterIT(); await t(1200);
        const backRevealed = await revealed();
        await page.evaluate(() => window.__test.moveToNear('it_out_a', { timeoutMs: 15000 })).catch(() => {});
        await t(800); await shot('02-page-on-tray-return');
        return {
            left_ok: !!(left && left.ok), left_after_ms: leftAfterMs, left_within_6s: leftAfterMs <= 6000,
            room_after_leave: roomAfter, page_landed: landed, close_to_reveal_ms: landed ? closeToRevealMs : null,
            player_room_at_reveal: roomAtReveal, copier_run_only_in_it: copierRun,
            back_in_it: await playerRoom(), it_out_a_shown: (await gv()).a, revealed_on_return: backRevealed,
            see_neils_page: (await tasks()).includes('see_neils_page')
        };
    })();
}

if (beat === 'reload_after') {
    report.beats.reload_after = await (async () => {
        const conv = await talk({ ask: true });
        const landed = await waitFor(async () => (await gv()).a, 12000, 300);
        const before = { shown: (await gv()).a, revealed: await revealed() };
        await shot('01-before-reload');
        await load(); await enterIT(); await t(2500);
        const after = { shown: (await gv()).a, revealed: await revealed() };
        await shot('02-after-reload');
        // The change-log choice is now gone (asked + saved), so this is a plain close; the onceOnly
        // mapping already fired, so nothing reprints.
        const conv2 = await talk({ ask: false }); await t(9000);
        return { page_landed: landed, before, after_reload: after, second_close: conv2.closed, second_shown: (await gv()).a, second_revealed: await revealed() };
    })();
}

if (beat === 'reload_during') {
    report.beats.reload_during = await (async () => {
        const conv = await talk({ ask: true });
        await t(2500); // reload well inside the 6 s delay
        const sinceClose = Date.now() - conv.closedAt;
        const armed = { asked: (await gv()).asked, shown: (await gv()).a };
        await load(); await enterIT(); await t(8000);
        const afterReload = { asked: (await gv()).asked, shown: (await gv()).a, revealed: await revealed() };
        // A plain (no-ask) close after the reload: neil_print_asked is saved, so the mapping fires now.
        const conv2 = await talk({ ask: false });
        const printed = await waitFor(async () => (await gv()).a, 12000, 300);
        await shot('01-after-next-close');
        return {
            close_to_reload_ms: sinceClose, neil_print_asked_before_reload: armed.asked, shown_before_reload: armed.shown,
            after_reload: afterReload, next_close_printed: printed, next_close_revealed: await revealed(),
            see_neils_page: (await tasks()).includes('see_neils_page'), note: 'R1 M3: the pending print is lost on reload, but the ask is saved, so the next close prints'
        };
    })();
}

fs.writeFileSync(outDir + `report-neil-${beat}-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ beat, beats: report.beats, errs: errs.slice(0, 5) }, null, 1).slice(0, 8000));
await browser.close();
