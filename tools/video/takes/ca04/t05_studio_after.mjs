// t05_studio_after: the Merrin & Sallow studio after the defend set, staff on their needs. SILENT by design: with kit_defend_done the chatter is off until the debrief, so the take
// confirms with watchBubbles that no bark fires (any bubble-start mark means the shot is not silent: tell the editor). The script cuts 2 to 4.8 s; the hold is 7 s.
// Entry state (seeded; tell AC0): SEED_AFTER from _ca04.mjs (the S9 flags in the scout):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca04_exec_whaling t05_studio_after '--set episode_e4_exec_whaling_state={"done":["brief","osint","write","flip","defend"]} --set episode_e4_exec_whaling_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e4_exec_whaling_defend_percent=100' "--hide-hud --zoom-step 1"
// setup() (off camera): prepare, move the player from Julian's side (192,198) to the corner by the sofa (255,228) so no "..." cue sits over him, settle.
// Marks: hold-start, bubble-start:<npc> / bubble-end:<npc> (only if a bark fires), frame:hold-mid, frame:hold-end, hold-end (bubbles count, 0 = silent).
import { sleep, prepare, watchBubbles, checkSprite } from './_ca04.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await bridge.moveTo(255, 228, { timeoutMs: 15000 }).catch(() => {});
  await sleep(800);
}

export default async (page, bridge, mark) => {
  await checkSprite(page, mark);
  const bubbles = await watchBubbles(page, mark);
  mark('hold-start');
  await sleep(3500); mark('frame:hold-mid');
  await sleep(3500); mark('frame:hold-end');
  await bubbles.stop();
  mark('hold-end', { bubbles: bubbles.seen.length, silent: bubbles.seen.length === 0 });
};
