// t05_inbox: the inbox shots, one take (a second window for the opened card is cut from the same take). Setup (off camera, not recorded) proves the route from the sort: kiosk, "Open the cards",
// "Start sorting", nine picks (keyboard keys, Next by DOM click), the summary's Done, then the inbox launch is up. Body: "Open the inbox", Start, the six-row list held 5.5 s (pointer parked at
// 40,40, off every row), then the genuine "What we monitor and why" row (Tarrowby intranet, 08:30) clicked and held 5.5 s on From, subject and body; no verb pressed. INBOX_HIDE_CSS hides the tally,
// brief, flags, verdict hint words and selected-row ring. The take asserts no visible text names a verb button, no "N of 6 sorted" is wrong ("0 of 6 sorted" may show), no team badge.
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca17 t05_inbox "" "--hide-hud --zoom-step 1"
// Marks: kiosk-open (body), launch-panel, inbox-open, start, list-up (rows), rect:list, list-end, row-click (the row text), card-open, rect:*, card-state, card-end, end; frame:list-up, frame:card.
import { sleep, prepare, toIntro, pressButton, waitButton, buttons, waitVisible, mouseClick, addCss, textShowing, chain, checkSprite, INBOX_HIDE_CSS, NARROW_INBOX_CSS } from './_ca17.mjs';

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await toIntro(page, bridge, () => {});
  await pressButton(page, /Start sorting/); await sleep(700);
  let picks = 0, done = false;
  for (let i = 0; i < 40 && !done; i++) {
    const bs = await buttons(page);
    if (bs.some(b => /^Open the inbox/.test(b))) { done = true; break; }
    if (bs.some(b => /^Done$/.test(b))) { await pressButton(page, /^Done$/); await sleep(1000); continue; }
    const next = await page.evaluate(() => { const b = document.querySelector('.sd-next'); if (b && b.offsetParent) { b.click(); return true; } return false; });
    if (next) { await sleep(400); continue; }
    const placed = await page.evaluate(() => { const b = [...document.querySelectorAll('.sd-bin-btn')].find(e => e.offsetParent && !e.disabled); if (!b) return false; b.click(); return true; });
    if (placed) { picks++; await sleep(500); continue; }
    await sleep(400);
  }
  console.log('sort route: picks', picks, 'buttons now', JSON.stringify(await buttons(page)));
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('inbox launch never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await addCss(page, INBOX_HIDE_CSS);
  if (narrow) await addCss(page, NARROW_INBOX_CSS(760));
  await sleep(500);
};
const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; };
export const makeRun = (narrow) => async (page, bridge, mark) => {
  await checkSprite(page, mark, { strict: false });
  mark('launch-panel', { buttons: await buttons(page) });
  await sleep(600);
  await pressButton(page, /^Open the inbox/); mark('inbox-open'); await sleep(900);
  mark('after-open', { buttons: await buttons(page) });
  await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, '.mail-row');
  await page.mouse.move(40, 40);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 140)));
  mark('list-up', { n: rows.length, rows, panel: await page.$eval('.mail-client', R) });
  mark('chain', { chain: await chain(page, '.mail-row') });
  if (rows.length !== 6) throw new Error('expected 6 rows, saw ' + rows.length);
  if (await textShowing(page, /Requests handled the right way|Fakes stopped|[1-9]\d* of 6 sorted/)) throw new Error('badge or non-zero tally showing');
  mark('frame:list-up'); await sleep(5500); mark('list-end');
  const target = /What we monitor and why/i;
  const hovered = await mouseClick(page, '.mail-row', target, { steps: 16, dwell: 450, click: true });
  mark('row-click', { at: hovered });
  await waitVisible(page, '.mail-subject'); await sleep(700);
  mark('card-open');
  const m = await page.evaluate(() => {
    const R = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) });
    const subj = document.querySelector('.mail-subject'), body = document.querySelector('.mail-body'), hdr = document.querySelector('.mail-headers');
    const verbs = [...document.querySelectorAll('.tri-verdicts button, .tri-verdicts .minigame-button')].filter(e => e.offsetParent).map(e => ({ t: e.innerText.trim(), r: R(e.getBoundingClientRect()) }));
    const hint = [...document.querySelectorAll('span.tri-verdict-hint')].map(e => getComputedStyle(e).visibility);
    const hovered = [...document.querySelectorAll('.mail-row')].filter(e => e.matches(':hover')).map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 40));
    return { subj: subj && R(subj.getBoundingClientRect()), hdr: hdr && R(hdr.getBoundingClientRect()), body: body && R(body.getBoundingClientRect()), bodyText: body && body.innerText.replace(/\s+/g, ' ').slice(0, 160), subjText: subj && subj.innerText, hdrText: hdr && hdr.innerText.replace(/\s+/g, ' ').slice(0, 100), verbs, hint, hovered, panel: R(document.querySelector('.mail-client').getBoundingClientRect()) };
  });
  mark('card-state', m);
  mark('rect:frame', { x: m.panel.x, y: m.subj ? m.subj.y : null, w: m.panel.w, h: m.body && m.subj ? m.body.b - m.subj.y : null, verbsTop: m.verbs.length ? Math.min(...m.verbs.map(v => v.r.y)) : null });
  if (!/monitor/i.test(m.subjText || '')) throw new Error('wrong card opened: ' + m.subjText);
  if (m.hint.some(v => v !== 'hidden')) throw new Error('verdict hint words not hidden');
  if (await textShowing(page, /Requests handled the right way|Fakes stopped/)) throw new Error('badge showing');
  mark('frame:card'); await sleep(5500); mark('card-end');
  mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
