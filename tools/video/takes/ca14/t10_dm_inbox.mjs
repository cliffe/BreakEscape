// t10_dm_inbox: the Defend inbox of direct messages and requests (six rows). The kiosk opens on the phone launch panel ("Open the phone"), then "Start".
// Nothing is answered. The list is held, then the pointer hovers down the rows; an optional last beat opens ONE row that is safe to show (the colleague's floor-plan DM:
// no tell, no answer). Row previews, the verdict labels and the team tally are hidden; the drill and privacy records are seeded so the drill and settings are skipped.
// Entry state (kiosk on the inbox step):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t10_dm_inbox \
//     --set episode_e14_social_media_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"],\"drill\":{\"done\":true,\"scored\":false,\"total\":7,\"placed\":7},\"privacy\":{\"done\":true,\"settings\":5,\"tightened\":5,\"facts\":5,\"closed\":5}} --set phish_df_cover_attempts=1 "--hide-hud --zoom-step 1"
// Marks: kiosk-open, launch-panel (buttons), phone-open, start, list-up (rows, row texts), frame-chain, rect:list, hover-row:<n>, rows_hover_end, safe-card-open, safe-card-end, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, mouseClick, addCss, textShowing, chain } from './_ca14.mjs';

// DM previews: a row (.mail-row) shows sender, time, a kind tag (.mail-row-tag, "Text") and the preview (the rest of .mail-row-subject, the start of the message body). Two
// previews open with the bracketed account notes ("[New account, created last week ..."): tells. The preview text is blanked (font-size 0 on .mail-row-subject, the tag kept).
// Also hidden:
// the team tally (a score-like line), the per-row verdict badge (none until a call is made, hidden anyway), the live-region notice.
export const HIDE_CSS = `.triage-client .mail-row-subject { font-size: 0 !important; } .triage-client .mail-row-subject .mail-row-tag { font-size: 14px !important; }
.triage-client .aw-team-tally, .triage-client .mail-row-badge, .triage-client .tri-live, .triage-client .mail-row-mark .mail-sr-only { display: none !important; }`;
export const NARROW_INBOX_CSS = (px = 560) => `
.mail-client.triage-client { max-width: ${px}px !important; width: ${px}px !important; overflow-x: hidden !important; }
.epr-kiosk-bezel { max-width: ${px}px !important; }
body:has(.mail-client) .epr-kiosk-bezel { visibility: hidden !important; }
.triage-client .tri-verdicts, .triage-client .tri-actions-open .tri-verdicts { flex-direction: column !important; flex-wrap: wrap !important; }
.triage-client .tri-verdict { width: 100% !important; flex: 0 0 auto !important; }`;

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await addCss(page, HIDE_CSS);
  if (narrow) await addCss(page, NARROW_INBOX_CSS(560));
  await sleep(400);
};
export const makeRun = (narrow) => async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  const b = await buttons(page); mark('launch-panel', { buttons: b });
  if (!(await waitButton(page, /Open the phone/, 10000))) throw new Error('phone launch panel never showed; buttons: ' + JSON.stringify(b));
  await sleep(1000);
  await pressButton(page, /Open the phone/); mark('phone-open');
  await sleep(1000);
  await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, '.mail-row');
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 120)));
  await page.mouse.move(40, 40);
  mark('list-up', { n: rows.length, rows });
  if (rows.length !== 6) throw new Error('expected 6 rows, saw ' + rows.length);
  if (await textShowing(page, /Risks reported or checked/)) throw new Error('team tally showing');
  mark('frame-chain', { chain: await chain(page, '.mail-row') });
  mark('rect:list', await page.$eval('.mail-client', e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
  mark('tabs', { text: await page.$$eval('.triage-client [role="tab"], .triage-client .mail-folder, .triage-client .mail-tab', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim())) });
  mark('frame:list-up'); await sleep(3500);
  // hover down the rows, no card open
  const n = rows.length;
  for (let i = 0; i < n; i++) {
    const p = await page.evaluate((k) => { const r = [...document.querySelectorAll('.mail-row')].filter(e => e.offsetParent)[k]; const q = r.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; }, i);
    await page.mouse.move(p.x, p.y, { steps: 16 }); mark('hover-row:' + (i + 1)); if (i === 2) mark('frame:hover-row');
    await sleep(650);
  }
  mark('rows_hover_end');
  // optional safe card: the colleague floor-plan DM (genuine, no tell)
  await mouseClick(page, '.mail-row', /Thandiwe/i, { steps: 16, dwell: 400, click: true });
  await waitVisible(page, '.tri-verdict').catch(() => {});
  await sleep(600);
  mark('safe-card-open', { text: (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).slice(0, 0) });
  mark('frame:safe-card'); await sleep(2200); mark('safe-card-end');
  mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
