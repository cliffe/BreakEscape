// t05_pretext_card (ca12, beat 4, attacker): the navy pretext card filling in. Setup (unrecorded): kiosk, Start, browser, Friendface,
// Catherine Merrin, Pin, close the browser. The take presses Prepare the call, then the Recipient picker (a custom list: click the
// "Catherine Merrin" span) and stops on the filled card BEFORE Approach (Approach opens the call, which t06 owns). Pattern level only.
// Entry state: PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca12_visitor_tailgater
// Record: run-take.sh ca12_visitor_tailgater t05_pretext_card "" "--hide-hud --zoom-step 1"
// Marks: prepare-call, frame:card, recipient-open, recipient-picked, frame:card-filled, hold-end. Avatar window: no (the card covers the scene).
import { sleep, prepare, kioskStart, openFriendface, pressButton, pressEl } from './_ca12a.mjs';

export async function setup(page, bridge, mark = () => {}) {
  await prepare(page, bridge); await kioskStart(page, bridge, mark); await openFriendface(page, mark);
  await pressButton(page, /Pin$/); await sleep(900);
  await bridge.minigame.close().catch(() => {}); await sleep(1000);
}

export default async (page, bridge, mark) => {
  await sleep(800);
  await pressButton(page, /Prepare the call/i); mark('prepare-call'); await sleep(1800);
  mark('frame:card');
  await sleep(1500);
  await pressEl(page, /Recipient|choose/i, 8000).catch(() => null); mark('recipient-open'); await sleep(1200);
  await pressEl(page, /^Catherine Merrin$/); mark('recipient-picked'); await sleep(1500);
  mark('frame:card-filled');
  await sleep(2000);
  mark('hold-end');
};
