// t02_attack_run: the whole attack in one take: kiosk Start; open-source research (Adaeze, Harlow / Derek Mason, INV-2217 noted by clicking each block);
// the Supplier Email Builder (pretext picked with the drop-down closed on screen, three From/invoice slots one by one, Red flags counter 2 to 1); Send;
// the green "It landed" panel; close the mail client onto "Now it lands on you"; hold; Continue (strip ticks to Defend).
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca01 t02_attack_run "" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare (Skip tutorial, close the Brief). Everything else is on camera.
// HOW BUILD AND SEND ARE DRIVEN (all real UI):
//   Compose = click button.mail-compose-btn (To defaults to Adaeze, who must have been noted first or the client says "Nobody to write to yet").
//   Pretext = page.selectOption on select.mail-compose-template[data-part=pretext] -> pretext_bank_change (the urgent wording). selectOption sets the value
//     without opening the native list, so the three options are never on screen. Any other still-unchosen part select (From, ask) is set to its first real option.
//   Slots = real mouse click on each button.mail-blank (data-slot sender_name, sender_address, invoice), the .mail-picker-option list opens, click the option
//     matching Derek Mason / derek.mason@harlowpackaging / INV-2217; the composer re-renders after each pick, so the buttons are re-found every time.
//   Red flags = .mail-redflag-count text is read after each step; 'redflags-1' is logged when it first reads 1 (flags: 'redflags:<n>' marks too).
//   Send = click button.mail-compose-send (enabled once the gate passes); the first Send is final. 'landed' = a visible "It landed" element, 'reply-in' = a visible
//     "Re: Invoice INV-2217" (arrives about 6 s later; soft, logged as reply-missing if it does not show in 12 s).
//   Close = bridge.minigame.close() on the mail client opens the kiosk flip screen ('Now it lands on you') at once; Continue ticks the strip.
// Marks: start, browser-open, note-adaeze, note-harlow, note-invoice, browser-closed, mail-open, compose, pretext-set, slot1, slot2, slot3, redflags-1, send,
//   landed, reply-in, mail-closed, flip-up, continue, strip-defend, end (+ redflags:<n>, slot-pick details).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick } from './_ca01.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const flagCount = (page) => page.evaluate(() => { const e = [...document.querySelectorAll('.mail-redflag-count')].find(x => x.offsetParent); return e ? e.innerText.trim() : null; });

export default async (page, bridge, mark) => {
  let lastFlags = null; let sawOne = false;
  const watchFlags = async () => { const c = await flagCount(page); if (c !== null && c !== lastFlags) { lastFlags = c; mark('redflags:' + c); if (c === '1' && !sawOne) { sawOne = true; mark('redflags-1'); } } };

  // kiosk Start (up to 3 interacts: the first can be swallowed)
  await openKiosk(page, bridge, mark);
  await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); mark('browser-open'); await sleep(1500);
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); mark(label); await sleep(1300);
  };
  await note('blk_finance_mgr', 'note-adaeze');
  await mouseClick(page, 'a.ob-link', /Our suppliers/i, { steps: 12, dwell: 400 });
  await waitVisible(page, '.ob-block[data-id="blk_harlow"]'); await sleep(1000);
  await note('blk_harlow', 'note-harlow');
  await mouseClick(page, 'a.ob-link', /Finance update/i, { steps: 12, dwell: 400 });
  await waitVisible(page, '.ob-block[data-id="blk_invoice"]'); await sleep(900);
  await note('blk_invoice', 'note-invoice');
  await sleep(700);
  await bridge.minigame.close(); await waitButton(page, /Open the mail client/, 10000); mark('browser-closed'); await sleep(1100);

  // mail client
  await pressButton(page, /Open the mail client/);
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open'); await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template'); mark('compose'); await sleep(1800);
  await watchFlags();

  // pretext (closed drop-down)
  await page.mouse.move(40, 40);
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'pretext_bank_change');
  await sleep(500); mark('pretext-set'); await watchFlags(); await sleep(1100);
  // any other unchosen part select (placeholder showing): first real option
  await page.evaluate(() => { for (const s of document.querySelectorAll('select.mail-compose-template')) if (!s.value) { const o = [...s.options].find(x => !x.disabled && x.value); if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } } });
  await sleep(700);

  // three slots, one by one
  const slots = [['sender_name', /Derek Mason/i, 'slot1'], ['sender_address', /derek\.mason@harlowpackaging/i, 'slot2'], ['invoice', /INV-2217/i, 'slot3']];
  for (const [slot, re, label] of slots) {
    await mouseClick(page, `button.mail-blank[data-slot="${slot}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, '.mail-picker-option'); await sleep(700);
    const opts = await page.$$eval('.mail-picker-option', els => els.filter(e => e.offsetParent).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()));
    if (!opts.some(o => re.test(o))) throw new Error('slot ' + slot + ' has no option ' + re + '; options: ' + JSON.stringify(opts));
    await mouseClick(page, '.mail-picker-option', re, { steps: 8, dwell: 300 });
    await page.waitForFunction((s) => { const b = document.querySelector(`button.mail-blank[data-slot="${s}"]`); return b && b.dataset.chosen; }, slot, { timeout: 5000 });
    await sleep(350); mark(label, { options: opts.length }); await watchFlags(); await sleep(1100); await watchFlags();
  }
  if (!sawOne) mark('redflags-final', { count: await flagCount(page) });
  await sleep(900);

  // send (first Send is final)
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  mark('send');
  await waitVisible(page, 'body *', /It landed/i, 15000).catch(() => { throw new Error('"It landed" never showed'); });
  // the match above can be a container: require a small element so the mark is the panel itself
  mark('landed');
  const landedAt = Date.now();
  let reply = false;
  while (Date.now() - landedAt < 12000 && !reply) { reply = await visible(page, 'body *', /Re: Invoice INV-2217/i); if (!reply) await sleep(150); }
  if (reply) mark('reply-in'); else mark('reply-missing');
  const wait = 7000 - (Date.now() - landedAt); if (wait > 0) await sleep(wait);   // hold about 7 s on It landed

  // close the mail client: the kiosk flip screen opens at once
  await bridge.minigame.close(); mark('mail-closed');
  await waitVisible(page, 'body *', /Now it lands on you/i, 10000); mark('flip-up'); await sleep(3000);
  await pressButton(page, /^Continue$/); mark('continue');
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('Defend panel never showed after Continue; buttons: ' + JSON.stringify(await buttons(page)));
  mark('strip-defend'); await sleep(1200); mark('end');
};
