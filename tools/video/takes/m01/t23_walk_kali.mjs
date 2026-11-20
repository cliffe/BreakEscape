// t23_walk_kali: the player walks up to the IT Audit Station (Kali) in the server room with the arrow keys and stops in front of it, then the
// VM launcher opens (the cue into the real-hacking clip). For the "Real Hacking" section (user, v8.2 review).
// Entry state: head-start in server_room (as t08 and t20):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room server_room --set briefing_played=true
// Record: run-take.sh t23_walk_kali "--start-room server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): stand about 90 px below the station (or as far as the room allows), facing it. The take: 0.8 s hold, walk up to the station,
// 0.6 s hold, open the launcher, 2 s hold. Marks: walk-start, leg:*, walk-end, launcher-open, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 105;
let vm = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  vm = (await bridge.getState()).nearby.find(n => /IT Audit Station/.test(n.name || ''));
  if (!vm) throw new Error('IT Audit Station not found');
  const r = await bridge.moveTo(vm.x, vm.y + 100, { timeoutMs: 20000 });
  await sleep(300);
  const p = (await bridge.getState()).player;
  if (Math.abs(p.x - vm.x) > 4) await keyLegs(bridge, [[p.x < vm.x ? 'right' : 'left', vm.x]], SPEED);
  await keyLegs(bridge, [['down', vm.y + 125]], SPEED);   // moveTo stops short: walk down to the start point
  await bridge.walk('up', 60);
  await sleep(1000);
  console.error('SETUP', JSON.stringify({ vm, moveTo: r && r.ok, player: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => {
  await sleep(800);
  mark('walk-start', { vm });
  await keyLegs(bridge, [['up', vm.y + 34]], SPEED, mark);
  mark('walk-end', { player: (await bridge.getState()).player });
  await sleep(600);
  const r = await bridge.interact(vm.id, { approach: false, timeoutMs: 8000 });
  await bridge.waitForMinigame('vm-launcher', { timeoutMs: 8000 }).catch(() => {});
  mark('launcher-open', { ok: r && r.ok, which: (await bridge.getState()).activeMinigame });
  await sleep(2000);
  mark('linger-end');
};
