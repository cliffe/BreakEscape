// t17_security_office (m10, keyless, NOT YET RUN): security_office crescendo closeups. (1) Alarm Board (alarm_panel), lamps incl. TUNNEL INNER DOOR: FORCED flashing (security_alerted seeded); (2) PIN pad on records_cupboard, PAD.cupboard (3 wrong digits, check_digits.rb yes/no), never ENTER, closed; (3) real lockpicking of fitter_locker (key lock, keyPins x4, kit is a start item, no key in hand), stops at the open (the card inside is not taken).
// Entry (new-game): --imports=none --start-room security_office --unlock security_office --set briefing_played=true --set security_alerted=true   Record: "--hide-hud --zoom-step 1"   (avatar marcus_hale)
// Record: MISSION=m10 run.sh marcus_hale t17_security_office "<flags>" "--hide-hud --zoom-step 1"
// Marks: board-open, board-held, board-closed, pad-open, pad-typed, pad-closed, locker-open, pins, tension, pin-set:N, lock-open, linger-end.
// Risks: security_alerted may turn the duty guard hostile (patrol speed 95 on room_entered only; start-room fires none) and the raid copies stay hidden (breach_open unset). Setup blinds duty_guard (los range 1, disabled) so lockpick_used_in_view cannot fire: check he does not walk through the shot. Do not film door_log / keypad_reset_slip (clues).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, pickLock, PAD } from './_c10.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { const g = window.npcManager.getNPC('duty_guard'); if (g) { g.los = { ...(g.los || {}), range: 1, enabled: false }; try { if (g.config && g.config.behavior && g.config.behavior.patrol) g.config.behavior.patrol.enabled = false; } catch (e) {} g.isVisible = false; try { const sp = g._sprite || g.sprite; sp.setVisible(false); sp.setActive(false); if (sp.body) sp.body.enable = false; sp.setPosition(-800, -800); } catch (e) { console.error('HIDE', String(e)); } } });
  await sleep(600); console.error('SETUP', JSON.stringify((await bridge.getState()).player));
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  await bridge.moveToNear('alarm_panel', { timeoutMs: 25000 }); await sleep(700);
  await openMg(bridge, 'alarm_panel', 'board', mark); await sleep(3500); mark('board-held'); await closeAll(page, bridge); mark('board-closed'); await sleep(900);
  await bridge.moveToNear('records_cupboard', { timeoutMs: 25000 }); await sleep(700);
  await openMg(bridge, 'records_cupboard', 'pad', mark); await sleep(1800);
  await typeKeys(page, PAD.cupboard, mark, 'pad', 500); await sleep(1500); await closeAll(page, bridge); mark('pad-closed'); await sleep(900);
  await bridge.moveToNear('fitter_locker', { timeoutMs: 25000 }); await sleep(700);
  const lr = await bridge.interact('fitter_locker', { timeoutMs: 20000, approach: false }); await sleep(1500);
  console.error('LOCKER', JSON.stringify(lr).slice(0, 400), JSON.stringify((await bridge.getState()).activeMinigame), JSON.stringify(await bridge.minigame.getState().catch(e => String(e))).slice(0, 800));
  const lw = await bridge.waitForMinigame('lockpicking', { timeoutMs: 8000 }).catch(() => null);
  if (!lw || lw.ok === false) throw new Error('locker did not open');
  mark('locker-open'); await sleep(1800);
  await pickLock(page, bridge, mark); await sleep(1200); await closeAll(page, bridge); mark('linger-end');
};
