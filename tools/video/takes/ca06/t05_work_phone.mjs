// t05_work_phone: the six-row work-phone list (shots "topic" run A and "phone_list" run B) and, on run B, the GENUINE canteen notice opened (shot "phone_card").
// RUN A (env CA06_LIST_ONLY=1): the list is held 8 s, nothing opened. RUN B (default): the list is held 6.8 s with the cursor sweeping down the six rows (hover only, no click),
// then the canteen notice row (e6_canteen_qr, "How was lunch? Rate this week's menu") is opened and held 5.6 s+. Nothing is pressed: no verdict, no "Where does this code go?",
// no sheet. The parking-permit notice (e6_parking_permit) is NEVER opened. The kiosk is Esc-less: the take just ends.
// Entry state (defend seed; the kiosk opens on the Defend panel):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca06_texts_and_qr t05_work_phone "--set episode_e6_texts_and_qr_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_mobile_staff_attempts=1" "--hide-hud --zoom-step 1"
//   (run A: prefix CA06_LIST_ONLY=1)
// HIDES (CSS, always on, HIDE_PHONE): tally badge, advisory, verdict row (.tri-actions, which holds .tri-verdicts), the "Seen:" label (.tri-kind-label), the "Where does this code go?"
// button (.tri-qr-where), the tells sheet. The card is then heading (h2.tri-kind-title), body, code, caption only. The take measures heading-to-caption and asserts the
// hidden things have zero height, so the edit needs no crop for them.
// Marks: kiosk-open, defend-panel (buttons), intro, list (rows), sweep-start, sweep-end, row_open, card-geometry, card-held, list-held (run A), end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, buttons, hideText, css, checkSprite, mouseClick, visible, narrowMail } from './_ca06.mjs';

export const HIDE_PHONE = `
.aw-team-tally, .mail-checklist-advisory, .tri-actions, .tri-verdicts, .tri-qr-where, .tri-sheet, .tri-tells, .tri-progress-tells { display: none !important; }
.tri-kind-qr .tri-kind-label { display: none !important; }`;

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export async function body(page, bridge, mark, narrow) {
  await css(page, HIDE_PHONE);
  await hideText(page, /Phish stopped for the team|Risks reported or checked for the team/i);
  if (narrow) await css(page, narrowMail(typeof narrow === 'number' ? narrow : 560));
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  await sleep(1200);
  const bs = await buttons(page); mark('defend-panel', { buttons: bs }); mark('frame:defend-panel');
  const launch = bs.find(b => /^Open the /i.test(b));
  if (!launch) throw new Error('no "Open the ..." launch button; buttons: ' + JSON.stringify(bs));
  await sleep(1200);
  await pressButton(page, new RegExp('^' + launch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')); await sleep(900); mark('intro', { launch });
  const bs2 = await buttons(page); mark('intro-buttons', { buttons: bs2 }); mark('frame:intro');
  await pressButton(page, /^Start$/); await sleep(1200);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 100)));
  if (rows.length !== 6) throw new Error('expected 6 rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  const head = await page.evaluate(() => { const e = document.querySelector('.tri-progress'); return e ? e.innerText.trim() : null; });
  mark('list', { rows, progress: head }); mark('frame:list');
  if (process.env.CA06_LIST_ONLY) { await sleep(8000); mark('list-held'); mark('end'); return; }
  // sweep: hover only (page.mouse.move), 6 rows over about 5.4 s, no click
  await sleep(1300);   // lead-in hold: list-to-row_open must cover the 6.8 s phone_list shot (list + 6.8 s before the card opens)
  mark('sweep-start');
  const boxes = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  await page.mouse.move(boxes[0].x, boxes[0].y - 40, { steps: 8 });
  for (const b of boxes) { await page.mouse.move(b.x, b.y, { steps: 10 }); await sleep(560); }
  mark('sweep-end'); mark('frame:sweep'); await sleep(500);
  await mouseClick(page, '.mail-row', /How was lunch/i, { steps: 12, dwell: 450 });
  mark('row_open', { parkingOpen: await visible(page, 'body *', /Vehicles not set up may be clamped/i) });
  await sleep(1300);
  const geo = await page.evaluate(() => {
    const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), vis: cs.display !== 'none' && r.height > 0 }; };
    return { vh: innerHeight, vw: innerWidth, card: q('.tri-kind-qr'), heading: q('.tri-kind-qr h2.tri-kind-title'), body: q('.tri-notice-text'), code: q('.tri-qr'), caption: q('.tri-qr-caption'), seen: q('.tri-kind-qr .tri-kind-label'),
      where: q('.tri-qr-where'), actions: q('.tri-actions'), verdict: q('.tri-verdict') };
  });
  mark('card-geometry', geo); mark('frame:card');
  const bad = [];
  if (!geo.heading || !geo.heading.vis) bad.push('no heading'); if (!geo.caption || !geo.caption.vis) bad.push('no caption');
  for (const k of ['seen', 'where', 'actions', 'verdict']) if (geo[k] && geo[k].vis) bad.push(k + ' still visible');
  for (const re of [/Where does this code go/i, /Seen:/, /Trust/, /Report/, /Delete/, /Vehicles not set up/i]) if (await visible(page, 'body *', re)) bad.push('visible text ' + re);
  if (bad.length) throw new Error('card frame not clean: ' + bad.join('; ') + ' ' + JSON.stringify(geo));
  await sleep(5400); mark('card-held'); mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
