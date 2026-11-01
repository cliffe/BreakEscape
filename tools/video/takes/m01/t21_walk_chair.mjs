// t21_walk_chair: short walking shot for montage B: the player walks across the main office and pushes a swivel chair, which rolls and spins away
// (replaces the walk into Kevin, which pushed him). No interaction, no dialogue, arrow keys only (no click marker).
// Entry state: head-start in main_office_area:
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room main_office_area --set briefing_played=true
// Record: run-take.sh t21_walk_chair "--start-room main_office_area --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): the tan swivel chair alone on the open floor (nearest (99,196)); stand 85 px to its right, feet on its wheel row. The take: 1.0 s hold,
// walk left into the chair, which rolls and spins to the west wall; 2.5 s hold.
// Marks: walk-start, contact (first chair movement), leg:left, walk-end, chair-rest.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 105;
const chairAt = (page) => page.evaluate(() => {
  const cs = (window.chairs || []).filter(c => c.isSwivelChair);
  let best = null, bd = 1e9;
  for (const c of cs) { const d = Math.hypot(c.x - 99, c.y - 196); if (d < bd) { bd = d; best = c; } }
  const p = window.player; return best ? { x: Math.round(best.x), y: Math.round(best.y), bx: Math.round(best.body.center.x), by: Math.round(best.body.center.y), pdy: Math.round(p.body.center.y - p.y), pdx: Math.round(p.body.center.x - p.x), vx: best.body ? Math.round(best.body.velocity.x) : 0, vy: best.body ? Math.round(best.body.velocity.y) : 0 } : null;
});
let start = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  start = await chairAt(page);
  if (!start) throw new Error('no swivel chair');
  // stand to the chair's right with the feet collider on the chair's wheel row
  const r = await bridge.moveTo(start.bx + 85 - start.pdx, start.by - start.pdy, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('moveTo ' + JSON.stringify(r).slice(0, 200));
  // moveTo stops where its path ends: line up exactly with short arrow-key pulses (both ways, as keyLegs only corrects forwards).
  // (The chair's left side is boxed in by the desk above it, so it is pushed from the right.)
  const ty = start.by - start.pdy, tx = start.bx + 85 - start.pdx;
  const pulse = async (axis, target, tol) => {
    for (let i = 0; i < 12; i++) {
      const p = (await bridge.getState()).player; const d = target - p[axis];
      if (Math.abs(d) <= tol) return;
      await bridge.walk(axis === 'y' ? (d > 0 ? 'down' : 'up') : (d > 0 ? 'right' : 'left'), Math.max(25, Math.round(Math.abs(d) / SPEED * 1000 * 0.85)));
      await sleep(150);
    }
  };
  await pulse('x', tx, 4); await pulse('y', ty, 2); await pulse('x', tx, 3);
  await sleep(1200);
  console.error('SETUP', JSON.stringify({ chair: start, player: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('walk-start', { chair: start });
  const watch = (async () => { for (let i = 0; i < 60; i++) { const c = await chairAt(page); if (c && (Math.abs(c.x - start.x) > 2 || Math.abs(c.y - start.y) > 2)) { mark('contact', c); return; } await sleep(50); } })();
  await keyLegs(bridge, [['left', start.bx - 45 - start.pdx]], SPEED, mark);
  mark('walk-end', { player: (await bridge.getState()).player, chair: await chairAt(page) });
  await watch;
  await sleep(2500);
  mark('chair-rest', await chairAt(page));
};
