// t11_night_corridor (m05), keyless: the night variant of main_corridor (torres_identified: motion lights, offAfter 75, dark ambient). The player stands in the lit corridor, leaves by the south door to reception_lobby, waits past the 75 s timer, and comes back so the strike is on film.
// Entry state: new-game.rb m05_insider_trading --imports=none --start-room main_corridor --set briefing_played=true --set torres_identified=true --set recruiter_texted=true
// Record: MISSION=m05 run.sh <avatar> t11_night_corridor "<flags above>" "--hide-hud --zoom-step 1"
// Marks: corridor-start, leave-door, lobby-wait-start, lobby-wait-end, return-door, corridor-reentered, linger-end. NO bark audio may be used from this take (night barks say "David"); picture only.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await sleep(1500);
  const s = await bridge.getState();
  console.error('SETUP', JSON.stringify({ p: s.player, near: s.nearby.map(n => n.id).slice(0, 20) }));
}
export default async (page, bridge, mark) => {
  await sleep(2500);
  mark('corridor-start', (await bridge.getState()).player);
  const r = await bridge.interact('door:main_corridor->reception_lobby', { timeoutMs: 20000 });
  mark('leave-door', { r: JSON.stringify(r).slice(0, 160) });
  for (let i = 0; i < 5 && (await bridge.getState()).player.room !== 'reception_lobby'; i++) await keyLegs(bridge, [['down', (await bridge.getState()).player.y + 40]], 105, mark);
  await keyLegs(bridge, [['down', (await bridge.getState()).player.y + 40]], 105, mark);
  await sleep(800);
  mark('lobby-wait-start', { room: (await bridge.getState()).player.room });
  await sleep(Number(process.env.M05_WAIT || 82000));
  mark('lobby-wait-end');
  for (let i = 0; i < 6 && (await bridge.getState()).player.room !== 'main_corridor'; i++) await keyLegs(bridge, [['up', (await bridge.getState()).player.y - 40]], 105, mark);
  mark('return-door', { room: (await bridge.getState()).player.room });
  await sleep(2500);
  mark('corridor-reentered', (await bridge.getState()).player);
  await sleep(2500);
  mark('linger-end');
};
