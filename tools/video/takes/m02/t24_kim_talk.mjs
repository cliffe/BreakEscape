// t24_kim_talk (m02): Dr Sarah Kim's conversation opened, held on the portrait/talk view; never advanced, no choice picked. Silent capture; the on-screen line is logged as marks for the spoiler check.
// Entry: new-game.rb m02_ransomed_trust --start-room dr_kim_office   Record: tools/video/takes/run-take.sh m02 t24_kim_talk "--start-room dr_kim_office" "--hide-hud --zoom-step 1"
import { makeTalk } from './_talk.mjs';
const t = makeTalk({ npcId: 'dr_sarah_kim' });
export const setup = t.setup; export default t.run;
