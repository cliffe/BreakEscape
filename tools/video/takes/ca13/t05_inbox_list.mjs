// t05_inbox_list: the six-row triage list ("0 of 6 sorted") held 3.5 s, then the GENUINE supplier card "Monthly cleaning invoice, October" (e13_supplier_genuine, 09:40; the key fake is
// "Cleaning invoice for payment", 10:12, and is never opened) held 8.0 s. Two runs of one script: RUN A (env CA13_LIST_ONLY=1) holds the list 3.5 s and stops; RUN B (default) is list then card.
// Entry state (defend seed; the kiosk opens on the Defend panel, buttons "Open the inbox" then Start):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t05_inbox_list "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\",\"flip\"]} --set phish_assist_reader_attempts=1" "--hide-hud --zoom-step 1"
//   (run A: prefix CA13_LIST_ONLY=1)
// HIDES (CSS): the team tally ".aw-team-tally" (the "0 of 6 sorted" .tri-progress stays), the verdict hints (visibility:hidden), the Red flags blocks and advisories, and the row sender text that is
// itself a tell, ".mail-row-address" (font-size 0: "07700 900812 (not in your contacts)" on the cloned voicemail, and the external board call's address). That leaves those two senders blank.
// The verdict buttons stay in the DOM and are out of frame in the edit (crop to From, subject, heading). NEVER pressed: any verdict, Show hidden text (.tri-hidden-btn).
// Marks: kiosk-open, defend-panel, intro, list (rows), list-held, row_open, card-held (card fields), end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, css, hideText, checkSprite, mouseClick, visible, NARROW_MAIL } from './_ca13.mjs';

export const INBOX_HIDE = `
.aw-team-tally { display: none !important; }
.tri-verdict-hint { visibility: hidden !important; }
.mail-row-address { font-size: 0 !important; }
.mail-redflag-list, .mail-redflag-sub, .mail-redflag-advice, .mail-redflag-clean, .mail-checklist-advisory { display: none !important; }`;
/** The narrowed mail client for the inbox cuts: NARROW_MAIL at 760 px instead of 560 (the list and card need the width). */
export const NARROW_760 = NARROW_MAIL.replace(/560px/g, '760px');

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function body(page, bridge, mark, narrow) {
  await css(page, INBOX_HIDE);
  await hideText(page, /Phish stopped for the team|Risks reported or checked for the team/i);
  if (narrow) await css(page, NARROW_760);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open'); await sleep(1200);
  const bs = await buttons(page); mark('defend-panel', { buttons: bs });
  if (!bs.some(b => /^Open the inbox$/.test(b))) throw new Error('no "Open the inbox" button; buttons: ' + JSON.stringify(bs));
  await pressButton(page, /^Open the inbox$/); await sleep(900); mark('intro');
  await pressButton(page, /^Start$/); await sleep(1200);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 90)));
  if (rows.length !== 6) throw new Error('expected 6 rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  const tells = await page.$$eval('.mail-row-address', els => els.map(e => ({ text: e.innerText.trim().slice(0, 40), fontSize: getComputedStyle(e).fontSize })));
  if (tells.some(t => t.fontSize !== '0px') || tells.length < 2) throw new Error('row tells not blanked (font-size 0): ' + JSON.stringify(tells));
  mark('row-tells-blanked', { tells });
  const prog = await page.evaluate(() => (document.querySelector('.tri-progress') || {}).innerText || null);
  mark('list', { rows, progress: prog }); mark('frame:list');
  if (await visible(page, '.aw-team-tally')) throw new Error('team tally visible');
  await sleep(3500); mark('list-held');
  if (process.env.CA13_LIST_ONLY) { mark('end'); return; }
  await mouseClick(page, '.mail-row', /Monthly cleaning invoice, October/i, { steps: 12, dwell: 450 });
  await waitVisible2(page);
  const card = await page.evaluate(() => ({ subject: (document.querySelector('.mail-subject') || {}).innerText, from: (document.querySelector('.mail-from-name') || {}).innerText, addr: (document.querySelector('.mail-from-address') || {}).innerText, time: (document.querySelector('.mail-time') || {}).innerText }));
  mark('row_open', card);
  if (!/09:40/.test(card.time || '') || /Cleaning invoice for payment/.test(card.subject || '')) throw new Error('opened the wrong card: ' + JSON.stringify(card));
  await sleep(1500); mark('frame:card');
  const hint = await page.evaluate(() => { const h = [...document.querySelectorAll('.tri-verdict-hint')].find(e => e.offsetParent); return h ? getComputedStyle(h).visibility : 'absent'; });
  const pressed = await page.evaluate(() => { const b = document.querySelector('.tri-hidden-btn'); return b ? b.getAttribute('aria-expanded') : 'absent'; });
  mark('card-held-check', { hintVisibility: hint, hiddenBtnExpanded: pressed });
  await sleep(6500); mark('card-held'); mark('end');
}
const waitVisible2 = async (page) => { for (let i = 0; i < 100; i++) { if (await visible(page, '.mail-subject')) return; await sleep(60); } throw new Error('card never opened'); };

export default (page, bridge, mark) => body(page, bridge, mark, false);
