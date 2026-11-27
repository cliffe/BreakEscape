// t19_bernie (m02): non-speaking presence of Bernie Nwosu (receptionist), reception_lobby. No dialogue opened. Crescendo flash material.
// Entry: new-game.rb m02_ransomed_trust --start-room reception_lobby   Record: tools/video/takes/run-take.sh m02 t19_bernie "--start-room reception_lobby" "--hide-hud --zoom-step 1"
import { makePresence } from './_presence.mjs';
const p = makePresence({ re: /bernie|receptionist|nwosu/i, dx: 0, dy: 90 });
export const setup = p.setup; export default p.run;
