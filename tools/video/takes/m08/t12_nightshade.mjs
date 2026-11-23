// t12_nightshade (m08, keyless, NOT YET RUN): cryptography_lab. Interview opener for Agent 0x47: walk to him (approach), two narrator lines, then "There you are. I wondered when they'd send you." (3.34 s). Out before "Of everyone in this building..." (that line points at him). No choice picked. Watch his portrait for anything the confrontation sprite shares.
// Entry state (new-game): --imports=none --start-room cryptography_lab --set briefing_played=true --set brief_taken=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh harjit_singh t12_nightshade "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, walk-end, conversation-open, there-you-are-done, targets-done.
import { makeBeat } from '../m05/_beat.mjs';
const b = makeBeat({ npcId: 'agent_nightshade', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 300, preMs: 600, steps: [], targets: [{ name: 'there-you-are', re: /There you are\. I wondered when they.d send you/i }] });
export const setup = b.setup; export default b.run;
