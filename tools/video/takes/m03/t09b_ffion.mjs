// t09b_ffion (m03 v3): NIGHT, reception_lobby. A STRAIGHT key-driven walk along one axis (x) to Ffion, lined up off camera first (setup pulses the
// player onto the exact start point; the walk has no y leg), then "Is Ms. Sterling expecting you this late?" (3.29 s). Her earlier line "You made me jump"
// plays first (3.50 s) and is not the target; the take holds 1 s after the target. No choice is picked.
// Entry state: new-game.rb m03_ghost_in_the_machine --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration
// Record (no BE_SPRITE): tools/video/takes/run-take.sh m03 t09b_ffion "--set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'ffion_rees', start: [-110, 20], stop: [-20, 20], order: 'xy', align: true, lingerMs: 1000, preMs: 600,
  targets: [{ name: 'jump', re: /You made me jump/i }, { name: 'expecting', re: /Ms\. Sterling expecting you this late/i }] });
export const setup = b.setup; export default b.run;
