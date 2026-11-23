// t22b_server_walk_flag (m06, keyless): re-take of t22. Door recipe: moveToNear the door, interact, after 4 s bridge.enterRoom('server_room'); then a key-driven walk INSIDE the server room to the flag station (flag_station_financial); station opened, nothing typed, closed. The launcher panel must not open.
// Entry state (new-game): --imports=none --unlock trading_floor --unlock server_room --start-room trading_floor --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh mei_lin_chow t22b_server_walk_flag "<flags above>" "--hide-hud --zoom-step 1"
// Marks: door-interact, enterRoom, room-entered, walk-start, leg:*, walk-end, station-open, station-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { closeAll } from './_cres.mjs';
const DOOR = 'door:trading_floor->server_room';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('door-interact');
  await bridge.interact(DOOR, { timeoutMs: 20000, approach: false });
  await sleep(4000);
  if ((await bridge.getState()).player.room !== 'server_room') { const r = await bridge.enterRoom('server_room', { timeoutMs: 30000 }); mark('enterRoom', { r: JSON.stringify(r).slice(0, 160) }); }
  const s0 = await bridge.getState();
  mark('room-entered', { room: s0.player.room }); if (s0.player.room !== 'server_room') throw new Error('did not cross the door'); await sleep(1500);
  const s = await bridge.getState(); const fs = s.nearby.find(n => n.id === 'flag_station_financial');
  if (!fs) throw new Error('station not in nearby: ' + JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y)])));
  mark('walk-start', { station: [fs.x, fs.y], player: [s.player.x, s.player.y] });
  // the entry point is already beside the station (32 px): walk out along the desk front and back to it, so the shot shows a straight walk in the server room ending at the station
  const legs = [['right', s.player.x + 90], ['left', fs.x + 4]];
  await keyLegs(bridge, legs, 145, mark);
  mark('walk-end', { player: (await bridge.getState()).player }); await sleep(1200);
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened on the walk');
  await bridge.moveToNear('flag_station_financial', { timeoutMs: 20000 }); await sleep(800);
  const r = await bridge.interact('flag_station_financial', { timeoutMs: 20000, approach: false }); await sleep(900);
  mark('station-open', { ok: r && r.ok });
  await sleep(2600); await closeAll(page, bridge); mark('station-closed'); await sleep(900);
};
