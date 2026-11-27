// t07_flip: the flip (beat 6). Lorna's L1 line after the call ("You talked your way through that door just now. Here you're the
// one being asked, same visitors."), then the kiosk's flip screen: heading "Now you're the one on the desk" with the strip on step 4,
// then Continue ticks the strip to Defend on a clean "Take the calls" panel.
// Its own run, separate from t06: the flip needs a reload after the call. Entry state: fresh game,
//   run-take.sh ca12_visitor_tailgater t07_flip "" "--hide-hud --zoom-step 1"
// setup() (off camera, about 65 s, mostly the reload): toCall (kiosk, browser, pin, card, Approach), plays D3 / sample box / buzz ask,
// closes the call, reloads, Resume, Skip tutorial, closes the Brief. The player then stands at (192,198) in the studio, beside Lorna.
// Spoiler rules: the flip body under the heading (call replay, "what would have caught it", the defender line) is hidden with
// injected CSS (.aw-flip children except the heading and Continue are visibility:hidden); no debrief, no verdict, no queue.
// Needs the avatar window (the player sprite is visible walking to Lorna).
// Marks: frame:npc-portrait-up (first frame with Lorna's portrait, the player's "playtest" portrait shows first), line-start/line-end
// L1 (voice watcher), kiosk-open, frame:flip-heading, tick (click Continue), frame:strip-defend.
import { sleep, toCall, playCallAndClose, reloadAndPrepare, interactRetry, openKiosk, pressButton, waitButton } from './_ca12b.mjs';
import { watchVoice } from '../lib/lib.mjs';
import { waitNpcPortrait } from './_ca12.mjs';

export async function setup(page, bridge) {
  await toCall(page, bridge); await playCallAndClose(page, bridge); await reloadAndPrepare(page, bridge);
  await page.addStyleTag({ content: '.aw-flip > :not(.aw-heading):not(.aw-continue){visibility:hidden !important}' });
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  const up = waitNpcPortrait(page, bridge, mark, /Lorna/i, 30000);   // polls while the interact runs, so the mark is the true first frame
  up.catch(() => {});
  await interactRetry(bridge, 'lorna_easton', mark);
  await up;
  const l1 = await vw.waitForLine(/talked your way through|held that door/, 25000);
  if (!l1) throw new Error('L1 never voiced');
  await sleep(300);
  await bridge.minigame.close();                       // before Lorna's second line and the hub
  await sleep(1500);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  await waitButton(page, /^Continue$/, 10000);
  await sleep(1800); mark('frame:flip-heading');
  await sleep(1200);
  mark('tick'); await pressButton(page, /^Continue$/);
  if (!(await waitButton(page, /Open the queue/, 10000))) throw new Error('Take the calls panel never showed');
  await sleep(300); mark('frame:strip-defend');
  await sleep(1500);
  await vw.stop();
  await bridge.minigame.close().catch(() => {});
  mark('end');
};
