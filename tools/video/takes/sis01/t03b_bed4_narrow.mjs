// t03b_bed4_narrow: t03 with the reader narrowed to 560 px (9:16 and 1:1). Same entry state; the selector list is the minigame container the t03 'rects' mark reports.
import { sleep, prepare, sprite, interact, rectOf, frame, narrow, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis01.mjs';

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await prepare(page, bridge, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  await narrow(page, '.game-display-dialog');
  const r = await interact(bridge, mark, 'bed4_monitor');
  if (!r || !r.ok) throw new Error('monitor interact failed');
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('.game-display-dialog .game-display-body'))) break; await sleep(100); }
  mark('intro-dropped', await page.evaluate(() => { const b = document.querySelector('.game-display-dialog .game-display-body'); const em = b && b.querySelector('em'); if (!em) return false; let n = em.nextSibling; em.remove(); while (n && n.nodeName === 'BR') { const x = n.nextSibling; n.remove(); n = x; } return true; }));
  mark('panel-open'); await sleep(200);
  mark('rects', { dialog: await rectOf(page, '.game-display-dialog'), scroll: await page.evaluate(() => { const b = document.querySelector('.game-display-body'); return b && { sh: b.scrollHeight, ch: b.clientHeight }; }) });
  const t1 = Date.now();
  for (const t of [0.5, 1.5, 2.5, 3.2, 3.8]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, 't+' + t); await says.drain(); }
  mark('mute-summary', await muteSummary(page));
  mark('end');
};
