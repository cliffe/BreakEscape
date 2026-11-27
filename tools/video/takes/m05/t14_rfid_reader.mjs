// t14_rfid_reader (m05), keyless: the server_hallway RFID door (door:main_corridor->server_hallway) with Owen's cloned badge. Setup (off camera): meet Owen, run the cloner (blurred), walk to main_corridor beside the door. The take opens the reader, shows it, then Emulate.
// RULE: the card number is the lockbox code: the same 30 ms blur as t13 runs here; check frames. torres_identified NOT set (day).
// Entry state: new-game.rb m05_insider_trading --imports=none --start-room open_office_area --set briefing_played=true
// Record: MISSION=m05 run.sh <avatar> t14_rfid_reader "--imports=none --start-room open_office_area --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: door-interact, reader-open (with buttons), step:<button>, door-open, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom } from './_live.mjs';
import { setup as meetOwen, blurUid, openClone, cloneAndSave, buttons, clickBtn } from './t13_rfid_clone.mjs';
const DOOR = 'door:main_corridor->server_hallway';
export async function setup(page, bridge) {
  await meetOwen(page, bridge);
  await blurUid(page);
  await openClone(page);
  await sleep(2500);
  if (!(await cloneAndSave(page, null))) throw new Error('never reached Save');
  await sleep(2500);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework.endMinigame(false)); await sleep(600); }
  await goRoom(page, bridge, ['open_office_area', 'main_corridor']);
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 }).catch(e => console.error('moveToNear', String(e).slice(0, 200)));
  await sleep(900);
  console.error('SETUP end', JSON.stringify((await bridge.getState()).player));
}
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('door-interact', { player: (await bridge.getState()).player });
  const r = await bridge.interact(DOOR, { timeoutMs: 20000, approach: false });
  console.error('INTERACT', JSON.stringify(r).slice(0, 300));
  await sleep(1800);
  mark('reader-open', { mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 100), buttons: await buttons(page) });
  await sleep(1500);
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) {
    const bs = await buttons(page); console.error('RBTNS', i, JSON.stringify(bs));
    const c = await clickBtn(page, 'Emulate');
    if (c) { mark('step:' + c, { buttons: bs }); ok = true; break; }
    await sleep(700);
  }
  for (let i = 0; i < 24; i++) { await sleep(250); if (!(await bridge.getState()).activeMinigame) break; }
  await sleep(600);
  const st = await bridge.getState();
  mark('door-open', { room: st.player.room, mg: JSON.stringify(st.activeMinigame), ok });
  await sleep(1500);
  mark('linger-end');
};
