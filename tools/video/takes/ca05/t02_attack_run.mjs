// t02_attack_run: the whole attack in one take. Kiosk Start; open-source research (Hana Novak, the Signing in page, the IT service desk address, then the
// Company news block "single sign-on moves to a new provider" noted last, so the news page is the research shot); the look-alike page builder
// (Quayholt, address quayholt-sso.example chosen from the three, secure padlock, Score, Attach to email); the mail client (sender slots, a pretext chosen
// with the drop-down closed, Attach Sign-in page); Send; the green "It landed" panel; Done; Hana's reply in the inbox, opened; close the mail client onto
// "Now it lands on you"; hold. NEVER presses Continue (the take ends on the flip heading).
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca05_signin_pages t02_attack_run "" "--hide-hud --zoom-step 1"
// The first Send is final (maxMessages 1). HIDES (CSS, always on): the builder's giveaway counter (p.lpb-tell-counter) and score rows (.lpb-score),
// the mail composer's red-flag panel (.mail-redflag-meter, display none) and, on the flip screen, everything under the "Now it lands on you" heading.
// Marks: start, browser-open, note-staff, note-sso, note-itdesk, news-open, note-news, browser-closed, builder-open, svc, address-chosen, padlock-chosen,
//   scored, attached, mail-open, compose, slot1, slot2, pretext-set, portal, link-attached, send, landed, landed-held, done, reply-row (the Hana row
//   shows, with seconds since send in the data), reply-open, mail-closed, flip-up, flip-held, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, css, checkSprite } from './_ca05.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const HIDE = `
p.lpb-tell-counter, .lpb-score, .lpb-live { visibility: hidden !important; }
.mail-redflag-meter { display: none !important; }
.aw-flip > :not(h2.aw-heading) { display: none !important; }`;

export default async (page, bridge, mark) => {
  await css(page, HIDE);
  await checkSprite(page, mark);
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); mark(label); await sleep(1100);
  };
  await openKiosk(page, bridge, mark); await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research: the news block is noted last so the news page is on screen at the end
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); mark('browser-open'); await sleep(1300);
  await note('blk_staff', 'note-staff');
  await mouseClick(page, 'a.ob-link', /Signing in/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-block[data-id="blk_sso"]'); await sleep(800);
  await note('blk_sso', 'note-sso');
  await note('blk_itdesk', 'note-itdesk');
  await mouseClick(page, 'a.ob-link', /Company news/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-block[data-id="blk_news"]'); mark('news-open'); await sleep(1500); mark('frame:news');
  await note('blk_news', 'note-news'); await sleep(1400);
  await bridge.minigame.close();
  if (!(await waitButton(page, /page builder/i, 10000))) throw new Error('builder button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('browser-closed'); await sleep(1000);

  // builder
  await pressButton(page, /page builder/i);
  await waitVisible(page, '.lpb-root'); mark('builder-open'); await sleep(2200);
  const chip = (re) => mouseClick(page, 'button.lpb-chip', re, { steps: 12, dwell: 450 });
  await chip(/^Quayholt$/); await sleep(900); mark('svc');
  await chip(/quayholt-sso\.example/); await sleep(1400); mark('address-chosen');
  await chip(/Show a secure padlock/); await sleep(1800); mark('padlock-chosen');
  await mouseClick(page, 'button.lpb-score-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'button', /Attach to email/); mark('scored'); mark('frame:builder-scored'); await sleep(900);
  await mouseClick(page, 'button', /Attach to email/, { steps: 12, dwell: 400 });
  if (!(await waitButton(page, /mail client/i, 10000))) throw new Error('mail client button never showed after Attach; buttons: ' + JSON.stringify(await buttons(page)));
  mark('attached'); await sleep(1000);

  // mail
  await pressButton(page, /mail client/i);
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open'); await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template'); mark('compose'); await sleep(1500);
  const slot = async (name, re, label) => {
    await mouseClick(page, `button.mail-blank[data-slot="${name}"]`, null, { steps: 10, dwell: 400 });
    await waitVisible(page, '.mail-picker-option'); await sleep(600);
    const opts = await page.$$eval('.mail-picker-option', els => els.filter(e => e.offsetParent).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()));
    if (!opts.some(o => re.test(o))) throw new Error('slot ' + name + ' has no option ' + re + '; options: ' + JSON.stringify(opts));
    await mouseClick(page, '.mail-picker-option', re, { steps: 8, dwell: 300 });
    await page.waitForFunction((s) => { const b = document.querySelector(`button.mail-blank[data-slot="${s}"]`); return b && b.dataset.chosen; }, name, { timeout: 5000 });
    await sleep(300); mark(label, { options: opts }); await sleep(800);
  };
  await slot('sender_name', /IT Service Desk/i, 'slot1');
  await slot('sender_address', /it-servicedesk@/i, 'slot2');
  await page.mouse.move(40, 40);
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'e5_pretext_reauth_calm'); await sleep(600); mark('pretext-set');
  await slot('portal', /Quayholt SSO/i, 'portal');
  await mouseClick(page, 'button.mail-compose-link', null, { steps: 10, dwell: 400 });
  await waitVisible(page, 'body *', /attached \(tap to remove\)/i, 5000); mark('link-attached'); mark('frame:composer'); await sleep(1100);
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);

  // send (first Send is final)
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  const tSend = Date.now(); mark('send');
  await waitVisible(page, 'body *', /It landed/i, 15000).catch(() => { throw new Error('"It landed" never showed'); });
  mark('landed', { msAfterSend: Date.now() - tSend });
  await sleep(1500); mark('frame:landed'); await sleep(1500); mark('landed-held');
  await mouseClick(page, 'button', /^Done$/, { steps: 10, dwell: 400 }); mark('done');
  // Hana's reply: the inbox row "Re: Action needed: sign in again" arrives about emailReplyDelay (6 s) after Send
  let row = false;
  while (Date.now() - tSend < 20000 && !row) { row = await visible(page, 'body *', /Re: Action needed/i); if (!row) await sleep(100); }
  if (row) mark('reply-row', { sSinceSend: +((Date.now() - tSend) / 1000).toFixed(2) }); else mark('reply-missing');
  if (row) {
    await sleep(900);
    await mouseClick(page, '.mail-row', /Re: Action needed/i, { steps: 12, dwell: 450 }).catch((e) => mark('reply-click-failed', { e: String(e).slice(0, 120) }));
    await waitVisible(page, 'body *', /I.ll sign in through that link/i, 6000).then(() => { mark('reply-open'); mark('frame:reply'); }).catch(async () => mark('reply-body-missing', { text: (await page.evaluate(() => document.body.innerText)).slice(0, 600) }));
    await sleep(3200);
  }
  await bridge.minigame.close(); mark('mail-closed');
  await waitVisible(page, 'body *', /Now it lands on you/i, 10000); mark('flip-up'); await sleep(1500); mark('frame:flip'); await sleep(1300); mark('flip-held');
  mark('end');
};
