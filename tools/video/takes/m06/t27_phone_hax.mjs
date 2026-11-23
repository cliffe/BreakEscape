// t27_phone_hax (m06, keyless, NOT YET RUN): the player's phone (phoneId player_phone), contact "Agent HaX" (agent_0x99_handler): list, thread, held; nothing picked. Same flow as m05 t19.
// Entry state (new-game): --imports=none --start-room reception_lobby --set briefing_played=true   Record flags: "" (no --hide-hud: the phone opens from the tray)
// Record: MISSION=m06 run.sh ngozi_adeyemi t27_phone_hax "<flags above>" ""
// Marks: phone-open, contact-picked, thread-shown, linger-end. TODO: HaX's thread may be empty before found_architects_fund; if so add --set found_architects_fund=true (ONLY if the thread then shows no slot/code) or accept the contact list.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 }); mark('phone-open'); await sleep(2200);
  const c = await bridge.minigame.clickText('Agent HaX'); mark('contact-picked', { ok: c && c.ok }); await sleep(2500);
  const d = await awaitChoice(bridge, 6000).catch(() => null);
  mark('thread-shown', { choices: d && d.choices.map(x => x.text), txt: await page.evaluate(() => ((document.querySelector('.phone-chat-container, [class*=phone]') || {}).innerText || '').slice(0, 500)) });
  await sleep(3500); mark('linger-end');
};
