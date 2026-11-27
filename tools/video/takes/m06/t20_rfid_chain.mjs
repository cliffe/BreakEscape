// t20_rfid_chain (m06, keyless, NOT YET RUN): the RFID pair on Irina's CTO badge (EM4100, rfidCard on irina_volkova, card_id cto_badge). Setup (off camera) opens Irina's chat and closes it (m05 t13 did this for Owen so the server accepts the copy; unverified here). On camera: cloner opens with the card (clone mode), steps to Save; closed; then the door reader on door:trading_floor->irina_office, Emulate, door opens.
// RULE: a 30 ms blur hides every UID/hex/number row (as m05 t13); check frames for any readable number. exchange_infiltrated set so Irina's chat is the short route.
// Entry state (new-game): --imports=none --unlock trading_floor --start-room trading_floor --set briefing_played=true --set exchange_infiltrated=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh daniel_seo t20_rfid_chain "<flags above>" "--hide-hud --zoom-step 1"
// Marks: cloner-open, step:<button>, saved, cloner-closed, door-interact, reader-open, step:Emulate, door-open, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { blurUid, cloneAndSave, buttons, clickBtn } from '../m05/t13_rfid_clone.mjs';
import { openChat, closeAll } from './_cres.mjs';
const DOOR = 'door:trading_floor->irina_office';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('irina_volkova', { timeoutMs: 20000 }); await sleep(500);
  await openChat(bridge, 'irina_volkova'); await sleep(1500); await closeAll(page, bridge); await sleep(800);
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1000); await blurUid(page);
  await page.evaluate(() => { const rc = window.npcManager.getNPC('irina_volkova').rfidCard; const cardData = { name: rc.name, card_id: rc.card_id, rfid_protocol: rc.rfid_protocol, type: 'keycard' }; for (const k of ['rfid_hex', 'rfid_facility', 'rfid_card_number', 'rfid_data']) if (rc[k] !== undefined) cardData[k] = rc[k]; window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: cardData, cloneSource: { npc_id: 'irina_volkova' } }); });
  mark('cloner-open'); await sleep(2500);
  if (!(await cloneAndSave(page, mark))) throw new Error('never reached Save');
  await sleep(2500); mark('saved'); await closeAll(page, bridge); mark('cloner-closed'); await sleep(900);
  mark('door-interact');
  await bridge.interact(DOOR, { timeoutMs: 20000, approach: false }); await sleep(1800);
  mark('reader-open', { buttons: await buttons(page) }); await sleep(1500);
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) { const c = await clickBtn(page, 'Emulate'); if (c) { mark('step:' + c); ok = true; break; } await sleep(700); }
  for (let i = 0; i < 24; i++) { await sleep(250); if (!(await bridge.getState()).activeMinigame) break; }
  await sleep(600); mark('door-open', { room: (await bridge.getState()).player.room, ok }); await sleep(1500); mark('linger-end');
};
