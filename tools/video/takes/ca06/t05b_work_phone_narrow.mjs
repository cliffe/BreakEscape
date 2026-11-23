// t05b_work_phone_narrow: t05_work_phone with the mail client / triage panel narrowed to 760 px (narrowMail(760), injected CSS: the inbox with the verdict cards; the card keeps its two-pane layout if it fits, see takes_ca06.md) for the 9:16 and 1:1 cuts. Same entry state, marks and hazards;
// CA06_LIST_ONLY=1 gives the list-only run. The inbox of verdict cards is the same .mail-client frame.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca06_texts_and_qr t05b_work_phone_narrow "--set episode_e6_texts_and_qr_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_mobile_staff_attempts=1" "--hide-hud --zoom-step 1"
import { setup, body } from './t05_work_phone.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, 760);
