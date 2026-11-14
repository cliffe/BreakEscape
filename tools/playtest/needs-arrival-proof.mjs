// SIMS-2 live proof (OFFICE_LIFE_SIMS_BUILD_PLAN 5.2, OLMP E6): prove that a needs arrival counts
// only where the NPC actually stands.
//
//   node tools/playtest/needs-arrival-proof.mjs <gameId> [port] [mode] [outDir]
//
// mode:
//   stub     reproduce the early-path-end fault, then show the fix. Grace's _planMovePath is
//            patched to return a path that ends at the lounge door for her sofa move. First, with
//            the fix neutralised in-browser (the legacy "any arrival counts" behaviour), the build
//            enters `using lounge_sofa` at the door. Then, with the real fix, the same stubbed short
//            path logs `arrival_far` and Grace walks on; no `using` fires at the door.
//   natural  20 Grace rest runs (she walks office -> lounge to the sofa) and 20 Tom kitchen trips
//            (office coffee switched off), every `using` captured with its distance from the cell.
//   all      stub then natural (default).
//
// Every `using` the needs system logs is captured with the NPC's distance from the move's cell
// (a _log wrapper installed in-browser), and the run fails if any is over 48 px. Movement and needs
// are driven only through window.__test. Clock stepped manually with real frames between steps.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';

const [gid, port = '3094', mode = 'all',
    outDir = '/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/officelife-sims/s2/'] = process.argv.slice(2);
if (!gid) { console.error('usage: needs-arrival-proof.mjs <gameId> [port] [mode] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const report = { gid, port, mode, errs, stub: null, natural: null };
const t = ms => page.waitForTimeout(ms);
const shot = n => page.screenshot({ path: outDir + `${n}-${gid}.png` });

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
    // Load the lounge (Grace's sofa) and the kitchen (Tom's cooler/coffee fallback) so both rooms exist.
    for (const r of ['lounge', 'kitchen']) {
        await page.evaluate(room => window.__test.enterRoom(room, { timeoutMs: 25000 }), r).catch(() => {});
        await t(800);
    }
    // Back to the office.
    await page.evaluate(() => window.__test.enterRoom('office', { timeoutMs: 25000 })).catch(() => {});
    await t(800);
}

// Install a _log wrapper that records every `using` entry with the NPC's distance from job.dest.
async function installUsingCapture() {
    await page.evaluate(() => {
        const sys = window.npcNeedsSystem;
        if (sys.__usingCap) return;
        sys.__usingCap = [];
        const orig = sys._log.bind(sys);
        sys._log = (npcId, ev, extra = {}) => {
            if (ev === 'using') {
                const s = sys.states.get(npcId);
                const pos = sys.world.npcPos(npcId);
                const dest = s && s.job && s.job.dest;
                const dist = (pos && dest) ? Math.round(Math.hypot(pos.x - dest.x, pos.y - dest.y)) : null;
                sys.__usingCap.push({ npc: npcId, target: extra.target, dist, clock: Math.round(sys.clockMs) });
            }
            return orig(npcId, ev, extra);
        };
    });
}
const usingCaps = () => page.evaluate(() => window.npcNeedsSystem.__usingCap || []);
const setManual = on => page.evaluate(v => window.__test.needs.setManualClock(v), on);
const stepClock = async (ms, frames = 6) => {
    await page.evaluate(m => window.__test.needs.step(m), ms);
    for (let i = 0; i < frames; i++) await t(60);
};
const setNeed = (id, need, lvl) => page.evaluate(([i, n, l]) => window.__test.needs.set(i, n, l), [id, need, lvl]);
const graceState = () => page.evaluate(() => {
    const s = window.__test.needs.state('grace');
    const pos = window.npcNeedsSystem.world.npcPos('grace');
    return { mode: s && s.mode, job: s && s.job, pos };
});

// Approach cell of an object, in world coords.
const approachOf = id => page.evaluate(oid => {
    const o = window.npcNeedsSystem.world.getObject(oid);
    const c = o && window.npcNeedsSystem.world.approachCell(o);
    return c ? { x: c.x, y: c.y } : null;
});

async function runStub() {
    const out = { legacy: null, fixed: null };
    const sofaCell = await approachOf('lounge_sofa');
    // Stub Grace's path planner to end ~35% along the real route (a short path end, as an async
    // path answer or a path stopped at a door gives), so the arrival fires far from the sofa cell.
    await page.evaluate(() => {
        const beh = window.npcBehaviorManager.behaviors.get('grace');
        beh.__planOrig = beh._planMovePath.bind(beh);
        beh._planMovePath = (pfm, sx, sy, ex, ey, cb) => beh.__planOrig(pfm, sx, sy, ex, ey, (path) => {
            if (Array.isArray(path) && path.length > 3) path = path.slice(0, Math.max(1, Math.floor(path.length * 0.35)));
            cb(path);
        });
    });
    // ---- (1) legacy neutralised: any arrival counts (the build before SIMS-2) ----
    await setManual(true);
    await page.evaluate(() => {
        const sys = window.npcNeedsSystem;
        sys.__acceptOrig = sys._acceptArrival.bind(sys);
        sys._acceptArrival = () => true;   // the old behaviour: any arrival counts
    });
    await setNeed('grace', 'rest', 18);
    for (let i = 0; i < 60; i++) {
        await stepClock(250, 2);
        const g = await graceState();
        if (g.job && g.job.phase === 'using' && g.job.targetId === 'lounge_sofa') { out.legacy = { usedAt: g.pos, sofaCell, dist: Math.round(Math.hypot(g.pos.x - sofaCell.x, g.pos.y - sofaCell.y)) }; break; }
    }
    await shot('stub-legacy');
    out.legacyLog = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'grace').slice(-12).map(e => `${e.t} ${e.ev} ${e.target || ''} ${e.dist ?? ''}`.trim()));
    // ---- (2) restore the real fix, same stubbed short path ----
    await page.evaluate(() => {
        const sys = window.npcNeedsSystem;
        sys._acceptArrival = sys.__acceptOrig; sys.__legacy = false;
        sys.setSeed ? sys.setSeed(sys.seed) : null;
    });
    await page.evaluate(() => window.__test.needs.setSeed(window.gameScenario.npcNeedsSeed));
    await setManual(true);
    await setNeed('grace', 'rest', 18);
    let farSeen = false, usedFar = false;
    for (let i = 0; i < 80; i++) {
        await stepClock(250, 2);
        const log = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'grace' && (e.ev === 'arrival_far' || e.ev === 'using')));
        if (log.some(e => e.ev === 'arrival_far')) farSeen = true;
        const g = await graceState();
        if (g.job && g.job.phase === 'using' && g.job.targetId === 'lounge_sofa') {
            const d = Math.round(Math.hypot(g.pos.x - sofaCell.x, g.pos.y - sofaCell.y));
            out.fixed = { usedAt: g.pos, sofaCell, dist: d };
            usedFar = d > 48;
            break;
        }
    }
    out.fixedFarSeen = farSeen; out.fixedUsedFar = usedFar;
    out.fixedLog = await page.evaluate(() => window.__test.needs.log().filter(e => e.npc === 'grace').slice(-14).map(e => `${e.t} ${e.ev} ${e.target || ''} ${e.dist ?? ''}`.trim()));
    await shot('stub-fixed');
    // un-stub the path planner
    await page.evaluate(() => { const beh = window.npcBehaviorManager.behaviors.get('grace'); if (beh && beh.__planOrig) { beh._planMovePath = beh.__planOrig; } });
    report.stub = out;
}

