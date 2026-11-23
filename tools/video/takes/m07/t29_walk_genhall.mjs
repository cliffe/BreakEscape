// t29_walk_genhall: walking shot, generator_room: straight leg towards door:generator_room->cable_vault (south), stopping 40 px short, nothing opened. (m07, keyless, NOT YET RUN). backup_transfer_switch (ATS-1 plate) is never touched.
// Entry state (new-game): --imports=none --unlock server_room --unlock generator_room --start-room generator_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh ngozi_adeyemi t29_walk_genhall "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end. TODO first run: the hall is 4x2 grid units wide: confirm the leg is on one axis; check the plate is not in frame.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1500); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1000); const s = await bridge.getState(); const dr = s.nearby.find(n => n.id === 'door:generator_room->cable_vault');
  if (!dr) throw new Error('door not in nearby: ' + JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y)]).slice(0, 14)));
  mark('walk-start', { player: s.player, door: [dr.x, dr.y] });
  await keyLegs(bridge, [['right', dr.x], ['down', dr.y - 40]], 145, mark); mark('walk-end', { player: (await bridge.getState()).player }); await sleep(1000);
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened on the walk');
};
