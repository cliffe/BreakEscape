// t02_attack_run: the whole attack in one take: kiosk Start; open-source research (Fatima and Colin noted on "Our people", then the Careers page with the vacancy noted);
// the application email builder (pretext "I'd like to apply for {vacancy} ... {hiring manager}" picked with the drop-down closed, the two slots filled one by one from the noted facts,
// the calm ask, the CV label chosen as the attachment, Fatima in the To line); Send; the green result panel; close the mail client onto "Now it lands on you"; hold;
// Continue (strip ticks to Defend). Never the zip attachment. Fatima's reply arrives about 6 s after Send; the take waits for it (soft) so the edit can use the longer lands variant.
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca02_cv_lures t02_attack_run "" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare (Skip tutorial, close the Brief). Everything else is on camera.
// HIDES: red-flag advice lines, clean-state line, checklist advisory and any tally (HIDE_MAIL in _ca02.mjs); the red-flag COUNTER stays.
// HOW IT IS DRIVEN (all real UI, as ca01): selects by page.selectOption (closed list), slots by real mouse click on button.mail-blank[data-slot=...] then .mail-picker-option.
// Marks: start, browser-open, note-fatima, note-colin, careers-open, note-vacancy, browser-closed, mail-open, compose, pretext-set, slot1 (vacancy), slot2 (hiring manager), ask-set, attach-set,
//   redflags:<n>, send, landed, reply-in (or reply-missing), mail-closed, flip-up, continue, strip-defend, end, frame:* (research, builder, panel, flip).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, addCss, HIDE_MAIL, spriteCheck, narrowPanel } from './_ca02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const flagCount = (page) => page.evaluate(() => { const e = [...document.querySelectorAll('.mail-redflag-count')].find(x => x.offsetParent); return e ? e.innerText.trim() : null; });

export async function run(page, bridge, mark, { narrow = false } = {}) {
  let lastFlags = null;
  const watchFlags = async () => { const c = await flagCount(page); if (c !== null && c !== lastFlags) { lastFlags = c; mark('redflags:' + c); } };
  await addCss(page, HIDE_MAIL);
  await spriteCheck(page, mark);
  await openKiosk(page, bridge, mark);
  await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); if (narrow) await narrowPanel(page, '.osint-browser-game-container', 560); mark('browser-open'); await sleep(1500);
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); mark(label); await sleep(1300);
  };
  await note('blk_recruiter', 'note-fatima');
  await note('blk_hiring_mgr', 'note-colin');
  await mouseClick(page, 'a.ob-link', /Careers/i, { steps: 12, dwell: 400 });
  await waitVisible(page, '.ob-block[data-id="blk_vacancy"]'); mark('careers-open'); await sleep(1500);
  await note('blk_vacancy', 'note-vacancy');
  mark('frame:careers-noted'); await sleep(1800);
  await bridge.minigame.close(); await waitButton(page, /Open the mail client/, 10000); mark('browser-closed'); await sleep(1100);

  // mail client
  await pressButton(page, /Open the mail client/);
  await waitVisible(page, 'button.mail-compose-btn'); if (narrow) { await narrowPanel(page, '.mail-client', 560); await page.evaluate(() => { for (const b of document.querySelectorAll('button')) if (/^\s*close\s*$/i.test(b.textContent) && b.closest('.mail-client')) b.style.visibility = 'hidden'; }); } mark('mail-open'); await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template'); mark('compose'); await sleep(1800);
  await watchFlags();

  await page.mouse.move(40, 40);
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'pretext_application');
  await sleep(500); mark('pretext-set'); await watchFlags(); await sleep(1100);

  const slots = [['vacancy', /WHO-114|Warehouse Operative/i, 'slot1'], ['hiring_manager', /Colin Mather/i, 'slot2']];
  for (const [slot, re, label] of slots) {
    await mouseClick(page, `button.mail-blank[data-slot="${slot}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, '.mail-picker-option'); await sleep(700);
    const opts = await page.$$eval('.mail-picker-option', els => els.filter(e => e.offsetParent).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()));
    if (!opts.some(o => re.test(o))) throw new Error('slot ' + slot + ' has no option ' + re + '; options: ' + JSON.stringify(opts));
    mark('picker-open:' + slot, { options: opts });
    await mouseClick(page, '.mail-picker-option', re, { steps: 8, dwell: 300 });
    await page.waitForFunction((s) => { const b = document.querySelector(`button.mail-blank[data-slot="${s}"]`); return b && b.dataset.chosen; }, slot, { timeout: 5000 });
    await sleep(350); mark(label); await watchFlags(); await sleep(1100); await watchFlags();
  }
  // the calm ask, then the CV label as the attachment (never the zip)
  await page.selectOption('select.mail-compose-template[data-part="ask"]', 'ask_calm'); await sleep(400); mark('ask-set'); await watchFlags(); await sleep(900);
  await page.selectOption('select.mail-compose-attach', 'kit_cv'); await sleep(400); mark('attach-set'); await watchFlags(); await sleep(1100);
  mark('frame:builder-filled'); await sleep(900);
  const to = await page.$eval('select.mail-compose-to', e => e.options[e.selectedIndex].text).catch(() => null);
  mark('to-line', { to });

  // send (first Send is final)
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  const sendAt = Date.now(); mark('send');
  await waitVisible(page, 'body *', /It landed/i, 15000).catch(async () => { throw new Error('"It landed" never showed; text: ' + (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400)))); });
  mark('landed'); mark('frame:landed-panel');
  const landedAt = sendAt;
  // The result panel covers the mail client, so innerText/visible never sees the reply row. Poll textContent (hidden DOM counts) for the reply text, and log the rows and the panel's pending line.
  const peek = () => page.evaluate(() => ({ body: document.body.textContent.replace(/\s+/g, ' '), pending: !!document.querySelector('.mail-checklist-reply'), panel: !!document.querySelector('.mail-checklist'), rows: [...document.querySelectorAll('.mail-row')].map(e => e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 120)) }));
  let reply = false, snap = null;
  while (Date.now() - landedAt < 12000 && !reply) { snap = await peek(); reply = /Re: Application/i.test(snap.rows.join(' | ')); if (!reply) await sleep(150); }
  if (reply) { mark('reply-in', { sinceSendMs: Date.now() - landedAt, pendingLineStill: snap.pending }); mark('frame:reply'); }
  else { const rows = await page.$$eval('.mail-row', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 120))); mark('reply-missing', { pendingLine: snap && snap.pending, panelUp: snap && snap.panel, rows, tail: snap && snap.body.slice(-400) }); }
  const wait = 7000 - (Date.now() - landedAt); if (wait > 0) await sleep(wait);

  // close the mail client: the kiosk flip screen opens at once
  await bridge.minigame.close(); mark('mail-closed');
  await waitVisible(page, 'body *', /Now it lands on you/i, 10000); mark('flip-up'); mark('frame:flip-heading'); await sleep(3000);
  await pressButton(page, /^Continue$/); mark('continue');
  if (!(await waitButton(page, /Open the inbox/, 10000))) throw new Error('Defend panel never showed after Continue; buttons: ' + JSON.stringify(await buttons(page)));
  mark('strip-defend'); await sleep(1200); mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, {});
