// t23_crate_lockpick (m09, keyless, NOT YET RUN): salvage_cage, the BETA crate (enrolment_crate, safe, key lock, keyPins x4). Real lockpicking with the starting kit (no key held). pickLock from m06 _cres; stops at lock-open and closes any contents panel at once (what the crate shows is unread: check frames, cut before it).
// Entry state (new-game): --imports=none --start-room salvage_cage --unlock salvage_cage --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh daniel_seo t23_crate_lockpick "<flags>" "--hide-hud --zoom-step 1"
// Marks: interact-crate, minigame-open, pins, tension, pin-set:N, lock-open, closed, linger-end. Do not touch field_kit_link (post-it) or tomb_beta_rack.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { pickLock, closeAll } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('enrolment_crate', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('interact-crate');
  const r = await bridge.interact('enrolment_crate', { timeoutMs: 20000, approach: false });
  const w = await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 }).catch(() => null);
  if (!w || w.ok === false) throw new Error('lockpicking did not open ' + JSON.stringify(r).slice(0, 200));
  mark('minigame-open'); await sleep(1800); await pickLock(page, bridge, mark); await closeAll(page, bridge); mark('closed'); await sleep(1000); mark('linger-end');
};
