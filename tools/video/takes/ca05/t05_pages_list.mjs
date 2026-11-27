// t05_pages_list: the five-row "pages behind links" list (shot "topic", take 3-10.3 s: list held) and, on a SECOND run of this same script, the
// card 'From an email: Your mailbox is 98% full' opened (shot "pages": list held about 3 s, then the card held about 7 s). Never presses a verdict.
// Entry state (kiosk opens on the Defend panel):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca05_signin_pages t05_pages_list "--set episode_e5_signin_pages_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\"]} --set phish_sso_staff_attempts=1" "--hide-hud --zoom-step 1"
// Labels (dry run 23 Nov): launch button "Open the pages" (NOT "Open the inbox"), then "Start"; rows are .mail-row, address first line, "Web page From an email: ..." second.
// The row is found by its text ("Your mailbox is 98% full" matches the row's full subject, although the list truncates it to "From an email: 'Your ..."), never by position.
// HIDES (CSS): the card body paragraph (.tri-page-text, includes "please use this page rather than ringing the service desk"); the green "Phish stopped for the team: N" badge. The list header "0 of 5 sorted" stays (constant, nothing picked).
// Marks: kiosk-open, defend-panel, intro, list (held 3.5 s), row_open, card-held, end; frame:* for the dry run.
// Two runs: default (shot "pages") holds the list 3.5 s, opens the card and holds it 5.5 s more; with env CA05_LIST_ONLY=1 (shot "topic") the list is held 8 s and
// the card is never opened. Cut points come from the marks (list, row_open, list-held), not from fixed seconds.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, hideText, css, checkSprite, mouseClick } from './_ca05.mjs';

// Narrow 560 px frame (found in the live DOM 23 Nov): the 960 px frame is .mail-client (not .minigame-game-container, which is the 1920 px stage); inside it
// .tri-sort > .mail-reader (grid: .mail-list-pane | .mail-read-pane). Stack the two panes, list on top, card below; the address button (.tri-address) goes on its own
// line under Padlock/Certificate and stays on one line (address words never break mid-word; "quayholt-support.example/mailbox" fits 520 px at its font size).
export const NARROW = `
.mail-client { width: 560px !important; max-width: 560px !important; height: 1010px !important; max-height: 1010px !important; }
.tri-sort, .mail-reader, .mail-list-pane, .mail-read-pane, .tri-browser, .tri-actions { min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; }
.mail-reader { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: auto minmax(0, 1fr) !important; }
.mail-list-pane { overflow-y: visible !important; max-height: none !important; }
.mail-read-pane { overflow-y: visible !important; }
.tri-verdicts { gap: 6px !important; }
.tri-verdict-hint { display: none !important; }   /* the hint lines would push the verdict row past the 560 px frame; the words Trust/Report/Delete stay */
.tri-verdict { min-width: 0 !important; flex: 1 1 0 !important; }
.tri-browser-bar { flex-wrap: wrap !important; }
.tri-browser-bar .tri-address { order: 3 !important; flex: 1 1 100% !important; white-space: nowrap !important; overflow-wrap: normal !important; word-break: keep-all !important; font-size: 17px !important; min-width: 0 !important; }
`;
// HIDES the card body paragraph ("... please use this page rather than ringing the service desk"): the edit then needs no crop. The form and verdict buttons stay.
export const HIDE_CARD_TEXT = `.tri-page-text { display: none !important; }`;

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function body(page, bridge, mark, narrow) {
  await css(page, '.aw-team-tally { display: none !important; }');   // the green "Phish stopped for the team: N" badge, whole box
  await hideText(page, /Phish stopped for the team/i);
  await css(page, HIDE_CARD_TEXT);
  if (narrow) await css(page, NARROW);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Open the pages/, 10000))) throw new Error('"Open the pages" never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('defend-panel'); mark('frame:defend-panel'); await sleep(1500);
  await pressButton(page, /Open the pages/); await sleep(900); mark('intro');
  await pressButton(page, /^Start$/); await sleep(1200);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).length);
  if (rows !== 5) throw new Error('expected 5 rows, saw ' + rows);
  mark('list'); mark('frame:list');
  if (process.env.CA05_LIST_ONLY) { await sleep(8000); mark('list-held'); mark('end'); return; }   // topic run: the list alone, held 8 s, no card
  await sleep(3500);
  const ok = await page.evaluate(() => { const r = [...document.querySelectorAll('.mail-row')].find(e => e.offsetParent && /Your mailbox is 98% full/.test(e.textContent)); if (!r) return false; r.scrollIntoView({ block: 'nearest' }); return true; });
  if (!ok) throw new Error('"Your mailbox is 98% full" row not found');
  await mouseClick(page, '.mail-row', /Your mailbox is 98% full/, { steps: 12, dwell: 450 });
  mark('row_open'); await sleep(1500); mark('frame:card'); await sleep(5500);
  mark('card-held'); mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
