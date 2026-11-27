// t02_brief: the Brief panel on the Quayholt purple tab, with the five-step strip. The edit frames the tab, the heading and the strip only (the paragraph with the
// advice, "Your job is not to solve anything...", is out of frame); this take also hides that paragraph (the whole P.epr-text) with CSS (visibility:hidden), so it is out of every format. Start is never pressed.
// Entry state: fresh game, no flags (Skip tutorial and the first-run Mission Brief popup closed in setup()).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t02_brief "" "--hide-hud --zoom-step 1"
// Marks: kiosk-open, brief-boxes (tab, heading, strip, paragraph, Start button boxes), frame:brief, hold-end, end. Hold 5.5 s (the shot uses 1 to 5.1 s).
import { sleep, prepare, openKiosk, buttons, narrow, tabs, boxOf } from './_ca16.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  // The advice sentence sits mid-paragraph in the single P.epr-text (it begins "You're on an authorised exercise..."), so the whole paragraph is hidden by selector (layout kept).
  await page.addStyleTag({ content: '.epr-kiosk-bezel p.epr-text{visibility:hidden !important}' });
  await openKiosk(page, bridge, mark); await sleep(900);
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  await page.mouse.move(1500, 1000);
  mark('kiosk-open', { b: await buttons(page), tabs: await tabs(page) });
  const boxes = await page.evaluate(() => { const q = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }; return { bezel: q('.epr-kiosk-bezel'), strip: q('[class*=strip]'), h: q('.epr-kiosk-bezel h1, .epr-kiosk-bezel h2, .epr-kiosk-bezel [class*=heading], .epr-kiosk-bezel [class*=title]') }; });
  mark('brief-boxes', boxes);
  mark('para-box', await boxOf(page, /Your job is not to solve anything/i));
  const vis = await page.evaluate(() => { const e = document.querySelector('.epr-kiosk-bezel p.epr-text'); if (!e) return { vis: 'absent' }; const b = e.getBoundingClientRect(); return { vis: getComputedStyle(e).visibility, adviceInDom: /Your job is not to solve anything/i.test(e.textContent || ''), box: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }; });
  mark('para-visibility', vis);
  await sleep(600); mark('frame:brief'); await sleep(4900);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
