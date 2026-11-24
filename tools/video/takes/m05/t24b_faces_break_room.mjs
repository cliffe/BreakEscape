// 24 Nov re-take (new id, same path as the original): new mouth-only visemes / new bust.
// t24b_faces_break_room (m05): DAY, break_room. Face flashes: for Lisa Park, Thandiwe Moyo, Niamh Doherty, Bernadette Lyons: walk near, interact, hold the portrait ~2.2 s (the narrator description is on screen; no choice picked), close. Never reads past the opener.
// Record: MISSION=m05 run.sh <avatar> t24b_faces_break_room "--imports=none --start-room break_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: <id>-open, <id>-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(900);
  for (const id of ['lisa_park', 'thandiwe_moyo', 'niamh_doherty', 'bernadette_lyons']) {
    try {
      await bridge.moveToNear(id, { timeoutMs: 20000 });
      await sleep(500);
      let r = await bridge.interact(id, { timeoutMs: 15000 });
      let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 3000 });
      if (!w || w.ok === false) { r = await bridge.interact(id, { timeoutMs: 15000 }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 }); }
      mark(id + '-open', { ok: !!(w && w.ok !== false) });
      await sleep(2400);
      for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework && window.MinigameFramework.endMinigame(false)); await sleep(500); }
      mark(id + '-closed');
      await sleep(700);
    } catch (e) { mark(id + '-error', { e: String(e).slice(0, 150) }); }
  }
};
