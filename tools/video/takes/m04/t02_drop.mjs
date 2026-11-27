// t02_drop (m04), keyless: the drop beat. The player walks south from operations_office into security_office; its motion-sensor lights strike on entry.
// Entry state: fresh game in operations_office, before the briefing's anomaly flags: new-game.rb m04_critical_failure --imports=none --start-room operations_office
// Record: BE_SPRITE=mei_lin_chow tools/video/takes/run-take.sh m04 t02_drop "--imports=none --start-room operations_office" "--hide-hud --zoom-step 1"
// Marks: walk-start, door-open, lights-on:security_office (the payoff), lights-seen, walk-end, linger-end.
import { sleep, clearScreen, watchLights } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); const s = await bridge.getState(); console.error('SETUP', JSON.stringify({ p: s.player, room: s.currentRoom })); }
export default async (page, bridge, mark) => {
  const lights = await watchLights(page, mark, 'security_office');
  await sleep(1200);
  mark('walk-start', (await bridge.getState()).player);
  const r = await bridge.interact('door:operations_office->security_office', { timeoutMs: 20000 });
  mark('door-open', { ok: r && r.ok, mode: r && r.mode, r: JSON.stringify(r).slice(0, 160) });
  await sleep(700);
  mark('after-door', (await bridge.getState()).player);
  await keyLegs(bridge, [['down', (await bridge.getState()).player.y + 100]], 105, mark);
  const ok = await lights.waitOn(6000);
  mark('lights-seen', { ok });
  await lights.drain();
  await sleep(2200);
  mark('walk-end', (await bridge.getState()).player);
  await lights.drain();
  await sleep(1500);
  mark('linger-end');
};
