// t02_attack_run: the whole attack in one take; feeds research, build, lands and flip. Kiosk Start; "Open the browser" (opens on the Brightwell Foods site, Leadership page):
// Ravinder Sandhu (Chief Executive) noted; Friendface, Ravinder's profile, the post "In Leeds all week..." noted (research cut at about 3.5 s after note-ceo);
// then Our team (Tom Reilly noted) and Finance update (the quarter-end payment noted), off the research shot but needed (the client says "Nobody to write to yet" without Tom).
// Mail client: Compose, From slots (sender's name, address) filled one by one, the Pretext chosen with the drop-down closed, the "which payment" slot, the Red flags
// counter read after each step; Send; the green result panel ("He would take the call"); the mail client is closed about 4 s after Send (before Tom's reply, which arrives
// about 6 s after Send) onto "Now it lands on you"; heading held 2.5 s. NEVER presses Continue, never opens Tom's reply.
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca07_voice_ceo t02_attack_run "" "--hide-hud --zoom-step 1"
// HIDES (CSS, always on; ATTACK_HIDE): the Red flags lines and sub line (the counter stays), the Ask row's template text, the flip body. The take asserts at the build marks
// that "keep it between us" is not visible. The pretext drop-down is closed (selectOption sets the value without opening the native list).
// Marks: start, browser-open, note-ceo, ff-open, ff-profile, note-post, note-tom, note-payment, browser-closed, mail-open, compose, slot1, slot2, pretext-set, slot3, redflags:<n>,
//   build-held, send, landed (msAfterSend), landed-held, mail-closed, flip-up, flip-held, reply-seen (only if Tom's reply showed before the close), end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, css, checkSprite, ATTACK_HIDE, NARROW_MAIL, NARROW_BROWSER } from './_ca07.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const flagCount = (page) => page.evaluate(() => { const e = [...document.querySelectorAll('.mail-redflag-count')].find(x => x.offsetParent); return e ? e.innerText.trim() : null; });

export async function body(page, bridge, mark, narrow) {
  await css(page, ATTACK_HIDE);
  if (narrow) await css(page, NARROW_MAIL + NARROW_BROWSER + (process.env.CA07_NARROW_BROWSER_CSS || ''));
  await checkSprite(page, mark);
  let last = null; const watchFlags = async () => { const c = await flagCount(page); if (c !== null && c !== last) { last = c; mark('redflags:' + c); } };
  const noQuiet = async () => { if (await visible(page, 'body *', /keep it between us/i)) throw new Error('"keep it between us" is on screen'); };
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); mark(label); await sleep(1100);
  };
  await openKiosk(page, bridge, mark); await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); mark('browser-open'); await sleep(1500);
  await note('blk_ceo', 'note-ceo'); mark('frame:note-ceo');
  await mouseClick(page, 'button.ob-site', /Friendface/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-profile-link'); mark('ff-open'); await sleep(700);
  await mouseClick(page, '.ob-profile-link', /Ravinder/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-block[data-id="post_tradeshow"]'); mark('ff-profile'); await sleep(700);
  await note('post_tradeshow', 'note-post'); mark('frame:note-post'); await sleep(900);
  await mouseClick(page, 'button.ob-site', /Brightwell/i, { steps: 12, dwell: 350 });
  await mouseClick(page, 'a.ob-link', /Our team/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-block[data-id="blk_ap_clerk"]'); await sleep(600);
  await note('blk_ap_clerk', 'note-tom');
  await mouseClick(page, 'a.ob-link', /Finance update/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-block[data-id="blk_payment"]'); await sleep(600);
  await note('blk_payment', 'note-payment');
  await bridge.minigame.close();
  if (!(await waitButton(page, /Open the mail client/, 10000))) throw new Error('mail client button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('browser-closed'); await sleep(1000);

  // build
  await pressButton(page, /Open the mail client/);
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open'); await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template'); mark('compose'); mark('frame:compose'); await watchFlags(); await sleep(1600);
  const slot = async (name, re, label) => {
    await mouseClick(page, `button.mail-blank[data-slot="${name}"]`, null, { steps: 10, dwell: 450 });
    await waitVisible(page, '.mail-picker-option'); await sleep(700);
    const opts = await page.$$eval('.mail-picker-option', els => els.filter(e => e.offsetParent).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()));
    if (!opts.some(o => re.test(o))) throw new Error('slot ' + name + ' has no option ' + re + '; options: ' + JSON.stringify(opts));
    await mouseClick(page, '.mail-picker-option', re, { steps: 8, dwell: 300 });
    await page.waitForFunction((s) => { const b = document.querySelector(`button.mail-blank[data-slot="${s}"]`); return b && b.dataset.chosen; }, name, { timeout: 5000 });
    await sleep(350); mark(label, { options: opts }); await watchFlags(); await sleep(1000); await watchFlags();
  };
  await slot('sender_name', /Ravinder Sandhu/i, 'slot1'); mark('frame:slot1');
  await slot('sender_address', /ravinder\.sandhu@brightwellfoods\.example/i, 'slot2');
  await page.mouse.move(40, 40);
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'pretext_ceo_payment'); await sleep(600); mark('pretext-set'); await watchFlags(); mark('frame:pretext'); await sleep(900);
  await slot('payment', /supplier payment/i, 'slot3'); mark('frame:slot3');
  await noQuiet(); await sleep(1200); await watchFlags(); mark('build-held');
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);

  // send (first Send is final)
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  const tSend = Date.now(); mark('send');
  await waitVisible(page, 'body *', /He would take the call/i, 15000).catch(() => { throw new Error('"He would take the call" never showed'); });
  mark('landed', { msAfterSend: Date.now() - tSend }); await sleep(1500); mark('frame:landed'); await sleep(1500); mark('landed-held');
  await noQuiet();
  if (await visible(page, 'body *', /keep it quiet|release it now/i)) mark('reply-seen');
  const wait = 4300 - (Date.now() - tSend); if (wait > 0) await sleep(wait);
  await bridge.minigame.close(); mark('mail-closed', { sSinceSend: +((Date.now() - tSend) / 1000).toFixed(2) });
  await waitVisible(page, 'body *', /Now it lands on you/i, 10000); mark('flip-up'); await sleep(1300); mark('frame:flip'); await sleep(1200); mark('flip-held');
  mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
