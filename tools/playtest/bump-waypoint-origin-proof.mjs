// Live proof: after an NPC-NPC bump in a room with a non-zero origin, the avoidance waypoint
// stays within a tile of the walker (it used to land the room origin away from the route).
// Headless, setFPS(20) with fixed steps on. Drive only a game id new-game.rb printed in this run.
//   node tools/playtest/bump-waypoint-origin-proof.mjs <gameId> <port> [inspect]
import { createRequire } from 'node:module';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3095', mode = 'run'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
const t = ms => page.waitForTimeout(ms);
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body && window.npcBehaviorManager, null, { timeout: 90000 });
await t(2000);
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
if (mode === 'inspect') {
    console.log(JSON.stringify(await page.evaluate(() => ({
        rooms: Object.fromEntries(Object.entries(window.rooms).map(([k, r]) => [k, r.position])),
        npcs: [...window.npcBehaviorManager.behaviors.entries()].map(([id, b]) => ({ id, room: b.roomId, x: Math.round(b.sprite.x), y: Math.round(b.sprite.y), st: b.currentState })),
    })), null, 1));
    await browser.close(); process.exit(0);
}
for (let i = 0; i < 8; i++) {
    const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi || window.MinigameFramework?.currentMinigame); });
    if (!busy) break;
    await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} });
    await page.keyboard.press('Escape'); await t(300);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
    await t(300);
}
const enter = await page.evaluate(() => window.__test.enterRoom('lounge', { timeoutMs: 25000 }));
await t(1500);
const info = await page.evaluate(() => {
    const r = window.rooms.lounge;
    return { enter: null, origin: r.position, size: [r.map?.widthInPixels, r.map?.heightInPixels],
        npcs: [...window.npcBehaviorManager.behaviors.entries()].map(([id, b]) => ({ id, room: b.roomId, x: Math.round(b.sprite.x), y: Math.round(b.sprite.y), st: b.currentState, wps: b.config?.patrol?.waypoints?.length })) };
});
console.log('enter', JSON.stringify(enter), JSON.stringify(info));

// Stage: marek is teleported into the lounge (origin 320,0) and walks east along y 163 to a goal;
// rosa (idle, immovable) stands in the lane. The overlap callback the engine registers runs here
// by hand each frame the bodies touch, exactly as Phaser would.
const res = await page.evaluate(async () => {
    const { handleNPCCollision } = await import('/break_escape/js/systems/npc-sprites.js');
    const TILE = 32, o = window.rooms.lounge.position;
    const walker = window.npcBehaviorManager.getBehavior('marek'), blocker = window.npcBehaviorManager.getBehavior('rosa');
    if (window.npcNeedsSystem) { window.npcNeedsSystem.update = () => {}; window.npcNeedsSystem.tick = () => {}; }
    window.npcNeedsSystem?.states?.delete?.('marek'); walker._seatTried = true;
    walker._moveOwner = undefined; walker._goToStayDest = null; walker._stopOnArrival = false; walker._seat = null;
    const sp = walker.sprite, bs = blocker.sprite;
    walker.roomId = 'lounge';
    sp.setPosition(o.x + 60, 163); sp.body.updateFromGameObject?.(); sp.body.setVelocity(0, 0);
    bs.setPosition(o.x + 130, 163); bs.body.updateFromGameObject?.(); bs.body.immovable = true; bs.body.setVelocity(0, 0);
    const goalX = o.x + 280, goalY = 163;
    const wp = { x: Math.round((goalX - o.x) / TILE), y: Math.round(goalY / TILE), tileX: Math.round(goalX / TILE), tileY: Math.round(goalY / TILE), worldX: goalX, worldY: goalY };
    walker.config.patrol = { ...walker.config.patrol, enabled: true, speed: 90, waypoints: [wp], waypointIndex: 0, multiRoom: false, route: null };
    walker.waypointIndex = 0;
    walker.currentState = 'patrol'; walker.config.patrol.enabled = true;
    let calls = 0; const ou = walker.update.bind(walker); walker.update = (...a) => { calls++; return ou(...a); }; window.__calls = () => calls;
    walker.chooseWaypointTarget(performance.now());
    const trace = [];
    let bumps = 0, tempWp = null;
    const t0 = performance.now();
    while (performance.now() - t0 < 14000) {
        const a = sp.body, b = bs.body;
        const touch = a.left < b.right + 2 && a.right > b.left - 2 && a.top < b.bottom + 2 && a.bottom > b.top - 2;
        if (touch) { bumps++; handleNPCCollision(sp, bs); }
        const tw = walker.config.patrol.waypoints.find(w => w.isTemporary);
        if (tw && !tempWp) tempWp = { worldX: tw.worldX, worldY: tw.worldY, tileX: tw.tileX, tileY: tw.tileY, atX: Math.round(sp.x), atY: Math.round(sp.y) };
        trace.push([Math.round(sp.x), Math.round(sp.y)]);
        await new Promise(r => setTimeout(r, 100));
        if (Math.abs(sp.x - goalX) < 20) break;
    }
    const xs = trace.map(p => p[0]), ys = trace.map(p => p[1]);
    return { origin: o, bumps, tempWp, start: trace[0], end: trace[trace.length - 1], minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys),
        goal: [goalX, goalY], blocker: [Math.round(bs.x), Math.round(bs.y)], samples: trace.filter((_, i) => i % 5 === 0).map(p => p.join(',')).join(' ') };
});
console.log('RESULT', JSON.stringify(res, null, 1));
console.log('errs', JSON.stringify(errs));
await browser.close();
