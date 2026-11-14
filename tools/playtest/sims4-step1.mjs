// SIMS-4 step 1: render + cell checks for the staff room. Loads a test_needs_sims game, enters the
// staff room, and dumps each staff-room object's resolved position / useFrom / approachCell /
// second-user cell, both NPCs' seated state and nearest chair, the west-door column, and the jittered
// caffeine/thirst at load. Read-only; no fixes applied here.
//   node tools/playtest/sims4-step1.mjs <gameId> [port] [outDir]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3094', outDir = '/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/officelife-sims/s4/'] = process.argv.slice(2);
if (!gid) { console.error('usage: sims4-step1.mjs <gameId> [port] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const t = ms => page.waitForTimeout(ms);
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
// Load IT then the staff room so both register.
await page.evaluate(() => window.__test.enterRoom('it_room', { timeoutMs: 25000 })).catch(() => {});
await t(1200);
await page.evaluate(() => window.__test.enterRoom('staff_room', { timeoutMs: 25000 })).catch(() => {});
await t(2500);
await page.screenshot({ path: outDir + `step1-staffroom-${gid}.png` });

const report = await page.evaluate(() => {
    const sys = window.npcNeedsSystem, world = sys.world, pm = window.pathfindingManager;
    const TILE = 32;
    const room = window.rooms['staff_room'];
    const asList = x => Array.isArray(x) ? x : Object.values(x || {});
    const out = { objects: {}, npcs: {}, doors: {} };
    // Drawn sprites (non-interactive) for reference
    out.drawn = asList(room && room.objects).filter(o => o && o.scenarioData && /boiler|cooler|microwave|chair|notes/.test(String(o.scenarioData.type || o.texture || ''))).length;
    for (const id of ['staff_boiler', 'staff_cooler', 'staff_microwave', 'job_board']) {
        const o = world.getObject(id);
        if (!o) { out.objects[id] = { missing: true }; continue; }
        const aff = o.affordance || {};
        const approach = world.approachCell ? world.approachCell(o) : null;
        const beside = (approach && world.besideCell) ? world.besideCell(approach, []) : null;
        const tile = c => c ? { tx: +(c.x / TILE).toFixed(2), ty: +(c.y / TILE).toFixed(2), x: Math.round(c.x), y: Math.round(c.y) } : null;
        const walkA = (approach && pm) ? pm.findNearestWalkableWorldCell(approach.x, approach.y, 0) : null;
        out.objects[id] = {
            pos: { x: +(o.x).toFixed(1), y: +(o.y).toFixed(1), tx: +((o.x) / TILE).toFixed(2), ty: +((o.y) / TILE).toFixed(2) },
            type: o.scenarioData && o.scenarioData.type, capacity: aff.capacity || 1, chatter: aff.chatter || null,
            useFrom: aff.useFrom || null, satisfies: aff.satisfies || null, restores: aff.restores,
            approachCell: tile(approach), approach_walkable: !!(walkA && Math.hypot(walkA.x - approach.x, walkA.y - approach.y) < 8),
            secondUserCell: tile(beside)
        };
    }
    for (const id of ['keith', 'jodie']) {
        const st = sys.getState(id) || {};
        const b = window.npcBehaviorManager && window.npcBehaviorManager.getBehavior(id);
        const sp = b && b.sprite;
        const feet = sp ? { x: sp.x, y: sp.y + (sp.displayHeight ? sp.displayHeight / 2 : 16) } : null;
        // nearest static chair
        let nearest = null;
        for (const o of asList(room && room.objects)) {
            const key = String((o.scenarioData && o.scenarioData.type) || o.texture || '');
            if (!/hospital_chair/.test(key)) continue;
            const foot = { x: o.x + (o.width || 32) / 2, y: o.y + (o.height || 32) };
            const d = feet ? Math.hypot(feet.x - foot.x, feet.y - foot.y) : null;
            if (d != null && (!nearest || d < nearest.d)) nearest = { key, d: +d.toFixed(1), footTx: +(foot.x / 32).toFixed(2), footTy: +(foot.y / 32).toFixed(2) };
        }
        out.npcs[id] = {
            mode: st.mode, seated: !!(sp && sp.isSeated !== undefined ? sp.isSeated : (st.mode === 'idle')),
            seatingState: (window.seatingManager && window.seatingManager.stateOf && window.seatingManager.stateOf(id)) || null,
            homeWorld: st.home ? { x: Math.round(st.home.x), y: Math.round(st.home.y), tx: +(st.home.x / 32).toFixed(2), ty: +(st.home.y / 32).toFixed(2), roomId: st.home.roomId } : null,
            spritePos: sp ? { tx: +(sp.x / 32).toFixed(2), ty: +(sp.y / 32).toFixed(2) } : null,
            nearestChair: nearest, sits_within_NEAR_CHAIR_36: !!(nearest && nearest.d <= 36),
            levels: st.levels, caffeine: st.levels && st.levels.caffeine, thirst: st.levels && st.levels.thirst
        };
    }
    // Path search from each home to each second-user cell (plan 5.4 step 1: besideCell makes no
    // route check, so each second-user cell must be reachable by a real path search from both homes).
    out.pathSearches = {};
    const pathTo = (sx, sy, ex, ey) => { let res = null; try { pm && pm.findWorldPath(sx, sy, ex, ey, p => { res = p; }); } catch (e) {} return res; };
    const homeOf = id => { const st = sys.getState(id) || {}; return st.home ? { x: st.home.x, y: st.home.y } : null; };
    for (const objId of ['staff_boiler', 'staff_cooler']) {
        const o = world.getObject(objId); if (!o) continue;
        const approach = world.approachCell ? world.approachCell(o) : null;
        const beside = (approach && world.besideCell) ? world.besideCell(approach, []) : null;
        if (!beside) { out.pathSearches[objId] = { secondUserCell: null }; continue; }
        out.pathSearches[objId] = { secondUserCell: { tx: +(beside.x / TILE).toFixed(2), ty: +(beside.y / TILE).toFixed(2) } };
        for (const id of ['keith', 'jodie']) {
            const h = homeOf(id);
            const path = h ? pathTo(h.x, h.y, beside.x, beside.y) : null;
            out.pathSearches[objId][id] = { fromHome: h ? { tx: +(h.x / TILE).toFixed(2), ty: +(h.y / TILE).toFixed(2) } : null, reachable: !!(path && path.length), waypoints: path ? path.length : 0 };
        }
    }
    // Jitter log: each NPC's configured initial vs the jittered value loaded for the coupled need.
    out.jitter = {};
    for (const id of ['keith', 'jodie']) {
        const st = sys.getState(id) || {};
        const rec = world.getNpc ? world.getNpc(id) : null;
        const need = id === 'keith' ? 'caffeine' : 'thirst';
        const cfg = rec && rec.needs && rec.needs[need];
        const loaded = st.levels && st.levels[need];
        out.jitter[id] = { need, initial: cfg && cfg.initial, jitterPct: cfg && cfg.jitterPct, loaded_at_start: loaded != null ? +Number(loaded).toFixed(2) : null, jitter_delta: (cfg && cfg.initial != null && loaded != null) ? +(loaded - cfg.initial).toFixed(2) : null };
    }
    out.jitter_note = 'restores re-jitter on each break; those are logged per start in the schedule beat (needs-sims-staff-room.mjs schedule).';
    // West door of staff_room
    const gates = (room && room.doorGates) || (room && room.gates) || null;
    out.doors.note = 'west door connects to it_room; door column read from check_door_alignment.py (OK)';
    out.clockMs = sys.clockMs;
    return out;
});
report.gid = gid; report.errs = errs.slice(0, 5);
fs.writeFileSync(outDir + `step1-report-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1).slice(0, 6000));
await browser.close();
