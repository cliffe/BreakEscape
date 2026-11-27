// t15_netherton_ending (m08, keyless, NOT YET RUN): director_office. The ending line, whole: "There is a mole in SAFETYNET. I am reasonably certain they are within a hundred metres of where you are standing." (9.02 s; first sentence ~2.7 s). His opening has no choice: narrator, "Agent. Nine days ago I sent you to Portland.", ..., then this line. One take per fresh game (the opening runs once). Out before "Ask me what you need." The 3x close-up and the wide are edit crops of this take.
// Entry state (new-game): --imports=none --start-room director_office --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh vivian_ashby t15_netherton_ending "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, walk-end, conversation-open, mole-line-done, targets-done.
import { makeBeat } from '../m05/_beat.mjs';
const b = makeBeat({ npcId: 'director_netherton', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 700, preMs: 600, steps: [], targets: [{ name: 'mole-line', re: /There is a mole in SAFETYNET\. I am reasonably certain/i }] });
export const setup = b.setup; export default b.run;
