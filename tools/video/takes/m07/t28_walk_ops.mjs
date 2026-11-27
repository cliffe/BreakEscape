// t28_walk_ops (m07, keyless, NOT YET RUN): walking shot, operations_floor: from the west door straight east past the water cooler towards the server-hall door (door:operations_floor->server_room), then hold 1 s, nothing opened. Legs: x to the door's x minus 40.
// Entry state (new-game): --imports=none --start-room operations_floor --set briefing_played=true --set inside_reached=true --set architect_t20_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh harjit_singh t28_walk_ops "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end. TODO first run: spawn row decides whether the straight leg passes the cooler (4,5 tiles area); adjust M07_DY.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1500); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1000); const s = await bridge.getState(); const dr = s.nearby.find(n => n.id === 'door:operations_floor->server_room');
  if (!dr) throw new Error('door not in nearby: ' + JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y)]).slice(0, 14)));
  mark('walk-start', { player: s.player, door: [dr.x, dr.y] });
  const legs = []; const dy = Number(process.env.M07_DY || 0); if (dy) legs.push([dy > 0 ? 'down' : 'up', s.player.y + dy]); legs.push(['right', dr.x - 40]);
  await keyLegs(bridge, legs, 145, mark); mark('walk-end', { player: (await bridge.getState()).player }); await sleep(1000);
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened on the walk');
};
