// t25_rfid_reader (m08, keyless, NOT YET RUN): operations_floor, the reader on door:operations_floor->server_room (rfid). Setup (off camera, blurred): meet Netherton (sit through his opening), clone his card (MIFARE custom keys: crack steps) and save, walk to operations_floor and stand at the door. On camera: reader opens, Emulate, door opens. Fresh game (not the ending take).
// Entry state (new-game): --imports=none --start-room director_office --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh marcus_hale t25_rfid_reader "<flags>" "--hide-hud --zoom-step 1"
// Marks: door-interact, reader-open, step:Emulate, door-open, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, closeAll, blurUid, cloneAndSave, buttons, clickBtn, openCloneNeth, meetNetherton } from './_c8.mjs';
const DOOR = 'door:operations_floor->server_room';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await meetNetherton(page, bridge);
  await blurUid(page); await openCloneNeth(page); await sleep(2500);
  if (!(await cloneAndSave(page, null))) throw new Error('never reached Save');
  await sleep(2500); await closeAll(page, bridge);
  await goRoom(page, bridge, ['main_lobby', 'operations_floor']); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900);
}
export default async (page, bridge, mark) => {
  await sleep(1200); await blurUid(page); mark('door-interact');
  await bridge.interact(DOOR, { timeoutMs: 20000, approach: false }); await sleep(1800);
  mark('reader-open', { buttons: await buttons(page) }); await sleep(1500);
  let ok = false; for (let i = 0; i < 6 && !ok; i++) { const c = await clickBtn(page, 'Emulate'); if (c) { mark('step:' + c); ok = true; break; } await sleep(700); }
  for (let i = 0; i < 24; i++) { await sleep(250); if (!(await bridge.getState()).activeMinigame) break; }
  await sleep(600); mark('door-open', { room: (await bridge.getState()).player.room, ok }); await sleep(1500); mark('linger-end');
};
