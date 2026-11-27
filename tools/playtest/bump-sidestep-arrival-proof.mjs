// Live proof: a bumped goToAndStay walk (owner 'needs', move id 123) must not arrive at the
// avoidance sidestep point. It used to stop there and emit npc_arrived (pathLeft 0) short of the
// destination; now it walks on and arrives once at the destination with its owner and move id.
// Scenario test_needs_sims (tom walks, grace stands in the lane). Headless, setFPS(20) with fixed steps on. Drive only a game id
// new-game.rb printed in this run.
//   node tools/playtest/bump-sidestep-arrival-proof.mjs <gameId> <port> [inspect]
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
const res = await page.evaluate(async () => {
    const { handleNPCCollision } = await import('/break_escape/js/systems/npc-sprites.js');
    const walker = window.npcBehaviorManager.getBehavior('tom'), blocker = window.npcBehaviorManager.getBehavior('grace');
    if (window.npcNeedsSystem) { window.npcNeedsSystem.update = () => {}; window.npcNeedsSystem.tick = () => {}; }
    window.npcNeedsSystem?.states?.delete?.('tom'); window.npcNeedsSystem?.states?.delete?.('grace');
    walker._seatTried = true; blocker._seatTried = true;
    const events = [];
    const ed = window.eventDispatcher, emit0 = ed.emit.bind(ed);
    ed.emit = (name, data) => { if (name === 'npc_arrived:tom') events.push({ t: Math.round(performance.now() - t0), x: Math.round(data.x), y: Math.round(data.y), owner: data.owner, moveId: data.moveId, pathLeft: data.pathLeft }); return emit0(name, data); };
    const sp = walker.sprite, bs = blocker.sprite;
    blocker.config.patrol.enabled = false; blocker.sprite.body.setVelocity(0, 0);
    const y0 = 400, startX = 100, goalX = 500, goalY = y0;
    sp.setPosition(startX, y0); sp.body.updateFromGameObject?.(); sp.body.setVelocity(0, 0);
    bs.setPosition(250, y0); bs.body.updateFromGameObject?.(); bs.body.immovable = true; bs.body.setVelocity(0, 0);
    walker.currentState = 'patrol';
    const t0 = performance.now();
    walker.goToAndStay(goalX, goalY, 90, { owner: 'needs', moveId: 123 });
    const trace = []; let bumps = 0, tempWp = null, stopAt = null, lastBump = 0;
    while (performance.now() - t0 < 25000) {
        // The walker steers round the standing blocker on its own, so the bump is staged: the
        // blocker is moved onto the walker once it is mid-route, and the overlap callback the
        // engine registers runs here by hand (as Phaser would on contact). The handler alternates
        // between re-picking the destination and picking its sidestep, so it takes two bumps.
        if (walker._stopOnArrival && bumps < 2 && sp.x > 220 && performance.now() - lastBump > 700) {
            bs.setPosition(sp.x + 20, sp.y); bs.body.updateFromGameObject?.(); bs.body.setVelocity(0, 0);
            bumps++; lastBump = performance.now(); handleNPCCollision(sp, bs);
        }
        const tw = walker.config.patrol.waypoints.find(w => w.isTemporary);
        if (tw && !tempWp) tempWp = { worldX: tw.worldX, worldY: tw.worldY, atX: Math.round(sp.x), atY: Math.round(sp.y) };
        trace.push([Math.round(sp.x), Math.round(sp.y)]);
        await new Promise(r => setTimeout(r, 100));
        if (!walker._stopOnArrival && !stopAt) { stopAt = Math.round(performance.now() - t0); }
        if (stopAt && performance.now() - t0 > stopAt + 1500) break;
    }
    return { bumps, tempWp, goal: [goalX, goalY], end: trace[trace.length - 1], stoppedAfterMs: stopAt,
        bumpsHad: bumps, distToGoal: Math.round(Math.hypot(sp.x - goalX, sp.y - goalY)), arrivals: events,
        samples: trace.filter((_, i) => i % 5 === 0).map(p => p.join(',')).join(' ') };
});
console.log('RESULT', JSON.stringify(res, null, 1));
console.log('errs', JSON.stringify(errs));
await browser.close();
