// t04_osint_note (ca12, beat 3, attacker): the navy browser window. Setup (unrecorded): kiosk, Start. The take presses Open the browser,
// clicks the Friendface tab, the Catherine Merrin link, then Pin on the first post; the green "Noted:" line is the payoff. Closes the
// browser at the end by the bridge (the strip then moves to Write). Pattern level only: no worked lure on screen.
// Entry state: PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca12_visitor_tailgater
// Record: run-take.sh ca12_visitor_tailgater t04_osint_note "" "--hide-hud --zoom-step 1"
// Marks: browser-open, friendface-tab, merrin-link, pin, frame:noted, browser-closed. Avatar window: no (the browser covers the scene).
import { sleep, prepare, kioskStart, pressButton, pressEl } from './_ca12a.mjs';

export async function setup(page, bridge, mark = () => {}) { await prepare(page, bridge); await kioskStart(page, bridge, mark); }

export default async (page, bridge, mark) => {
  await sleep(1000);
  await pressButton(page, /Open the browser/i); mark('browser-open'); await sleep(1800);
  mark('frame:browser-page');
  await pressEl(page, /^Friendface$/); mark('friendface-tab'); await sleep(1500);
  await pressEl(page, /^Catherine Merrin$/); mark('merrin-link'); await sleep(1800);
  mark('frame:merrin-page');
  await pressButton(page, /Pin$/); mark('pin'); await sleep(1200);
  mark('frame:noted');
  await sleep(1500);
  await bridge.minigame.close().catch(() => {}); mark('browser-closed');
  await sleep(800);
};
