// t02_attack_run: the whole attack in one take (ca01/ca08 way, ca04 ids): kiosk Start; open-source research (Our people: Catherine and Tomás noted, so the mail client
// has a recipient and a sender name; Events & talks: the Lisbon Design Forum block, then the speaker-bio block with her travel address, noted); the email builder
// (pretext picked with the drop-down closed, From name, From address and the trip slot one by one, Red flags counter number only); Send; the green "It landed" panel;
// Tomás's reply (arrives about 6 s after Send); close the mail client onto "Now you're the PA"; hold. The script's shots cut from this take:
//   research (8 to 12.6 s), build (30 to 36.6 s), lands (Send click then the panel, closes before the reply), hook (a window around the reply: panel about 1 s, then the reply), flip (52 to 54 s).
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca04_exec_whaling t02_attack_run "" "--hide-hud --zoom-step 1"
// Narrowed variant for the 9:16 and 1:1 crops: t02n_attack_run.mjs (same body, panels capped at 560 px).
// setup() (off camera): prepare (Skip tutorial, close the Brief). Everything else is on camera.
// HIDDEN BY CSS: .mail-redflag-list, .mail-redflag-advice, .mail-redflag-clean (Red flags text, names the webmail address; the counter number stays); on the flip screen
//   everything but the heading (.aw-flip > :not(h2.aw-heading)).
// HOW BUILD AND SEND ARE DRIVEN (all real UI): Pretext = selectOption on select.mail-compose-template[data-part=pretext] (ms_pretext_pay_now, throws if missing), so the drop-down
//   is never open on screen. Slots = real mouse clicks on button.mail-blank (sender_name, sender_address, then the trip slot that appears once the pretext is chosen), options
//   chosen from the open .mail-picker-option list. First Send is final.
// Marks: start, browser-open, note-catherine, note-tomas, note-calendar, note-bio, browser-closed, mail-open, compose, pretext-set, slot1..slot3, redflags:<n> (every change),
//   redflags-final, send, landed (+ panel text), reply-in (a visible mail row for the reply), reply-text (the reply's on-screen text), reply-readable (text on screen), mail-closed,
//   flip-up, end. 'sSinceSend' data on landed/reply-in.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, addCss, HIDE_TELLS, FLIP_HIDE_CSS, NARROW_CSS, watchTts, checkSprite } from './_ca04.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const flagCount = (page) => page.evaluate(() => { const e = [...document.querySelectorAll('.mail-redflag-count')].find(x => x.offsetParent); return e ? e.innerText.trim() : null; });

