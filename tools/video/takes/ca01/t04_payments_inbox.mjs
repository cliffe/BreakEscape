// t04_payments_inbox: the Defend panel, the six-row inbox list, then the lure "Updated bank details, please action today" open with its four verdict
// buttons. Nothing is pressed. Kiosk panel only (no avatar in frame).
// Entry state (same as t03; the kiosk opens on "Defend: Now you are on the receiving end"):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca01 t04_payments_inbox "--set episode_e1_invoice_fraud_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_supplier_contact_attempts=1" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare, kiosk, wait for the "Open the inbox" button.
// Timeline from the take start (the edit needs card-open at 4 to 6 s of the trimmed take, then at least 12 s more on the card, Verify hovered late):
//   0.4 s Open the inbox, +0.9 s Start, list on screen ~1.7 s (held 3 s), row hovered ~4.2 s and clicked so the card opens at ~5.0 s,
//   then Trust (+2.0), Report (+4.5), Delete (+7.0), Verify (+9.5) hovered slowly, end at card-open + 13.5 s. The take throws if card-open misses 4 to 6 s.
// Marks: inbox-open, start, list-up, hover-lure-row, click-lure, card-open (the card with its verdict buttons visible), hover-trust, hover-report, hover-delete, hover-verify, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick } from './_ca01.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await openKiosk(page, bridge, () => {});
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('kiosk is not on the Defend panel; buttons: ' + JSON.stringify(await buttons(page)));
  await page.mouse.move(40, 40);   // park the pointer off the panel
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const T0 = Date.now(); const at = async (s) => { const w = T0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); };
  await at(0.4); await pressButton(page, /Open the inbox/); mark('inbox-open');
  await at(1.3); await pressButton(page, /^Start$/); mark('start');
  await waitVisible(page, '.mail-row'); const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).length);
  if (rows !== 6) throw new Error('expected 6 inbox rows, saw ' + rows);
  mark('list-up', { rows });
  await at(4.2); mark('hover-lure-row');
  await mouseClick(page, '.mail-row', /Updated bank details/i, { steps: 14, dwell: 350, click: false });
  await at(4.95); await page.mouse.down(); await page.mouse.up(); mark('click-lure');
  await waitVisible(page, '.tri-verdict');
  const open = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  if (!/brightwel1foods\.example/i.test(open)) throw new Error('lure card not showing its From address');
  mark('card-open'); const C0 = Date.now(); const rel = async (s) => { const w = C0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); };
  for (const [name, re, s] of [['trust', /Trust/i, 2.0], ['report', /Report/i, 4.5], ['delete', /Delete/i, 7.0], ['verify', /Verify/i, 9.5]]) {
    await rel(s);
    const pt = await page.evaluate((src) => { const r = new RegExp(src, 'i'); const b = [...document.querySelectorAll('.tri-verdict')].find(x => x.offsetParent && r.test(x.innerText)); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; }, re.source);
    if (!pt) throw new Error('no verdict button ' + name);
    await page.mouse.move(pt.x, pt.y, { steps: 14 }); mark('hover-' + name);   // move only: nothing is pressed
  }
  await rel(13.5); mark('end');
};
