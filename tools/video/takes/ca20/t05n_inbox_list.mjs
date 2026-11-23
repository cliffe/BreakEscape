// t05n_inbox_list: t05 with the .mail-client panel capped to 560 px for 9:16 and 1:1 (list and the page card); same entry state, marks and assertions.
import { setup, run } from './t05_inbox_list.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
