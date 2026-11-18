// Live proof: an NPC seated on one place of a two-place sofa (test_seating, Mina on leather_sofa1)
// takes a tap on her figure and E from her seat, instead of the sofa sitting the player beside her.
//   node tools/playtest/seated-npc-click-proof.mjs <gameId> <port> [outDir]
// Drive only a game id new-game.rb printed in this run. Headless, setFPS(20) with fixed steps on.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3107', outDir = `${REPO_ROOT}tmp/seated-click`] = process.argv.slice(2);
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
const shot = async name => page.screenshot({ path: `${outDir}/${name}.png` });
const info = () => page.evaluate(() => {
    const b = window.npcBehaviorManager.getBehavior('lounge_sofa'), s = b.sprite;
    const sofa = Object.values(window.rooms[window.currentPlayerRoom || 'seat_lounge'].objects).find(o => window.seating.isSeat(o) && o._places);
    const r = v => Math.round(v);
    return { room: window.currentPlayerRoom, player: [r(window.player.x), r(window.player.y)], seated: !!b._seat, mina: [r(s.x), r(s.y)],
        sofaPlaces: sofa && sofa._places, sofaSeatedBy: sofa && sofa.seatedBy, sofaBox: sofa && [r(sofa.x), r(sofa.y), r(sofa.displayWidth), r(sofa.displayHeight)],
        playerSeated: window.seating.isSeated(), chatOpen: !!(window.MinigameFramework && window.MinigameFramework.currentMinigame),
        ui: (() => { const st = window.__test.getState(); return { minigame: st.activeMinigame || null, blocking: st.blockingUi || null }; })() };
});
const waitUi = async () => { for (let i = 0; i < 40; i++) { await t(250); const u = (await info()).ui; if (u.minigame || u.blocking) return { ms: (i + 1) * 250, ...u }; } return { ms: 10000, none: true }; };
const out = { before: await info() };
await shot('0-start');
// Hook what the player does: person-chat opens, sofa sits
await page.evaluate(() => {
    window.__log = [];
    const ts = window.seating.trySit; window.seating.trySit = (c) => { window.__log.push('trySit:' + (c.scenarioData?.id || c.objectId)); return ts.call(window.seating, c); };
    const qs = window.seating.queueSit; if (qs) window.seating.queueSit = (c) => { window.__log.push('queueSit:' + (c.scenarioData?.id || c.objectId)); return qs.call(window.seating, c); };
    const h = window.handleObjectInteraction; window.handleObjectInteraction = (o) => { window.__log.push('handle:' + (o.npcId || o.scenarioData?.id)); return h(o); };
});
const miniaTap = await page.evaluate(() => { const s = window.npcBehaviorManager.getBehavior('lounge_sofa').sprite; return [s.x, s.y - 8]; });
// Walk to the sofa's near edge, then tap her figure
const sofaBox = out.before.sofaBox;
out.walkToEdge = await page.evaluate(([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 15000 }), [sofaBox[0] - 14, miniaTap[1] + 24]);
await t(500);
out.atEdge = await info(); await shot('1-at-sofa-edge');
// Ade's club chair is also in reach from the sofa edge, so a tap can open the who-do-you-mean menu (R2 m1: the tap
// reach matches E). Whenever a tap leaves that menu open, pick Mina from it and record the menu text.
const pickMina = async (wait, tag) => {
    if (wait.blocking?.id !== 'be-interaction-menu-overlay') return;
    out[tag + 'Menu'] = wait.blocking.text;
    out[tag + 'MinaPicked'] = await page.evaluate(() => { const b = [...document.querySelectorAll('#be-interaction-menu .be-im-item')].find(e => /Mina/.test(e.textContent)); if (b) { b.click(); return true; } return false; });
    out[tag + 'PickWait'] = await waitUi();
};
out.tap = await page.evaluate(([x, y]) => window.__test.clickAt(x, y), miniaTap);
out.tapWait = await waitUi();                       // the first tap walks to her; chat opens only if it was already in reach
await pickMina(out.tapWait, 'tap');
out.afterTap = await info(); out.logTap = await page.evaluate(() => window.__log.slice());
await shot('2-after-tap');
const closeChat = async () => { const u = (await info()).ui; if (u.minigame || u.blocking) { await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} }); await t(600); } };
if (out.tapWait.none) {
    out.tap2 = await page.evaluate(([x, y]) => window.__test.clickAt(x, y), miniaTap);   // arrived beside her: tap again
    out.tap2Wait = await waitUi();
    await pickMina(out.tap2Wait, 'tap2');
    await shot('2b-second-tap');
}
await closeChat();
// Step off to the sofa edge again, then E (from her chair: sofa in reach, she maybe not)
out.walkBack = await page.evaluate(([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 15000 }), [sofaBox[0] + sofaBox[2] + 12, miniaTap[1] + 18]);
await t(500);
out.beforeE = await info();
await page.evaluate(() => window.__test.pressKey('e'));
out.eWait = await waitUi(); await shot('3-after-E');
out.afterE = await info();
await closeChat();
out.errors = errs;
fs.writeFileSync(`${outDir}/proof.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
