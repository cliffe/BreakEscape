// t03_kiosk_strip (ca12, beats 2 and 6): the Merrin & Sallow training kiosk with the six-step strip, then Start. Fresh game. Defender strip:
// this take is the fresh pass (step 1 of 6). The second pass (the tick to "5 Defend" on the "Take the calls" panel) needs a finished call
// and a reload, so it comes from t07's run, not here. Crop the brown company tab only; no scope text is cut mid-line (checked on the frames).
// Entry state: PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca12_visitor_tailgater
// Record: run-take.sh ca12_visitor_tailgater t03_kiosk_strip "" "--hide-hud --zoom-step 1"
// Marks: interact:training_kiosk, frame:kiosk-open, start, frame:after-start. Avatar window: no (the panel covers the player).
import { sleep, prepare, openKiosk, pressButton } from './_ca12a.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); }

export default async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark);
  await sleep(1500);
  mark('frame:kiosk-open');
  await sleep(2500);
  await pressButton(page, /^Start$/); mark('start');
  await sleep(1500);
  mark('frame:after-start');
  await sleep(2000);
  mark('hold-end');
};
