// t06_payments_verify: the payments inbox, the lure "Updated bank details, please action today" opened, then the staff member CLICKS Verify
// (ring the supplier back on the number you already hold, the safe step for a bank-detail change per the lure's truth note), ticks the two
// tells that gave it away on the "What made you say that?" sheet, presses Confirm, and the review card with the game's own result shows.
// Kiosk panel only (no avatar in frame). Spoiler level: low (the lure's tells are the lesson; no codes or PINs on screen).
// Entry state (same as t04):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca01 t06_payments_verify "--set episode_e1_invoice_fraud_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_supplier_contact_attempts=1" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare, kiosk, wait for the "Open the inbox" button.
// Timeline from the take start: Open the inbox 0.4 s, Start 1.3 s, list up ~1.7 s, lure row hovered 4.2 s, clicked 4.95 s (card open ~5.0 s),
//   Verify hovered at card-open + 2.0 s (brief hover), clicked at + 3.2 s, sheet ticks at +1.0 s and +1.8 s after the click, Confirm at +3.0 s,
//   then the result card is held 3.0 s. About 17 s in all.
// Marks: inbox-open, start, list-up, hover-lure-row, click-lure, card-open, hover-verify, click-verify, sheet-open, tick-1, tick-2, confirm, result, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, waitVisible, mouseClick } from './_ca01.mjs';

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
  await rel(2.0);
  const pt = await page.evaluate(() => { const b = [...document.querySelectorAll('.tri-verdict.verdict-verify')].find(x => x.offsetParent); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2, text: b.innerText.replace(/\s+/g, ' ') }; });
  if (!pt) throw new Error('no Verify button');
  await page.mouse.move(pt.x, pt.y, { steps: 14 }); mark('hover-verify', { label: pt.text });
  await rel(3.2); await page.mouse.down(); await page.mouse.up(); mark('click-verify');
  await waitVisible(page, '.tri-sheet'); mark('sheet-open');
  const S0 = Date.now(); const srel = async (s) => { const w = S0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); };
  let n = 0;
  for (const chip of ['lookalike_domain', 'changed_bank_details']) {
    await srel(1.0 + n * 0.8);
    const c = await page.evaluate((id) => { const i = document.querySelector('.tri-sheet input[data-chip="' + id + '"]'); if (!i) return null; const q = i.closest('label').getBoundingClientRect(); return { x: q.x + 24, y: q.y + q.height / 2 }; }, chip);
    if (!c) throw new Error('no chip ' + chip);
    await page.mouse.move(c.x, c.y, { steps: 10 }); await sleep(150); await page.mouse.click(c.x, c.y); n++; mark('tick-' + n, { chip });
  }
  await srel(3.0);
  const ok = await page.evaluate(() => [...document.querySelectorAll('.tri-sheet input[data-chip]')].filter(i => i.checked).length);
  if (ok !== 2) throw new Error('expected 2 ticked chips, saw ' + ok);
  await mouseClick(page, '.tri-confirm', null, { steps: 12, dwell: 300, click: false });
  await page.mouse.down(); await page.mouse.up(); mark('confirm');
  await waitVisible(page, '.tri-card-verdict');
  const res = await page.evaluate(() => { const c = document.querySelector('.tri-card-verdict'); return (c.closest('.tri-card') || c.parentElement).innerText.replace(/\s+/g, ' ').slice(0, 600); });
  mark('result', { text: res });
  await sleep(3000); mark('end');
};
