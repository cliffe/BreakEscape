// t14_elena (m07, keyless, NOT YET RUN): server_room. Elena at the backup rack: opening (two lines) > [Finish what, exactly?] > "Forty minutes I've been at it. It's read-only. Of course it is." (3.94 s). Out before the next menu.
// Entry state (new-game): --imports=none --unlock server_room --start-room server_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh <avatar> t14_elena "<flags>" "--hide-hud --zoom-step 1"     (avatar: daniel_seo)
import { makeBeat } from '../m05/_beat.mjs';
const b = makeBeat({ npcId: 'elena_rodriguez', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 800, preMs: 600, steps: [/Finish what, exactly/i], targets: [{ name: 'forty-minutes', re: /Forty minutes I.ve been at it/i }] });
export const setup = b.setup; export default b.run;
