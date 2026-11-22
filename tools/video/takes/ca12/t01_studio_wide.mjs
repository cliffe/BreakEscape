// t01_studio_wide (ca12, beat 1 hook): the lit Merrin & Sallow studio with the staff on their needs. A fresh game; the player is moved (in setup)
// from Julian's side (192,198) to the corner by the sofa (255,228), then stands still: a quiet hold. A1 ("Right, five minutes on the sofa") is NOT ambient: it only fires from the t09 step-away
// set piece, so this take cannot get it. The ambient chatter (A3 Thandiwe, A4 Julian, A2/A5 kettle trip) is random: watchBubbles marks
// whatever fires as bubble-start/bubble-end (picture clock), and the editor cuts in on those. Plain 12 s hold, no spoiler content in frame.
// Entry state: PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca12_visitor_tailgater
// Record: run-take.sh ca12_visitor_tailgater t01_studio_wide "" "--hide-hud --zoom-step 1"
// Marks: hold-start, bubble-start:<npc> / bubble-end:<npc> (only if a chatter line fires), frame:hold-mid, frame:hold-end, hold-end. Avatar window: no (player still, small in frame).
import { sleep, prepare, watchBubbles } from './_ca12.mjs';

// Move the player out of Julian's interaction cue (the "..." bubble) to the bottom right corner by the sofa, before the take starts.
export async function setup(page, bridge) {
  await prepare(page, bridge);
  await bridge.moveTo(255, 228, { timeoutMs: 15000 }).catch(() => {});
  await sleep(800);
}

export default async (page, bridge, mark) => {
  const bubbles = await watchBubbles(page, mark);
  mark('hold-start');
  await sleep(6000);
  mark('frame:hold-mid');
  await sleep(6000);
  mark('frame:hold-end');
  await bubbles.stop();
  mark('hold-end', { bubbles: bubbles.seen.length });
};
