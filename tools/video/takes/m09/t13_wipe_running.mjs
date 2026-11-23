// t13_wipe_running (m09, keyless, NOT YET RUN): server_closet, tran_outcome at its default "left" so the Wipe Console (tape_side_console) reads "WIPE IN PROGRESS ... 212 reels" with the red blink. Holds the panel 2.6 s, closes, then Jesse Tran's opener "Paper. You people break into buildings at night for paper." (4.25 s), out before his hub menu. Jesse's sight challenge needs m01_maya_ko (unset with --imports=none) so the chat opens on `start`.
// Entry state (new-game): --imports=none --start-room server_closet --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh daniel_seo t13_wipe_running "<flags>" "--hide-hud --zoom-step 1"
// Marks: console-open, console-closed, then makeBeat marks (jesse-done, targets-done). The edit cuts console panel (a), Jesse (b).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, closeAll, makeBeat } from './_c9.mjs';
const b = makeBeat({ npcId: 'jesse_tran', start: [80, 70], stop: [35, 40], order: 'xy', lingerMs: 700, preMs: 500, steps: [], targets: [{ name: 'jesse', re: /Paper\. You people break into buildings at night/i }] });
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('tape_side_console', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); await openMg(bridge, 'tape_side_console', 'console', mark); await sleep(2600);
  await closeAll(page, bridge); mark('console-closed'); await sleep(600);
  await b.setup(page, bridge); await b.run(page, bridge, mark);
};
