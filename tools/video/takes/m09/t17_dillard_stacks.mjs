// t17_dillard_stacks (m09, keyless, NOT YET RUN): the action sequence. From loading_dock the player goes north through the door into the dark open_stacks (motion lights strike, held 1.4 s), then tran_alerted is written (writeGlobal) which shows Lyle Dillard and opens his chat: "Dillard, Statewide Security. Stay where you are." (4.37 s, tag #hostile:archive_guard). The take plays the line whole, closes nothing, holds about 2 s on the chase. throttleFps(20) in setup. Never KOs him. Cody Old Coyote stands in the same room: accept or frame out in the edit.
// Entry state (new-game): --imports=none --start-room loading_dock --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh vivian_ashby t17_dillard_stacks "<flags>" "--hide-hud --zoom-step 1"
// Marks: door-open, lights-held, alerted, dillard-done, chase-held, end. Out point on chase-held minus 0.3 s.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { setGlobal } from './_c9.mjs';
const DOOR = 'door:loading_dock->open_stacks';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} }); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); await sleep(1200);
  await bridge.interact(DOOR, { timeoutMs: 20000, approach: false }); mark('door-open');
  for (let i = 0; i < 40 && (await bridge.getState()).currentRoom !== 'open_stacks'; i++) await sleep(250);
  await sleep(1400); mark('lights-held', { room: (await bridge.getState()).currentRoom });
  mark('alerted', { v: await setGlobal(page, 'tran_alerted', true) });
  const l = await vw.waitForLine(/Dillard, Statewide Security/i, 25000); if (!l) throw new Error('Dillard line never played'); mark('dillard-done', { durMs: l.durMs });
  await sleep(2000); mark('chase-held'); await vw.stop(); mark('end');
};
