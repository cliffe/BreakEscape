// t15_park (m07, keyless, NOT YET RUN): cable_vault (PIN door, unlocked by flag; its keypad is never filmed). Park at the junction box: entry line "Four minutes and I'd have been out. Four." (3.38 s). The fight (hub [Then finish it and see what happens. (Fight him.)] > goes_loud > swing) is NOT filmed here: see Not done.
// Entry state (new-game): --imports=none --unlock cable_vault --start-room cable_vault --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh <avatar> t15_park "<flags>" "--hide-hud --zoom-step 1"     (avatar: frank_callahan)
import { makeBeat } from '../m05/_beat.mjs';
const b = makeBeat({ npcId: 'thomas_park', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 800, preMs: 600, steps: [], targets: [{ name: 'four-minutes', re: /Four minutes and I.d have been out/i }] });
export const setup = b.setup; export default b.run;
