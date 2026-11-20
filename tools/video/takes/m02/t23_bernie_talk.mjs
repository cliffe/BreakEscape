// t23_bernie_talk (m02): Bernie Nwosu's conversation opened, held on the portrait/talk view; never advanced, no choice picked. Silent capture; the on-screen line is logged as marks for the spoiler check.
// Entry: new-game.rb m02_ransomed_trust --start-room reception_lobby   Record: tools/video/takes/run-take.sh m02 t23_bernie_talk "--start-room reception_lobby" "--hide-hud --zoom-step 1"
import { makeTalk } from './_talk.mjs';
const t = makeTalk({ npcId: 'receptionist' });
export const setup = t.setup; export default t.run;
