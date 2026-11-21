// t05_phone (m03): the player's phone, Agent HaX chat (contact list, bubbles, reply choices), a neutral topic, held longer than feels natural. Player not visible: any avatar.
// Entry state: fresh game with the briefing gate: new-game.rb m03_ghost_in_the_machine --set briefing_played=true
// Record: BE_SPRITE=<any> tools/video/takes/run-take.sh m03 t05_phone "--set briefing_played=true" ""   (no --hide-hud: the phone opens from the tray)
// Path: open phone, pick Agent HaX, choices shown, pick a neutral topic (the first hub choice that is not about the mission's secrets), reply settles, hold.
// Marks: phone-open, contact-picked, choices-shown (with the choice texts), choice:<text>, reply-settled, linger-end. Phone lines have no voice.
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
  const pick = (process.env.M03_PHONE_STEPS || '^How do I clone these keycards').split('|').filter(Boolean).map(s => new RegExp(s, 'i'));
  let n = 0;
  for (const re of pick) {
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
