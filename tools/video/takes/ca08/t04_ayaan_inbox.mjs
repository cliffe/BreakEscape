// t04_ayaan_inbox: the Defend panel, the six-row inbox list ("0 of 6 sorted"), then the row "Your password was changed" (real IT address, body asks nothing) open with its four
// verdict buttons. Nothing is pressed. Kiosk panel only (no avatar in frame). Modelled on ca01/t04_payments_inbox.mjs.
// Entry state (scout S7; the kiosk opens on the Defend panel):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca08_after_the_click t04_ayaan_inbox \
//     "--set episode_e8_after_the_click_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_takeover_victim_attempts=1" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare, kiosk, wait for "Open the inbox".
// Timeline from the take start (script shots: topic = take 1 to 7 s on the list; triage = take 5.5 to 16 s, list held then the card open and the verdicts hovered):
//   0.4 s Open the inbox, +0.9 s Start, list on screen about 1.7 s (held to 6 s), row hovered about 6.2 s and clicked so the card opens at about 7 s, then Trust (+1.5),
//   Report (+3.5), Delete (+5.5), Verify (+7.5) hovered slowly, end at card-open + 10 s. The take throws if the list does not have six rows or the card shows an ask.
// Marks: inbox-open, start, list-up (rows, subjects in row order), hover-card-row, click-card-row, card-open, hover-trust, hover-report, hover-delete, hover-verify, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, narrowPanel } from './_ca08.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await openKiosk(page, bridge, () => {});
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('kiosk is not on the Defend panel; buttons: ' + JSON.stringify(await buttons(page)));
  await page.mouse.move(40, 40);
  await sleep(500);
}

export async function run(page, bridge, mark, { narrow = false, px = 560 } = {}) {
  const T0 = Date.now(); const at = async (s) => { const w = T0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); };
  await at(0.4); await pressButton(page, /Open the inbox/); mark('inbox-open');
  if (narrow) { await narrowPanel(page, '.mail-client', px); await page.addStyleTag({ content: '.se-overlay-close,#minigame-close,.minigame-close-button{display:none !important;}' }); }
  await at(1.3); await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, '.mail-row');
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 90)));
  if (rows.length !== 6) throw new Error('expected 6 inbox rows, saw ' + rows.length + ': ' + JSON.stringify(rows));
  if (!rows.some(r => /Your password was changed/i.test(r))) throw new Error('no "Your password was changed" row: ' + JSON.stringify(rows));
  mark('list-up', { rows }); mark('frame:list');
  await at(6.2); mark('hover-card-row');
  await mouseClick(page, '.mail-row', /Your password was changed/i, { steps: 14, dwell: 350, click: false });
  await at(6.95); await page.mouse.down(); await page.mouse.up(); mark('click-card-row');
  await waitVisible(page, '.tri-verdict');
  const open = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  if (!/it-servicedesk@quayholt\.example/i.test(open)) throw new Error('card does not show the real IT address; text: ' + open.slice(0, 400));
  mark('card-open', { text: open.slice(0, 700) }); mark('frame:card-open');
  const C0 = Date.now(); const rel = async (s) => { const w = C0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); };
  for (const [name, re, s] of [['trust', /Trust/i, 1.5], ['report', /Report/i, 3.5], ['delete', /Delete/i, 5.5], ['verify', /Verify/i, 7.5]]) {
    await rel(s);
    const pt = await page.evaluate((src) => { const r = new RegExp(src, 'i'); const b = [...document.querySelectorAll('.tri-verdict')].find(x => x.offsetParent && r.test(x.innerText)); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; }, re.source);
    if (!pt) throw new Error('no verdict button ' + name);
    await page.mouse.move(pt.x, pt.y, { steps: 14 }); mark('hover-' + name);   // move only: nothing is pressed
  }
  mark('frame:verify-hover');
  await rel(10); mark('end');
}

export default (page, bridge, mark) => run(page, bridge, mark);
