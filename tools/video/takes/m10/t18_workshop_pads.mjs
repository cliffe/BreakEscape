// t18_workshop_pads (m10, keyless, NOT YET RUN): workshop_floor crescendo closeups. (1) the password screen on model_terminal (lockType password): opens, held, z/q/x typed (never the password, never Enter), closed. (2) RFID: the cloner on Imran's card (rfidCard on npc imran, EM4100) read and saved with a 30 ms UID blur; closed; then the reader on door:workshop_floor->power_room (still locked), Emulate, door opens.
// Setup (off camera) opens and closes Imran's chat so the server has met him (as m07 t17). The workshop guard / Gary / Imran may wander; the bench terminal's contents are never opened.
// Entry (new-game): --imports=none --start-room workshop_floor --unlock workshop_floor --set briefing_played=true   (power_room stays locked)   Record: "--hide-hud --zoom-step 1"   (avatar harjit_singh)
// Record: MISSION=m10 run.sh harjit_singh t18_workshop_pads "<flags>" "--hide-hud --zoom-step 1"
// Marks: pw-open, pw-typed, pw-closed, cloner-open, step:<button>, saved, cloner-closed, door-interact, reader-open, step:Emulate, door-open, linger-end. Check frames for any readable UID/number in the cloner.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, openChat, blurUid, cloneAndSave, buttons, clickBtn } from './_c10.mjs';
const DOOR = 'door:workshop_floor->power_room';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('imran', { timeoutMs: 25000 }).catch(() => {}); await sleep(600);
  await openChat(bridge, 'imran'); await sleep(1500); await closeAll(page, bridge); await sleep(800);
  await bridge.moveToNear('model_terminal', { timeoutMs: 25000 }); await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1000); await openMg(bridge, 'model_terminal', 'pw', mark); await sleep(2200);
  mark('pw-typed'); await sleep(3000); /* no typing: a password field must never be typed into (browser save-password popup, 24 Nov) */ await closeAll(page, bridge); mark('pw-closed'); await sleep(1000);
  await blurUid(page);
  await page.evaluate(() => { const rc = window.npcManager.getNPC('imran').rfidCard; const cardData = { name: rc.name, card_id: rc.card_id, rfid_protocol: rc.rfid_protocol, type: 'keycard' }; for (const k of ['rfid_hex', 'rfid_facility', 'rfid_card_number', 'rfid_data']) if (rc[k] !== undefined) cardData[k] = rc[k]; window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: cardData, cloneSource: { npc_id: 'imran' } }); });
  mark('cloner-open'); await sleep(2500);
  if (!(await cloneAndSave(page, mark))) throw new Error('never reached Save');
  await sleep(2500); mark('saved'); await closeAll(page, bridge); mark('cloner-closed'); await sleep(900);
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 }).catch(() => {}); await sleep(800); mark('door-interact');
  await bridge.interact(DOOR, { timeoutMs: 20000, approach: false }); await sleep(1800);
  mark('reader-open', { buttons: await buttons(page) }); await sleep(1500);
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) { const c = await clickBtn(page, 'Emulate'); if (c) { mark('step:' + c); ok = true; break; } await sleep(700); }
  for (let i = 0; i < 24; i++) { await sleep(250); if (!(await bridge.getState()).activeMinigame) break; }
  await sleep(600); mark('door-open', { room: (await bridge.getState()).player.room, ok }); await sleep(1500); mark('linger-end');
};
