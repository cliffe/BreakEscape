// t02_cms_claim: the CMS Claim Record, heading and summary block only (hook cut-in 71 f, cost beat 49 f). Silent shot.
// Entry state: tools/video/takes/run-take.sh sis03 t02_cms_claim "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Path: interact claims_management_system, open on the Claim Record tab (the default); no tab click (Policy Info holds the PIN; Quarterly/Warranty tabs spoil).
// Hides (CSS, all DOM): the 4 other nav tabs, .cms-context (dev text), the contents list's last li ("Containment logged: manual ESD..."), then the whole list below the crop.
// The panel does not overflow, so there is no scroll: the "scroll" is a CSS drift (translateY 0 to -8 px over 6.5 s, ease) on .cms-summary-strip's wrapper.
// Crop for the edit (1920x1080): x602 y264 w640 h132 (heading + summary cards). The list starts at y404, outside the crop; it is hidden anyway.
// Marks: panel-open, rects (panel, heading, summary, list, crop), hide-applied, text-check (BAD_WORDS in visible text: must be none), globals (policy_reviewed, cms_policy_section_reviewed: both stay false),
//   toast-seen / toast-watch-end (Eleanor's timed text over 12 s), frame:cms_t0, frame:cms_t6, end.
import { sleep, prepare, interact, rectOf, globals, textHits, waitSel, narrow, watchToasts } from './_sis03.mjs';

export const NARROW = false;
export const CROP = { x: 602, y: 264, w: 640, h: 132 };

export function build(isNarrow) {
  return async (page, bridge, mark) => {
    await prepare(page, bridge, mark);
    const tw = watchToasts(page, mark, 12000);
    await interact(bridge, mark, 'claims_management_system');
    if (!(await waitSel(page, '.cms-panel', 8000))) throw new Error('cms panel did not open');
    mark('panel-open'); await sleep(400);
    if (isNarrow) { await narrow(page, '.cms-panel, .cms-minigame-game-container'); await page.addStyleTag({ content: '.cms-body{grid-template-columns:minmax(0,1fr) !important}.cms-nav{display:none !important}' }); } // 560 px collapses the 3-column grid (content 0 px wide): one column, nav tab list hidden
    await page.addStyleTag({ content: `
      .cms-nav-button:not(.cms-nav-active):not(.active):not(.selected){visibility:hidden !important}
      .cms-context{display:none !important}
      .cms-content-list{visibility:hidden !important}
      .cms-content-list li:last-child{display:none !important}
      @keyframes sis03drift{from{transform:translateY(0)}to{transform:translateY(-8px)}}
      .cms-summary-strip{animation:sis03drift 6.5s ease-in-out forwards}` });
    await sleep(300);
    const active = await page.evaluate(() => [...document.querySelectorAll('.cms-nav-button')].map(b => ({ t: b.textContent.trim().slice(0, 24), vis: getComputedStyle(b).visibility, cls: b.className.slice(0, 50) })));
    mark('hide-applied', { nav: active });
    mark('rects', { panel: await rectOf(page, '.cms-panel'), heading: await rectOf(page, '.cms-content-header'), summary: await rectOf(page, '.cms-summary-strip'), list: await rectOf(page, '.cms-content-list'), crop: CROP, narrow: isNarrow });
    mark('text-check', { hits: await textHits(page), listLastLi: await page.evaluate(() => { const l = document.querySelector('.cms-content-list li:last-child'); return l ? getComputedStyle(l).display : null; }) });
    mark('globals', await globals(bridge, ['policy_reviewed', 'cms_policy_section_reviewed']));
    mark('frame:cms_t0'); await sleep(500);
    await sleep(5500); mark('frame:cms_t6'); await sleep(500);
    await tw;
    mark('globals-end', await globals(bridge, ['policy_reviewed', 'cms_policy_section_reviewed']));
    mark('end');
  };
}
export default build(false);
