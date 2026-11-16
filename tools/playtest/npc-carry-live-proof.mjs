// Live proof (NPC_CARRIED_ITEMS_PLAN.md): an NPC carry through the real game client on
// scenarios/test_needs_sims. Grace notices the office mugs, picks them up, carries them to the washing-up
// tray and consumes them (beat consume), or is suspended mid-carry so the client sets them down (beat drop).
// Records every carry_object / put_down_object / consume_carried / remove_object request and its status,
// reads the room fetch, then reloads (about:blank, then back) and reads it again. Headless, setFPS(20) with
// fixed steps on.
//   node tools/playtest/npc-carry-live-proof.mjs <gameId> [port] [consume|drop] [outFile]
// Games come from tools/playtest/new-game.rb test_needs_sims; use a fresh game per beat.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3095', beat = 'consume', outFile = `./carry-${beat}-${process.argv[2]}.json`] = process.argv.slice(2);
if (!gid) { console.error('usage: npc-carry-live-proof.mjs <gameId> [port] [consume|drop] [outFile]'); process.exit(2); }
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
const report = { gid, beat, steps: {}, reqs, errs };

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
// The room fetch: where every mug is, and what Grace holds
const fetchRoom = rid => page.evaluate(async ([g, rid]) => {
    const r = await fetch(`/break_escape/games/${g}/room/${rid}`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return { status: r.status };
    const j = await r.json();
    const room = j.room || j;
    const objs = Array.isArray(room.objects) ? room.objects : Object.values(room.objects || {});
    const mugs = objs.filter(o => /mugs/.test(o.id || '')).map(o => { const c = { ...o }; delete c.observations; delete c.contents; return c; });
    const npcs = (room.npcs || []).filter(n => n.id === 'grace').map(n => ({ id: n.id, itemsHeld: (n.itemsHeld || []).map(i => i.id) }));
    return { status: r.status, mugs, npcs };
}, [gid, rid]);
const graceState = () => page.evaluate(() => { const s = window.npcNeedsSystem.states.get('grace'); const rec = window.npcManager?.getNPC?.('grace'); return { job: s?.job ? { kind: s.job.kind, phase: s.job.phase, carrying: !!s.job.carrying, itemId: s.job.itemId, target: s.job.targetId } : null, held: Object.keys(rec?._needsCarried || {}), itemsHeld: (rec?.itemsHeld || []).map(i => i.id), room: window.npcBehaviorManager?.getBehavior?.('grace')?.roomId }; });

await boot();
// Open kitchen and lounge so the needs system sees them, then settle back in the office
report.rooms = [];
for (const r of ['kitchen', 'office', 'lounge', 'office']) report.rooms.push([r, (await page.evaluate(r => window.__test.enterRoom(r), r).catch(e => ({ err: String(e) })))?.ok ?? null]);
report.steps.before = { office: await fetchRoom('office'), kitchen: await fetchRoom('kitchen') };

// Wait (real clock, up to ~5 min) until Grace is carrying the mugs
let carrying = null;
for (let i = 0; i < 150 && !carrying; i++) {
    await t(2000);
    const g = await graceState();
    if (g.job?.carrying || g.held.length) carrying = g;
}
report.steps.carrying = carrying;
if (!carrying) { report.fail = 'Grace never picked up the mugs'; }
else {
    await t(1500);
    report.steps.carryFetch = { office: await fetchRoom('office'), kitchen: await fetchRoom('kitchen'), grace: await graceState() };
    if (beat === 'ko') {
        // KO Grace mid-carry: make her hostile so she has a combat state, then knock her
        // out. dropNPCItems ends the needs-carry as a KO put-down (ko_drop_carried), so the
        // mug lands once on the KO room floor and npcCarry clears.
        report.steps.ko = await page.evaluate(() => {
            try { window.npcHostileSystem?.setNPCHostile?.('grace', true); } catch (e) {}
            const before = window.npcHostileSystem?.getState?.('grace');
            const ok = window.npcHostileSystem?.damageNPC?.('grace', 99999);
            return { ok, isKO: window.npcHostileSystem?.isNPCKO?.('grace'), room: window.npcBehaviorManager?.getBehavior?.('grace')?.roomId, hadState: !!before };
        });
        await t(4000);
    } else if (beat === 'drop') {
        report.steps.suspend = await page.evaluate(() => window.npcNeedsSystem.control('grace', 'suspend'));
        await t(3000);
    } else {
        for (let i = 0; i < 90; i++) { await t(2000); const g = await graceState(); if (!g.held.length) break; }
        await t(2500);
    }
    report.steps.after = { grace: await graceState(), office: await fetchRoom('office'), kitchen: await fetchRoom('kitchen') };
    report.graceLog = await page.evaluate(() => (window.npcNeedsSystem.getLog?.() || []).filter(e => e.npc === 'grace').slice(-30)).catch(() => null);
    // Reload through about:blank, then back
    await page.goto('about:blank');
    await boot();
    report.steps.reload = { office: await fetchRoom('office'), kitchen: await fetchRoom('kitchen'), lounge: await fetchRoom('lounge') };
    report.steps.reloadClient = await page.evaluate(() => {
        const out = [];
        for (const [rid, room] of Object.entries(window.rooms || {})) for (const [k, o] of Object.entries(room.objects || {})) if (/mugs/.test(String(o.objectId || o.scenarioData?.id || k))) out.push({ room: rid, key: k, x: Math.round(o.x), y: Math.round(o.y), visible: o.visible });
        return out;
    });
}
await page.screenshot({ path: outFile.replace(/\.json$/, '.png') });
fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
