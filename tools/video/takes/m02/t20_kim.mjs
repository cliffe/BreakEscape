// t20_kim (m02): non-speaking presence of Dr Sarah Kim, dr_kim_office. No dialogue opened.
// Entry: new-game.rb m02_ransomed_trust --start-room dr_kim_office   Record: tools/video/takes/run-take.sh m02 t20_kim "--start-room dr_kim_office" "--hide-hud --zoom-step 1"
import { makePresence } from './_presence.mjs';
const p = makePresence({ re: /kim/i, dx: 0, dy: 90 });
export const setup = p.setup; export default p.run;
