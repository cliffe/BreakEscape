// t17_locker_pick (m08, keyless, NOT YET RUN): break_room. (1) real lockpicking of Phantom's locker (phantom_locker, key lock, no key held; NOT Nightshade's: his go-bag). pickLock from m06 _cres; out before any contents. (2) face flash for the Off-Duty Agent (background_agent), held 1.8 s, closed before his testimony line. The off-duty agent's sight would catch the pick: offduty_agent_hostile is seeded true so the lockpick_used_in_view mapping's condition fails and the pick goes ahead (npc-manager.js: "won't fire now - pick goes ahead"); he is NOT hostile in the world, only the global is set.
// Entry state (new-game): --imports=none --start-room break_room --set briefing_played=true --set brief_taken=true --set offduty_agent_hostile=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh daniel_seo t17_locker_pick "<flags>" "--hide-hud --zoom-step 1"
// Marks: interact-locker, minigame-open, pins, tension, pin-set:N, lock-open, background_agent-open/-closed. Keep the post-it (password_sticky_note) off every crop.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { pickLock, faceFlash, closeAll } from './_c8.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('phantom_locker', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('interact-locker');
  const r = await bridge.interact('phantom_locker', { timeoutMs: 20000, approach: false });
  const w = await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 }).catch(() => null);
  if (!w || w.ok === false) throw new Error('lockpicking did not open (caught?) ' + JSON.stringify(r).slice(0, 200));
  mark('minigame-open'); await sleep(1800); await pickLock(page, bridge, mark); await sleep(500); mark('pick-done'); for (let i = 0; i < 3; i++) { await closeAll(page, bridge); await sleep(700); } /* v2: opening the lock opens the container (contents) which blocked the chat; cut before contents */
  await faceFlash(page, bridge, mark, 'background_agent', 1800); await sleep(600);
};
