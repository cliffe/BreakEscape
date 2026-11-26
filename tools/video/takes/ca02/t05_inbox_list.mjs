// t05_inbox_list: the Defend inbox, filmed in two runs so the same seconds are never shown twice (env INBOX_RUN=A or B; default A). Kiosk panel only (no avatar in frame).
//   run A (script `topic`, 3 to 10.1 s): Defend panel, "Open the inbox", Start, the six-row list "0 of 6 sorted" held; nothing opened, the cursor parked off the panel.
//   run B (script `inbox`): the same, list held 3.8 s, then the genuine Tendai Shava card opened and held ~8.5 s; the card's verdict buttons stay in the DOM (the edit crops them out of frame),
//         tells and tallies hidden by CSS, nothing hovered or pressed, cursor never over the Jordan Kerr row (the move to Tendai's row is a straight line from the right edge).
// Entry state (send done, defend seat; the kiosk opens on "Defend"):
//   BE_SPRITE=female_office_worker_v2 INBOX_RUN=B tools/video/takes/run-take.sh ca02_cv_lures t05_inbox_list "--set episode_e2_cv_lures_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_recruiter_contact_attempts=1" "--hide-hud --zoom-step 1"
// Never press a verdict (a press shows the reason panel); never Esc (closes the whole minigame).
// Marks: kiosk-open, inbox-open, start, list (= t0, list first on screen), card-open (B), end; frame:* at each.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, mouseClick, waitVisible, addCss, narrowPanel } from './_ca02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

/** CSS hides for the card: tell chips and per-flag notes, tallies, verdict hints. Keeps the From line, subject, attachment label and body. */
export const HIDE_CARD = '.tri-per-flag-note,.tri-perflag-note,.tri-verdict-hint,.aw-team-tally,.mail-tally,.tri-tally{visibility:hidden !important}';

export async function run(page, bridge, mark, { narrow = false, runId = 'A' } = {}) {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('kiosk is not on the Defend panel; buttons: ' + JSON.stringify(await buttons(page)));
  await page.mouse.move(1750, 950); await sleep(1000); mark('frame:kiosk-defend-panel');
  await pressButton(page, /Open the inbox/); mark('inbox-open'); await sleep(1200);
  await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, 'button.mail-row, .mail-row');
  await addCss(page, HIDE_CARD);
  if (narrow) await narrowPanel(page, '.mail-client', 760);
  await sleep(500);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 90)));
  if (rows.length !== 7) throw new Error('expected 7 inbox rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  mark('list', { rows }); mark('frame:list');
  if (runId === 'A') { await sleep(7500); mark('end'); return; }
  await sleep(3800 + 300);
  await mouseClick(page, '.mail-row', /Tendai/i, { steps: 16, dwell: 250 }); mark('card-open'); await sleep(500); mark('frame:card');
  const t = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  mark('card-text', { hasFrom: /tendai/i.test(t), attach: (t.match(/Tendai_Shava_CV\.pdf/) || [null])[0], head: t.slice(0, 40) });
  await sleep(8000); mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { runId: (process.env.INBOX_RUN || 'A').toUpperCase() });
