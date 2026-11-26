// t14_tesseract_core (m10, keyless, NOT YET RUN): ENDING. core, Tesseract. Route: interact tesseract > core_router > case "All four. Good. Now it's my turn." > [Go on, then.] >
// "Your service spent decades hoarding the world's weak points. At six, I give them back." (8.21 s, #delivery calm) > "City by city. Or you press this, and they go everywhere in the same minute. Eleven hundred to ..." (11.81 s; the edit cuts before the figure).
// Entry (new-game): the S-core seed of planning_notes/.../stage_4/objectives_tasks.md:462 (done-flags, rooms unlocked, flags 1-4 submitted) via: --imports=none --start-room core --unlock core --unlock gallery --unlock server_hall --unlock power_room
//   --set briefing_played=true --set flag1_submitted=true --set flag2_submitted=true --set flag3_submitted=true --set flag4_submitted=true --set flag4_heard=true --set core_greeted=true --set tess_warned=true --set tess_loose2_said=true --set gallery_shutter_cut=true --set gallery_open=true --set outer_lock_open=true --set breach_open=true --set breach_call_done=true --set head_start_out='"none"' --set raid_clock='"t0400"'
//   (the full seed also uses --submit-flag with station-qualified ids and --complete-task lines: add them if the greeting does not reach [Go on, then.]). Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m10 run.sh daniel_seo t14_tesseract_core "<flags>" "--hide-hud --zoom-step 1"     NEVER pick a menu that ends the mission; stops at the first menu after the City-by-city line.
// Marks: walk-start, interact, line-start:/line-end:, choices-shown, choice:*, pitch-done, city-done, targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { driveTargets, openChat } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); await sleep(1000); mark('walk-start');
  await bridge.moveToNear('tesseract', { timeoutMs: 25000 }); await sleep(600); mark('interact'); await openChat(bridge, 'tesseract');
  await driveTargets(page, bridge, mark, vw, { steps: [/Go on, then/i], targets: [{ name: 'pitch', re: /spent decades hoarding the world.s weak points/i }, { name: 'city', re: /City by city\. Or you press this/i }], lingerMs: 800, timeoutMs: 120000, skipMs: 700 });
};
