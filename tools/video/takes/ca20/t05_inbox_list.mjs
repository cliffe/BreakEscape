// t05_inbox_list: the Defend half's six-row list ("ON THE ROAD": Wi-Fi lists, web pages, notices) held, then the GENUINE page "From the cafe Wi-Fi: accept and connect" (e20_wifi_page_genuine)
// opened as a card (https, padlock, "I accept the terms", Connect). Nothing is pressed inside the card; the fake, the evil twin, the hotel list and the lost-device fake are never opened.
// HIDES (CSS): .aw-team-tally, .tri-progress, .tri-brief-text, .tri-flags, .tri-false-flags, .tri-live, span.tri-verdict-hint (visibility), .tri-actions (visibility); verb buttons also hidden by text.
// The pointer is parked at (40,40) and never moves over a row (the click is a DOM click on the row), so no row is hovered in the list or the card.
// Entry state (kiosk opens on the Defend launch "Open the pages"):
//   BE_SPRITE=<player key> tools/video/takes/run-take.sh ca20 t05_inbox_list --set 'episode_e20_remote_and_mobile_working_state={"done":["brief","mistake","flip"]}' --set kit_quiet=true "" "--hide-hud --zoom-step 1"
// Marks: kiosk-open, launch-panel, inbox-open, start, list-up (rows, mail-client box), row-boxes, hidden-proof, frame:list (mid-hold), row_click (the edit's card in = this), card-open, card-box,
//   card-text, card-lines, card-state, frame:card (mid-hold), card-end, end. Dry run measures: list hold >= 5.0 s, card hold 4.6 s.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, narrow } from './_ca20.mjs';

const HIDE_CSS = `
.triage-client .aw-team-tally, .aw-team-tally, .triage-client .tri-progress, .triage-client .tri-brief-text, .triage-client .tri-flags, .triage-client .tri-false-flags, .triage-client .tri-live { display: none !important; }
span.tri-verdict-hint, .tri-actions { visibility: hidden !important; }
.mail-row, .mail-row:focus, .mail-row:focus-visible, .mail-row.selected { outline: none !important; box-shadow: none !important; }
.mail-row:focus, .mail-row:focus-visible { background: transparent !important; }
.mail-row.selected { border-color: rgba(0,0,0,0) !important; }
`;
const WIFI = /Wi-Fi: accept and connect/i;

export async function setup(page, bridge) { await prepare(page, bridge); await page.addStyleTag({ content: HIDE_CSS }); await sleep(400); }

export async function run(page, bridge, mark, { narrowed = false } = {}) {
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => { for (const b of document.querySelectorAll('.mail-client button')) if (/^(Trust|Report|Delete|Verify|Reply|Pass|Safe|Fake|Unsafe|Real)\b/.test((b.innerText || '').trim())) b.style.setProperty('visibility', 'hidden', 'important'); }, 100)); });
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  mark('launch-panel', { b: await buttons(page) });
  if (!(await waitButton(page, /Open the pages/, 10000))) throw new Error('launch panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(700);
  await pressButton(page, /Open the pages/); mark('inbox-open'); await sleep(900);
  mark('start-panel', { b: await buttons(page) });
  if (await waitButton(page, /^Start$/, 1500)) { await pressButton(page, /^Start$/); mark('start'); }
  await waitVisible(page, '.mail-row');
  if (narrowed) await narrow(page, '.mail-client', 560);
  await page.mouse.move(40, 40); await sleep(300);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 120)));
  if (rows.length !== 6) throw new Error('expected 6 rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  if (rows.filter(r => WIFI.test(r)).length !== 1) throw new Error('Wi-Fi page row not unique: ' + JSON.stringify(rows));
  const box = (sel) => page.evaluate((s) => { const e = document.querySelector(s); const r = e && e.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; }, sel);
  mark('list-up', { n: rows.length, rows, client: await box('.mail-client'), tabs: await page.evaluate(() => [...document.querySelectorAll('[class*=strip] *, [class*=tab]')].filter(e => e.offsetParent && e.children.length === 0 && (e.innerText || '').trim()).map(e => e.innerText.trim()).slice(0, 14)) });
  mark('row-boxes', await page.$$eval('.mail-row', els => els.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })));
  const hid = await page.evaluate(() => { const vis = [...document.querySelectorAll('body *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => e.innerText || '').join(' | ');
    return { tally: /Fakes stopped|of 6 sorted|0 of 6/i.test(vis), verbs: [...document.querySelectorAll('.tri-actions')].map(e => getComputedStyle(e).visibility), hint: [...document.querySelectorAll('span.tri-verdict-hint')].map(e => getComputedStyle(e).visibility), hovered: [...document.querySelectorAll('.mail-row')].filter(e => e.matches(':hover')).length }; });
  mark('row-style', await page.$$eval('.mail-row', els => els.map(e => [e.className, getComputedStyle(e).backgroundColor, document.activeElement === e, e.getAttribute('aria-selected')])));
  mark('hidden-proof', hid);
  if (hid.tally) throw new Error('tally or count visible'); if (hid.hovered) throw new Error('a row is hovered');
  await sleep(2400); mark('frame:list'); await sleep(2700);
  // the genuine page row: DOM click (no pointer path), card on screen from the first frame after this mark
  const ok = await page.evaluate((src) => { const r = [...document.querySelectorAll('.mail-row')].find(e => e.offsetParent && new RegExp(src, 'i').test(e.innerText)); if (!r) return false; r.click(); return true; }, WIFI.source);
  if (!ok) throw new Error('Wi-Fi page row not found');
  mark('row_click'); await page.mouse.move(40, 40);
  await waitVisible(page, '.mail-subject'); await sleep(300); mark('card-open');
  mark('card-box', await box('.mail-client'));
  mark('card-text', await page.evaluate(() => (document.querySelector('.mail-client') || {}).innerText.replace(/\s+/g, ' ').slice(0, 900)));
  mark('card-lines', await page.evaluate(() => [...document.querySelectorAll('.mail-client *')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden' && e.children.length === 0 && (e.innerText || '').trim()).map(e => String(e.className).slice(0, 30) + ' | ' + e.innerText.trim().slice(0, 70) + ' | ' + Object.values(e.getBoundingClientRect().toJSON()).slice(0, 4).map(Math.round).join(','))));
  const st = await page.evaluate(() => ({ visBtn: [...document.querySelectorAll('.mail-client button')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => e.innerText.trim().slice(0, 30)), actions: [...document.querySelectorAll('.tri-actions')].map(e => getComputedStyle(e).visibility), hint: [...document.querySelectorAll('span.tri-verdict-hint')].map(e => getComputedStyle(e).visibility), hovered: [...document.querySelectorAll('.mail-row')].filter(e => e.matches(':hover')).length, subj: (document.querySelector('.mail-subject') || {}).innerText }));
  mark('card-state', st);
  if (!/https|accept/i.test(JSON.stringify(await page.evaluate(() => (document.querySelector('.mail-client') || {}).innerText)))) throw new Error('card text unexpected');
  await sleep(2000); mark('frame:card'); await sleep(2300); mark('card-end');
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: false });
