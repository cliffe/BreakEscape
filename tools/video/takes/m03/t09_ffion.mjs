// t09_ffion (m03): NIGHT. The player walks up to Ffion at reception, she says "Oh! You made me jump. I only came back for my charger." (3.50 s)
// then "Is Ms. Sterling expecting you this late?" (3.29 s). The take holds 1 s after the second clip ends; no choice is picked (the answer menu follows).
// Entry state: night: new-game.rb m03_ghost_in_the_machine --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration (start room reception_lobby)
// Record: BE_SPRITE=marcus_hale tools/video/takes/run-take.sh m03 t09_ffion "--set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'ffion_rees', start: [-90, 70], stop: [-45, 40], order: 'xy', lingerMs: 1000, preMs: 1800,
  targets: [{ name: 'jump', re: /You made me jump/i }, { name: 'expecting', re: /Ms\. Sterling expecting you this late/i }] });
export const setup = b.setup; export default b.run;
