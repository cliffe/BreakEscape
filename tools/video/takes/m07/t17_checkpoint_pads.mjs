// t17_checkpoint_pads (m07, keyless, NOT YET RUN): security_checkpoint. (1) the Contractor Badge Station PIN pad (badge_printer, pc, lockType pin): PAD.badge typed (3 wrong digits), never ENTER, closed. (2) the RFID cloner on Hollis's belt (clone mode, blurred, to Save), closed. Hollis's sight is seeded off by hollis_resolved=evaded (the scenario's own skipIfGlobal); setup also meets him (chat open/close) off camera.
// Entry state (new-game): --imports=none --start-room security_checkpoint --set briefing_played=true --set hollis_resolved=evaded   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh mei_lin_chow t17_checkpoint_pads "<flags>" "--hide-hud --zoom-step 1"
// Marks: pad-open, pad-typed, closed, cloner-open, step:<button>, saved, cloner-closed, linger-end. Check frames for any readable UID/number in the cloner (30 ms blur).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, blurUid, cloneAndSave, openCloneHollis, meetHollis, PAD } from './_c7.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await meetHollis(page, bridge); await bridge.moveToNear('badge_printer', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, 'badge_printer', 'pad', mark); await sleep(1800);
  await typeKeys(page, PAD.badge, mark, 'pad', 500); await sleep(1500);
  await closeAll(page, bridge); mark('closed'); await sleep(1200);
  await blurUid(page); await openCloneHollis(page); mark('cloner-open'); await sleep(2500);
  if (!(await cloneAndSave(page, mark))) throw new Error('never reached Save');
  await sleep(2500); mark('saved'); await closeAll(page, bridge); mark('cloner-closed'); await sleep(1200); mark('linger-end');
};
