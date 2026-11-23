// t11_lobby_athena (m08, keyless, NOT YET RUN): the establishing shot. main_lobby, briefing seeded played: a straight key-driven walk toward the receptionist ATHENA (receptionist_ai: see-through, cyan glow, flicker), stopping about 120 px short, held 1 s. Centre the edit on her console. Check the flicker frames (a frame where she is nearly invisible).
// Entry state (new-game): --imports=none --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh lucia_moreno t11_lobby_athena "--imports=none --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { npcPos } from './_c8.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1500); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1000); const p = (await bridge.getState()).player; const a = await npcPos(page, 'receptionist_ai');
  mark('walk-start', { player: p, athena: a });
  const dx = a.x - p.x, dy = a.y - p.y; const legs = [];
  if (Math.abs(dx) >= Math.abs(dy)) legs.push([dx > 0 ? 'right' : 'left', a.x - Math.sign(dx) * 120]); else legs.push([dy > 0 ? 'down' : 'up', a.y - Math.sign(dy) * 120]);
  await keyLegs(bridge, legs, 145, mark); mark('walk-end', { player: (await bridge.getState()).player }); await sleep(1000);
};
