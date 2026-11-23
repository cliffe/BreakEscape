// t11b_control_grid_narrow: t11 with the panel capped at 560 px (9:16 / 1:1). Same entry state and marks as t11_control_grid.
import { run, setup } from './t11_control_grid.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, 560);
