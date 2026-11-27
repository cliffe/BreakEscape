// t03_alarm_panel: the Facility Alarm Panel in the gas alarm, H2 GAS lamp amber (alarm shot, 4.0-6.6 s; Helen's 46aae3 audio runs on from t01, so this take is silent).
// Feeds: alarm (hold 1.26 s of picture after speech ends at 1.19 s, 2.6 s shot).
// Entry state: tools/video/takes/run-take.sh sis02 t03_alarm_panel "--set hydrogen_alarm=true --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
//   (hydrogen_alarm set so the H2 GAS lamp is amber ADVISORY; --set fires no events.) Fresh game.
// Actions: interact('alarm_panel') opens AlarmPanelMinigame (root .minigame-game-container.ap-game-container, ~322 px wide, centred): already narrow, so t03b only caps it.
//   Hold 3.2 s; no click. The panel's SIS STATUS reads green "WITHIN SETPOINTS" (the falsified value, fine). Nothing to hide.
// Marks: sprite, panel-open, rects (panel box), text (panel inner text, for the spoiler read), frame:panel_t+N, bark-check, end.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  const r = await interact(bridge, mark, 'alarm_panel');
  if (!r || !r.ok) throw new Error('alarm_panel interact failed');
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('.ap-game-container'))) break; await sleep(100); }
  mark('panel-open'); await sleep(700);
  mark('rects', { panel: await rectOf(page, '.ap-game-container > *'), container: await rectOf(page, '.minigame-container') });
  mark('text', await page.evaluate(() => (document.querySelector('.ap-game-container') || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 600)));
  const t1 = Date.now();
  for (const t of [0.5, 1.3, 2.6]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, 'panel_t+' + t); await says.drain(); }
  await sleep(700);
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
};
