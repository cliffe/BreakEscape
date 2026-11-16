// Live proof for NPC carried items slice C (NPC_CARRIED_ITEMS_SLICE_C_PLAN.md section 5):
// a reload in the middle of a carry ends the carry, puts the object back where it was
// picked up from, and the NPC repeats the carry. Headless, setFPS(20) with fixed steps on.
// A reload is about:blank then back to the game URL. Each beat records every update_room
// status, page and console errors, the needs job snapshot used to time the reload, and the
// room fetch and client world before and after the reload.
//
//   node tools/playtest/npc-carry-reload-proof.mjs <scenario> <gameId> <port> <point> [outFile]
//
//   scenario test_needs_sims     points T1 T2
//   scenario lab_physical_pentest points L1 L2 L3 L4 L5
//
// A fresh game per beat, from tools/playtest/new-game.rb. Drive only ids printed in this run.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-carry-c/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [scenario, gid, port = '3091', point = 'T1', outFile = `./reload-${scenario}-${point}-${gid}.json`] = process.argv.slice(2);
if (!scenario || !gid) { console.error('usage: npc-carry-reload-proof.mjs <scenario> <gameId> <port> <point> [outFile]'); process.exit(2); }

const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [], reqs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
page.on('response', async r => {
    const q = r.request();
    if (q.method() !== 'POST' || !/update_room/.test(r.url())) return;
    let body = {}; try { body = JSON.parse(q.postData() || '{}'); } catch (e) { /* not json */ }
    reqs.push({ action: body.actionType || body.action_type, data: body.data || body, status: r.status() });
});
const t = ms => page.waitForTimeout(ms);
const report = { scenario, gid, point, steps: {}, reqs, errs };

async function boot() {
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
    await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcNeedsSystem, null, { timeout: 90000 });
    await t(2000);
    for (let i = 0; i < 8; i++) {
        const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi || window.MinigameFramework?.currentMinigame); });
        if (!busy) break;
        await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} });
        await page.keyboard.press('Escape'); await t(300);
        await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
        await t(300);
    }
    await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
}

// The room fetch: every carried object in the room and what the NPC holds.
const fetchRoom = (rid, re) => page.evaluate(async ([g, rid, re]) => {
    const rx = new RegExp(re);
    const r = await fetch(`/break_escape/games/${g}/room/${rid}`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return { status: r.status };
    const j = await r.json();
    const room = j.room || j;
    const objs = Array.isArray(room.objects) ? room.objects : Object.values(room.objects || {});
    const items = objs.filter(o => rx.test(o.id || '')).map(o => ({ id: o.id, position: o.position || { x: o.x, y: o.y } }));
    const npcs = (room.npcs || []).map(n => ({ id: n.id, itemsHeld: (n.itemsHeld || []).map(i => i.id) })).filter(n => n.itemsHeld.length);
    return { status: r.status, items, npcs };
}, [gid, rid, re.source]);

const npcState = id => page.evaluate(id => {
    const s = window.npcNeedsSystem.states.get(id);
    const rec = window.npcManager?.getNPC?.(id);
    return {
        job: s?.job ? { kind: s.job.kind, phase: s.job.phase, carrying: !!s.job.carrying, itemId: s.job.itemId, target: s.job.targetId } : null,
        held: Object.keys(rec?._needsCarried || {}),
        itemsHeld: (rec?.itemsHeld || []).map(i => i.id),
        room: window.npcBehaviorManager?.getBehavior?.(id)?.roomId
    };
}, id);

const globals = () => page.evaluate(() => ({ ...(window.gameState?.globalVariables || {}) }));
const inventoryIds = () => page.evaluate(() => (window.inventory?.items || []).map(i => i?.scenarioData?.id || i?.objectId).filter(Boolean));
const carriedWorld = re => page.evaluate(re => {
    const rx = new RegExp(re);
    const out = [];
    for (const [rid, room] of Object.entries(window.rooms || {})) for (const [k, o] of Object.entries(room.objects || {})) {
        const id = String(o.objectId || o.scenarioData?.id || k);
        if (rx.test(id)) out.push({ room: rid, id, x: Math.round(o.x), y: Math.round(o.y), cx: Math.round(o.x + (o.displayWidth || 0) / 2), cy: Math.round(o.y + (o.displayHeight || 0) / 2), visible: o.visible });
    }
    return out;
}, re.source);

// Wait up to ms for an NPC-state predicate, polling the real clock.
async function waitFor(id, pred, ms = 300000, step = 1500) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const s = await npcState(id);
        if (pred(s)) return s;
        await t(step);
    }
    return null;
}
async function waitGlobal(name, ms = 300000, step = 1500) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const g = await globals();
        if (g[name]) return g;
        await t(step);
    }
    return null;
}
async function reload(reNeed) {
    await page.goto('about:blank');
    await boot();
    return { room: null, world: await carriedWorld(reNeed) };
}

