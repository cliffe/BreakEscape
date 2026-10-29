// t18_walk_maya: short walking shot: the player comes in from hallway_east through the door of Maya's office and crosses it towards Maya Chen with the arrow
// keys (no click marker), stopping before any dialogue opens (no interaction, no voice). Maya's office is small (160x192), so the entrance supplies most of the motion.
// Entry state: head-start in hallway_east (maya_office is unlocked):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room hallway_east --set briefing_played=true
// Record: run-take.sh t18_walk_maya "--start-room hallway_east --set briefing_played=true" "--hide-hud --zoom-step 1"
// The take: 1.2 s hold in the hallway, enterRoom('maya_office') (the game's room transition), walk the legs, 3 s hold.
// Marks: enter-room, room-entered, walk-start, leg:<dir>, walk-end.
import { sleep, clearScreen } from './lib.mjs';
import { keyLegs } from './walklib.mjs';
const SPEED = 105;   // px/s, from the leg timings of earlier runs
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('enter-room');
  const r = await bridge.enterRoom('maya_office', { timeoutMs: 20000 });
  mark('room-entered', { ok: r && r.ok, player: (await bridge.getState()).player });
  if (!r || r.ok === false) throw new Error('enterRoom failed ' + JSON.stringify(r).slice(0, 200));
  await sleep(900);
  const rc = await bridge.roomContents('maya_office');
  const maya = rc.npcs.find(n => n.id === 'maya_chen');         // room coordinates are world coordinates and the room's offset varies: aim relative to Maya
  const me = (await bridge.getState()).player;
  mark('walk-start', { player: [me.x, me.y], maya: [maya.x, maya.y] });
  await keyLegs(bridge, [['up', maya.y + 22], ['right', maya.x + 30]], SPEED, mark);
  mark('walk-end', (await bridge.getState()).player);
  await sleep(3000);
  if ((await bridge.getState()).dialogue) throw new Error('a dialogue opened during the walk');
};
