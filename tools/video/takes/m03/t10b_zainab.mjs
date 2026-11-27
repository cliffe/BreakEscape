// t10b_zainab (m03 v3): DAY (afternoon), reception_lobby. A STRAIGHT key-driven walk down one axis (y) to Zainab on the visitor sofa, lined up off camera first
// (setup waits until she is stationary, then pulses the player onto the exact start point; no x leg), then "Hiya. Here to see Sterling? Good luck." (3.89 s), hold 4.5 s after the clip (to catch a blink; the editor trims). No choice.
// Entry state: new-game.rb m03_ghost_in_the_machine --set briefing_played=true
// Record (day): BE_SPRITE=mei_lin_chow tools/video/takes/run-take.sh m03 t10b_zainab "--set briefing_played=true" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
import { sleep, clearScreen } from '../lib/lib.mjs';
const b = makeBeat({ npcId: 'zainab_hussain', start: [0, -115], stop: [0, -36], order: 'yx', align: true, lingerMs: 4500, preMs: 600,
  targets: [{ name: 'hiya', re: /Here to see Sterling\? Good luck/i }] });
export const setup = async (page, bridge) => {
  // wait (off camera) until Zainab has stopped moving: an office-life walk or desk fidget would jitter the shot
  await clearScreen(page, bridge, () => {});
  let last = null, still = 0;
  for (let i = 0; i < 60 && still < 6; i++) {
    const n = (await bridge.getState()).nearby.find(x => x.id === 'zainab_hussain');
    if (n && last && Math.abs(n.x - last.x) < 1 && Math.abs(n.y - last.y) < 1) still++; else still = 0;
    last = n && { x: n.x, y: n.y }; await sleep(500);
  }
  console.error('ZAINAB-STILL', still, JSON.stringify(last));
  await b.setup(page, bridge);
};
export default b.run;
