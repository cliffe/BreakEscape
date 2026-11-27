// t04b_pump_narrow: the pump with its container narrowed to 560 px (9:16 / 1:1). Phaser may relayout (stacked) or ignore the CSS: the 'objs' / 'crop-box' marks and the frames say which.
// Entry state: the charts seed (see t04p_pump).
import { prepare, sprite, narrow } from './_sis01.mjs';
import { pumpShot } from './t04p_pump.mjs';
export default async (page, bridge, mark) => {
  await sprite(page, mark); await prepare(page, bridge, mark);
  await narrow(page, '.minigame-container, #ip-phaser-container');
  await pumpShot(page, bridge, mark, true);
  mark('end');
};
