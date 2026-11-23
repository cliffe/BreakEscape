// t04c_ehr_narrow: the patient records terminal in the 560 px column (9:16 / 1:1). Fresh game, "--set briefing_played=true".
import { prepare, sprite, narrow } from './_sis01.mjs';
import { ehrShot } from './t04_ward_minigames.mjs';
export default async (page, bridge, mark) => {
  await sprite(page, mark); await prepare(page, bridge, mark);
  await narrow(page, '.ehr-terminal-minigame-game-container');
  await ehrShot(page, bridge, mark, true);
  mark('end');
};
