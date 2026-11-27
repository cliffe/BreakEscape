// t05_pages_list: the seven-row "pages behind links" list and, on a SECOND run of this same script, the genuine tick page 'From a bookmark: Fernside Catering order portal' opened as a card
// (shot "pages": list held 2.5 s, then the card held 6.5 s). Never presses a verdict; the three verdict buttons and their hints are hidden by CSS and out of frame.
// Entry state (kiosk opens on the Defend panel):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t05_pages_list "--set episode_e10_downloads_and_fake_checks_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\"]} --set phish_order_colleague_attempts=1" "--hide-hud --zoom-step 1"
// Two rows are titled 'From a bookmark: Fernside Catering order portal': 09:12 is the FAKE (keystroke steps) and 09:20 is the genuine tick page; the take picks 09:20 by time and throws if the card shows keystroke steps.
// Labels (dry run): launch button and Start as logged in the marks (defend-panel buttons). The row is found by its text, never by position.
// HIDES (CSS): .tri-verdicts, .tri-verdict-hint, the green team tally, any .tri-tally. The list header count stays (constant, nothing picked).
// Narrow variant (t05b): .mail-client 760 px (the verdict-card inboxes' width), panes stacked.
// Marks: kiosk-open, defend-panel (data: buttons), intro, list (data: rows), row_open, card-held, end; frame:* for the dry run. env CA10_LIST_ONLY=1 holds the list only (no card).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, hideText, css, checkSprite, mouseClick } from './_ca10.mjs';

export const NARROW = `
.mail-client { width: 760px !important; max-width: 760px !important; height: 1010px !important; max-height: 1010px !important; }
.tri-sort, .mail-reader, .mail-list-pane, .mail-read-pane, .tri-browser { min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; }
.mail-reader { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: auto minmax(0, 1fr) !important; }
.mail-list-pane { overflow-y: visible !important; max-height: none !important; }
.mail-read-pane { overflow-y: visible !important; }
.tri-browser-bar { flex-wrap: wrap !important; }
.tri-browser-bar .tri-address { order: 3 !important; flex: 1 1 100% !important; white-space: nowrap !important; overflow-wrap: normal !important; word-break: keep-all !important; font-size: 17px !important; min-width: 0 !important; }
`;
export const HIDE = `.aw-team-tally, .tri-tally { display: none !important; }
.tri-verdicts, .tri-verdict-hint { display: none !important; }`;

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function body(page, bridge, mark, narrow) {
  await css(page, HIDE);
  await hideText(page, /Phish stopped for the team/i);
  if (narrow) await css(page, NARROW);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Open the pages/, 10000))) throw new Error('"Open the pages" never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('defend-panel', { buttons: await buttons(page) }); mark('frame:defend-panel'); await sleep(1500);
  await pressButton(page, /Open the pages/); await sleep(900); mark('intro');
  await pressButton(page, /^Start$/); await sleep(1200);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 70)));
  if (rows.length !== 7) throw new Error('expected 7 rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  mark('list', { rows }); mark('frame:list');
  if (process.env.CA10_LIST_ONLY) { await sleep(8000); mark('list-held'); mark('end'); return; }
  await sleep(2500);
  const ok = await page.evaluate(() => { const r = [...document.querySelectorAll('.mail-row')].find(e => e.offsetParent && /09:20/.test(e.textContent) && /Fernside/.test(e.textContent)); if (!r) return false; r.scrollIntoView({ block: 'nearest' }); return true; });
  if (!ok) throw new Error('"Fernside Catering order portal" row not found');
  await mouseClick(page, '.mail-row', /09:20.*From a bookmark: Fernside/, { steps: 12, dwell: 450 });
  mark('row_open'); await sleep(1500); mark('frame:card');
  const card = await page.evaluate(() => { const b = document.querySelector('.tri-browser'); return b ? { addr: (b.querySelector('.tri-address') || {}).textContent, text: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) } : null; });
  mark('card', card);
  if (!card || /Press Windows|Ctrl \+ V|paste/i.test(card.text) || !/not a robot/i.test(await page.evaluate(() => document.body.textContent))) throw new Error('opened the wrong page (must be the 09:20 genuine tick page): ' + JSON.stringify(card));
  await sleep(5000); mark('card-held'); mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
