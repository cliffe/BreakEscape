// t22_gen_lockpick (m07, keyless, NOT YET RUN): real lockpicking of door:server_room->generator_room (key lock, keyPins x4) from server_room with NO key in the inventory (the kit is a starting item; do not pick up generator_maintenance_key). pickLock from m06 _cres. Elena has no sight cone.
// Entry state (new-game): --imports=none --unlock server_room --start-room server_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh frank_callahan t22_gen_lockpick "<flags>" "--hide-hud --zoom-step 1"
// Marks: interact-door, minigame-open, pins, tension, pin-set:N, lock-open, linger-end. Cut the door opening after lock-open.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { pickLock } from './_c7.mjs';
const DOOR = 'door:server_room->generator_room';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('interact-door');
  const r = await bridge.interact(DOOR, { timeoutMs: 20000, approach: false });
  const w = await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 }).catch(() => null);
  if (!w || w.ok === false) throw new Error('lockpicking did not open ' + JSON.stringify(r).slice(0, 200));
  mark('minigame-open'); await sleep(1800); await pickLock(page, bridge, mark); await sleep(1200); mark('linger-end');
};
