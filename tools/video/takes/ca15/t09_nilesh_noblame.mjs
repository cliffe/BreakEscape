// t09_nilesh_noblame: Nilesh's tone line after the defend set: "That's the lot. If the official way's slow, tell us rather than
// building your own way round." then "Nobody's in trouble for a workaround." (2.57 s, cached). Person-chat view.
// Entry state (step-away flags plus the host-said flag so the hub reaches the defend-complete branch, not the stick branch):
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t09_nilesh_noblame \
//     "--set episode_e15_shadow_it_state={\"done\":[\"brief\",\"mistake\",\"flip\",\"defend\"]} --set episode_e15_shadow_it_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e15_shadow_it_defend_percent=60 --set kit_ca15_host_said=true" \
//     "--hide-hud --zoom-step 1"
// The take refuses if the conversation does not open on "That's the lot." (a different first line means the stick branch ran).
// Ends 0.35 s after the second line ends (before the hub menu), holds 1 s on the room.
// Marks: start-hold, interact, frame:npc-portrait-up, line-start/line-end per line, lot_start, noblame_start, noblame_end, player-sprite, end.
import { sleep, prepare, interactRetry, waitNpcPortrait, checkSprite } from './_ca15.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Nilesh/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'nilesh_solanki', mark); mark('interact');
  await up;
  const lot = await vw.waitForLine(/That's the lot|stick/i, 30000);
  if (!lot) throw new Error('no first line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/That's the lot/.test(lot.text)) throw new Error('conversation opened on the wrong line: ' + lot.text);
  mark('lot_start', null, lot.start);
  const nb = await vw.waitForLine(/in trouble for a workaround/, 30000);
  if (!nb) throw new Error('noblame line never voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  mark('noblame_start', null, nb.start); mark('noblame_end', { durMs: nb.durMs }, nb.end);
  await sleep(350);
  await vw.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await sleep(1000); mark('end');
};
