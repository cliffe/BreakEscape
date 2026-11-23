// t21_owen_spare (m05): DAY. Walk to Owen; first meeting [Point me at the logs...] > hub > [Patricia's log has a crypto badge...] > give_door_log, target "That's Halloran's spare on the server hallway. Odd...". Ends at the line (the "Mind, a spare..." line follows, CUT before).
// Record: MISSION=m05 run.sh <avatar> t21_owen_spare "--imports=none --start-room open_office_area --set briefing_played=true --set found_incident_log=true" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'owen_gallagher', start: [-45, 70], stop: [-10, 40], order: 'xy', lingerMs: 500, preMs: 600,
  steps: [/Point me at the logs/i, /crypto badge in the server hallway/i],
  targets: [{ name: 'spare', re: /Halloran's spare on the server hallway/i }] });
export const setup = b.setup; export default b.run;
