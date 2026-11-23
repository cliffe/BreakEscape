// t20_gallery_closeups (m10, keyless, NOT YET RUN): gallery. (1) the fingerprint kit on the Keypad Face Plate (lock_keypad_plate, easy), BRUSH ONLY (the dusted plate's text names digits: never lift/compare, and the observation text is not read); (2) the PIN pad on door:gallery->core, PAD.core (4 wrong digits, check_digits.rb yes/no), never ENTER, closed; (3) face flash Sione Fonoti (lock_guard) by walking near.
// Entry (new-game): --imports=none --start-room gallery --unlock gallery --set briefing_played=true --set lock_guard_stood_down=true   Record: "--hide-hud --zoom-step 1"   (avatar lucia_moreno)
// lock_guard_stood_down is his own skipIfGlobal, so the pad's door_unlock_attempt sight challenge cannot fire. The monitor guard / farah_guard are in the room (no sight challenge listed); room_entered not fired by start-room, so barks and Victoria stay quiet.
// Record: MISSION=m10 run.sh lucia_moreno t20_gallery_closeups "<flags>" "--hide-hud --zoom-step 1"
// Marks: kit-open..dust-closed, pad-open, pad-typed, pad-closed, lock_guard-open/-closed. Do the Fonoti flash last (he patrols and a hostile chase would end the take).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, dustBrush, faceFlash, PAD } from './_c10.mjs';
const DOOR = 'door:gallery->core';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); const m = await bridge.moveToNear('lock_keypad_plate', { timeoutMs: 25000 }); if (!m || !m.ok) throw new Error('moveToNear plate ' + JSON.stringify(m).slice(0, 200)); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(1500); await dustBrush(page, bridge, mark, 'lock_keypad_plate'); await sleep(800);
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, DOOR, 'pad', mark); await sleep(1800);
  await typeKeys(page, PAD.core, mark, 'pad', 500); await sleep(1500); await closeAll(page, bridge); mark('pad-closed'); await sleep(900);
  try { await faceFlash(page, bridge, mark, 'lock_guard'); } catch (e) { mark('lock_guard-error', { e: String(e).slice(0, 150) }); }
};
