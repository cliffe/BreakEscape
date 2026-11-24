// t26b_park_fight (m07, keyless, NOT YET RUN): cable_vault. Park's entry line "Four minutes and I'd have been out. Four." (3.38 s, target), then the hub choice [Then finish it and see what happens. (Fight him.)] picked after a short dwell, "Right." and the narrator's swing; the take then holds about 1.8 s on the chase (#hostile) and stops BEFORE any KO. throttleFps(20) set in setup (hostile NPC under headless physics). t15 films the line alone.
// Entry state (new-game): --imports=none --unlock cable_vault --start-room cable_vault --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh mei_lin_chow t26b_park_fight "<flags>" "--hide-hud --zoom-step 1"
// Marks: four-minutes-done (makeBeat), choices-shown, choice:*, right-done, swing-seen, chase-held, end. Out point on chase-held minus 0.3 s.
import { sleep, watchVoice } from '../lib/lib.mjs';
import { makeBeat } from '../m05/_beat.mjs';
import { pickMenu } from '../m06/_conv.mjs';
const b = makeBeat({ npcId: 'thomas_park', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 300, preMs: 600, steps: [], targets: [{ name: 'four-minutes', re: /Four minutes and I.d have been out/i }] });
export const setup = b.setup;
import { clearScreen as _cs } from '../lib/lib.mjs';
export default async (page, bridge, mark) => {
  await _cs(page, bridge, () => {}); await sleep(500);
  await b.run(page, bridge, mark);
  await page.evaluate(() => window.__test && window.__test.throttleFps && window.__test.throttleFps(20)).catch(() => {});
  const vw = await watchVoice(page, mark);
  await pickMenu(bridge, /finish it and see what happens/i, mark, 30000);
  const l = await vw.waitForLine(/^Right\.?$/i, 20000); if (l) mark('right-done', { durMs: l.durMs });
  for (let i = 0; i < 40; i++) { const d = (await bridge.getState()).dialogue; if (d && /fight/i.test(d.text || '')) { mark('swing-seen'); break; } await sleep(250); }
  await sleep(1800); mark('chase-held'); await vw.stop(); mark('end');
};
