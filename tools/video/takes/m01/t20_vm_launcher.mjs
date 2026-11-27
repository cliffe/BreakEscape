// t20_vm_launcher: the IT Audit Station (Kali) VM launcher in server_room, for the trailer's minigame crescendo. The launcher UI only: no VM is
// started (none exists in the capture environment), nothing is typed.
// Entry state: head-start in server_room (the start room, as t08):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room server_room --set briefing_played=true
// Record: run-take.sh t20_vm_launcher "--start-room server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: approach, launcher-open, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';

export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  await sleep(1200);
  const st = await bridge.getState();
  const vm = st.nearby.find(n => /IT Audit Station/.test(n.name || ''));
  if (!vm) throw new Error('IT Audit Station not found: ' + st.nearby.map(n => n.name).join(','));
  mark('approach');
  const r = await bridge.interact(vm.id, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('vm-launcher', { timeoutMs: 8000 }).catch(() => {});
  mark('launcher-open', { which: (await bridge.getState()).activeMinigame });
  await sleep(3500);
  mark('linger-end');
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(1000);
};
