// t14_lorna_noblame: Lorna's L5 ("Nobody's in trouble for slowing a pushy visitor down.", cached, 3.29 s) in her person-chat view,
// said after the defend set. Entry state skips the triage: the defend is marked done in the kiosk state and the ink global
// episode_e12_visitor_tailgater_defend_complete is true. kit_defend_done is NOT set (it would route Lorna to the look-up recap
// instead). Her first line ("That's the desk done. ...") plays before L5, so the take holds through it and closes the chat 0.35 s after L5 (the hub choice menu opens at about +0.47 s) and holds 1 s on the studio.
// No verdict, debrief or kiosk screen is shown.
//   run-take.sh ca12_visitor_tailgater t14_lorna_noblame "--set episode_e12_visitor_tailgater_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]} --set episode_e12_visitor_tailgater_defend_complete=true" "--hide-hud --zoom-step 1"
// Marks: start-hold, interact:lorna_easton, frame:npc-portrait-up, line-start/line-end for each line, choice-menu-opened if shown, end.
import { sleep, prepare, interactRetry } from './_ca12b.mjs';
import { watchVoice } from '../lib/lib.mjs';
import { waitNpcPortrait } from './_ca12.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Lorna/i, 30000);
  up.catch(() => {});
  await interactRetry(bridge, 'lorna_easton', mark);
  await up;
  const l5 = await vw.waitForLine(/in trouble for slowing/, 30000);
  if (!l5) throw new Error('L5 never voiced; lines heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  let menu = false; const t0 = Date.now();
  while (Date.now() - t0 < 350) { const d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice && !menu) { menu = true; mark('choice-menu-opened'); } await sleep(50); }
  await vw.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');   // the choice menu opens about 0.47 s after L5 ends: close before it
  await sleep(1000);
  mark('end');
};
