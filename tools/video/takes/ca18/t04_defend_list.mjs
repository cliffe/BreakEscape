// t04_defend_list: the alerts shot. Kiosk opens on Defend ("Open the inbox"), "Start": the six-row list held, then the genuine 08:54 Fenlow Managed IT alert ("Some accounts were briefly
// locked this morning", e18_lockout_genuine) opened and held, framed on the subject, From and "Hello,". Nothing is pressed; no verdict, no feedback panel.
// Entry state (kiosk on Defend):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca18 t04_defend_list --set 'episode_e18_credential_attacks_at_scale_state={"done":["brief","osint","guess","flip"]}' --set guess_e18_landed=true "" "--hide-hud --zoom-step 1"
// HIDES (DEFEND_HIDE_CSS): team badge ("Fakes stopped for the team"), "N of 6 sorted", the brief panel, flag chips, span.tri-verdict-hint (visibility), and the card's .mail-body is clipped to
//   its first line "Hello," (the advisory shares a text block with sentence 1). The take asserts by Range rect that the advisory ("We will never ask you for your password", "You don't need to do
//   anything") sits below the clipped body, that the hint words are visibility:hidden, and that the cursor is not over the 09:06 row.
// Marks: kiosk-open, launch-panel, inbox-open, start, list-up (rows), rect:list, card-open, rect:subject, rect:hello, rect:body-clip, rect:advisory, rect:frame (the crop: subject top to Hello bottom,
//   panel x range), card-end, end; frame:list-up, frame:card.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, mouseClick, addCss, textShowing, chain, DEFEND_HIDE_CSS, NARROW_INBOX_CSS } from './_ca18.mjs';

const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; };

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await addCss(page, DEFEND_HIDE_CSS);
  if (narrow) await addCss(page, NARROW_INBOX_CSS(760));
  await sleep(400);
};
export const makeRun = (narrow) => async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  mark('launch-panel', { buttons: await buttons(page) });
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('inbox launch panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1000);
  await pressButton(page, /Open the inbox/); mark('inbox-open'); await sleep(1000);
  await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, '.mail-row');
  await page.mouse.move(40, 40);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 120)));
  if (rows.length !== 6) throw new Error('expected 6 rows, saw ' + rows.length);
  if (await textShowing(page, /Fakes stopped|of 6 sorted/)) throw new Error('team badge or tally showing');
  mark('list-up', { n: rows.length, rows, mailClient: await page.$eval('.mail-client', R) });
  mark('chain', { chain: await chain(page, '.mail-row') });
  mark('frame:list-up'); await sleep(4000);
  // the genuine 08:54 card; the pointer rests on its own row, never over the 09:06 row
  await mouseClick(page, '.mail-row', /Some accounts were briefly locked/i, { steps: 16, dwell: 450, click: true });
  await waitVisible(page, '.mail-subject'); await sleep(700);
  mark('card-open');
  const m = await page.evaluate(() => {
    const R = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) });
    const subj = document.querySelector('.mail-subject'), body = document.querySelector('.mail-body'), hdr = document.querySelector('.mail-headers');
    const find = (re) => { const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const m = re.exec(n.textContent); if (m) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); return R(r.getBoundingClientRect()); } } return null; };
    const hint = [...document.querySelectorAll('span.tri-verdict-hint')].map(e => getComputedStyle(e).visibility);
    const hovered = [...document.querySelectorAll('.mail-row')].filter(e => e.matches(':hover')).map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 40));
    const panel = document.querySelector('.mail-client').getBoundingClientRect();
    return { subj: R(subj.getBoundingClientRect()), hdr: R(hdr.getBoundingClientRect()), body: R(body.getBoundingClientRect()), hello: find(/Hello,/), adv1: find(/We will never ask/), adv2: find(/You don't need/), hint, hovered, panel: R(panel), bodyText: body.innerText.replace(/\s+/g, ' ').slice(0, 60), rowSel: [...document.querySelectorAll('.mail-row.selected')].length };
  });
  mark('rect:subject', m.subj); mark('rect:hello', m.hello); mark('rect:body-clip', m.body); mark('rect:advisory', { adv1: m.adv1, adv2: m.adv2 });
  mark('rect:frame', { x: m.panel.x, y: m.subj.y, w: m.panel.w, h: m.hello ? m.hello.b - m.subj.y : null });
  mark('card-state', { hint: m.hint, hovered: m.hovered, bodyText: m.bodyText });
  if (!m.hello) throw new Error('Hello, not found');
  for (const k of ['adv1', 'adv2']) if (!m[k] || m[k].y < m.body.b - 1) throw new Error('advisory ' + k + ' not below the clipped body: ' + JSON.stringify({ a: m[k], body: m.body }));
  if (m.hello.b > m.body.b + 1) throw new Error('Hello, itself clipped');
  if (!m.hint.length || m.hint.some(v => v !== 'hidden')) throw new Error('verdict hint words not hidden: ' + JSON.stringify(m.hint));
  if (m.hovered.some(t => /09:06|locked - act now/i.test(t))) throw new Error('cursor over the 09:06 row');
  if (await textShowing(page, /Fakes stopped|of 6 sorted/)) throw new Error('team badge or tally showing');
  mark('frame:card'); await sleep(5000); mark('card-end');
  mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
