// t22_server_walk_flag (m06, keyless, NOT YET RUN): (1) enter server_room through the unlocked door:trading_floor->server_room (motion lights strike), straight key-driven walk towards vm_launcher_hackme, STOP before it opens (its panel has a login post-it; no minigame must open). (2) the flag station (flag_station_financial), nothing submitted, held 2.6 s, closed.
// Entry state (new-game): --imports=none --unlock trading_floor --unlock server_room --start-room trading_floor --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh mei_lin_chow t22_server_walk_flag "<flags above>" "--hide-hud --zoom-step 1"
// Marks: door-interact, room-entered, walk-start, leg:*, walk-end, station-open, station-closed. TODO first run: the spawn point inside server_room decides the legs; a dark lead-in of about 1 s is wanted.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { closeAll } from './_cres.mjs';
const DOOR = 'door:trading_floor->server_room';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('door-interact');
  await bridge.interact(DOOR, { timeoutMs: 20000, approach: false });
  for (let i = 0; i < 40 && (await bridge.getState()).player.room !== 'server_room'; i++) await sleep(250);
  mark('room-entered', { room: (await bridge.getState()).player.room }); await sleep(1500);
  const s = await bridge.getState(); const vm = s.nearby.find(n => n.id === 'vm_launcher_hackme');
  if (!vm) throw new Error('launcher not in nearby: ' + JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y)])));
  mark('walk-start', { vm: [vm.x, vm.y], player: s.player });
  await keyLegs(bridge, [['up', vm.y + 34], ['left', vm.x]], 145, mark);
  mark('walk-end', { player: (await bridge.getState()).player }); await sleep(1500);
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened on the walk');
  await bridge.moveToNear('flag_station_financial', { timeoutMs: 20000 }); await sleep(800);
  const r = await bridge.interact('flag_station_financial', { timeoutMs: 20000, approach: false }); await sleep(900);
  mark('station-open', { ok: r && r.ok, mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 120) });
  await sleep(2600); await closeAll(page, bridge); mark('station-closed'); await sleep(900);
};
