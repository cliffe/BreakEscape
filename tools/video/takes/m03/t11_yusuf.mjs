// t11_yusuf (m03): DAY (afternoon). The player walks to Yusuf in the reception seating; "Afternoon. If you're my client, you're very late." (4.58 s), hold 1 s after the clip. No choice.
// Entry state: new-game.rb m03_ghost_in_the_machine --set briefing_played=true
// Record: BE_SPRITE=harjit_singh tools/video/takes/run-take.sh m03 t11_yusuf "--set briefing_played=true" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'yusuf_demir', start: [-20, -150], stop: [0, -50], order: 'yx', lingerMs: 1000,
  targets: [{ name: 'late', re: /you're very late/i }] });
export const setup = b.setup; export default b.run;
