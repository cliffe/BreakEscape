// t10b_drug_scan_narrow: t10 at a 760 px panel for the 9:16 and 1:1 aspects (injected CSS max-width 760 px on the minigame frame). 560 px clipped the 7-column table (682 px wide) so the PASS column was cut off; 760 px leaves a 724 px wrap, which holds it. Same entry state and hard-stop as t10
// (RUN click, rows 1-5 PASS, close at scan+1.4 s, drug_library_compromised stays false).
// Entry state: tools/video/takes/run-take.sh sis01 t10b_drug_scan_narrow "--start-room major_incident_room --set briefing_played=true --set manufacturer_datasheet_available=true --set paper_charts_collected=true" "--hide-hud --zoom-step 1"
// Marks as t10 plus chain (frame ancestor classes), rects-scanning (crop boxes in the narrowed layout), fit-check (table and status cell inside the wrap, no clip; must be fits:true) and crop-box-narrow (x,y,w,h: the whole window down to MORPHINE row top - 4; the take throws if MORPHINE row sits above it).
// Expected (dry-run to confirm): window x580 w760, wrap about x598 w724, rows 1-5 PASS at 0.9 s, crop bottom at the MORPHINE row top - 4 (was y520 at 560 px; read crop-box-narrow, do not assume).
import { sleep, prepare, sprite, narrow, chainOf } from './_sis01b.mjs';
import { openChecker, geometry } from './t10_drug_scan.mjs';

const NARROW_W = 760;
export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChecker(page, bridge, mark);
  mark('chain', await chainOf(page, '.dli-wrap'));
  await narrow(page, '.console-window.console-window-fill', NARROW_W);   // frame chain (dry run): .dli-wrap > .dli-game-container > .console-window (1280x880) > .minigame-container (full screen)
  await sleep(400);
  const g = await geometry(page, mark);
  const fit = await page.evaluate(() => { const w = document.querySelector('.dli-wrap'), t = document.querySelector('.dli-wrap table, #dli-panel table') || w, s0 = document.querySelector('#dli-status-0'); const wr = w.getBoundingClientRect(), sr = s0 && s0.getBoundingClientRect(); return { wrapW: Math.round(wr.width), wrapScrollW: w.scrollWidth, tableScrollW: t.scrollWidth, statusRight: sr && Math.round(sr.right), wrapRight: Math.round(wr.right), fits: !!sr && sr.right <= wr.right + 1 && w.scrollWidth <= w.clientWidth + 1 }; });
  mark('fit-check', fit);
  const win = await page.evaluate(() => { const e = document.querySelector('.console-window.console-window-fill'); const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }; });
  const m5 = g.rows[5] && g.rows[5].y;
  mark('crop-box-narrow', { x: win.x, y: win.y, w: win.w, h: m5 ? m5 - 4 - win.y : null, morphineRowTop: m5 });
  if (!fit.fits) throw new Error('t10b: table still clipped at ' + NARROW_W + ' px: ' + JSON.stringify(fit));
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
