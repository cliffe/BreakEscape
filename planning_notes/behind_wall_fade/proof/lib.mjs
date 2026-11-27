// Shared helpers for the behind-wall-fade live proof (headless, keyless server on :3001).
// Run with the repo's playwright under Node 24: ~/.cache/ms-playwright-go/1.57.0/node <script> <gameId>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const here = path.dirname(fileURLToPath(import.meta.url));

export async function open(gid, { query = '', port = '3001', reducedMotion = null, route = null } = {}) {
  const browser = await chromium.launch({ headless: !process.env.HEADED });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  if (reducedMotion) await page.emulateMedia({ reducedMotion });
  page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 200)));
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
  if (route) await route(page);
  await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1${query}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.gameScenario && window.rooms && window.loadRoom && window.__test && window.player && window.player.body, null, { timeout: 90000 });
  await page.waitForTimeout(2000);
  // headless loop fix, once
  if (!process.env.NOFIX) await page.evaluate(() => { const g = window.game.sys.game; g.loop.smoothStep = false; g.loop.minFps = 1; window.game.physics.world.setFPS(20); /* deviation: fixedStep=false lets the player tunnel through the 8 px wall boxes */ });
  // close the title screen / tutorial popups with Enter
  for (let i = 0; i < 6; i++) {
    const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
    if (!busy) break;
    await page.keyboard.press('Enter'); await page.waitForTimeout(500); await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
  }
  return { browser, page };
}
export const shot = (page, name) => page.screenshot({ path: path.join(here, name + '.png') });
export const sleep = (page, ms) => page.waitForTimeout(ms);
export const dbg = (page) => page.evaluate(() => window.behindWallFade.debugState());
export async function loadRooms(page, ids) {
  await page.evaluate(async (ids) => { for (const id of ids) await window.loadRoom(id); }, ids);
}
