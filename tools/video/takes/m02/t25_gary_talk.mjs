// t25_gary_talk (m02): Gary Whitlock's conversation opened, held on the portrait/talk view; never advanced, no choice picked. Silent capture; the on-screen line is logged as marks for the spoiler check.
// Entry: new-game.rb m02_ransomed_trust --start-room it_department   Record: tools/video/takes/run-take.sh m02 t25_gary_talk "--start-room it_department" "--hide-hud --zoom-step 1"
import { makeTalk } from './_talk.mjs';
const t = makeTalk({ npcId: 'gary_whitlock' });
export const setup = t.setup; export default t.run;
