// t05_phone: phone chat with Agent HaX (message bubbles, contact list, choice buttons). Voice not needed (phone lines have no cached audio: 503).
// Entry state: head-start (skips the opening briefing cutscene):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --set briefing_played=true
// Record: run-take.sh t05_phone "--set briefing_played=true" ""   (no --hide-hud: the phone is opened from the inventory tray)
// Path: open the phone from the inventory, pick Agent HaX, "Got any general advice?", then "What about Maya?" (no culprit named; the Maya line says she is the informant: editor's call).
// Marks: phone-open, contact-picked, choice:<text>, reply-settled:<n>, linger-end.
import { sleep, clearScreen, awaitChoice } from './lib.mjs';

export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('open-phone-click');
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1500);                                  // contact list
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('contact-picked', { ok: c && c.ok });
  const plan = [/^Got any general advice/i, /^What about Maya/i];   // after Maya the chat returns to the hub
  let n = 0;
  for (const re of plan) {
    const d = await awaitChoice(bridge, 45000);
    if (!d) throw new Error('no choices for ' + re);
    mark('choices-shown', { choices: d.choices.map(x => x.text) });
    await sleep(1300);                                // read the options
    const ch = await bridge.minigame.choose(re);
    if (!ch || !ch.ok) throw new Error('choose failed ' + JSON.stringify(ch).slice(0, 200));
    mark('choice:' + ch.chose, { number: ch.number });
    n++;
  }
  // let the last reply print, then linger
  await awaitChoice(bridge, 45000);
  mark('reply-settled', { n });
  await sleep(1800);
  mark('linger-end');
};
