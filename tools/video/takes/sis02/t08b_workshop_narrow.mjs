// t08b_workshop_narrow: t08 with the access-log window capped at 560 px (9:16 / 1:1). Same entry state and marks as t08_workshop.
import { run, setup } from './t08_workshop.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, 560);
