// t08_triage: the defender's reception triage (beat 7). The "Take the calls" panel, Open the queue, the navy Brief screen, Start,
// the six-row list ("0 of 6 sorted"), then one visitor card opened ("Expected client" first, "Unknown visitor" as the fallback).
// Entry state: fresh game, run-take.sh ca12_visitor_tailgater t08_triage "" "--hide-hud --zoom-step 1". setup() (off camera, about
// 65 s) plays the call, reloads and presses Continue on the flip screen (so the flip body, a spoiler, is never on camera); the
// take starts on the clean "Take the calls" panel with the strip ticked to Defend.
// Spoiler rules: stops with the card open and the four verdict buttons unpressed. Nothing after a verdict, no result, no tells.
// Needs the avatar window per the shot list (the kiosk panel hides the player, so it is optional in practice).
// Marks: panel-queue, click:Open the queue, frame:brief-screen, click:Start, frame:list, click:<row>, frame:card, end.
import { sleep, toCall, playCallAndClose, reloadAndPrepare, openKiosk, pressButton, waitButton, clickEl, buttons } from './_ca12b.mjs';

export async function setup(page, bridge) {
  await toCall(page, bridge); await playCallAndClose(page, bridge); await reloadAndPrepare(page, bridge);
  await openKiosk(page, bridge);
  await pressButton(page, /^Continue$/);
  if (!(await waitButton(page, /Open the queue/, 10000))) throw new Error('Take the calls panel never showed');
  await sleep(500);
}

export default async (page, bridge, mark) => {
  mark('panel-queue'); await sleep(1800);
  mark('frame:take-the-calls');
  mark('click:Open the queue'); await pressButton(page, /Open the queue/);
  await waitButton(page, /^Start$/, 10000); await sleep(1500); mark('frame:brief-screen');
  mark('click:Start'); await pressButton(page, /^Start$/);
  await sleep(1500); mark('frame:list');
  await sleep(1200);
  const row = await clickEl(page, /Expected client/) ? 'Expected client' : (await clickEl(page, /Unknown visitor/) ? 'Unknown visitor' : null);
  if (!row) throw new Error('no visitor row to open; buttons: ' + JSON.stringify((await buttons(page)).slice(0, 10)));
  mark('click:' + row);
  await sleep(1500); mark('frame:card');
  await sleep(2000);
  mark('end');                                         // no verdict pressed
};
