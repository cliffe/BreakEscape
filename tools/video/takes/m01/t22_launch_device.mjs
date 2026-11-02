// t22_launch_device: the ENTROPY Launch Device opened from the inventory (the flag station in launch-abort mode), for a flash in the minigame
// crescendo (user, v8.2 review: replaces the Kali VM launcher cut). Nothing is typed or pressed; no launch or abort.
// Entry state: head-start in break_room with the device given (--give finds it in the NPC's itemsHeld by id):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room break_room --set briefing_played=true --give entropy_launch_device
// Record: run-take.sh t22_launch_device "<the flags above>" "--zoom-step 1"   (HUD left on: the device opens from the inventory tray)
// Marks: open, device-shown, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const inv = (await bridge.getState()).inventory.map(x => x.name);
  if (!inv.some(n => /launch device/i.test(n))) throw new Error('no launch device: ' + inv.join(','));
  await sleep(500);
}

export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('open');
  const r = await bridge.openInventoryItem('entropy_launch_device');
  if (!r || r.ok === false) throw new Error('open failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('flag-station', { timeoutMs: 8000 });
  mark('device-shown', await bridge.minigame.getState().catch(e => String(e)));
  await sleep(3500);
  mark('linger-end');
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
