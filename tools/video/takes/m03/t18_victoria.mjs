// t18_victoria (m03): DAY (afternoon), conference_room_01. The player walks to Victoria Sterling and the interview opens; the take waits for
// "Competent is cheap. That's not why you're here." (3.98 s, first_impression) and holds 1.2 s after it. No choice is picked.
// Entry state: new-game.rb m03_ghost_in_the_machine --start-room conference_room_01 --unlock conference_room_01 --set briefing_played=true
// Record: BE_SPRITE=frank_callahan tools/video/takes/run-take.sh m03 t18_victoria "--start-room conference_room_01 --unlock conference_room_01 --set briefing_played=true" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'victoria_sterling', start: [0, 96], stop: [0, 40], order: 'yx', lingerMs: 1200,
  targets: [{ name: 'competent', re: /Competent is cheap/i }] });
export const setup = b.setup; export default b.run;