// ── test_needs_sims (Grace carries the office mugs to the washing-up tray) ──
async function runNeedsSims() {
    const RE = /mugs/;
    await boot();
    report.rooms = [];
    for (const r of ['kitchen', 'office', 'lounge', 'office']) report.rooms.push([r, (await page.evaluate(r => window.__test.enterRoom(r), r).catch(e => ({ err: String(e) })))?.ok ?? null]);
    report.steps.before = { office: await fetchRoom('office', RE), kitchen: await fetchRoom('kitchen', RE) };

    // Grace picks up the mugs through the real needs AI.
    const carrying = await waitFor('grace', s => s.job?.carrying || s.held.length, 300000);
    report.steps.carrying = carrying;
    if (!carrying) { report.fail = 'Grace never picked up the mugs'; return; }

    if (point === 'T2') {
        // Suspend her mid-carry so she puts the mug down in the kitchen, then let her carry
        // it again from the kitchen, and reload mid-carry.
        report.steps.suspend = await page.evaluate(() => window.npcNeedsSystem.control('grace', 'suspend'));
        await waitFor('grace', s => !s.held.length, 60000);
        await t(2500);
        report.steps.putDown = { kitchen: await fetchRoom('kitchen', RE), grace: await npcState('grace') };
        report.steps.resume = await page.evaluate(() => window.npcNeedsSystem.control('grace', 'resume'));
        const carry2 = await waitFor('grace', s => (s.job?.carrying || s.held.length) && s.room === 'kitchen', 300000);
        report.steps.carrying2 = carry2;
        if (!carry2) { report.fail = 'Grace did not re-carry from the kitchen'; return; }
    } else {
        // T1: reload while she is walking the mug to the target.
        await waitFor('grace', s => s.job?.phase === 'goto_target', 60000);
    }
    report.steps.preReload = { grace: await npcState('grace'), office: await fetchRoom('office', RE), kitchen: await fetchRoom('kitchen', RE) };

    report.steps.reload = await reload(RE);
    // A reload restarts the player in the office with only the office loaded, and the needs
    // system sees only loaded rooms (README step 2): the washing-up tray, the water and the
    // rest spots are all in the kitchen and lounge. So walk through both doors again, as a
    // real player would, or Grace has no target and parks every need with no_source.
    // REENTER=0 skips this, for a control run that shows the gap.
    report.steps.reEnter = [];
    if (process.env.REENTER !== '0') {
        for (const r of ['kitchen', 'office', 'lounge', 'office']) report.steps.reEnter.push([r, (await page.evaluate(r => window.__test.enterRoom(r), r).catch(e => ({ err: String(e) })))?.ok ?? null]);
    }
    report.steps.afterReload = { office: await fetchRoom('office', RE), kitchen: await fetchRoom('kitchen', RE), grace: await npcState('grace') };

    // The NPC re-notices the object and repeats the carry (no driver call).
    const again = await waitFor('grace', s => {
        const log = null; return s.job?.carrying || s.held.length;
    }, Number(process.env.REPICK_MS || 120000));
    report.steps.repeats = again;
    report.graceLog = await page.evaluate(() => (window.npcNeedsSystem.getLog?.() || []).filter(e => e.npc === 'grace').slice(-20)).catch(() => null);
}

