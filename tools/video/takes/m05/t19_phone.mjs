// t19_phone (m05, keyless): the player's phone, Agent HaX thread: contact list, then the thread with whatever it shows, held. Nothing picked (no answer in the thread). Player not visible: any avatar.
// Record: MISSION=m05 run.sh <avatar> t19_phone "--imports=none --start-room main_corridor --set briefing_played=true" ""   (no --hide-hud: the phone opens from the tray)
// Marks: phone-open, contacts (names), contact-picked, thread-shown (choice texts if any), linger-end.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open', { names: await page.evaluate(() => [...document.querySelectorAll('[class*=contact]')].map(e => e.textContent.trim().slice(0, 40)).slice(0, 8)) });
  await sleep(2200);
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('contact-picked', { ok: c && c.ok });
  await sleep(2500);
  const d = await awaitChoice(bridge, 6000).catch(() => null);
  mark('thread-shown', { choices: d && d.choices.map(x => x.text), txt: await page.evaluate(() => (document.querySelector('.phone-chat-container, [class*=phone]') || {}).innerText?.slice(0, 500)) });
  await sleep(3500);
  mark('linger-end');
};
