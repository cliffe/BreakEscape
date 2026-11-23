// t27_walk_checkpoint (m07, keyless, NOT YET RUN): walking shot, security_checkpoint: from the spawn straight towards Hollis (torch lit), stopping out of his reach. Sight challenge seeded off (hollis_resolved=evaded). Legs: x towards Hollis, M07_WALK px (default 90) then hold 1 s.
// Entry state (new-game): --imports=none --start-room security_checkpoint --set briefing_played=true --set hollis_resolved=evaded   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh lucia_moreno t27_walk_checkpoint "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end. Check the torch beam shows and Hollis is not pushed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1500); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1000); const s = await bridge.getState(); const px = s.player.x, d = Number(process.env.M07_WALK || 90);
  const h = await page.evaluate(() => { const n = window.npcManager.getNPC('ray_hollis'); return n && n._sprite && { x: n._sprite.x, y: n._sprite.y }; });
  mark('walk-start', { player: s.player, hollis: h });
  await keyLegs(bridge, [[h && h.x > px ? 'right' : 'left', px + (h && h.x > px ? d : -d)]], 145, mark);
  mark('walk-end', { player: (await bridge.getState()).player }); await sleep(1000);
};
