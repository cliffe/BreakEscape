// t03n_choices_reveal: t03 with the kiosk bezel capped to 560 px for 9:16 and 1:1 (cards, montage, flip panel); same entry state, marks and assertions.
import { setup, run } from './t03_choices_reveal.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
