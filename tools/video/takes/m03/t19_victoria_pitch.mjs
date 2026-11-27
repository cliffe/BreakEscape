// t19_victoria_pitch (m03): DAY (afternoon), conference_room_01. A short straight walk (one axis, 56 px) to Victoria Sterling, the interview opens,
// two scripted choices, then her hub choice "What is Zero Day actually for?" and her line "We find it, we price it, and we find the somebody."
// (knot zero_day_philosophy, 5.26 s). Holds 1.2 s after it. No choice is picked after it (the menu follows within about a second: out before it).
// Entry state: new-game.rb m03_ghost_in_the_machine --start-room conference_room_01 --unlock conference_room_01 --set briefing_played=true
// Record: BE_SPRITE=ngozi_adeyemi tools/video/takes/run-take.sh m03 t19_victoria_pitch "--start-room conference_room_01 --unlock conference_room_01 --set briefing_played=true" "--hide-hud --zoom-step 1"
// Path: first_impression "Why am I here, then?" > philosophy_intro "So, responsible disclosure or full disclosure?" > market lines > hub "What is Zero Day actually for?" > target.
// (Every choice there carries an Influence toast; they all come before the target.) Marks: walk-start, walk-end, interact, choice:*, line-start:/line-end:, pitch-done, targets-done.
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'victoria_sterling', start: [0, 96], stop: [0, 40], order: 'yx', lingerMs: 1200,
  steps: [/^Why am I here/i, /^So, responsible disclosure/i, /^What is Zero Day actually for/i],
  targets: [{ name: 'pitch', re: /We find it, we price it, and we find the somebody/i }] });
export const setup = b.setup; export default b.run;
