// lab_physical_pentest needs smoke (OFFICE_LIFE_STUCK_RETURN.md): boot, get the player into the
// rooms that hold needs NPCs (reception: Kieran; open_plan: three staff), then watch them for 60 s
// of needs clock: stall lines, how far each walked, and page errors. The player walks through the
// doors with the bridge when they open; a locked door is passed by loading the room and placing the
// player on the nearest walkable cell (a test shortcut, not a solve). Headless, setFPS(20) with
// fixed steps on.
//   node tools/playtest/lab-needs-smoke.mjs <gameId> [port]
import { createRequire } from 'node:module';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3093'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player?.body && window.npcNeedsSystem, null, { timeout: 90000 });
await page.waitForTimeout(2000);
await page.keyboard.press('Escape');
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
const route = [];
for (const room of ['reception', 'hall', 'open_plan']) {
    const walked = await page.evaluate(r => window.__test.enterRoom(r).then(x => !!x?.ok).catch(() => false), room);
    let placed = false;
    if (!walked) {
        placed = await page.evaluate(async (r) => {
            if (!window.rooms[r]) await window.loadRoom(r);
            const rp = window.roomPositions?.[r] || window.rooms[r]?.position || { x: 0, y: 0 };
            const map = window.rooms[r]?.map;
            const w = map?.widthInPixels || 320, h = map?.heightInPixels || 288;
            const cell = window.pathfindingManager?.findNearestWalkableStartCell?.(rp.x + w / 2, rp.y + h * 0.7);
            if (!cell) return false;
            const p = window.player;
            const dx = cell.x - p.body.center.x, dy = cell.y - p.body.center.y;
            p.body.reset(p.x + dx, p.y + dy);
            return true;
        }, room).catch(() => false);
        await page.waitForTimeout(1500);
    }
    route.push({ room, walked, placed, now: await page.evaluate(() => window.currentPlayerRoom || window.player?.currentRoom || null) });
}
await page.waitForTimeout(3000);
const ids = await page.evaluate(() => [...window.npcNeedsSystem.states.keys()]);
const pos = () => page.evaluate(ids => Object.fromEntries(ids.map(id => { const p = window.npcNeedsSystem.world.npcPos(id); return [id, p && [Math.round(p.x), Math.round(p.y)]]; })), ids);
const c0 = await page.evaluate(() => window.npcNeedsSystem.clockMs);
const walked = Object.fromEntries(ids.map(id => [id, 0]));
let last = await pos();
const w0 = Date.now();
while ((await page.evaluate(() => window.npcNeedsSystem.clockMs)) - c0 < 60000 && Date.now() - w0 < 300000) {
    await page.waitForTimeout(1000);
    const now = await pos();
    for (const id of ids) if (now[id] && last[id]) walked[id] += Math.hypot(now[id][0] - last[id][0], now[id][1] - last[id][1]);
    last = now;
}
const log = await page.evaluate(() => window.npcNeedsSystem.getLog());
const lines = ev => log.filter(e => e.ev === ev).map(e => `${e.npc}@${e.t}(${e.x},${e.y})`);
const jobs = log.filter(e => /^job_(start|started|done|failed)$/.test(e.ev)).length;
const perNpc = ev => Object.fromEntries(ids.map(id => [id, log.filter(e => e.ev === ev && e.npc === id).length]));
console.log(JSON.stringify({ gid, route, rerouted_by_npc: perNpc('walk_rerouted'), resumed_by_npc: perNpc('return_resumed'), needs_s: Math.round(((await page.evaluate(() => window.npcNeedsSystem.clockMs)) - c0) / 1000), npcs: ids.length,
    walked: Object.fromEntries(Object.entries(walked).map(([k, v]) => [k, Math.round(v)])), jobs,
    walk_stuck: lines('walk_stuck'), walk_rerouted: lines('walk_rerouted').length, return_stuck: lines('return_stuck'),
    return_abandoned: lines('return_abandoned'), seat_gave_up: lines('seat_gave_up'), errs }));
await browser.close();
