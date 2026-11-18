// Live proof: m03 learning hints (blind m03 #3 and #4). Opens the RFID cloner on the
// reception badge (both crack attacks offered, with a one-line explanation) and reads
// the server-room whiteboard (shift-cipher nudge).
//   SHOT_DIR=<dir> node tools/playtest/m03-learning-hints-proof.mjs <gameId> <port>
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
await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body, null, { timeout: 90000 });
for (let i = 0; i < 40; i++) {
  if (await page.evaluate(() => window.gameState?.globalVariables && !window.MinigameFramework?.currentMinigame)) break;
  await page.keyboard.press('Space'); await t(800);
}
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
await t(2000);
for (let i = 0; i < 4; i++) { await page.evaluate(() => { if (window.MinigameFramework?.currentMinigame) window.MinigameFramework.endMinigame(true); }); await t(600); }
const out = { gid, errs };
const shot = n => page.screenshot({ path: `${process.env.SHOT_DIR}/${n}.png` });
// 1. whiteboard
await page.evaluate(() => { [...document.querySelectorAll('button')].find(b => /^continue$/i.test(b.innerText.trim()))?.click(); });
await t(1500);
out.roomObjs = await page.evaluate(() => Object.entries(window.rooms?.server_room?.objects || {}).filter(([k, o]) => /whiteboard/i.test(k + (o.scenarioData?.name || ''))).map(([k, o]) => [k, o.scenarioData?.name]));
out.whiteboard = await page.evaluate(() => window.__test.interact(Object.entries(window.rooms?.server_room?.objects || {}).find(([k, o]) => /whiteboard/i.test(k + (o.scenarioData?.name || '')))?.[0]).then(r => JSON.stringify(r).slice(0, 200)));
await t(2500); await shot('whiteboard-hint');
await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} });
await t(800);
// 2. badge choice
out.badge = await page.evaluate(() => {
  // The receptionist's lanyard card, as the scenario defines it (the room's NPCs are not loaded here)
  const card = { card_id: 'receptionist_badge', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Staff Access Badge' };
  window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: { ...card, name: card.name } });
  return card;
});
await t(6000);
out.buttons1 = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean));
await shot('badge-0');
for (let i = 0; i < 4; i++) {
  const has = out.buttons1.some(b => /Dictionary Attack \(instant\)/.test(b));
  if (has) break;
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => /^>?\s*(Crack keys first|Read|Clone|Continue|Info)/i.test(b.innerText.trim())); b?.click(); });
  await t(3000);
  out.buttons1 = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean));
}
out.note = await page.evaluate(() => document.querySelector('.flipper-crack-choice')?.innerText || null);
await shot('badge-choice');
console.log(JSON.stringify(out, null, 1));
await browser.close();
