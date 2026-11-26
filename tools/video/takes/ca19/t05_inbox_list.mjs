// t05_inbox_list: the six-row desk inbox list ("0 of 6 sorted") held 3.4 s with the cursor off the Leo 14:05 and Piledocs 13:20 rows and nothing pressed, then the GENUINE 13:24 card
// "Finish setting up Quayholt Files" (sender "Quayholt Apps") opened by sender/subject, held 6.4 s with the body, verdict buttons and hidden-text button hidden (visibility:hidden), so only
// From, subject and heading read. The 15:30 device-update card, the Leo card and the Piledocs card are never opened; no verdict is ever pressed.
// Entry state (defend seed; the kiosk opens on the Defend panel: "Open the inbox", then Start):
//   tools/video/takes/run-take.sh ca19_malware_and_updates t05_inbox_list "--set episode_e19_malware_and_updates_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
// HIDES (CSS): .aw-team-tally, .tri-verdict-hint (INBOX_HIDE from ca13), the Red flags blocks, then .mail-body, .tri-actions, .tri-hidden-btn on the opened card.
// Marks: kiosk-open, defend-panel, intro, list (rows, progress), list-held, row_open (card fields), card-body-proof, card-held, end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, buttons, css, hideText, visible, mouseClick, sprite } from './_ca19.mjs';
import { INBOX_HIDE, NARROW_760 } from '../ca13/t05_inbox_list.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const CARD_HIDE = '.mail-body, .tri-actions, .tri-hidden-btn { visibility: hidden !important; }';
export async function body(page, bridge, mark, narrow) {
  await css(page, INBOX_HIDE); await css(page, CARD_HIDE);
  await hideText(page, /Phish stopped for the team|Risks reported or checked for the team/i);
  if (narrow) await css(page, typeof narrow === 'string' ? narrow : NARROW_760);
  await sprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open'); await sleep(1200);
  const bs = await buttons(page); mark('defend-panel', { buttons: bs });
  if (!bs.some(b => /^Open the inbox$/.test(b))) throw new Error('no "Open the inbox" button; buttons: ' + JSON.stringify(bs));
  await pressButton(page, /^Open the inbox$/); await sleep(900); mark('intro');
  await pressButton(page, /^Start$/); await sleep(1200);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 120)));
  if (rows.length !== 6) throw new Error('expected 6 rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  const prog = await page.evaluate(() => (document.querySelector('.tri-progress') || {}).innerText || null);
  const boxes = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }));
  mark('list', { rows, boxes, progress: prog }); mark('frame:list');
  if (await visible(page, '.aw-team-tally')) throw new Error('team tally visible');
  await sleep(3400); mark('list-held');
  if (process.env.CA19_LIST_ONLY) { mark('end'); return; }
  await mouseClick(page, '.mail-row', /Finish setting up Quayholt Files/i, { steps: 12, dwell: 450 });
  for (let i = 0; i < 100 && !(await visible(page, '.mail-subject')); i++) await sleep(60);
  const card = await page.evaluate(() => ({ subject: (document.querySelector('.mail-subject') || {}).innerText, from: (document.querySelector('.mail-from-name') || {}).innerText, addr: (document.querySelector('.mail-from-address') || {}).innerText, time: (document.querySelector('.mail-time') || {}).innerText }));
  mark('row_open', card);
  if (!/13:24/.test(card.time || '') || !/Finish setting up Quayholt Files/.test(card.subject || '')) throw new Error('opened the wrong card: ' + JSON.stringify(card));
  await sleep(1200); mark('frame:card');
  const proof = await page.evaluate(() => { const vis = (sel) => [...document.querySelectorAll(sel)].map(e => getComputedStyle(e).visibility); return { body: vis('.mail-body'), actions: vis('.tri-actions'), hiddenBtn: vis('.tri-hidden-btn'), hint: vis('.tri-verdict-hint'), bodyTextVisible: [...document.querySelectorAll('body *')].some(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && /You started setting up|a moment ago/i.test(e.innerText || '') && ![...e.children].some(c => /You started setting up|a moment ago/i.test(c.innerText || ''))) }; });
  mark('card-body-proof', proof);
  if (proof.bodyTextVisible) throw new Error('card body visible');
  await sleep(5200); mark('card-held'); mark('end');
}
export default (page, bridge, mark) => body(page, bridge, mark, false);
