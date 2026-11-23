// t20_patricia_vetted (m05): DAY. Walk to Patricia, first meeting: [Fill me in...] > [Who has access to the data?] > suspects_overview, target "All vetted. All trusted. One of them shouldn't be." Ends at the line (the next menu follows).
// Record: MISSION=m05 run.sh <avatar> t20_patricia_vetted "--imports=none --start-room patricia_office --set briefing_played=true" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'patricia_morgan', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 800, preMs: 600,
  steps: [/Fill me in/i, /Who has access/i],
  targets: [{ name: 'vetted', re: /All vetted\. All trusted/i }] });
export const setup = b.setup; export default b.run;
