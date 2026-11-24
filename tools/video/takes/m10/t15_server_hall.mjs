// t15_server_hall (m10, keyless, NOT YET RUN): server_hall. (1) the countdown panel: clock_server_hall (smartscreen, readDisplay) with raid_clock seeded so it reads NOW 03:30; read, held 4 s, closed; no answer on it. (2) face flash: Dr Abena Asante (asante), shown on room_entered:server_hall, so the take walks IN from power_room.
// Entry (new-game): --imports=none --start-room power_room --unlock power_room --set briefing_played=true --set raid_clock='"t0330"'   Record: "--hide-hud --zoom-step 1"   (avatar vivian_ashby)
// Record: MISSION=m10 run.sh vivian_ashby t15_server_hall "<flags>" "--hide-hud --zoom-step 1"
// Marks: entered, panel-open, panel-held, panel-closed, asante-open, asante-closed. Cut the Asante flash before any menu. Wendell is revealed on power_room entry only, and the take starts in power_room, so no ring (cut_by_hand unset).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { faceFlash, closeAll } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  const e = await bridge.enterRoom('server_hall', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok }); await sleep(1500);
  await bridge.moveToNear('clock_server_hall', { timeoutMs: 25000 }); await sleep(700);
  const r = await bridge.interact('clock_server_hall', { timeoutMs: 15000, approach: false }); await sleep(1500);
  mark('panel-open', { ok: r && r.ok, mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 100) });
  await sleep(4000); mark('panel-held');
  await page.evaluate(() => { const x = document.querySelector('.game-display-dialog .game-modal-close'); if (x) x.click(); }).catch(() => {}); await sleep(500); await closeAll(page, bridge); if ((await bridge.getState()).activeMinigame) await page.keyboard.press('Escape').catch(() => {}); mark('panel-closed'); await sleep(900);
  try { await faceFlash(page, bridge, mark, 'asante'); } catch (err) { mark('asante-error', { e: String(err).slice(0, 150) }); }
};
