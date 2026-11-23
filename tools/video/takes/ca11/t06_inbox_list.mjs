// t06_inbox_list: the six-row desk inbox list ("0 of 6 sorted", the passed-on badge hidden), then the genuine 11:15 card "Mrs Hale's son has a new mobile, and good news"
// (Sam Whitlow) opened. The verb buttons are never pressed or named: they sit below the body and the edit frames From, subject and body only.
// Entry state (kiosk opens on the Defend intro):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11_misdirected_data t06_inbox_list \
//     "--set episode_e11_misdirected_data_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
// Body: Open the inbox, Start, hold the list 4.4 s (cursor parked bottom-right, off the 08:52 and 10:48 rows), click the 11:15 row (found by sender + subject, not position), hold 5.2 s.
// 08:52 preview blanked (font-size 0, decision 3, 23 Nov). Marks: tab:<heading>, list, row_boxes, row_1115, card-box, end.
import { sleep, prepare, openKiosk, pressButton, buttons, hideText, hideLong, narrowPanel } from './_ca11.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function run(page, bridge, mark, { narrow = false } = {}) {
  await openKiosk(page, bridge, mark);
  mark('kiosk-buttons', { b: await buttons(page) });
  // the team tally (.aw-team-tally: a green outlined box even when its text is empty) and the key row's selected ring (the 08:52 row opens selected) are hidden
  await page.addStyleTag({ content: '.aw-team-tally{visibility:hidden !important} .triage-client .mail-row.selected, .mail-row.selected{border-color:rgba(0,0,0,0) !important} .tri-actions{visibility:hidden !important} .mail-row, .mail-row:focus, .mail-row:focus-visible{outline:none !important;box-shadow:none !important}' });
  // the four verb buttons carry the answers ("This one is routine. I would handle it myself."): hidden in every format, never pressed
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => { for (const b of document.querySelectorAll('.mail-client button')) if (/^(Trust|Report|Delete|Verify)\b/.test((b.innerText || '').trim())) b.style.setProperty('visibility', 'hidden', 'important'); }, 100)); });
  // the 08:52 key row's preview ("I think this wasn't meant for me?") is a tell: blanked with font-size 0 (row height kept), sender and time stay
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => { for (const r of document.querySelectorAll('.mail-row')) if (/08:52/.test(r.innerText)) for (const e of r.querySelectorAll('.mail-row-subject')) { e.style.setProperty('font-size', '0', 'important'); e.style.setProperty('min-height', '18px', 'important'); e.style.setProperty('display', 'block', 'important'); } }, 50)); });
  await pressButton(page, /Open the inbox/); await sleep(900);
  mark('kiosk-buttons2', { b: await buttons(page) });
  await pressButton(page, /^Start$/); await sleep(1200);
  if (narrow) await narrowPanel(page, '.mail-client', 560);
  await page.mouse.move(1500, 1000);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).length);
  if (rows !== 6) throw new Error('expected 6 inbox rows, saw ' + rows);
  mark('list', { rows: await page.$$eval('.mail-row', els => els.map(e => (e.innerText || '').replace(/\s+/g, ' ').slice(0, 70))) });
  mark('row_boxes', await page.$$eval('.mail-row', els => els.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })));
  mark('frame:list'); await sleep(4400);
  const ok = await page.evaluate(() => { const r = [...document.querySelectorAll('.mail-row')].find(e => e.offsetParent && /Sam Whitlow/i.test(e.innerText) && /new mobile/i.test(e.innerText)); if (!r) return false; r.click(); return true; });
  if (!ok) throw new Error('11:15 Sam Whitlow row not found');
  mark('row_1115'); await sleep(600);
  mark('card-box', await page.evaluate(() => { const c = document.querySelector('.mail-client'); const r = c && c.getBoundingClientRect(); return r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null; }));
  mark('frame:card'); await sleep(4600);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: false });
