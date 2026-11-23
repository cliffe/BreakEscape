// t02b_brief_narrow: narrowed-panel variant of t02_brief for the 9:16 and 1:1 crops (.epr-kiosk-bezel capped at 560 px, centred): Quayholt tab, heading and strip in frame, Start unpressed.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t02b_brief_narrow "" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca16.mjs';
import { run } from './t02_brief.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