export async function run(page, bridge, mark, { narrow = false } = {}) {
  let lastFlags = null;
  const watchFlags = async () => { const c = await flagCount(page); if (c !== null && c !== lastFlags) { lastFlags = c; mark('redflags:' + c); } };
  await checkSprite(page, mark);
  const tts = await watchTts(page, mark);
  await openKiosk(page, bridge, mark);
  await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); mark('browser-open'); await sleep(1500); mark('frame:browser-open');
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); mark(label); mark('frame:' + label); await sleep(1300);
  };
  await note('blk_partner', 'note-catherine');
  await note('blk_pa', 'note-tomas');
  await mouseClick(page, 'a.ob-link', /Events/i, { steps: 12, dwell: 400 });
  await waitVisible(page, '.ob-block[data-id="blk_calendar"]'); await sleep(1000);
  await note('blk_calendar', 'note-calendar');
  await note('blk_bio', 'note-bio');
  await sleep(700);
  await bridge.minigame.close(); await waitButton(page, /Open the mail client/, 10000); mark('browser-closed'); await sleep(1100);

  // mail client
  await pressButton(page, /Open the mail client/);
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open');
  await addCss(page, HIDE_TELLS);
  if (narrow) { await addCss(page, NARROW_CSS(560)); await addCss(page, '.se-overlay-close,#minigame-close,.minigame-close-button,.minigame-controls{display:none !important;}'); }
  await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template');
  if (narrow) await page.evaluate(() => { for (const b of document.querySelectorAll('button')) if (/^\s*(Close|×)\s*$/i.test(b.innerText) && !b.closest('.epr-root')) b.style.visibility = 'hidden'; });
  if (narrow) await addCss(page, '.mail-compose-btn{display:none !important;}');   // the "ose" stub at 560 px is the Compose button's clipped tail (not Close): hidden once the composer is open
  mark('compose'); await sleep(1800); mark('frame:compose-empty');
  await watchFlags();

  // pretext (closed drop-down)
  await page.mouse.move(40, 40);
  const pre = await page.$$eval('select.mail-compose-template[data-part="pretext"] option', os => os.map(o => o.value));
  if (!pre.includes('ms_pretext_pay_now')) throw new Error('pretext option ms_pretext_pay_now missing; options: ' + JSON.stringify(pre));
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'ms_pretext_pay_now');
  await sleep(500); mark('pretext-set'); await watchFlags(); await sleep(1100); mark('frame:pretext-set');
  await page.evaluate(() => { for (const s of document.querySelectorAll('select.mail-compose-template')) if (!s.value) { const o = [...s.options].find(x => !x.disabled && x.value); if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } } });
  await sleep(700);

  // the slots, one by one (the trip slot appears once the pretext is chosen)
  const slots = [['sender_name', /Catherine Merrin/i, 'slot1'], ['sender_address', /catherine\.merrin@mailgrove/i, 'slot2'], ['trip', /Lisbon Design Forum/i, 'slot3']];
  for (const [slot, re, label] of slots) {
    const sel = `button.mail-blank[data-slot="${slot}"]`;
    if (!(await page.$(sel))) { mark('slot-missing:' + slot, { slots: await page.$$eval('button.mail-blank', b => b.map(x => x.dataset.slot)) }); continue; }
    await mouseClick(page, sel, null, { steps: 12, dwell: 450 });
    await waitVisible(page, '.mail-picker-option'); await sleep(700);
    const opts = await page.$$eval('.mail-picker-option', els => els.filter(e => e.offsetParent).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()));
    if (!opts.some(o => re.test(o))) throw new Error('slot ' + slot + ' has no option ' + re + '; options: ' + JSON.stringify(opts));
    await mouseClick(page, '.mail-picker-option', re, { steps: 8, dwell: 300 });
    await page.waitForFunction((s) => { const b = document.querySelector(`button.mail-blank[data-slot="${s}"]`); return b && b.dataset.chosen; }, slot, { timeout: 5000 });
    await sleep(350); mark(label, { options: opts }); await watchFlags(); await sleep(1100); await watchFlags();
  }
  mark('redflags-final', { count: await flagCount(page) }); mark('frame:builder-filled');
  await sleep(900);

  // send (first Send is final)
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  const sendAt = Date.now(); mark('send');
  await waitVisible(page, 'body *', /It landed/i, 15000).catch(() => { throw new Error('"It landed" never showed'); });
  mark('landed', { sSinceSend: +((Date.now() - sendAt) / 1000).toFixed(2), text: await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].filter(x => x.offsetParent && /It landed/i.test(x.innerText || '')).pop(); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 400) : null; }) });
  mark('frame:landed-panel');
  const landedAt = Date.now();
  // Tomás's reply: a row whose text holds the reply (Re: ...) or the reply text itself
  let reply = false;
  while (Date.now() - landedAt < 14000 && !reply) { reply = await visible(page, '.mail-row, .mail-msg, .mail-pane', /Will do, Catherine|Re: /i); if (!reply) await sleep(100); }
  if (!reply) mark('reply-missing');
  else {
    mark('reply-in', { sSinceSend: +((Date.now() - sendAt) / 1000).toFixed(2) }); mark('frame:reply-in');
    const rowText = await page.evaluate(() => { const r = [...document.querySelectorAll('.mail-row')].find(x => x.offsetParent && /Re: |Will do/i.test(x.innerText)); return r ? r.innerText.replace(/\s+/g, ' ') : null; });
    mark('reply-row', { rowText });
    // the green panel covers the mail client: it must be closed with its Done button (a real click) before the reply can be seen; note its text before and after
    const panelTxt = () => page.evaluate(() => { const e = [...document.querySelectorAll('body *')].filter(x => x.offsetParent && /It landed/i.test(x.innerText || '')).pop(); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 400) : null; });
    mark('panel-at-reply', { text: await panelTxt() });
    // HOOK BEAT (fast on purpose, the cold open is 5.0 s: panel about 0.8 s, then the reply text): Done and the reply row are real clicks with almost no dwell.
    mark('hook-start'); await sleep(800);
    await mouseClick(page, 'button', /^Done$/, { steps: 4, dwell: 0 }); mark('done-pressed');
    await mouseClick(page, '.mail-row', /Re: |Will do/i, { steps: 4, dwell: 0 });
    await waitVisible(page, 'body *', /Will do, Catherine/i, 6000).catch(() => mark('reply-text-missing'));
    mark('reply-opened');
    const txt = await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].filter(x => x.offsetParent && /Will do, Catherine/i.test(x.innerText || '') && x.children.length < 4).pop(); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 300) : null; });
    mark('reply-readable', { text: txt }); mark('frame:reply-readable');
    await sleep(4300); mark('hook-end');
  }
  const wait = 9000 - (Date.now() - landedAt); if (wait > 0) await sleep(wait);

  // close the mail client: the kiosk flip screen opens at once (heading and strip only)
  await bridge.minigame.close(); mark('mail-closed');
  await addCss(page, FLIP_HIDE_CSS);
  await waitVisible(page, 'body *', /Now you.re the PA/i, 10000); mark('flip-up'); mark('frame:flip-up'); await sleep(2800);
  await tts.stop();
  mark('end');
}

export default (page, bridge, mark) => run(page, bridge, mark);
