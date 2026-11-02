// t05_phone (m02): the player's phone, Agent HaX chat (contact list, message bubbles, reply choices), a choice picked, held longer than feels natural.
// Entry state: fresh game with the briefing gate: new-game.rb m02_ransomed_trust --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t05_phone "--set briefing_played=true" ""   (no --hide-hud: the phone is opened from the inventory tray)
// Path: open phone, pick Agent HaX, first-call choices shown (1.8 s), "What should I know going in?", hub choices shown (1.8 s), "Where do I start?", reply settles, 3 s hold.
// Marks: phone-open, contact-picked, choices-shown, choice:<text>, reply-settled, linger-end. Phone lines have no voice.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('open-phone-click');
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1700);
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('contact-picked', { ok: c && c.ok });
  let n = 0;
  for (const re of [/^What should I know going in/i, /^Where do I start/i]) {
    const d = await awaitChoice(bridge, 45000);
    if (!d) throw new Error('no choices for ' + re);
    mark('choices-shown', { choices: d.choices.map(x => x.text) });
    await sleep(1800);
    const ch = await bridge.minigame.choose(re);
    if (!ch || !ch.ok) throw new Error('choose failed ' + JSON.stringify(ch).slice(0, 200));
    mark('choice:' + ch.chose, { number: ch.number });
    n++;
  }
  const d2 = await awaitChoice(bridge, 45000);
  mark('reply-settled', { n, choices: d2 && d2.choices.map(x => x.text) });
  await sleep(3000);
  mark('linger-end');
};
