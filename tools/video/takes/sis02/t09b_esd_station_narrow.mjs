// t09b_esd_station_narrow: t09 with the ESD panel capped at 560 px for 9:16 and 1:1 (the panel is 600 px wide). Same entry state as t09.
import { setup as s9, run } from './t09_esd_station.mjs';
export const setup = s9;
export default (page, bridge, mark) => run(page, bridge, mark, 560);
