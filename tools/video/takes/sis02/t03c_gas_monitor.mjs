// t03c_gas_monitor: the H2 Gas Detector Panel (object id hydrogen_detector, Hall 1) at its BASE readout: montage_b "Gas monitor" (header only, numbers cropped in the edit) and the crescendo
//   (readout "Current reading 0.4%", "Alarm and ventilate: 1.0%"). No alarm state, so no 3.8, no SIS and no alarm text may be in frame (spoiler read in the 'text' mark).
// Entry state: tools/video/takes/run-take.sh sis02 t03c_gas_monitor "--start-room battery_hall_1 --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
//   Fresh game, NO hydrogen_alarm. --start-room battery_hall_1 means Helen is not a loaded NPC (new-game WARNING expected), so no hall bark.
// Actions: interact('hydrogen_detector') (the player walks over), hold 3 s, close. The panel is a gameDisplay dialog (.game-display-dialog).
// Marks: sprite, panel-open, rects (dialog, title), text (spoiler read; must not contain 3.8 / SIS / alarm variants), frame:gas_t+N, bark-check, end.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export async function run(page, bridge, mark, narrowPx) {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  if (narrowPx) await page.addStyleTag({ content: `.game-display-dialog{width:${narrowPx}px !important;max-width:${narrowPx}px !important;box-sizing:border-box !important}` });
  const r = await interact(bridge, mark, 'hydrogen_detector');
  if (!r || !r.ok) throw new Error('hydrogen_detector interact failed');
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('.game-display-dialog'))) break; await sleep(100); }
  mark('panel-open'); await sleep(700);
  mark('rects', { dialog: await rectOf(page, '.game-display-dialog'), title: await rectOf(page, '.game-display-title') });
  // Redact the "Hardwired to the SIS ... Not on SCADA." sentence from the DOM (spoiler list: never on screen); the edit then needs no two-strip crop.
  mark('redact', await page.evaluate(() => { let n = 0; const w = document.createTreeWalker(document.querySelector('.game-display-dialog'), NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) { if (/Hardwired to the SIS/i.test(t.nodeValue)) { t.nodeValue = t.nodeValue.replace(/Hardwired to the SIS[^.]*\.(\s*Not on SCADA\.)?/i, ''); n++; } } return n; }));
  const text = await page.evaluate(() => (document.querySelector('.game-display-dialog') || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 700));
  mark('text', text); mark('spoiler-read', { has38: /3\.8/.test(text), hasSIS: /SIS/i.test(text), hasAlarmWord: /alarm/i.test(text) });
  const t1 = Date.now();
  for (const t of [0.4, 1.2, 2.2]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, 'gas_t+' + t); await says.drain(); }
  await sleep(700);
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, 0);
