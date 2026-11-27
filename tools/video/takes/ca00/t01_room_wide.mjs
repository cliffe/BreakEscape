// t01_room_wide: the Quayholt training room, held still: Darren and Niamh at their desks, the kiosk glow, Anjali standing, the player at the spawn.
// Feeds room (3.5 s, "Every episode is set in a working office."). Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 BE_PORT=<port> tools/video/takes/run-take.sh ca00_first_play t01_room_wide "" "--hide-hud --zoom-step 1"
// No kiosk, no talk. The player stays at the spawn (the sprite key is checked: expect female_office_worker_v2, never the hooded hacker).
// Any ambient bubble (thirst chatter) is marked by watchBubbles so the edit can avoid or use it; none is expected in 12 s.
// Marks: player-sprite, hold-start, bubble-start:<npc> / bubble-end:<npc> (only if one fires), frame:hold-mid, frame:hold-end, hold-end.
import { sleep, prepare, checkSprite, watchBubbles } from './_ca00.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const bubbles = await watchBubbles(page, mark);
  await checkSprite(page, mark);
  mark('hold-start'); await sleep(6000);
  mark('frame:hold-mid'); await sleep(6000);
  mark('frame:hold-end');
  await bubbles.stop();
  mark('hold-end', { bubbles: bubbles.seen.length });
};