async function runNatural() {
    const out = { graceRuns: 0, tomRuns: 0, maxDist: 0, offenders: [] };
    await page.evaluate(() => window.__test.needs.setSeed(window.gameScenario.npcNeedsSeed));
    await installUsingCapture();
    await setManual(true);
    // 20 Grace sofa runs: force rest urgent, step until she uses the sofa, repeat.
    for (let r = 0; r < 20 && out.graceRuns < 20; r++) {
        await setNeed('grace', 'rest', 18);
        let used = false;
        for (let i = 0; i < 80 && !used; i++) {
            await stepClock(250, 2);
            const g = await graceState();
            if (g.job && g.job.phase === 'using' && g.job.targetId === 'lounge_sofa') { used = true; out.graceRuns++; }
        }
        // let her finish and walk home
        for (let i = 0; i < 20; i++) { await stepClock(500, 1); const g = await graceState(); if (g.mode === 'idle' || g.mode === 'returning') break; }
    }
    // 20 Tom kitchen trips: switch the office coffee off, force caffeine urgent.
    await page.evaluate(() => { window.gameState.globalVariables.office_coffee_off = true; window.eventDispatcher.emit('global_variable_changed:office_coffee_off', { name: 'office_coffee_off', value: true }); });
    for (let r = 0; r < 20 && out.tomRuns < 20; r++) {
        await setNeed('tom', 'caffeine', 18);
        let used = false;
        for (let i = 0; i < 80 && !used; i++) {
            await stepClock(250, 2);
            const s = await page.evaluate(() => { const x = window.__test.needs.state('tom'); return x && x.job ? { phase: x.job.phase, target: x.job.targetId } : null; });
            if (s && s.phase === 'using') { used = true; out.tomRuns++; }
        }
        for (let i = 0; i < 20; i++) { await stepClock(500, 1); const s = await page.evaluate(() => window.__test.needs.state('tom')); if (s && (s.mode === 'idle' || s.mode === 'returning')) break; }
    }
    const caps = await usingCaps();
    for (const c of caps) { if (c.dist != null) { out.maxDist = Math.max(out.maxDist, c.dist); if (c.dist > 48) out.offenders.push(c); } }
    out.usingCount = caps.length;
    await shot('natural-end');
    report.natural = out;
}

await load();
if (mode === 'stub' || mode === 'all') await runStub();
if (mode === 'natural' || mode === 'all') await runNatural();
fs.writeFileSync(outDir + `proof-${mode}-${gid}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
