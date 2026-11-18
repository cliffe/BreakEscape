// Flag station "Submitted Flags" list restore after reload - live proof.
// Usage: PORT=3108 node tools/playtest/flag-list-restore-proof.mjs <gameId> "<flag1>,<flag2>,<flag3>" [stationId]
// Run from inside the worktree so playwright resolves its node_modules.
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 3108), BASE = `http://127.0.0.1:${PORT}`;
const gameId = Number(process.argv[2]);
const flags = (process.argv[3] || '').split(',');
const STATION = process.argv[4] || 'flag_station_dropsite';
// ROOMS=hall,station: game starts in the hall (station room unlocked); the player leaves the
// station room before each reload and walks back in afterwards, so the room data comes from
// the door path rather than the start-room fetch.
const ROOMS = (process.env.ROOMS || '').split(',').filter(Boolean);
const urls = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { gameId, steps: [] };

async function clearUi(page) {
  for (let i = 0; i < 20; i++) {
    const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame?.id || null, blk: !!(s.blockingUi || s.player?.blocking) }; }).catch(() => ({ mg: 'x', blk: false }));
    if (!st.mg && !st.blk) break;
    if (st.mg === 'title-screen') await page.keyboard.press('Enter').catch(() => {});
    else if (st.mg) await page.evaluate(() => window.__test.minigame.close()).catch(() => {});
    else {
      let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => null);
      if (!d || d.ok === false) d = await page.evaluate(() => window.__test.dismissBlockingUi()).catch(() => null);
    }
    await sleep(600);
  }
}
async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('request', r => { if (/\/(unlock|room\/)/.test(r.url())) urls.push(r.method() + ' ' + r.url().replace(BASE, '')); });
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} });
  await page.goto(`${BASE}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
  await clearUi(page);
  return page;
}
async function toStationRoom(page) {
  if (ROOMS.length !== 2) return;
  const cur = await page.evaluate(() => window.__test.getState().player?.room || window.currentPlayerRoom);
  if (cur !== ROOMS[1]) { const e = await page.evaluate(r => window.__test.enterRoom(r), ROOMS[1]); out.steps.push({ enter: ROOMS[1], ok: e && e.ok, was: cur }); }
}
async function leaveStationRoom(page) {
  if (ROOMS.length !== 2) return;
  const e = await page.evaluate(r => window.__test.enterRoom(r), ROOMS[0]); out.steps.push({ leave: ROOMS[0], ok: e && e.ok });
}
async function openStation(page) {
  await toStationRoom(page);
  const r = await page.evaluate(id => window.__test.interact(id), STATION);
  await page.waitForSelector('#flag-history-list', { timeout: 15000 });
  await sleep(300);
  return r;
}
const listed = page => page.evaluate(() => [...document.querySelectorAll('#flag-history-list li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()));
async function submit(page, f) {
  await page.fill('#flag-input', f);
  await page.click('#flag-submit-btn');
  await page.waitForFunction(() => /accepted|✓/i.test(document.querySelector('#flag-result')?.textContent || ''), null, { timeout: 15000 }).catch(() => {});
  await sleep(800);
}
const closeStation = page => page.evaluate(() => window.__test.minigame.close());

const browser = await chromium.launch({ headless: true });
let page = await open(browser);
const r = await openStation(page); out.steps.push({ open: r && r.ok });
out.initial = await listed(page);
await submit(page, flags[0]); await submit(page, flags[1]);
out.afterTwo = await listed(page);
await closeStation(page); await leaveStationRoom(page); out.roomAtReload1 = await page.evaluate(() => window.currentPlayerRoom); await page.close();

page = await open(browser);
await openStation(page);
out.afterReload = await listed(page);
await submit(page, flags[2]);
out.afterThird = await listed(page);
await closeStation(page); await leaveStationRoom(page);
// reload once more: all three must come back
await page.close(); page = await open(browser);
await openStation(page);
out.afterSecondReload = await listed(page);
await browser.close();
out.requests = urls;
console.log(JSON.stringify(out, null, 1));
