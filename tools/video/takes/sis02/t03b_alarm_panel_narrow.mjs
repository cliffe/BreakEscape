// t03b_alarm_panel_narrow: t03 with the panel capped at 560 px for 9:16 and 1:1. The panel is ~322 px wide already, so the cap is a no-op; kept so every aspect has a take. Same entry state as t03.
import { narrow } from './_sis02.mjs';
import t03, { setup as s3 } from './t03_alarm_panel.mjs';
export async function setup(page, bridge) { await s3(page, bridge); await narrow(page, '.ap-game-container'); }
export default t03;
