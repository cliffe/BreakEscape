// t17_guard_lockpick (m06, keyless, NOT YET RUN): security_checkpoint. (1) face flash: the Checkpoint Guard (checkpoint_guard), portrait held 2.4 s, closed before any menu. (2) real lockpicking of the trading-floor door (door:security_checkpoint->trading_floor, key lock, easy), the lockpick kit is a starting item. The guard has a lockpick_used_in_view catch, so setup shrinks his sight (los.range 1) off camera; otherwise the pick is stopped and his chat opens (that is the guard's own line, not this take).
// Entry state (new-game): --imports=none --start-room security_checkpoint --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh vivian_ashby t17_guard_lockpick "<flags above>" "--hide-hud --zoom-step 1"
// Marks: checkpoint_guard-open/-closed, interact-door, minigame-open, pins, tension, pin-set:N, lock-open, linger-end. Cut the door's opening after lock-open.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { faceFlash, pickLock } from './_cres.mjs';
const DOOR = 'door:security_checkpoint->trading_floor';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { const g = window.npcManager.getNPC('checkpoint_guard'); if (g) g.los = { ...(g.los || {}), range: 1 }; });
  await sleep(600);
}
export default async (page, bridge, mark) => {
  await sleep(900);
  await faceFlash(page, bridge, mark, 'checkpoint_guard');
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(800);
  mark('interact-door');
  const r = await bridge.interact(DOOR, { timeoutMs: 20000, approach: false });
  const w = await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 }).catch(() => null);
  if (!w || w.ok === false) throw new Error('lockpicking did not open (guard caught it?) ' + JSON.stringify(r).slice(0, 200));
  mark('minigame-open'); await sleep(1800);
  await pickLock(page, bridge, mark);
  await sleep(1200); mark('linger-end');
};
