// t06_inbox_list: the six-row inbox triage list, then the Benmoor Packaging "USB catalogue" message open with its four verbs.
// Entry state (kiosk opens on the Swap Shop panel):
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t06_inbox_list \
//     "--set episode_e15_shadow_it_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
// setup() (off camera): kiosk, Open the Swap Shop, Start, four picks (first bin each time), Done; the kiosk is left on its next panel.
// Body: Open the inbox, Start, hold the list 4 s, click the Benmoor row (found by its text, not its position), hold 5.1 s.
// Never presses a verb. CSS hides the green "Risky shortcuts stopped" badge.
// Marks: list, row_usb, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, hideText } from './_ca15.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  await openKiosk(page, bridge, () => {});
  await pressButton(page, /Open the Swap Shop/); await sleep(800);
  await pressButton(page, /^Start$/); await sleep(800);
  for (let i = 0; i < 20; i++) {
    const bs = await buttons(page);
    if (bs.some(b => /^Done$/.test(b))) { await pressButton(page, /^Done$/); break; }
    if (bs.some(b => /^See where/.test(b))) { await pressButton(page, /^See where/); await sleep(900); continue; }
    const clicked = await page.evaluate(() => { const b = [...document.querySelectorAll('.sd-bin-btn')].find(e => e.offsetParent && !e.disabled); if (!b) return false; b.click(); return true; });
    if (clicked) { await sleep(900); continue; }
    const nxt = bs.find(b => /^(Next|Continue)/i.test(b));
    if (nxt) { await pressButton(page, new RegExp('^' + nxt.replace(/[^\w ]/g, '.'))); await sleep(700); continue; }
    await sleep(500);
  }
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('inbox launch button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(500);
}

export default async (page, bridge, mark) => {
  await hideText(page, /Risky shortcuts stopped/i);
  await pressButton(page, /Open the inbox/); await sleep(900);
  await pressButton(page, /^Start$/); await sleep(1200);
  const rows = await page.$$eval('.mail-row', els => els.filter(e => e.offsetParent).length);
  if (rows !== 6) throw new Error('expected 6 inbox rows, saw ' + rows);
  mark('list'); await sleep(4000);
  const ok = await page.evaluate(() => { const r = [...document.querySelectorAll('.mail-row')].find(e => e.offsetParent && /Benmoor/i.test(e.innerText) && /USB/i.test(e.innerText)); if (!r) return false; r.click(); return true; });
  if (!ok) throw new Error('Benmoor USB row not found');
  mark('row_usb'); await sleep(5100);
  mark('end');
};
