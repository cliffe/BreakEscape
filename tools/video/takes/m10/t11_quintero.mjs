// t11_quintero (m10, keyless, NOT YET RUN): invitation line. security_office, Quintero's raid copy (quintero_so, ink knot so, breach_announced arm) "I don't like doors that know your name." (2.74 s). The player's wanted photo is on the board behind her.
// Entry (new-game): --imports=<file with {"m06_assets_seized": true}> (hides duty_guard_b; an import global, so NOT --set) --start-room security_office --unlock security_office --set briefing_played=true --set breach_open=true --set breach_announced=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m10 run.sh ngozi_adeyemi t11_quintero "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, walk-end, interact, conversation-open, line-start:/line-end:, quintero-done, targets-done. Fallback line (not-whodunit arm) is not scripted: check its cache first. If the copy opens by itself on entry, makeBeat's interact retries; read SETUP.
import { makeBeat } from '../m05/_beat.mjs';
const b = makeBeat({ npcId: 'quintero_so', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 900, preMs: 500, steps: [], targets: [{ name: 'quintero', re: /I don.t like doors that know your name/i }] });
export const setup = b.setup; export default b.run;
