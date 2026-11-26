// t15_nilesh_kind: beat 11 of the ca15 r3 trailer. Nilesh at the kiosk, his read after the drop: "Nobody was careless there. She was being kind,
// and that's what a drop relies on." (voiced clip 935729fb..., 4.7 s). Person-chat view.
// Entry state (drop already used, line not yet said, runner closed):
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t15_nilesh_kind \
//     "--set ca15_drop_given=true --set ca15_drop_used=true --set ca15_drop_done=true" "--hide-hud --zoom-step 1"
// The choice list (".person-chat-choices-container", "Thanks, Nilesh.") is hidden from before the chat opens until 2.0 s after the line ends.
// The take refuses if the first voiced line is not the "careless" one.
// Edit: in = line_start - 0.1, out = in + 6.32, requires line_end <= out - 0.35.
// Marks: start-hold, interact, frame:npc-portrait-up, line-start/line-end (voice watcher), line_start, line_end, menu_hidden_until, player-sprite, end.
import { sleep, prepare, interactRetry, waitNpcPortrait, checkSprite, hideCss } from './_ca15.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.ca15_drop_used !== true) throw new Error('entry state wrong: ca15_drop_used is not true');
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  await hideCss(page, '.person-chat-choices-container{visibility:hidden !important}');
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Nilesh/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'nilesh_solanki', mark); mark('interact');
  await up;
  const l = await vw.waitForLine(/careless|Before we flip|That's the lot|Nilesh, service desk/i, 30000);
  if (!l) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(x => x.text)));
  if (!/Nobody was careless/.test(l.text)) throw new Error('chat opened on the wrong line: ' + l.text);
  mark('line_start', null, l.start); mark('line_end', { durMs: l.durMs }, l.end);
  await sleep(2100); mark('menu_hidden_until');
  await vw.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await sleep(1500); mark('end');
};
