// t10b_drug_scan_narrow: t10 at a ~560 px panel for the 9:16 and 1:1 aspects (injected CSS max-width 560 px on the minigame frame). Same entry state and hard-stop as t10
// (RUN click, rows 1-5 PASS, close at scan+1.4 s, drug_library_compromised stays false).
// Entry state: tools/video/takes/run-take.sh sis01 t10b_drug_scan_narrow "--start-room major_incident_room --set briefing_played=true --set manufacturer_datasheet_available=true --set paper_charts_collected=true" "--hide-hud --zoom-step 1"
// Marks as t10 plus chain (frame ancestor classes) and rects-scanning (crop boxes in the narrowed layout: the 7-column table may wrap or clip; check frame:scan_t+N).
import { sleep, prepare, sprite, narrow, chainOf } from './_sis01b.mjs';
import { openChecker, geometry } from './t10_drug_scan.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChecker(page, bridge, mark);
  mark('chain', await chainOf(page, '.dli-wrap'));
  await narrow(page, '.console-window.console-window-fill');   // frame chain (dry run): .dli-wrap > .dli-game-container > .console-window (1280x880) > .minigame-container (full screen)
  await sleep(400);
  const g = await geometry(page, mark);
  mark('frame:pre_scan');
  await page.evaluate(() => document.querySelector('#dli-run-btn').click());
  const tClick = Date.now(); mark('scan-start', null, tClick);
  await sleep(150);
  const g2 = await geometry(page, (l, d) => mark(l + '-scanning', d));
  const sample = () => page.evaluate(() => [0, 1, 2, 3, 4, 5].map(i => (document.querySelector('#dli-status-' + i)?.textContent || '').trim().slice(0, 8)));
  const ft = [0.3, 0.6, 0.9, 1.2]; let fi = 0, rowsPass = null;
  while ((Date.now() - tClick) / 1000 < 1.4) {
    const el = (Date.now() - tClick) / 1000;
    while (fi < ft.length && el >= ft[fi]) { mark('frame:scan_t+' + ft[fi]); fi++; }
    const s = await sample(); if (!rowsPass && s.slice(0, 5).every(x => /PASS/.test(x))) { rowsPass = el; mark('rows-pass', { atS: +el.toFixed(2), statuses: s }); }
    await sleep(40);
  }
  mark('hard-stop', { elapsedS: +((Date.now() - tClick) / 1000).toFixed(2), statuses: await sample() });
  await bridge.minigame.close().catch(() => {});
  await sleep(2500);
  const st = await bridge.getState();
  mark('global-check', { drug_library_compromised: st.globals && st.globals.drug_library_compromised, minigame: st.activeMinigame ? 'still-open' : null });
  mark('end');
};
