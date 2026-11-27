// t04b_queue_narrow: narrowed-panel variant of t04_service_queue for the 9:16 and 1:1 crops. Same entry state, body and marks; the queue frame
// (.mail-client.triage-client, 960 px) is capped at 560 px by injected CSS once the list is up, centred. Use for queue_a, topic, queue_b, queue_c.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca03_helpdesk_reset t04b_queue_narrow \
//     "--set episode_e3_helpdesk_reset_state={\"done\":[\"brief\",\"osint\",\"write\",\"mfa\",\"flip\"]}" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca03.mjs';
import { run } from './t04_service_queue.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true });
