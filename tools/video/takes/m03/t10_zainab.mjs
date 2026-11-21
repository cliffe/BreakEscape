// t10_zainab (m03): DAY (afternoon). The player walks to Zainab on the reception sofa; "Hiya. Here to see Sterling? Good luck." (3.89 s), hold 1 s after the clip. No choice.
// Entry state: new-game.rb m03_ghost_in_the_machine --set briefing_played=true
// Record: BE_SPRITE=frank_callahan tools/video/takes/run-take.sh m03 t10_zainab "--set briefing_played=true" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'zainab_hussain', start: [20, -150], stop: [0, -50], order: 'yx', lingerMs: 1000,
  targets: [{ name: 'hiya', re: /Here to see Sterling\? Good luck/i }] });
export const setup = b.setup; export default b.run;
