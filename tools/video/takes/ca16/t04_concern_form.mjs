// t04_concern_form: (a) the flip shot, the Defend launch panel right after the montage (strip ticked to 4 Defend, heading "Raise a concern", the "Open the form" button; the paragraph under
// the heading, which names Samira, is hidden), then (b) Open the form, Start, and the Build step with NOTHING picked: What / When / Where / Who groups of fact chips, "Your report: Nothing
// picked yet.", Check my report. The conclusion group (.cf-conclusions: Ross / Samira / Craig theories) is display:none and the intro guidance (.cf-guidance) hidden, so nothing is spoiled.
// The flip shot is the launch panel itself (seeded, not reached by pressing Continue from the montage); t03 never goes past the montage, so no extra click is needed there.
// Entry state (kiosk opens on the Defend launch panel; confirmed, buttons "Open the form"):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t04_concern_form \
//     "--set episode_e16_insider_risk_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
// Marks: kiosk-open, launch-boxes, frame:launch (mid-hold), launch-end (Open the form pressed), intro, form-open, build-boxes, frame:build (mid-hold), end. Nothing is ever picked or checked.
// Take timeline: launch panel 0 to ~3.2 s (the shot uses 0 to 2.6), Build step visible from about 5 s (the shot uses 4 to 9.5 s of the script's plan: use build-start..+5.5).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, narrow, tabs } from './_ca16.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const box = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }, sel);

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await page.addStyleTag({ content: '.epr-kiosk-bezel p.epr-text{visibility:hidden !important} .cf-guidance{visibility:hidden !important} .cf-conclusions{display:none !important} .cf-chip:focus,.cf-chip:focus-visible{outline:none !important}' });
  if (narrowed) await narrow(page, '.epr-kiosk-bezel', 560);
  await openKiosk(page, bridge, mark); await sleep(900);
  await page.mouse.move(1500, 1000);
  const bt = await buttons(page);
  if (!bt.some(b => /Open the form/.test(b))) throw new Error('Open the form not shown; buttons: ' + JSON.stringify(bt));
  mark('kiosk-open', { b: bt, tabs: await tabs(page) });
  mark('launch-boxes', { bezel: await box(page, '.epr-kiosk-bezel'), strip: await box(page, '[class*=strip]'), heading: await box(page, '.epr-kiosk-bezel h2'), para: await box(page, '.epr-kiosk-bezel p.epr-text'), btn: await box(page, '.epr-launch') });
  await sleep(1600); mark('frame:launch'); await sleep(1600);
  mark('launch-end'); await pressButton(page, /Open the form/); await sleep(1000);
  if (narrowed) await narrow(page, '.cf-root', 560);
  mark('intro', { b: await buttons(page), guidanceVisible: await page.evaluate(() => { const e = document.querySelector('.cf-guidance'); return e ? getComputedStyle(e).visibility : 'absent'; }) });
  if (!(await waitButton(page, /^Start$/, 8000))) throw new Error('form Start not shown');
  await sleep(500); await pressButton(page, /^Start$/); await sleep(1100);
  await page.mouse.move(1500, 1000);
  const chips = await page.$$eval('.cf-chip-fact', els => els.filter(e => e.offsetParent).length);
  mark('form-open', { factChips: chips, conclusionVisible: await page.evaluate(() => !![...document.querySelectorAll('.cf-chip-conclusion')].find(e => e.offsetParent)), pressedChips: await page.$$eval('.cf-chip[aria-pressed=true], .cf-chip.selected, .cf-chip.is-picked', e => e.length), report: await page.evaluate(() => (document.querySelector('.cf-report') || {}).innerText || null) });
  mark('build-boxes', { root: await box(page, '.cf-root'), heading: await box(page, '.cf-heading'), report: await box(page, '.cf-report'), check: await box(page, '.cf-check'), container: await box(page, '.cf-minigame-container .minigame-header, .cf-minigame-container h2, .cf-minigame-container [class*=title]') });
  await sleep(2700); mark('frame:build'); await sleep(2800);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
