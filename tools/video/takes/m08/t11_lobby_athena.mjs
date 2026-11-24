// t11_lobby_athena (m08, keyless, NOT YET RUN): the establishing shot. main_lobby, briefing seeded played: a straight key-driven walk toward the receptionist ATHENA (receptionist_ai: see-through, cyan glow, flicker), stopping about 120 px short, held 1 s. Centre the edit on her console. Check the flicker frames (a frame where she is nearly invisible).
// Entry state (new-game): --imports=none --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh lucia_moreno t11_lobby_athena "--imports=none --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { npcPos } from './_c8.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1500); const p = (await bridge.getState()).player; if (p.y < 225) await keyLegs(bridge, [['down', 225]], 145, () => {}); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
// v2 (24 Nov): the first run walked AWAY from her (down). Setup now walks down to y 225 off camera; the take walks straight up toward her and holds 1.5 s (a 3.8 s take dropped 1.69%).
export default async (page, bridge, mark) => {
  await sleep(1200); const p = (await bridge.getState()).player;
  mark('walk-start', { player: p });
  await keyLegs(bridge, [['up', 150]], 145, mark); mark('walk-end', { player: (await bridge.getState()).player }); await sleep(1500);
};
