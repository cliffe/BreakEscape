// t18_locker_key (m08, keyless, NOT YET RUN): break_room. The KEY lock on Vector's locker (vector_locker) with his key given by the flags (--give vector_locker_key; an NPC-held item, new-game.rb marks Vector as met). Key selection, pick the key, click the key target; shoot the last half second of insertion; out before the contents. The key minigame never runs the off-duty agent's catch (only "Switch to Lockpicking" does).
// Entry state (new-game): --imports=none --start-room break_room --give vector_locker_key --set briefing_played=true --set brief_taken=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh lucia_moreno t18_locker_key "<flags>" "--hide-hud --zoom-step 1"
// Marks: interact-locker, key-mode, key-selected, key-turn, locker-open, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { closeAll } from './_c8.mjs';
const L = 'vector_locker';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(L, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('interact-locker'); await bridge.interact(L, { timeoutMs: 20000, approach: false });
  await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 }); await sleep(900);
  let ks = await bridge.minigame.getState(); mark('key-mode', { keyMode: ks && ks.keyMode }); await sleep(1200);
  const sel = ks && (ks.keySelection || (ks.state && ks.state.keySelection));
  if (sel && sel.length) { const pick = sel.find(s => /vector|0x23|locker/i.test(s.label || '')) || sel[0]; await bridge.minigame.clickCanvas(pick.x, pick.y); mark('key-selected', { label: pick.label, n: sel.length }); await sleep(1200); ks = await bridge.minigame.getState(); }
  const kt = ks && (ks.keyTarget || (ks.state && ks.state.keyTarget)); if (!kt) throw new Error('no keyTarget ' + JSON.stringify(ks).slice(0, 400));
  await bridge.minigame.clickCanvas(kt.x, kt.y); mark('key-turn');
  await sleep(700); mark('locker-open'); await closeAll(page, bridge); await sleep(800); mark('linger-end');
};
