// t08b_nilesh_ask: Nilesh's opener, N1 "Nilesh, service desk. Something slowing you down? Ask us first. We'd rather help than clean up." (7.58 s, r3 wording,
// cached), person-chat view. Entry state: fresh game, no flags, kiosk never opened.
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t08b_nilesh_ask "" "--hide-hud --zoom-step 1"
// The take walks to him, plays N1 in full, and closes the chat as N2 ("Start at the kiosk...") starts (n2_start), so N2 is barely heard.
// The edit cuts at n1_end + 0.1. Marks: start-hold, frame:npc-portrait-up, npc_portrait_up, n1_start, n1_end, n2_start, line-start/end, end.
import { sleep, prepare, interactRetry, waitNpcPortrait, checkSprite } from './_ca15.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Nilesh/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'nilesh_solanki', mark);
  await up; mark('npc_portrait_up');
  const n1 = await vw.waitForLine(/Something slowing you down/, 30000);
  if (!n1) throw new Error('N1 never voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  mark('n1_start', null, n1.start); mark('n1_end', { durMs: n1.durMs }, n1.end);
  const n2 = await vw.waitForLine(/Start at the kiosk/, 15000);
  if (n2) mark('n2_start', null, n2.start);
  await vw.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await sleep(600); mark('end');
};
