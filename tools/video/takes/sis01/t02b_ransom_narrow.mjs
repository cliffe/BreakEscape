// t02b_ransom_narrow: t02 with the panel narrowed to 560 px (9:16 and 1:1). Same entry state and marks as t02, plus the narrowed rects.
// Run: run-take.sh sis01 t02b_ransom_narrow "--set briefing_played=true" "--hide-hud --zoom-step 1"
import { sleep, prepare, sprite, interact, rectOf, frame, narrow } from './_sis01.mjs';
import { MASK, AMOUNT_RECT } from './t02_ransom_station.mjs';

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await prepare(page, bridge, mark);
  await narrow(page, '.ransomware-display-game-container, .ransomware-display-panel');
  const r = await interact(bridge, mark, 'ward_monitoring_station');
  if (!r || !r.ok) throw new Error('station interact failed');
  for (let i = 0; i < 40; i++) { if (await page.evaluate(() => !!document.querySelector('.ransomware-display-body'))) break; await sleep(150); }
  mark('panel-open'); await sleep(300);
  mark('mask-applied', await page.evaluate(MASK));
  mark('rects', { panel: await rectOf(page, '.ransomware-display-game-container'), pre: await rectOf(page, '.ransomware-display-body'), title: await rectOf(page, '.ransomware-display-title'), timer: await rectOf(page, '.ransomware-display-timer-row'), amount: await page.evaluate(AMOUNT_RECT) });
  const t0 = Date.now();
  for (const t of [1, 2, 3, 3.9]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t0))); frame(mark, 't+' + t); }
  mark('overflow-check', await page.evaluate(() => { const p = document.querySelector('.ransomware-display-body'); return p ? { scrollW: p.scrollWidth, clientW: p.clientWidth } : null; }));
  mark('end');
};
