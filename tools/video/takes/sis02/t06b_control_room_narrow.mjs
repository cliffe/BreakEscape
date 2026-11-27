// t06b_control_room_narrow: t06 with the network window and the note pad capped at 560 px for 9:16 and 1:1 (only the network window needs it: the folder is 728 px and the NIS dialog 1050 px, the edit scales those). Same entry state as t06.
import { setup as s6, run } from './t06_control_room.mjs';
export const setup = s6;
export default (page, bridge, mark) => run(page, bridge, mark, 560);
