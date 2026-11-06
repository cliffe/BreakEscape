// t14b_flag_station (m02): the flag-station screen on flag_station_dropsite in server_room. Shot in a game with NO flag submitted: with flag 3 submitted the screen lists the submitted flag string.
// Entry state: head-start in server_room: new-game.rb m02_ransomed_trust --start-room server_room --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t14b_flag_station "--start-room server_room --set briefing_played=true" "--hide-hud"
// Marks: interact, flagstation-open, flagstation-hold-end, flagstation-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  const r = await bridge.interact('flag_station_dropsite', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('flag station interact ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('flag-station', { timeoutMs: 8000 });
  const st = await bridge.minigame.getState();
  mark('flagstation-open', { id: st && st.id });
  console.error('FLAG-TEXT', JSON.stringify(st && st.text).slice(0, 800));
  await sleep(3000);
  mark('flagstation-hold-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('flagstation-closed');
  await sleep(800);
};
