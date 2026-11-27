// t13_lorna_flip: Lorna's L1 ("You talked your way through that door just now. Here you're the one being asked, same visitors.",
// cached, 5.69 s) in her person-chat view, with 1 s of lead-in (studio, player and Lorna) and 1 s after the line. Lorna's next line (L4) starts 0.5 s after L1 ends, so the chat
// is closed 0.35 s after line-end (mark chat-closed) and the last second is the studio; L4 is never heard and no choice menu is shown. No kiosk, no flip screen.
// Entry state: fresh game, no flags; setup() (off camera, about 65 s, same as t07) plays the call through to the door and reloads.
//   run-take.sh ca12_visitor_tailgater t13_lorna_flip "" "--hide-hud --zoom-step 1"
// Marks: start-hold, interact:lorna_easton, frame:npc-portrait-up (Lorna's portrait/subtitle replaces the player's), line-start/line-end
// (voice watcher), choice-menu-opened if a choice menu shows (it should not before the close), end.
import { sleep, toCall, playCallAndClose, reloadAndPrepare, interactRetry } from './_ca12b.mjs';
import { watchVoice } from '../lib/lib.mjs';
import { waitNpcPortrait } from './_ca12.mjs';

export async function setup(page, bridge) {
  await toCall(page, bridge); await playCallAndClose(page, bridge); await reloadAndPrepare(page, bridge);
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Lorna/i, 30000);
  up.catch(() => {});
  await interactRetry(bridge, 'lorna_easton', mark);
  await up;
  const l1 = await vw.waitForLine(/talked your way through|held that door/, 25000);
  if (!l1) throw new Error('L1 never voiced');
  if (!/talked your way through/.test(l1.text)) throw new Error('wrong L1 variant: ' + l1.text);
  // L4 starts only 0.5 s after L1 ends, so close the chat 0.35 s after the line and hold 1 s on the studio (player and Lorna).
  let menu = false; const t0 = Date.now();
  while (Date.now() - t0 < 350) { const d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice && !menu) { menu = true; mark('choice-menu-opened'); } await sleep(50); }
  await vw.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await sleep(1000);
  mark('end');
};