// ── lab_physical_pentest (Sofia carries the dropped BadUSB to her PC, usb_foothold) ──
async function runLab() {
    const RE = /kit_deviceB/;
    await boot();
    // Take the BadUSB from the kit table, carry it east to the open-plan floor, drop it.
    report.nav = [];
    report.nav.push(['pickup', await page.evaluate(() => window.__test.interact('kit_deviceB')).catch(e => ({ err: String(e) }))]);
    for (const r of ['reception', 'hall', 'open_plan']) report.nav.push([r, await page.evaluate(r => window.__test.enterRoom(r), r).catch(e => ({ err: String(e) }))]);
    await t(1000);
    report.steps.held = await inventoryIds();
    report.nav.push(['drop', await page.evaluate(() => window.__test.inventoryAct('kit_deviceB', 'Drop here')).catch(e => ({ err: String(e) }))]);
    await t(1500);
    report.steps.dropped = { open_plan: await fetchRoom('open_plan', RE), world: await carriedWorld(RE) };

    // A reload restarts the player in the start room, and Sofia's room is not simulated until it
    // is loaded again, so walk back to open_plan after each reload (as a real player would).
    const needReload = async (re) => {
        report.steps.reload = await reload(re);
        report.steps.reEnter = [];
        for (const r of ['reception', 'hall', 'open_plan']) report.steps.reEnter.push([r, (await page.evaluate(r => window.__test.enterRoom(r), r).catch(e => ({ err: String(e) })))?.ok ?? null]);
        await t(1500);
        report.steps.reload.world = await carriedWorld(re);
    };

    if (point === 'L1') {
        // Reload after the drop, before Sofia moves.
        report.steps.preReload = { sofia: await npcState('lord'), open_plan: await fetchRoom('open_plan', RE) };
        await needReload(RE);
    } else if (point === 'L2') {
        // Reload right after Sofia picks it up (walking).
        const walk = await waitFor('lord', s => s.job?.carrying || s.held.length, 300000);
        report.steps.preReload = { sofia: walk, open_plan: await fetchRoom('open_plan', RE) };
        if (!walk) { report.fail = 'Sofia never picked up the BadUSB'; return; }
        await needReload(RE);
    } else if (point === 'L3') {
        // Reload while the use is running.
        const using = await waitFor('lord', s => s.job?.phase === 'using', 300000);
        report.steps.preReload = { sofia: using, open_plan: await fetchRoom('open_plan', RE) };
        if (!using) { report.fail = 'Sofia never reached the using phase'; return; }
        await needReload(RE);
    } else if (point === 'L4') {
        // Reload as soon as the use completes (kp_usb_foothold set). 200 ms is not reachable
        // headless; the real gap is recorded.
        const g = await waitGlobal('kp_usb_foothold', 300000, 300);
        report.steps.preReload = { usedAt: Date.now(), globalsHadFoothold: !!g, sofia: await npcState('lord') };
        if (!g) { report.fail = 'kp_usb_foothold never set'; return; }
        await needReload(RE);
    } else if (point === 'L5') {
        // Reload after the remote session has arrived.
        await waitGlobal('kp_usb_foothold', 300000, 300);
        const inv = await waitFor('lord', () => true, 1); // noop, just settle
        for (let i = 0; i < 40; i++) { if ((await inventoryIds()).includes('records_remote_session')) break; await t(1500); }
        report.steps.preReload = { inventory: await inventoryIds(), globals: pick(await globals()) };
        await needReload(RE);
    }

    // After the reload, usb_foothold must still complete: wait for the global and the grant.
    report.steps.afterReload = { open_plan: await fetchRoom('open_plan', RE), sofia: await npcState('lord') };
    const g = await waitGlobal('kp_usb_foothold', 300000, 500);
    for (let i = 0; i < 60; i++) { if ((await inventoryIds()).includes('records_remote_session')) break; await t(1500); }
    report.steps.outcome = {
        kp_usb_foothold: !!(g && g.kp_usb_foothold),
        remoteSessionInInventory: (await inventoryIds()).includes('records_remote_session'),
        world: await carriedWorld(RE),
        open_plan: await fetchRoom('open_plan', RE)
    };
    report.sofiaLog = await page.evaluate(() => (window.npcNeedsSystem.getLog?.() || []).filter(e => e.npc === 'lord').slice(-20)).catch(() => null);
}

const pick = g => Object.fromEntries(Object.entries(g).filter(([k]) => /usb|foothold|dropped/.test(k)));

try {
    if (scenario === 'test_needs_sims') await runNeedsSims();
    else if (scenario === 'lab_physical_pentest') await runLab();
    else report.fail = `unknown scenario ${scenario}`;
} catch (e) {
    report.fail = 'exception: ' + String(e).slice(0, 300);
}

// Pass summary: no 4xx/5xx on carry actions, no page errors, exactly one of each carried object.
const carryActions = reqs.filter(r => /carry_object|put_down_object|consume_carried|ko_drop/.test(r.action || ''));
report.carryActionStatuses = carryActions.map(r => `${r.action}:${r.status}`);
report.badCarryStatuses = carryActions.filter(r => r.status >= 400).map(r => `${r.action}:${r.status}`);

await page.screenshot({ path: outFile.replace(/\.json$/, '.png') });
fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ point, fail: report.fail || null, badCarryStatuses: report.badCarryStatuses, errs: report.errs.slice(0, 5), outcome: report.steps.outcome, repeats: report.steps.repeats, afterReload: report.steps.afterReload }, null, 1));
await browser.close();
