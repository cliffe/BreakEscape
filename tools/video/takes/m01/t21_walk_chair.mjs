// t21_walk_chair: short walking shot for montage B: the player heads across the main office for the north-west door (to hallway_west) and
// knocks a swivel chair on the way, which rolls and spins aside; the player carries on to the door. Replaces the walk into Kevin (user, v8 and
// v8.2 reviews: "walking towards a door but happens to knock a chair"). Arrow keys only (no click marker), no interaction, no dialogue.
// Entry state: head-start in main_office_area:
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room main_office_area --set briefing_played=true
// Record: run-take.sh t21_walk_chair "--start-room main_office_area --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): the tan chair by the north-west desk (nearest (101,82)) and the doorway to hallway_west; stand right of the chair with the feet a few
// px below its wheel row, so the walk catches it off centre. The take: 0.8 s hold, walk left past the chair to the door's line, walk up to the door.
// Marks: walk-start, leg:left, contact (first chair movement), leg:up, walk-end, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 105;
const chairAt = (page) => page.evaluate(() => {
  const cs = (window.chairs || []).filter(c => c.isSwivelChair);
  let best = null, bd = 1e9;
  for (const c of cs) { const d = Math.hypot(c.x - 101, c.y - 82); if (d < bd) { bd = d; best = c; } }
  const p = window.player;
  return best ? { x: Math.round(best.x), y: Math.round(best.y), bx: Math.round(best.body.center.x), by: Math.round(best.body.center.y), pdy: Math.round(p.body.center.y - p.y), pdx: Math.round(p.body.center.x - p.x) } : null;
});
let start = null, door = null;
const OFF = 7;   // feet this far below the chair's wheel row: an off-centre knock, so it spins aside
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  start = await chairAt(page);
  door = (bridge.doorways ? await bridge.doorways('main_office_area') : []).find(d => d.to === 'hallway_west');
  if (!start || !door) throw new Error('setup lookup ' + JSON.stringify({ start, door }));
  const ty = start.by + OFF - start.pdy, tx = start.bx + 80 - start.pdx;
  await bridge.moveTo(tx, ty, { timeoutMs: 20000 });
  const pulse = async (axis, target, tol) => {
    for (let i = 0; i < 12; i++) {
      const p = (await bridge.getState()).player; const d = target - p[axis];
      if (Math.abs(d) <= tol) return;
      await bridge.walk(axis === 'y' ? (d > 0 ? 'down' : 'up') : (d > 0 ? 'right' : 'left'), Math.max(25, Math.round(Math.abs(d) / SPEED * 1000 * 0.85)));
      await sleep(150);
    }
  };
  await pulse('x', tx, 4); await pulse('y', ty, 2); await pulse('x', tx, 3);
  await sleep(1000);
  console.error('SETUP', JSON.stringify({ chair: start, door, player: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => {
  await sleep(800);
  mark('walk-start', { chair: start, door });
  const watch = (async () => { for (let i = 0; i < 80; i++) { const c = await chairAt(page); if (c && (Math.abs(c.x - start.x) > 2 || Math.abs(c.y - start.y) > 2)) { mark('contact', c); return; } await sleep(50); } })();
  const doorX = (door.gap && door.gap.axis === 'x') ? (door.gap.feetMin + door.gap.feetMax) / 2 : door.x;
  await keyLegs(bridge, [['left', doorX - start.pdx]], SPEED, mark);
  await keyLegs(bridge, [['up', door.y + 30 - start.pdy]], SPEED, mark);
  mark('walk-end', { player: (await bridge.getState()).player, chair: await chairAt(page) });
  await watch;
  await sleep(1500);
  mark('linger-end', await chairAt(page));
};
