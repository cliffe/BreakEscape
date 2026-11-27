// t05_inbox_list: the six-row "A leaver's week" inbox list ("0 of 6 sorted" header kept; Reuben's row is the 2nd of 6, not the last: its preview is blanked here; Hana is the 6th), then the Hana Novak (mobile) row opened as a
// card (caller ID and line 1 only: the edit crops below line 1; no DOM edit of the card). Verbs and the team tally are hidden, the selected-row ring neutralised. Nothing is pressed
// inside the card and Reuben's email is never opened.
// Entry state (kiosk opens on the Raise a concern launch; setup() completes the form off camera, then the kiosk is on the inbox launch panel):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t05_inbox_list \
//     "--set episode_e16_insider_risk_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
// setup(): Open the form, Start, picks the four fact chips (what, when, where, who), Check my report, Done. Body: Open the inbox, Start, hold the list, click the Hana row (found by text), hold.
// Marks: kiosk-buttons, list (row texts), row_boxes, frame:list (mid-hold), row_hana, card-box, card-text (first 200 chars), frame:card (mid-hold), end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, narrow, hideText } from './_ca16.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await openKiosk(page, bridge, () => {});
  await pressButton(page, /Open the form/); await sleep(900);
  await pressButton(page, /^Start$/); await sleep(1000);
  await page.evaluate(() => { for (const t of ['unknown contact offered', 'Tuesday evening', 'messaging app', 'came to me']) { const b = [...document.querySelectorAll('.cf-chip-fact')].find(e => e.innerText.includes(t)); if (b) b.click(); } });
  await sleep(500); await pressButton(page, /Check my report/); await sleep(1200);
  await pressButton(page, /^Done$/); await sleep(1500);
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('inbox launch never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(400);
}

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  // team tally, verbs, selected ring and focus outlines hidden (as ca11 t06); the key row's tell-text is not a concern here (the list previews are the plain subjects)
  await page.addStyleTag({ content: '.aw-team-tally{visibility:hidden !important} span.tri-verdict-hint{visibility:hidden !important} .tri-actions{visibility:hidden !important} .mail-row.selected{border-color:rgba(0,0,0,0) !important} .mail-row, .mail-row:focus, .mail-row:focus-visible, .mail-client *:focus, .mail-client *:focus-visible{outline:none !important;box-shadow:none !important}' });
  // Reuben's row is the SECOND row (not the last): its preview ("Can I use your login for ten minutes?") is blanked with font-size 0 (row height kept), sender and time stay
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => { for (const r of document.querySelectorAll('.mail-row')) if (/Reuben Ofori/.test(r.innerText)) for (const e of r.querySelectorAll('.mail-row-subject')) { e.style.setProperty('font-size', '0', 'important'); e.style.setProperty('min-height', '18px', 'important'); e.style.setProperty('display', 'block', 'important'); } }, 50)); });
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => { for (const b of document.querySelectorAll('.mail-client button')) if (/^(Trust|Report|Delete|Verify|Reply|Pass)\b/.test((b.innerText || '').trim())) b.style.setProperty('visibility', 'hidden', 'important'); }, 100)); });
  mark('kiosk-buttons', { b: await buttons(page) });
  await pressButton(page, /Open the inbox/); await sleep(900);
  await pressButton(page, /^Start$/); await sleep(1200);
  if (narrowed) await narrow(page, '.mail-client', 560);
  await page.mouse.move(1500, 1000);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).length);
  if (rows !== 6) throw new Error('expected 6 inbox rows, saw ' + rows);
  mark('list', { rows: await page.$$eval('.mail-row', els => els.map(e => (e.innerText || '').replace(/\s+/g, ' ').slice(0, 80))) });
  mark('row_boxes', await page.$$eval('.mail-row', els => els.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })));
  mark('client-box', await page.evaluate(() => { const c = document.querySelector('.mail-client'); const r = c && c.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; }));
  await sleep(1800); mark('frame:list'); await sleep(2200);
  const ok = await page.evaluate(() => { const r = [...document.querySelectorAll('.mail-row')].find(e => e.offsetParent && /Hana Novak/i.test(e.innerText)); if (!r) return false; r.click(); return true; });
  if (!ok) throw new Error('Hana Novak row not found');
  mark('row_hana'); await sleep(800);
  await page.mouse.move(1500, 1000);
  mark('card-box', await page.evaluate(() => { const c = document.querySelector('.mail-client'); const r = c && c.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; }));
  mark('card-text', await page.evaluate(() => (document.querySelector('.mail-client') || {}).innerText.replace(/\s+/g, ' ').slice(0, 700)));
  mark('card-lines', await page.evaluate(() => [...document.querySelectorAll('.mail-client *')].filter(e => e.offsetParent && e.children.length === 0 && (e.innerText || '').trim()).map(e => String(e.className).slice(0, 30) + ' | ' + e.innerText.trim().slice(0, 60) + ' | ' + Object.values(e.getBoundingClientRect().toJSON()).slice(0, 4).map(Math.round).join(','))));
  await sleep(2200); mark('frame:card'); await sleep(2800);
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
