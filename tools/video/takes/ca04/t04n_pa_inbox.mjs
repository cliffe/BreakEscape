// t04n_pa_inbox: the narrowed-panel variant of t04_pa_inbox for the 9:16 and 1:1 crops (mail client .mail-client capped at 760 px (560 truncates every name and subject to "Catherine Mer...", unreadable; scale 760 into the window in the edit, as ca08 t04b)). Same entry state, body, runs and marks:
// CA04_RUN=A (list held) or CA04_RUN=B (cursor down the rows).
//   CA04_RUN=A BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca04_exec_whaling t04n_pa_inbox '<SEED_DEFEND flags>' "--hide-hud --zoom-step 1"
import { run, setup } from './t04_pa_inbox.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true, px: 760 });
