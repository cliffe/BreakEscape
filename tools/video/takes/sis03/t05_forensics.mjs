// t05_forensics: the FDP forensic laptop, Timeline tab scrolling, one tab-bar click to Access log, that table scrolling (montage_a/b, 45 f each). Silent shot.
// Entry state: tools/video/takes/run-take.sh sis03 t05_forensics "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Hides (CSS + DOM, applied before any frame): the tabs historian, sis_log, soc_coverage, dc_implant (never opened); the three callouts (.fdp-evidence-gap, .fdp-session-record, .fdp-compliance-note);
//   .fdp-footer (the CONFIRM CAUSAL CHAIN button and the "Review the SIS Engineering Log" hint). Then a DOM scan of every timeline step and every jump-log row for BAD_WORDS
//   (SIS|ESD|Ofgem|NCSC|NESO|cable|Containment...) and each match is hidden (known hit: the c.ellison jump-log row, "SIS configurator ... cable pulled"). Nothing else is hidden.
// Path: timeline scroll (panel scrollTop 0 -> max over 3 s in 60 steps; after the hides nothing overflows, so it becomes a 10 px CSS drift over 3 s), click button.fdp-tab[data-tab=jump_log] with a real mouse click, scroll that table over 3 s.
// Marks: panel-open, hide-applied (hidden rows' text), rects, text-check-timeline / text-check-jump (BAD_WORDS: must be none), scroll-start / scroll-end per tab, tab-click, toast-seen / toast-watch-end,
//   frame:fdp_timeline_t0, frame:fdp_timeline_end, frame:fdp_jump_t0, frame:fdp_jump_end, end.
import { sleep, prepare, interact, rectOf, textHits, waitSel, narrow, watchToasts, clickSel, hideBadRows } from './_sis03.mjs';

// Scroll the panel; once the hidden rows leave nothing to scroll (max <= 8 px), drift the content by CSS instead (script change, as for the Claim Record).
const scrollPanel = async (page, ms, driftSel) => {
  const info = await page.evaluate(() => { const p = document.querySelector('.fdp-panel'); return { max: p.scrollHeight - p.clientHeight }; });
  if (info.max <= 8) {
    await page.evaluate(([sel, t]) => { const e = document.querySelector(sel); if (e) { e.style.transition = 'transform ' + t + 'ms ease-in-out'; e.style.transform = 'translateY(-10px)'; } }, [driftSel, ms]);
    await sleep(ms); return { ...info, drift: true };
  }
  const n = 60; for (let i = 1; i <= n; i++) { await page.evaluate((y) => { document.querySelector('.fdp-panel').scrollTop = y; }, Math.round(info.max * i / n)); await sleep(ms / n); }
  return info;
};

export function build(isNarrow) {
  return async (page, bridge, mark) => {
    await prepare(page, bridge, mark);
    const tw = watchToasts(page, mark, 12000);
    await interact(bridge, mark, 'fdp_terminal');
    if (!(await waitSel(page, '.fdp-panel', 8000))) throw new Error('fdp did not open');
    mark('panel-open'); await sleep(500);
    if (isNarrow) await narrow(page, '.fdp-wrap');
    await page.addStyleTag({ content: `
      .fdp-tab[data-tab=historian],.fdp-tab[data-tab=sis_log],.fdp-tab[data-tab=soc_coverage],.fdp-tab[data-tab=dc_implant]{display:none !important}
      .fdp-evidence-gap,.fdp-session-record,.fdp-compliance-note,.fdp-footer{display:none !important}` });
    const hidTl = await hideBadRows(page, '.fdp-panel', '.fdp-timeline-step');
    mark('hide-applied', { timelineHidden: hidTl, tabs: await page.evaluate(() => [...document.querySelectorAll('.fdp-tab')].filter(b => b.offsetParent).map(b => b.textContent.trim())) });
    mark('rects', { wrap: await rectOf(page, '.fdp-wrap'), tabbar: await rectOf(page, '.fdp-tab-bar'), panel: await rectOf(page, '.fdp-panel'), narrow: isNarrow });
    mark('text-check-timeline', { hits: await textHits(page) });
    await page.evaluate(() => { document.querySelector('.fdp-panel').scrollTop = 0; });
    mark('frame:fdp_timeline_t0'); await sleep(500);
    mark('scroll-start:timeline'); const i1 = await scrollPanel(page, 3000, '.fdp-timeline'); mark('scroll-end:timeline', i1);
    mark('frame:fdp_timeline_end'); await sleep(500);
    // one real click on the Access log tab
    mark('tab-click', { ok: await clickSel(page, 'button.fdp-tab', /access log|jump/i) }); await sleep(700);
    const hidJ = await hideBadRows(page, '.fdp-panel', '.fdp-log-table tbody tr');
    await page.evaluate(() => { document.querySelector('.fdp-panel').scrollTop = 0; });
    mark('hide-applied-jump', { jumpHidden: hidJ, active: await page.evaluate(() => document.querySelector('.fdp-tab-active')?.dataset.tab) });
    mark('text-check-jump', { hits: await textHits(page) });
    mark('frame:fdp_jump_t0'); await sleep(500);
    mark('scroll-start:jump'); const i2 = await scrollPanel(page, 3000, '.fdp-log-table'); mark('scroll-end:jump', i2);
    mark('frame:fdp_jump_end'); await sleep(500);
    await tw;
    mark('end');
  };
}
export default build(false);
