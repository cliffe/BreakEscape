// Live proof: a global set by an eventMapping survives a reload made 1 to 2 s later.
// Headless, setFPS(20) with fixed steps on. Fires room_entered:server_room through the
// event dispatcher (the m05 mapping sets server_room_entered), waits RELOAD_MS, reloads,
// and reports every sync_state request, the reloaded client's value and the server's
// stored value read back through the bootstrap endpoint after the reload.
//
//   node tools/playtest/global-reload-flush-proof.mjs <gameId> <port> [reloadMs] [outFile]
//
// PROOF_RELOAD=reload (default, page.reload: pagehide fires), blank (about:blank, then the
// game URL) or close (browser.close() and a new browser: no pagehide, like a crash or a
// killed tab; the pattern the m05 office-life harness used as its "reload").
// Drive only a game id new-game.rb printed in this run.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const NODE_MODULES = (process.env.PLAYWRIGHT_NODE_MODULES || `${REPO_ROOT}node_modules`).replace(/\/?$/, '/');
const require = createRequire(NODE_MODULES);
const { chromium } = require('playwright-core');
const EXEC = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM
    || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3099', reloadMs = '1500', outFile = `./global-reload-${gid}.json`] = process.argv.slice(2);
if (!gid) { console.error('usage: global-reload-flush-proof.mjs <gameId> <port> [reloadMs] [outFile]'); process.exit(2); }

const GLOBAL = process.env.PROOF_GLOBAL || 'server_room_entered';
const EVENT = process.env.PROOF_EVENT || 'room_entered:server_room';
const t0 = Date.now();
const MODE = process.env.PROOF_RELOAD || 'reload';
const NPC = process.env.PROOF_NPC || 'bernadette_dlamini';
const syncs = [], errs = [];
let browser, page;
async function openPage() {
browser = await chromium.launch({ headless: true, executablePath: EXEC });
page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
page.on('request', q => {
    if (!/sync_state/.test(q.url())) return;
    let body = {}; try { body = JSON.parse(q.postData() || '{}'); } catch (e) { /* not json */ }
    syncs.push({ at: Date.now() - t0, method: q.method(), keys: Object.keys(body), globals: body.globalVariables || null });
});
page.on('requestfinished', async q => {
    if (!/sync_state/.test(q.url())) return;
    const r = await q.response().catch(() => null);
    syncs.push({ at: Date.now() - t0, finished: true, status: r?.status() ?? null });
});
page.on('requestfailed', q => { if (/sync_state/.test(q.url())) syncs.push({ at: Date.now() - t0, failed: q.failure()?.errorText }); });
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
}
await openPage();
const t = ms => page.waitForTimeout(ms);

async function boot() {
    await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body && window.stateSync && window.eventDispatcher, null, { timeout: 90000 });
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

// The server's stored value, read through the same bootstrap the game loads from.
const serverValue = () => page.evaluate(async ([g, name]) => {
    const r = await fetch(`/break_escape/games/${g}/scenario`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return { status: r.status };
    const j = await r.json();
    const s = j.scenario || j;
    return { status: r.status, saved: s.savedGlobalVariables?.[name] ?? s.globalVariables?.[name], savedNpcVisibility: s.savedNpcVisibility || null };
}, [gid, GLOBAL]);
const npcVisible = () => page.evaluate(id => { const n = window.npcManager?.getNPC?.(id); const b = window.npcBehaviorManager?.getBehavior?.(id); return { record: n ? (n.visible ?? null) : 'none', sprite: b?.sprite ? b.sprite.visible : null }; }, NPC);

const report = { gid, mode: MODE, reloadMs: Number(reloadMs), global: GLOBAL, event: EVENT, syncs, errs };
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await boot();
report.before = { client: await page.evaluate(n => window.gameState.globalVariables[n], GLOBAL), npc: await npcVisible(), server: await serverValue() };
// Let any boot-time sync settle so the global is the only pending change.
await page.evaluate(() => window.stateSync.sync());
await t(500);
report.setAt = Date.now() - t0;
// PROOF_SET=event (default) fires EVENT through the dispatcher; PROOF_SET=global sets GLOBAL
// true and emits its global_variable_changed event, as the m05 office-life harness did.
report.afterSet = await page.evaluate(([ev, n, how]) => {
    if (how === 'global') {
        window.gameState.globalVariables[n] = true;
        window.eventDispatcher.emit(`global_variable_changed:${n}`, { value: true, name: n });
    } else window.eventDispatcher.emit(ev, {});
    return window.gameState.globalVariables[n];
}, [EVENT, GLOBAL, process.env.PROOF_SET || 'event']);
report.npcAfterSet = await npcVisible();
await t(Number(reloadMs));
report.reloadAt = Date.now() - t0;
const url = `http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`;
if (MODE === 'close') { await browser.close(); await openPage(); await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); }
else if (MODE === 'blank') { await page.goto('about:blank'); await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); }
else await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await boot();
report.after = { client: await page.evaluate(n => window.gameState.globalVariables[n], GLOBAL), npc: await npcVisible(), server: await serverValue() };
report.pass = report.afterSet === true && report.after.client === true && report.after.server.saved === true;
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
