// t13_walk_doyle (m02): in hospital_ward the player walks west along a row about 48 px below Sister Doyle's feet and passes beside her without touching her (no interaction, no dialogue).
// Entry state: head-start in hospital_ward: new-game.rb m02_ransomed_trust --start-room hospital_ward --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t13_walk_doyle "--start-room hospital_ward --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): stand 170 px east of Doyle on that row (aligned with pulses). Take: 0.8 s hold, left to 45 px past her, hold. Marks: walk-start, leg:left, walk-end (with the closest distance to any NPC), linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
let doyle = null, rowY = 0, pdy = 31;
const nearestNpc = async (bridge) => { const s = await bridge.getState(); const p = s.player; let best = null; for (const n of s.nearby.filter(n => n.kind === 'npc')) { const d = Math.hypot(n.x - p.x, n.y - p.y); if (!best || d < best.d) best = { id: n.id, d: Math.round(d) }; } return best; };
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  doyle = s.nearby.find(n => n.id === 'ward_nurse');
  pdy = await page.evaluate(() => Math.round(window.player.body.center.y - window.player.y));
  rowY = doyle.y + 48;   // sprite-centre row 48 px below hers (36 brushed past the roaming nurse standing beside her)
  const tx = doyle.x + 170;
  await bridge.moveTo(tx, rowY + pdy, { timeoutMs: 20000 });
  const pulse = async (axis, target, tol) => {
    for (let i = 0; i < 12; i++) {
      const p = (await bridge.getState()).player; const d = target - p[axis];
      if (Math.abs(d) <= tol) return;
      await bridge.walk(axis === 'y' ? (d > 0 ? 'down' : 'up') : (d > 0 ? 'right' : 'left'), Math.max(25, Math.round(Math.abs(d) / SPEED * 1000 * 0.85)));
      await sleep(150);
    }
  };
  await pulse('x', tx, 4); await pulse('y', rowY, 3); await pulse('x', tx, 3);
  await sleep(800);
  console.error('SETUP', JSON.stringify({ doyle: { x: doyle.x, y: doyle.y }, rowY, player: (await bridge.getState()).player, npcs: (await bridge.getState()).nearby.filter(n => n.kind === 'npc').map(n => [n.id, Math.round(n.x), Math.round(n.y)]) }));
}
export default async (page, bridge, mark) => {
  await sleep(800);
  mark('walk-start', { player: (await bridge.getState()).player, nearest: await nearestNpc(bridge) });
  let minD = 1e9, minId = null, walking = true;
  const watch = (async () => { while (walking) { const n = await nearestNpc(bridge); if (n && n.d < minD) { minD = n.d; minId = n.id; } await sleep(40); } })();
  await keyLegs(bridge, [['left', doyle.x - 45]], SPEED, mark);
  walking = false; await watch;
  mark('walk-end', { player: (await bridge.getState()).player, minNpcDistance: minD, minNpc: minId });
  await sleep(1500);
  if ((await bridge.getState()).dialogue) throw new Error('a dialogue opened');
  mark('linger-end', { minNpcDistance: minD, minNpc: minId });
};
