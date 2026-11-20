// lab_physical_pentest RoE nudge hold proof: in a fresh game (rules unread), fire one kit-use
// event through the event dispatcher (item_dropped:kit_qr, the event item-drop.js emits) and
// sample Ruth's bark toast every 100 ms for 12 s. Before the fix the toast closed within about
// 250 ms (its condition read the guard its own mapping set). Headless, setFPS(20), fixed steps.
//   node tools/playtest/roe-nudge-hold-proof.mjs <gameId> [port]
import { createRequire } from 'node:module';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3230'] = process.argv.slice(2);
const LINE = 'Hold on. Have you read the rules of engagement';
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.route('**/*', r => (r.request().method() === 'POST' && new URL(r.request().url()).pathname.endsWith('/tts')) ? r.abort() : r.continue());
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.__test && window.player?.body && window.eventDispatcher && window.npcManager, null, { timeout: 90000 });
await page.waitForTimeout(3000);
await page.keyboard.press('Escape');
await page.evaluate(() => { const loop = window.game.sys.game.loop; loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
await page.waitForTimeout(1500);
const before = await page.evaluate(() => ({ done: window.gameState.globalVariables.kp_roe_done, nudged: window.gameState.globalVariables.kp_roe_nudged, due: window.gameState.globalVariables.kp_roe_nudge_due }));
await page.evaluate(() => window.eventDispatcher.emit('item_dropped:kit_qr', { objectId: 'kit_qr', itemId: 'kit_qr', roomId: window.currentPlayerRoom }));
const samples = [];
for (let i = 0; i < 120; i++) {
  samples.push(await page.evaluate(line => [...document.querySelectorAll('.npc-bark')].some(el => el.textContent.includes(line) && el.offsetParent !== null), LINE));
  await page.waitForTimeout(100);
}
const firstSeen = samples.indexOf(true);
let lastSeen = samples.lastIndexOf(true);
const after = await page.evaluate(() => ({ done: window.gameState.globalVariables.kp_roe_done, nudged: window.gameState.globalVariables.kp_roe_nudged, due: window.gameState.globalVariables.kp_roe_nudge_due }));
// A second kit use must not nudge again
await page.evaluate(() => window.eventDispatcher.emit('item_dropped:kit_cable', { objectId: 'kit_cable', itemId: 'kit_cable', roomId: window.currentPlayerRoom }));
await page.waitForTimeout(1500);
const again = await page.evaluate(line => [...document.querySelectorAll('.npc-bark')].filter(el => el.textContent.includes(line)).length, LINE);
await page.screenshot({ path: `tools/playtest/roe-nudge-hold-${gid}.png` }).catch(() => {});
console.log(JSON.stringify({ gid, before, after, firstSeenMs: firstSeen < 0 ? null : firstSeen * 100, shownMs: firstSeen < 0 ? 0 : (lastSeen - firstSeen + 1) * 100, stillUpAt12s: samples[samples.length - 1], nudgeToastsAfterSecondKit: again, errs }));
await browser.close();
