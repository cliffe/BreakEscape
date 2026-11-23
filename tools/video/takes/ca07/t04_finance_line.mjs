// t04_finance_line: the finance line. Two runs of one script: RUN A (shot "topic", env CA07_LIST_ONLY=1) holds the five-row list (three voicemails and two emails, "0 of 5 sorted")
// for 8 s and opens nothing; RUN B (shot "triage", default) holds the list about 4 s then opens the GENUINE Ravinder train voicemail ("Ravinder (mobile), in your contacts", 13:05)
// as a card and holds it about 5.5 s. The card's transcript is hidden by CSS (it ends "Nothing for you to do", which would answer the VO); the cloned voicemail card
// ("07700 900771") and the "Need this paid today" email body are NEVER opened. Nothing is pressed (no Trust, Report, Delete, Verify; Esc ends the minigame, so the card is never closed).
// Entry state: defend seed (the kiosk opens on the Defend panel):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca07_voice_ceo t04_finance_line "--set episode_e7_voice_ceo_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_ceo_voice_target_attempts=1" "--hide-hud --zoom-step 1"
//   (run A: prefix CA07_LIST_ONLY=1)
// Labels (read in the dry run, see takes_ca07.md): the launch button and the panel text are asserted, not assumed. Rows are .mail-row.
// Marks: kiosk-open, defend-panel (buttons), intro, list (rows), row_open (run B), card-held, list-held (run A), end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, hideText, css, checkSprite, mouseClick, visible, NARROW_MAIL } from './_ca07.mjs';

// HIDES: the card's transcript (class measured in the dry run: HIDE_TRANSCRIPT), the green tally badge if present.
export const HIDE_TRANSCRIPT = `.tri-transcript, .tri-vm-transcript, .tri-voicemail-transcript, [class*="transcript"] { visibility: hidden !important; }`;

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function body(page, bridge, mark, narrow) {
  await css(page, '.aw-team-tally { display: none !important; }' + HIDE_TRANSCRIPT);
  await hideText(page, /Risks reported or checked for the team|Phish stopped for the team/i);
  if (narrow) await css(page, NARROW_MAIL);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  await sleep(1200);
  const bs = await buttons(page); mark('defend-panel', { buttons: bs }); mark('frame:defend-panel');
  const launch = bs.find(b => /^Open the /i.test(b));
  if (!launch) throw new Error('no "Open the ..." launch button; buttons: ' + JSON.stringify(bs));
  await sleep(1200);
  await pressButton(page, new RegExp('^' + launch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')); await sleep(900); mark('intro', { launch });
  await pressButton(page, /^Start$/); await sleep(1200);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 90)));
  if (rows.length !== 5) throw new Error('expected 5 rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  mark('list', { rows }); mark('frame:list');
  if (process.env.CA07_LIST_ONLY) { await sleep(8000); mark('list-held'); mark('end'); return; }
  await sleep(3500);
  await mouseClick(page, '.mail-row', /Ravinder Sandhu.*13:05.*Voicemail/i, { steps: 12, dwell: 450 });
  const card = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  mark('row_open', { cloned: /900771/.test(card) && /Hi, it's Ravinder\. I'm on a borrowed phone/.test(card) });
  await sleep(1500); mark('frame:card');
  if (await visible(page, 'body *', /Nothing for you to do/i)) throw new Error('the genuine card transcript ("Nothing for you to do") is visible: hide it');
  await sleep(4000); mark('card-held'); mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
