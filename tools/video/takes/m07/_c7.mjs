// Shared by the m07 crescendo/close-up takes t17..t30 (23 Nov, written, NOT run). Never types a PIN/password/code: only DIGITS (checked by check_digits.rb), never ENTER.
import { sleep } from '../lib/lib.mjs';
import { openChat, closeAll } from '../m06/_cres.mjs';
export { faceFlash, openMg, typeKeys, pickLock, closeAll, openChat, driveToMenu } from '../m06/_cres.mjs';
export { blurUid, cloneAndSave, buttons, clickBtn } from '../m05/t13_rfid_clone.mjs';
export const PAD = { badge: ['3', '8', '5'], vault: ['9', '1', '6'] };   // prefix/position-checked by check_digits.rb (yes/no only)
/** Off camera: close any dialogue, then open and close Hollis's chat so the server has met him (as m05/m06 did for the cloned NPC). */
export async function meetHollis(page, bridge) {
  await bridge.moveToNear('ray_hollis', { timeoutMs: 25000 }).catch(() => {}); await sleep(600);
  await openChat(bridge, 'ray_hollis'); await sleep(1500); await closeAll(page, bridge); await sleep(800);
}
export const openCloneHollis = (page) => page.evaluate(() => { const rc = window.npcManager.getNPC('ray_hollis').rfidCard; const cardData = { name: rc.name, card_id: rc.card_id, rfid_protocol: rc.rfid_protocol, type: 'keycard' }; for (const k of ['rfid_hex', 'rfid_facility', 'rfid_card_number', 'rfid_data']) if (rc[k] !== undefined) cardData[k] = rc[k]; window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: cardData, cloneSource: { npc_id: 'ray_hollis' } }); });
/** Straight key-driven walk from the player's current position: legs relative (dx/dy px), 145 px/s. */
export const relLegs = async (bridge, dx, dy) => { const p = (await bridge.getState()).player; const legs = []; if (dx) legs.push([dx > 0 ? 'right' : 'left', p.x + dx]); if (dy) legs.push([dy > 0 ? 'down' : 'up', p.y + dy]); return legs; };
