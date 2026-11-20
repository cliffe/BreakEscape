// t22_ward_crowd (m02): hospital_ward establishing shot, several NPCs in frame (Doyle, Raval, Pryce, Hargreaves, Chen), no dialogue. Fresh game, ward lit, shot early.
// Entry: new-game.rb m02_ransomed_trust --start-room hospital_ward   Record: tools/video/takes/run-take.sh m02 t22_ward_crowd "--start-room hospital_ward" "--hide-hud --zoom-step 1"
// The player stands where the head-start puts them (no walking); logs every NPC position so the edit can crop.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NPCS', JSON.stringify(s.nearby.filter(n => n.kind === 'npc').map(n => [n.id, n.name, Math.round(n.x), Math.round(n.y)])), 'player', JSON.stringify([s.player.x, s.player.y]));
  await sleep(500);
}
export default async (page, bridge, mark) => {
  await sleep(900);
  const s = await bridge.getState();
  mark('presence-start', { player: [s.player.x, s.player.y], npcs: s.nearby.filter(n => n.kind === 'npc').map(n => [n.id, Math.round(n.x), Math.round(n.y)]) });
  await sleep(3400);
  if ((await bridge.getState()).dialogue) throw new Error('a dialogue opened');
  mark('presence-end');
  await sleep(500);
};
