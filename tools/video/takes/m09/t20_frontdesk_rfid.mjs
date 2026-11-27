// t20_frontdesk_rfid (m09, keyless, NOT YET RUN): front_desk. (1) the RFID cloner on Noor's belt card (Staff Card, N. Haddad; blurred; read, crack, Save), (2) the RFID door reader on the staff_passage door (rfid lock), Emulate with the saved clone, door opens. Setup off camera: open/close Noor's chat so the server has met her (closed before her menu). The door is NOT walked through (the Drop is t21).
// Entry state (new-game): --imports=none --start-room front_desk --unlock front_desk --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh harjit_singh t20_frontdesk_rfid "<flags>" "--hide-hud --zoom-step 1"
// Marks: cloner-open, step:<button>, saved, cloner-closed, door-interact, reader-open, step:Emulate, door-open, linger-end. Frames: no readable UID/card number (30 ms blur); the reader may print the card name only.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { closeAll, blurUid, cloneAndSave, buttons, clickBtn, meetNpc, openCloneNpc, doorId } from './_c9x.mjs';
let D;
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await meetNpc(page, bridge, 'noor_haddad'); D = await doorId(bridge, 'front_desk', 'staff_passage'); }
export default async (page, bridge, mark) => {
  await sleep(1000); await blurUid(page); await openCloneNpc(page, 'noor_haddad'); mark('cloner-open'); await sleep(2500);
  if (!(await cloneAndSave(page, mark))) throw new Error('never reached Save');
  await sleep(2500); mark('saved'); await closeAll(page, bridge); mark('cloner-closed'); await sleep(900);
  await bridge.moveToNear(D, { timeoutMs: 25000 }); await sleep(900); mark('door-interact', { D });
  await bridge.interact(D, { timeoutMs: 20000, approach: false }); await sleep(1800);
  mark('reader-open', { buttons: await buttons(page) }); await sleep(1500);
  let ok = false; for (let i = 0; i < 6 && !ok; i++) { const c = await clickBtn(page, 'Emulate'); if (c) { mark('step:' + c); ok = true; break; } await sleep(700); }
  for (let i = 0; i < 24; i++) { await sleep(250); if (!(await bridge.getState()).activeMinigame) break; }
  await sleep(600); mark('door-open', { ok }); await sleep(1500); mark('linger-end');
};
