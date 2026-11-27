// t16_clock (m07, keyless, NOT YET RUN): scada_control, the cascade_countdown_display smartscreen in its armed look, 4 s hold, no line. Mercer is in the room (no sight challenge listed); nothing is opened, the Cascade Control System is never touched.
// Entry state (new-game): --imports=none --unlock scada_control --start-room scada_control --set briefing_played=true --set cascade_armed=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh <avatar> t16_clock "<flags>" "--hide-hud --zoom-step 1"     (avatar: vivian_ashby)
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1000); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1500); mark('hold-start', { near: (await bridge.getState()).nearby.map(n => n.id).slice(0, 12) });
  await sleep(4000); mark('linger-end');
};
