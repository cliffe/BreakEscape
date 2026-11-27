// t02_room_wide: the Tarrowby depot office, wide, with the player walking to the training screen (kiosk, 238,98). Fresh game, kit_quiet seeded so no bark sits under the VO.
// The player starts at (192,198); Nilesh (5.5,3.8 tiles), Fatima (2,6) and Chidi (3,6) are at their desks, the drinks machine is at (222,239). The player walks up and right to just
// under the kiosk, nothing is pressed (no interact, so the kiosk stays shut). Script shot is 8.0 s (0 to 8.0 s of this take): the edit picks the in point from the marks.
// Entry state:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca17 t02_room_wide "--set kit_quiet=true" "--hide-hud --zoom-step 1"
// Marks: player-sprite, start-hold, walk-start, leg:*, walk-end (x, y), bubble-start/end:<npc> (only if a bark fires: that is a discard), frame:t+N every 2 s, end.
import { sleep, prepare, checkSprite, watchBubbles } from './_ca17.mjs';
import { keyLegs } from '../lib/walklib.mjs';

const SPEED = 145;   // player px/s (ca01, m02 measured); keyLegs undershoots then corrects in pulses
export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_quiet !== true) throw new Error('entry state wrong: kit_quiet is not true; seed it with --set kit_quiet=true');
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  await checkSprite(page, mark, { strict: false });
  const t0 = Date.now();
  mark('start-hold'); mark('frame:t+0');
  await sleep(1500);
  const p = (await bridge.getState()).player;
  mark('walk-start', { x: p.x, y: p.y, room: p.room });
  await keyLegs(bridge, [['up', 124], ['right', 236]], SPEED, mark);
  const q = (await bridge.getState()).player;
  mark('walk-end', { x: q.x, y: q.y, room: q.room });
  let next = 2;
  while (Date.now() - t0 < 8500) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(100);
  }
  await bw.drain();
  if (bw.seen.length) mark('bark-in-take', { seen: bw.seen.map(e => e.text) });
  const m = (await bridge.getState()).activeMinigame; if (m) mark('minigame-open-unexpected', { m: String(m.id || m.type || m) });
  await bw.stop(); mark('end');
};
