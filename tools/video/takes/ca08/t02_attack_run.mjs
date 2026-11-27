// t02_attack_run: the whole attack in one take, the ca01 way with ca08 ids: kiosk Start; open-source research (Our people: Ayaan noted so the mail client has a
// recipient; Signing in: the service desk address block noted; Company news: the single sign-on block noted); the look-alike email builder (pretext picked with the
// drop-down closed, From name and address and the sign-on slot one by one, Red flags counter number only); Send; the green "It landed" panel; close the mail client
// onto "Now it lands on you"; hold; Continue (strip ticks to Defend). The script's three shots cut from this: research (about 8 to 12.3 s), build (28 to 35.2 s), lands (42 to 45 s).
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca08_after_the_click t02_attack_run "" "--hide-hud --zoom-step 1"
// Narrowed variant for the 9:16 and 1:1 crops: t02b_builder_narrow.mjs runs this same body with the mail client capped at 560 px.
// setup() (off camera): prepare (Skip tutorial, close the Brief). Everything else is on camera.
// HIDDEN BY CSS (injected when the mail client opens): .mail-redflag-list, .mail-redflag-advice, .mail-redflag-clean (the Red flags tell lines); the counter .mail-redflag-count stays.
//   The composed body shows no finished lure while building (the page is slots, drop-downs and the counter); the edit crops anything else.
// HOW BUILD AND SEND ARE DRIVEN (all real UI): same as ca01 t02. Pretext = selectOption on select.mail-compose-template[data-part=pretext] (value e8_pretext_reauth, throws if missing);
//   the "ask" select keeps its default (e8_ask_calm). Slots = real mouse clicks on button.mail-blank (sender_name, sender_address, then the sign-on system slot that
//   appears after the pretext is chosen), options chosen from the open .mail-picker-option list.
// Marks: start, browser-open, note-ayaan, note-itdesk, note-news, browser-closed, mail-open, compose, pretext-set, slot1..slot3, redflags:<n> (every change), redflags-final,
//   send, landed (+ the panel text), reply-in or reply-missing, mail-closed, flip-up, continue, strip-defend, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, narrowPanel } from './_ca08.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const flagCount = (page) => page.evaluate(() => { const e = [...document.querySelectorAll('.mail-redflag-count')].find(x => x.offsetParent); return e ? e.innerText.trim() : null; });
export const HIDE_TELLS = '.mail-redflag-list,.mail-redflag-advice,.mail-redflag-clean{display:none !important;}';

export async function run(page, bridge, mark, { narrow = false } = {}) {
  let lastFlags = null;
  const watchFlags = async () => { const c = await flagCount(page); if (c !== null && c !== lastFlags) { lastFlags = c; mark('redflags:' + c); } };
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
  await note('blk_staff', 'note-ayaan');
  await mouseClick(page, 'a.ob-link', /Signing in/i, { steps: 12, dwell: 400 });
  await waitVisible(page, '.ob-block[data-id="blk_itdesk"]'); await sleep(1000);
  await note('blk_itdesk', 'note-itdesk');
  await mouseClick(page, 'a.ob-link', /Company news/i, { steps: 12, dwell: 400 });
  await waitVisible(page, '.ob-block[data-id="blk_news"]'); await sleep(900);
  await note('blk_news', 'note-news');
  await sleep(700);
  await bridge.minigame.close(); await waitButton(page, /Open the mail client/, 10000); mark('browser-closed'); await sleep(1100);

  // mail client
  await pressButton(page, /Open the mail client/);
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open');
  await page.addStyleTag({ content: HIDE_TELLS });
  if (narrow) { await narrowPanel(page, '.mail-client', 560); await page.addStyleTag({ content: '.se-overlay-close,#minigame-close,.minigame-close-button,.epr-kiosk-close,button[aria-label="Close"],.minigame-controls{display:none !important;}' }); }   // capping the panel pushes the Close/X to a clipped stub beside it
  await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template');
  if (narrow) await page.evaluate(() => { for (const b of document.querySelectorAll('button')) if (/^\s*(Close|×)\s*$/i.test(b.innerText) && !b.closest('.epr-root')) b.style.visibility = 'hidden'; });   // the toolbar Close pokes out beside the narrowed panel
  mark('compose'); await sleep(1800); mark('frame:compose-empty');
  await watchFlags();

  // pretext (closed drop-down)
  await page.mouse.move(40, 40);
  const pre = await page.$$eval('select.mail-compose-template[data-part="pretext"] option', os => os.map(o => o.value));
  if (!pre.includes('e8_pretext_reauth')) throw new Error('pretext option e8_pretext_reauth missing; options: ' + JSON.stringify(pre));
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'e8_pretext_reauth');
  await sleep(500); mark('pretext-set'); await watchFlags(); await sleep(1100); mark('frame:pretext-set');
  await page.evaluate(() => { for (const s of document.querySelectorAll('select.mail-compose-template')) if (!s.value) { const o = [...s.options].find(x => !x.disabled && x.value); if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } } });
  await sleep(700);

  // the slots, one by one (the sign-on system slot appears once the pretext is chosen)
  const slots = [['sender_name', /Quayholt IT Service Desk/i, 'slot1'], ['sender_address', /it-servicedesk@quayholt\.example/i, 'slot2'], ['portal', /single sign-on|SSO/i, 'slot3']];
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
  mark('send');
  await waitVisible(page, 'body *', /It landed/i, 15000).catch(() => { throw new Error('"It landed" never showed'); });
  mark('landed', { text: await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].filter(x => x.offsetParent && /It landed/i.test(x.innerText || '')).pop(); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 400) : null; }) });
  const landedAt = Date.now();
  let reply = false;
  while (Date.now() - landedAt < 12000 && !reply) { reply = await visible(page, 'body *', /Re: /i); if (!reply) await sleep(150); }
  mark(reply ? 'reply-in' : 'reply-missing'); mark('frame:landed-panel');
  const wait = 7000 - (Date.now() - landedAt); if (wait > 0) await sleep(wait);   // hold about 7 s on It landed

  // close the mail client: the kiosk flip screen opens at once
  await bridge.minigame.close(); mark('mail-closed');
  await waitVisible(page, 'body *', /Now it lands on you/i, 10000); mark('flip-up'); mark('frame:flip-up'); await sleep(3000);
  await pressButton(page, /^Continue$/); mark('continue');
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('Defend panel never showed after Continue; buttons: ' + JSON.stringify(await buttons(page)));
  mark('strip-defend'); await sleep(1200); mark('end');
}

export default (page, bridge, mark) => run(page, bridge, mark);
