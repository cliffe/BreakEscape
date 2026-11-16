// Hidden hostiles and the fight music - live proof. Keyless server on PORT (default 3093).
// Usage: node tools/playtest/hidden-hostiles-music-proof.mjs <gameId>   (a fresh test_hidden_hostiles game)
// Run from inside the worktree so playwright resolves. Headless; setFPS(20), fixed steps on.
// Every change goes through real paths: the vault door attempt sets the night global and
// hides the day guard by its own mapping; debugKO knocks the other guard out.
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 3093), BASE = `http://127.0.0.1:${PORT}`;
const gameId = Number(process.argv[2]);
if (!gameId) { console.error('game id needed'); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { gameId };

const music = page => page.evaluate(() => window.MusicController?.getState?.()?.playlist ?? null);
const npcs = page => page.evaluate(() => (window.npcManager.getAllNPCs() || []).map(n => ({
  id: n.id, hostile: window.npcHostileSystem.isNPCHostile(n.id), ko: window.npcHostileSystem.isNPCKO(n.id),
  hiddenByMapping: window.npcManager.isHiddenByMapping(n.id),
  spriteVisible: (n._sprite || n.sprite) ? !!(n._sprite || n.sprite).visible : null })));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* */ } });
await page.goto(`${BASE}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
// Title screen (Enter starts it), Mission Brief and resume prompts: clear until the bridge reports none, twice
let clean = 0;
for (let i = 0; i < 30 && clean < 2; i++) {
  const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame?.id || null, blk: !!(s.blockingUi || s.player?.blocking) }; }).catch(() => ({ mg: 'x', blk: false }));
  if (!st.mg && !st.blk) { clean++; await sleep(300); continue; }
  clean = 0;
  if (st.mg === 'title-screen') await page.keyboard.press('Enter').catch(() => {});
  else if (st.mg) await page.evaluate(() => window.__test.minigame.close()).catch(() => {});
  else {
    let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => null);
    if (!d || d.ok === false) d = await page.evaluate(() => window.__test.dismissBlockingUi()).catch(() => null);
  }
  await sleep(600);
}
out.uiClean = clean >= 2;
await sleep(1000);
out.start = { playlist: await music(page), npcs: await npcs(page) };

// Night turn: try the vault door (real door_unlock_attempt), which sets night and hides the day guard
out.doorways = await page.evaluate(() => window.__test.doorways());
const door = Array.isArray(out.doorways) ? out.doorways[0] : out.doorways?.doorways?.[0];
out.doorTry = await page.evaluate(async (d) => {
  const id = d?.id || d?.doorId;
  return id ? await window.__test.interact(id) : { ok: false, why: 'no door id' };
}, door).catch(e => ({ error: String(e) }));
await sleep(2000);
await page.evaluate(() => window.__test.minigame?.close?.()).catch(() => {});
out.afterNight = { night: await page.evaluate(() => window.gameState.globalVariables.night), playlist: await music(page), npcs: await npcs(page) };

// Knock out the visible guard: the fight should end though the hidden one is hostile and conscious
out.ko = await page.evaluate(() => window.__test.debugKO('fight_guard'));
await sleep(1500);
out.afterKO = { playlist: await music(page), npcs: await npcs(page) };

// Reload: the hidden state comes back from the server; the music for a loaded game is the scenario's game_loaded entry
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
await sleep(2000);
out.afterReload = { hiddenByMapping: await page.evaluate(() => window.npcManager.isHiddenByMapping('day_guard')), npcs: await npcs(page), playlist: await music(page) };
console.log(JSON.stringify(out, null, 1));
await browser.close();
