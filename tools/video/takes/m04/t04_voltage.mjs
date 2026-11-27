// t04_voltage (m04), keyless: the ending. The player starts in plant_room, Static already stood aside (off screen, idle at the wall), and walks the few steps to Voltage at his bench.
// Path: opener > [You're not burning this hall down.] > "Ja. They all say that on the way in." > "Look at my hand. Then look at the clock." (3.38 s, crescendo J-cut)
//   > [Make me understand it first.] > [Why infrastructure? Why civilians?] > "I didn't bring a bomb, agent. I brought a maintenance schedule." (4.42 s). Stops 1 s after it; the next line (budget cuts) is not reached.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room plant_room --set briefing_played=true --set static_stood_aside=true
// Record: BE_SPRITE=vivian_ashby tools/video/takes/run-take.sh m04 t04_voltage "<flags above>" "--hide-hud --zoom-step 1"
// Marks: walk-start, walk-end, interact, conversation-open, choice:*, line-start:/line-end:, hand-done, maint-done, targets-done.
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'voltage', start: [-64, -33], stop: [-34, -33], order: 'xy', align: true, lingerMs: 1000,
  steps: [/not burning this hall down/i, /Make me understand it first/i, /Why infrastructure/i],
  targets: [{ name: 'hand', re: /Look at my hand/i }, { name: 'maint', re: /maintenance schedule/i }] });
export const setup = b.setup; export default b.run;
