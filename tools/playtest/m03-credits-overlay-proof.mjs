// Live proof: the m03 victory visualiser shows the scenario's creditsOverlay (operation GHOST IN THE MACHINE).
//   SHOT_DIR=<dir> node tools/playtest/m03-credits-overlay-proof.mjs <gameId> <port>
import { createRequire } from 'node:module';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const { chromium } = createRequire(`${REPO_ROOT}node_modules/`)('playwright-core');
const EXEC = process.env.CHROMIUM || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3109'] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, executablePath: EXEC });
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
await p.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await p.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__test && window.eventDispatcher, null, { timeout: 90000 });
for (let i = 0; i < 40; i++) {
  if (await p.evaluate(() => window.gameState?.globalVariables && !window.MinigameFramework?.currentMinigame)) break;
  await p.keyboard.press('Space'); await p.waitForTimeout(800);
}
await p.waitForTimeout(2000);
// The real trigger (conversation_closed:closing_debrief) asks the server whether the mission is complete and
// refuses ("Not finished yet") on a game that only has the start-up state, so open the visualiser with the
// same options the scenario's victory music event passes, on the loaded scenario.
await p.evaluate(() => {
  const ev = (window.gameScenario.music?.events || []).find(e => e.trigger === 'conversation_closed:closing_debrief');
  window.BondVisualiser.open({ credits: ev.credits, autoStop: true, disableClose: true, missionOver: true });
});
await p.waitForTimeout(4000);
const txt = async () => p.evaluate(() => document.body.innerText);
let t = await txt();
console.log('GHOST IN THE MACHINE shown:', /GHOST IN THE MACHINE/.test(t), '| OPERTN line:', (t.match(/OPER[^\n]*\n?[^\n]*/) || [''])[0].replace(/\n/g, ' '));
await p.screenshot({ path: process.env.SHOT_DIR + '/credits1.png' });
await p.waitForTimeout(8000);
t = await txt();
console.log('later: GHOST IN THE MACHINE:', /GHOST IN THE MACHINE/.test(t), '| ticker:', (t.match(/INTEL:[^\n]*/) || [''])[0]);
await p.screenshot({ path: process.env.SHOT_DIR + '/credits2.png' });
await b.close();
