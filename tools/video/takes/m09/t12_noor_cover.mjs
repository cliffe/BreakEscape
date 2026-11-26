// t12_noor_cover (m09, keyless, NOT YET RUN): front desk. Walk to Noor Haddad and her opener "We're closed. Nobody comes in for a deed at this hour." (m09_noor_haddad.ink `start` else-branch, 3.89 s). Out before the cover menu (makeBeat ends after the line + 1 s).
// Entry state (new-game): --imports=none --start-room front_desk --unlock front_desk --set briefing_played=true --set dock_done=true (dock_done stops the game_loaded HaX dock call)   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh ngozi_adeyemi t12_noor_cover "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, walk-end, interact, conversation-open, closed-done, targets-done. TODO first run: tune start/stop offsets from the SETUP log; picks wanted a walk in from loading_dock (door:loading_dock->front_desk), not done.
import { makeBeat } from './_c9.mjs';
const b = makeBeat({ npcId: 'noor_haddad', start: [90, 60], stop: [30, 40], order: 'xy', lingerMs: 900, preMs: 500, steps: [], targets: [{ name: 'closed', re: /We.re closed\. Nobody comes in for a deed/i }] });
export const setup = b.setup; export default b.run;
