// t21_gary (m02): non-speaking presence of Gary Whitlock, it_department. No dialogue opened. Gary's workstation post-it is a spoiler: check the frame and crop it off.
// Entry: new-game.rb m02_ransomed_trust --start-room it_department   Record: tools/video/takes/run-take.sh m02 t21_gary "--start-room it_department" "--hide-hud --zoom-step 1"
import { makePresence } from './_presence.mjs';
const p = makePresence({ re: /gary/i, dx: 0, dy: 90 });
export const setup = p.setup; export default p.run;
