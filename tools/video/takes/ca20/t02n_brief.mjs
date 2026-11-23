// t02n_brief: t02 with the kiosk bezel capped to 560 px for 9:16 and 1:1; same marks and assertions.
import { setup, run } from './t02_brief.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
