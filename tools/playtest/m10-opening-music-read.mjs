// Reads m10's opening music and its starting-hidden hostiles (read only). Usage: node tools/playtest/m10-opening-music-read.mjs <gameId>
import { chromium } from 'playwright';
const PORT = Number(process.env.PORT || 3093), gameId = Number(process.argv[2]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* */ } });
await page.goto(`http://127.0.0.1:${PORT}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
let clean = 0;
for (let i = 0; i < 30 && clean < 2; i++) {
  const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame?.id || null, blk: !!(s.blockingUi || s.player?.blocking) }; }).catch(() => ({ mg: 'x', blk: false }));
  if (!st.mg && !st.blk) { clean++; await sleep(300); continue; }
  clean = 0;
  if (st.mg === 'title-screen') await page.keyboard.press('Enter').catch(() => {});
  else if (st.mg) await page.evaluate(() => window.__test.minigame.close()).catch(() => {});
  else { let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => null); if (!d || d.ok === false) await page.evaluate(() => window.__test.dismissBlockingUi()).catch(() => null); }
  await sleep(600);
}
await sleep(1500);
console.log(JSON.stringify(await page.evaluate(() => {
  const hs = window.npcHostileSystem, nm = window.npcManager;
  const hostile = nm.getAllNPCs().filter(n => hs.isNPCHostile(n.id)).map(n => ({ id: n.id, ko: hs.isNPCKO(n.id), hiddenByMapping: nm.isHiddenByMapping(n.id), isVisible: n.isVisible }));
  const counts = hostile.filter(h => !h.ko && !h.hiddenByMapping).length;
  return { playlist: window.MusicController.getState().playlist, hostile, countedByNewRule: counts, countedByOldRule: hostile.filter(h => !h.ko).length, visibilityRecord: nm.exportNpcVisibility() };
}), null, 1));
await browser.close();
