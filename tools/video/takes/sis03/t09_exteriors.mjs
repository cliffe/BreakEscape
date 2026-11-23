// t09_exteriors: the Warranty Compliance Checklist exterior, four rows (W-03, W-07, W-09, W-12), hints hidden, nothing ticked (montage_b, 48 f). Silent shot.
// Entry state: tools/video/takes/run-take.sh sis03 t09_exteriors "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Path: interact warranty_checklist; hide .wcc-hint (and, to be safe, .wcc-gate-note, which names the CMS and exhibits); cursor sweeps over the four .wcc-row (hover only: the mouse moves to the row's
//   context text, never onto a .wcc-verdict-btn, never a click). Verdict buttons are left visible or cropped by the edit; the dry run logs where they are so the edit can crop them out.
// Marks: panel-open, rows (code, title, context text, verdict button rects), hide-applied, rects, text-check (BAD_WORDS must be none), hover:<code>, verdict-state (no .wcc-verdict-btn marked active/selected),
//   globals, toast-seen / toast-watch-end, frame:wcc_t0, frame:wcc_hover, end.
import { sleep, prepare, interact, rectOf, textHits, waitSel, narrow, watchToasts, globals } from './_sis03.mjs';

export function build(isNarrow) {
  return async (page, bridge, mark) => {
    await prepare(page, bridge, mark);
    const tw = watchToasts(page, mark, 12000);
    await interact(bridge, mark, 'warranty_checklist');
    if (!(await waitSel(page, '.wcc-panel', 8000))) throw new Error('checklist did not open');
    mark('panel-open'); await sleep(600);
    if (isNarrow) await narrow(page, '.wcc-panel');
    await page.addStyleTag({ content: '.wcc-hint,.wcc-gate-note{display:none !important}' });
    await sleep(300);
    const rows = await page.evaluate(() => [...document.querySelectorAll('.wcc-row')].map(r => { const g = (s) => { const e = r.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
      return { code: (r.querySelector('.wcc-code') || {}).textContent, ctx: (r.querySelector('.wcc-row-context') || {}).textContent?.slice(0, 120), row: (() => { const b = r.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; })(), btns: [...r.querySelectorAll('.wcc-verdict-btn')].map(b => { const q = b.getBoundingClientRect(); return { t: b.textContent.trim(), x: Math.round(q.x), y: Math.round(q.y), w: Math.round(q.width), h: Math.round(q.height) }; }) }; }));
    mark('rows', { n: rows.length, rows });
    mark('hide-applied', { hints: await page.evaluate(() => [...document.querySelectorAll('.wcc-hint')].map(e => getComputedStyle(e).display)) });
    mark('rects', { panel: await rectOf(page, '.wcc-panel'), narrow: isNarrow });
    mark('text-check', { hits: await textHits(page) });
    mark('frame:wcc_t0'); await sleep(500);
    // hover each row's text area (left of the verdict buttons): the mouse never enters a button
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].row; if (!r) continue;
      const tx = r.x + Math.min(120, r.w * 0.2), ty = r.y + r.h / 2;
      await page.mouse.move(tx, ty, { steps: 12 }); mark('hover:' + String(rows[i].code || i).trim()); await sleep(700);
      if (i === 1) { mark('frame:wcc_hover'); await sleep(500); }
    }
    mark('verdict-state', await page.evaluate(() => ({ active: [...document.querySelectorAll('.wcc-verdict-btn')].filter(b => /active|selected|chosen|ticked/.test(b.className)).length, total: document.querySelectorAll('.wcc-verdict-btn').length })));
    mark('globals', await globals(bridge, ['warranty_checklist_complete', 'warranty_evidence_reviewed']));
    await tw;
    mark('end');
  };
}
export default build(false);
