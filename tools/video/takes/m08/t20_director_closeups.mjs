// t20_director_closeups (m08, keyless, NOT YET RUN): director_office. Setup (off camera) sits through Netherton's opening to the first menu so the server has met him. On camera: (1) the director_safe PIN pad (lockType pin; PAD.all wrong digits, never ENTER; never its contents), closed; (2) the RFID cloner on his lanyard (clone mode, MIFARE custom keys: cloneAndSave presses Crack keys/Dictionary Attack/Read, blurred), Save, closed. Run on a fresh game: this is NOT the ending take (t15).
// Entry state (new-game): --imports=none --start-room director_office --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh ngozi_adeyemi t20_director_closeups "<flags>" "--hide-hud --zoom-step 1"
// Marks: pad-open, pad-typed, closed, cloner-open, step:<button>, saved, cloner-closed, linger-end. The safe may open a biometric screen first: read the frames. The clone is normally offered only after the interviews; the take calls startRFIDMinigame directly (m05/m06/m07 way): server acceptance unverified. Check frames for any readable UID.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, blurUid, cloneAndSave, openCloneNeth, meetNetherton, PAD } from './_c8.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await meetNetherton(page, bridge); await bridge.moveToNear('director_safe', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, 'director_safe', 'pad', mark); await sleep(1800);
  await typeKeys(page, PAD.all, mark, 'pad', 500); await sleep(1500); await closeAll(page, bridge); mark('closed'); await sleep(1200);
  await blurUid(page); await openCloneNeth(page); mark('cloner-open'); await sleep(2500);
  if (!(await cloneAndSave(page, mark))) throw new Error('never reached Save');
  await sleep(2500); mark('saved'); await closeAll(page, bridge); mark('cloner-closed'); await sleep(1200); mark('linger-end');
};
