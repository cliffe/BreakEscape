// t13_vector_audit (m08, keyless, NOT YET RUN): operations_floor. Vector, hub re-entry line first ("You again..." / "Back. Still boring..." is voiced but unused), then [The door audit has you in the Crypto Lab that morning.] (the ":83" variant, asked_alibi false), narrator "The colour goes out of his face.", then "Eight minutes. I went in for a hardware token from the token cabinet, and I came out again." (5.33 s). Picture out before the choice menu; start the edit on the portrait.
// Entry state (new-game): --imports=none --start-room operations_floor --set briefing_played=true --set brief_taken=true --set vector_interviewed=true --set found_badge_audit=true   Record: "--hide-hud --zoom-step 1"
// found_badge_audit is seeded for the ink only; Julian/Agnieszka may or may not appear (they are ambient staff; t22 films them properly).
// Record: MISSION=m08 run.sh marcus_hale t13_vector_audit "<flags>" "--hide-hud --zoom-step 1"
// Marks: choices-shown, choice:*, eight-minutes-done, targets-done.
import { makeBeat } from '../m05/_beat.mjs';
const b = makeBeat({ npcId: 'agent_vector', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 300, preMs: 600, steps: [/door audit has you in the Crypto Lab/i], targets: [{ name: 'eight-minutes', re: /Eight minutes\. I went in for a hardware token/i }] });
export const setup = b.setup; export default b.run;
