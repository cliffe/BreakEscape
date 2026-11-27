// t03d_gas_monitor_narrow: t03c with the dialog capped at 560 px for 9:16 and 1:1. Same entry state as t03c.
import { setup as s3, run } from './t03c_gas_monitor.mjs';
export const setup = s3;
export default (page, bridge, mark) => run(page, bridge, mark, 560);
