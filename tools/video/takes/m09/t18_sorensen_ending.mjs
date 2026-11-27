// t18_sorensen_ending (m09, keyless, NOT YET RUN): restricted_cage. ENDING = Sorensen at the shredder, m09_sorensen_cage.ink:33 "Everyone ENTROPY ever placed is filed in this room, dear. By morning, I'll be the only index you can ask." (#delivery: gentle, almost kind, without looking up; 9.86 s; round-2 owner pick, plays whole). Out before :34 "Paper was the only thing...". bin_chosen and hatch_talked are set true so no bin-choice scene fires on entry (the hidden sorensen_door scene is a choice screen).
// Entry state (new-game): --imports=none --start-room restricted_cage --unlock restricted_cage --set briefing_played=true --set bin_chosen=true --set hatch_talked=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh mei_lin_chow t18_sorensen_ending "<flags>" "--hide-hud --zoom-step 1"
// Marks: makeBeat marks (ending-done, targets-done). Edit: J-cut the first sentence under the crescendo, hit at the pause after "dear.". Check no task panel/HaX toast from the seeded globals. The 3x UI-free wide of Sorensen at the feed is NOT filmed here (see Not done).
import { makeBeat } from './_c9.mjs';
const b = makeBeat({ npcId: 'sorensen', start: [90, 70], stop: [40, 40], order: 'xy', lingerMs: 1000, preMs: 600, steps: [], targets: [{ name: 'ending', re: /Everyone ENTROPY ever placed is filed in this room/i }] });
export const setup = b.setup; export default b.run;
