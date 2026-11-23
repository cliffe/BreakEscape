// t12_irina_badges (m06, keyless): Dr Irina Volkova, target "Satoshi is paranoid about doors and careless about passwords. Exactly backwards." (7.82 s whole; edit cuts after "passwords." if short).
// Path: start (exchange_infiltrated set so first_meeting is skipped) "Back again. What do you need?" > hub [Tell me about your door access.] > discuss_badges lines > target. Out before the hub menu.
// Entry state (new-game): --imports=none --unlock trading_floor --start-room trading_floor --set briefing_played=true --set exchange_infiltrated=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh <avatar> t12_irina_badges "<flags above>" "--hide-hud --zoom-step 1"
// Marks: walk-start, walk-end, conversation-open, choices-shown, choice:*, exactly-backwards-done, targets-done. Offsets in makeBeat are the m05 Patricia ones: TODO check on the first run.
// 23 Nov first run: start [70,90] was unreachable (player stopped at +67,+58, 46 px away) and the beat only walks right/down, so the start is up-left of Irina.
import { makeBeat } from '../m05/_beat.mjs';
const b = makeBeat({ npcId: 'irina_volkova', start: [-60, -40], stop: [-22, -8], order: 'xy', lingerMs: 800, preMs: 600,
  steps: [/Tell me about your door access/i],
  targets: [{ name: 'exactly-backwards', re: /Exactly backwards/i }] });
export const setup = b.setup; export default b.run;
