// Live proof: a walker's planned path bends round a seated NPC whose chair is NOT in window.chairs
// (the m05 break room case), the walker arrives, and the sitter can still stand up and leave.
// window.chairs is emptied at runtime only, to reproduce that case in test_needs_sims; no game
// record is edited. Headless, setFPS(20) with fixed steps on.
//   node tools/playtest/seated-npc-avoid-proof.mjs <gameId> <port> [outDir]
// Drive only a game id new-game.rb printed in this run.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3096', outDir = `${REPO_ROOT}tmp/handover/bump_fix`] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
const t = ms => page.waitForTimeout(ms);
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body && window.npcBehaviorManager, null, { timeout: 90000 });
await t(2500);
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
for (let i = 0; i < 8; i++) {
    const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi || window.MinigameFramework?.currentMinigame); });
    if (!busy) break;
    await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} });
    await page.keyboard.press('Escape'); await t(300);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    await t(300);
}

const res = await page.evaluate(async () => {
    const { unseatNPC } = await import('/break_escape/js/systems/seating.js');
    const mgr = window.npcBehaviorManager, pm = window.pathfindingManager;
    const r = v => Math.round(v);
    const pts = p => p && p !== 'timeout' ? p.map(q => [r(q.x), r(q.y)]) : p;
    const find = (a, b, opts) => new Promise(res => { pm.findWorldPath(a[0], a[1], b[0], b[1], p => res(p), false, opts); setTimeout(() => res('timeout'), 3000); });
    if (window.npcNeedsSystem) { window.npcNeedsSystem.update = () => {}; window.npcNeedsSystem.tick = () => {}; }
    const sit = mgr.getBehavior('sanjay'), walker = mgr.getBehavior('marek');
    const out = { seated: !!sit._seat, sitterImmovable: sit.sprite.body.immovable };
    // Reproduce the m05 case at runtime only: the sitter's chair is not in window.chairs
    const savedChairs = window.chairs; window.chairs = [];
    const bd = sit.sprite.body, cx = bd.center.x, cy = bd.center.y;
    out.sitterBody = [r(bd.left), r(bd.top), r(bd.right), r(bd.bottom)];
    const A = [r(cx - 45), r(cy)], B = [r(cx + 45), r(cy)];
    out.A = A; out.B = B;
    const avoid = await find(A, B);                          // new code: seated NPC bodies avoided
    const old = await find(A, B, { ignoreSeated: true });    // what the old code planned here
    out.plannedWithAvoid = pts(avoid); out.plannedIgnoreSeated = pts(old);
    const inBody = p => Array.isArray(p) && p.some(q => q.x > bd.left - 4 && q.x < bd.right + 4 && q.y > bd.top - 4 && q.y < bd.bottom + 4);
    out.oldCrossesSitter = inBody(old); out.avoidCrossesSitter = inBody(avoid);
    // Standing NPC is not avoided: set _seat aside for one search
    const keep = sit._seat; sit._seat = null;
    const standing = await find(A, B); out.standingPath = pts(standing); sit._seat = keep;
    out.standingCrossesSitter = inBody(standing);
    // Walk it for real
    walker.roomId = sit.roomId; walker._seatTried = true; walker._seat = null;
    walker._moveOwner = undefined; walker._goToStayDest = null; walker._stopOnArrival = false;
    const ws = walker.sprite;
    // sprite y and body centre differ by a fixed offset; plan and measure on the body centre
    ws.setPosition(A[0], A[1]); ws.body.updateFromGameObject?.(); ws.body.setVelocity(0, 0);
    const offY = ws.body.center.y - ws.y, offX = ws.body.center.x - ws.x;
    ws.setPosition(A[0] - offX, A[1] - offY); ws.body.updateFromGameObject?.();
    out.bodyOffset = [r(offX), r(offY)];
    const feet = () => [ws.body.center.x, ws.body.center.y];
    const dist = () => { const [x, y] = feet(); const dx = Math.max(bd.left - x, 0, x - bd.right), dy = Math.max(bd.top - y, 0, y - bd.bottom); return Math.hypot(dx, dy); };
    walker.goToAndStay(B[0], B[1], 90, { arriveWithin: 10 }); // goToAndStay takes body-centre coordinates
    const trace = []; let minD = 1e9, maxY = -1e9, minY = 1e9;
    const t0 = performance.now();
    while (performance.now() - t0 < 25000) {
        const [x, y] = feet(); trace.push([r(x), r(y)]); minD = Math.min(minD, dist()); maxY = Math.max(maxY, y); minY = Math.min(minY, y);
        if (Math.hypot(x - B[0], y - B[1]) < 14) break;
        await new Promise(res => setTimeout(res, 100));
    }
    out.walk = { start: trace[0], end: trace[trace.length - 1], arrived: Math.hypot(trace.at(-1)[0] - B[0], trace.at(-1)[1] - B[1]) < 14,
        minDistToSitterBody: Math.round(minD * 10) / 10, yRange: [r(minY), r(maxY)], ms: r(performance.now() - t0),
        trace };
    out.walkerEnd = { state: walker.currentState, path: (walker.currentPath || []).map(q => [r(q.x), r(q.y)]), pathIndex: walker.pathIndex,
        stopOnArrival: walker._stopOnArrival, vel: [r(ws.body.velocity.x), r(ws.body.velocity.y)], blocked: ws.body.blocked, touching: ws.body.touching,
        moving: walker.isMoving, avoid: !!walker._avoid };
    out.sitterMovedDuringWalk = sit._seat ? [r(sit.sprite.x), r(sit.sprite.y)] : 'unseated';
    window.__stage = { A, B };
    // Sitter stands up and walks out
    window.chairs = savedChairs;
    unseatNPC(sit);
    await new Promise(res => setTimeout(res, 1500));
    const s2 = sit.sprite; const from = [r(s2.body.center.x), r(s2.body.center.y)];
    out.standUp = { seatCleared: !sit._seat, immovable: s2.body.immovable, from };
    const goal = [r(B[0] + 20), r(B[1])];
    sit.roomId = sit.roomId; sit._seatTried = true;
    sit.goToAndStay(goal[0], goal[1], 90, { arriveWithin: 10 });
    const t1 = performance.now(); let last = from, still = 0;
    while (performance.now() - t1 < 20000) {
        const cur = [s2.body.center.x, s2.body.center.y];
        if (Math.hypot(cur[0] - goal[0], cur[1] - goal[1]) < 14) break;
        await new Promise(res => setTimeout(res, 100));
    }
    out.standUp.goal = goal; out.standUp.end = [r(s2.body.center.x), r(s2.body.center.y)];
    out.standUp.arrived = Math.hypot(s2.body.center.x - goal[0], s2.body.center.y - goal[1]) < 14;
    // Own seat: with another NPC still seated, a path to this NPC's own chair spot still exists
    const amara = mgr.getBehavior('amara'); window.chairs = [];
    const ownGoal = [r(cx), r(cy)];
    const toOwn = await find([r(cx + 70), r(cy)], ownGoal);
    out.ownSeatPath = pts(toOwn);
    out.amaraStillSeated = !!amara._seat;
    window.chairs = savedChairs;
    out.playerStateKeysWithAvoid = Object.keys(window.gameState || {}).length;
    return out;
});
fs.writeFileSync(`${outDir}/seated-avoid-proof.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await page.screenshot({ path: `${outDir}/seated-avoid-end.png` });
console.log('errs', JSON.stringify(errs));
await browser.close();
