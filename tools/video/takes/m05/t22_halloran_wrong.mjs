// t22_halloran_wrong (m05): DAY. Walk to Halloran, first meeting opener; target "Find whoever did this, and quickly. And I hope to God you're wrong about my team." Ends at the line (her menu follows).
// Record: MISSION=m05 run.sh <avatar> t22_halloran_wrong "--imports=none --start-room research_lab --set briefing_played=true" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'dr_halloran', start: [-70, 40], stop: [-35, 10], order: 'xy', lingerMs: 500, preMs: 600,
  targets: [{ name: 'wrong', re: /hope to God you're wrong/i }] });
export const setup = b.setup; export default b.run;
