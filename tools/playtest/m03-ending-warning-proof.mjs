// Live proof: m03's debrief is held behind the ending warning when an optional objective
// is open (blind m03 m8). Fires Victoria's conversation_closed (which sets victoria_choice_made),
// then checks the overlay, "Keep going" (no debrief) and "End the mission now" (debrief starts).
//   node tools/playtest/m03-ending-warning-proof.mjs <gameId> <port>
import { createRequire } from 'node:module';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.CHROMIUM || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3109'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
const t = ms => page.waitForTimeout(ms);
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body && window.eventDispatcher && window.endingCheck, null, { timeout: 90000 });
await t(3000);
await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} });
const out = { gid, errs };
out.open = await page.evaluate(() => window.endingCheck.openOptionalObjectives?.() ?? 'n/a');
out.enabled = await page.evaluate(() => window.breakEscapeConfig.endingCheck);
const snap = () => page.evaluate(() => ({ overlay: !!document.getElementById('ending-check-overlay'), text: document.getElementById('ending-check-overlay')?.innerText?.slice(0, 300) || null,
  choice: window.gameState.globalVariables.victoria_choice_made, debrief: window.gameState.globalVariables.debrief_played, mc: !!window.MinigameFramework?.currentMinigame }));
await page.evaluate(() => window.eventDispatcher.emit('conversation_closed:victoria_sterling', {}));
await t(2500);
out.afterVictoria = await snap();
await page.screenshot({ path: process.env.SHOT_DIR + '/ending.png' });
// Keep going
await page.evaluate(() => { [...document.querySelectorAll('#ending-check-overlay button')].find(b => /keep going/i.test(b.innerText))?.click(); });
await t(2500);
out.afterKeepGoing = await snap();
// End now (held ending: use the objectives panel button or re-fire)
out.panelButton = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => /end the mission/i.test(b.innerText)).map(b => b.innerText));
await page.evaluate(() => { [...document.querySelectorAll('button')].find(b => /^end the mission$/i.test(b.innerText.trim()))?.click(); });
await t(3000);
out.afterEndClick = await snap();
await page.evaluate(() => { [...document.querySelectorAll('#ending-check-overlay button')].find(b => /end the mission now/i.test(b.innerText))?.click(); });
await t(4000);
out.afterEndNow = await snap();
console.log(JSON.stringify(out, null, 1));
await browser.close();
