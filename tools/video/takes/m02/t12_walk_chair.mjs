// t12_walk_chair (m02): the player crosses hospital_ward for the east door (to emergency_equipment_storage), cutting past a swivel chair (chair-white-2-rotate3, body at about 555,117)
// that rolls and spins aside; the player carries on to the door. Arrow keys only (no click marker), no interaction, no dialogue, never touches an NPC.
// Entry state: head-start in hospital_ward: new-game.rb m02_ransomed_trust --start-room hospital_ward --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t12_walk_chair "--start-room hospital_ward --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): stand 85 px left of the chair and 18 px below its wheel row (clear of chair-white-2-rotate5 further left), aligned with short pulses.
// Take: 0.8 s hold, right to just left of the chair's centre line, up to the door row (the chair is clipped on the way), right through the door line. Marks: walk-start, leg:*, contact (first chair movement), walk-end, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
const chairAt = (page) => page.evaluate(() => {
  const c = (window.chairs || []).find(c => c.texture && c.texture.key === 'chair-white-2-rotate3');
  const p = window.player;
  return c ? { x: Math.round(c.x), y: Math.round(c.y), bx: Math.round(c.body.center.x), by: Math.round(c.body.center.y), pdy: Math.round(p.body.center.y - p.y), pdx: Math.round(p.body.center.x - p.x) } : null;
});
let start = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  start = await chairAt(page);
  if (!start) throw new Error('chair not found');
  const tx = start.bx - 85 - start.pdx, ty = start.by + 18 - start.pdy;
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
  console.error('SETUP', JSON.stringify({ chair: start, player: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => {
  await sleep(800);
  mark('walk-start', { chair: start, player: (await bridge.getState()).player });
  const watch = (async () => { for (let i = 0; i < 160; i++) { const c = await chairAt(page); if (c && (Math.abs(c.x - start.x) > 2 || Math.abs(c.y - start.y) > 2)) { mark('contact', c); return; } await sleep(50); } })();
  await keyLegs(bridge, [['right', start.bx - 12 - start.pdx]], SPEED, mark);
  await keyLegs(bridge, [['up', 80 - start.pdy]], SPEED, mark);
  await keyLegs(bridge, [['right', 636 - start.pdx]], SPEED, mark);
  mark('walk-end', { player: (await bridge.getState()).player, chair: await chairAt(page) });
  await watch;
  await sleep(1200);
  mark('linger-end', await chairAt(page));
};
