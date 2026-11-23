// t09_phone (m04): the player's phone, Robert Vance (ops desk) chat: contact list, bubbles, reply choices, a neutral first reply, held. Player not visible.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room scada_control_room --set briefing_played=true --set vance_phone_available=true --set vance_is_ally=true --set vance_met=true
// Record: BE_SPRITE=lucia_moreno tools/video/takes/run-take.sh m04 t09_phone "<same flags>" ""   (no --hide-hud: the phone opens from the tray)
// Marks: phone-open, contact-picked, choices-shown (texts), choice:<text>, reply-settled, linger-end. Phone lines have no voice.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1700);
  const c = await bridge.minigame.clickText('Robert Vance');
  mark('contact-picked', { ok: c && c.ok });
  await sleep(1500);
  // The thread is a silent stub; the support line is a voiced call placed with the Call button (needs vance_is_ally).
  const cb = await page.evaluate(() => { const b = document.querySelector('.call-button'); if (!b) return false; b.click(); return true; });
  mark('call-probe', await page.evaluate(() => ({ g: [window.gameState?.globalVariables?.vance_is_ally, window.gameState?.globalVariables?.robert_vance_ko], closed: window.phoneRinger?.isClosed?.(), btn: !!document.querySelector('.call-button'), html: (document.querySelector('.phone-conversation-header, [class*=conversation-header]')||{}).innerHTML?.slice(0,300) })));
  mark('call-placed', { ok: cb });
  await sleep(2500);
  const d = await awaitChoice(bridge, 20000);
  if (!d) { mark('no-choices', { st: JSON.stringify(await bridge.getState()).slice(0, 400) }); throw new Error('no choices'); }
  mark('choices-shown', { choices: d.choices.map(x => x.text) });
  await sleep(2200);
  const ch = await bridge.minigame.choose(1);
  mark('choice:' + (ch && ch.chose), { ok: ch && ch.ok });
  await sleep(3500);
  const d2 = await awaitChoice(bridge, 8000).catch(() => null);
  mark('reply-settled', { choices: d2 && d2.choices.map(x => x.text) });
  await sleep(2500);
  mark('linger-end');
};
