// t02_attack_run: the whole attack in one take (feeds research 8-12.8 s, lands, flip). Kiosk Start; open-source research (the Fernside tab's "About Fernside" block
// blk_fernside_site noted first, then back on the Quayholt tab (its landing page is "Suppliers and ordering") blk_fernside_portal noted LAST, so the portal block is the research shot;
// blk_leo's note is never filmed); the fake-check builder with the real-Fernside host ("genuine"), the pretext "fits", urgency "calm", step "smooth" (the SAME picks as t03), Score read
// BEFORE Send (must clear linkThreshold 70); the mail client (To Leo Brennan, From slots Quayholt Operations / operations@quayholt.example, the calm order pretext, no ask part (the composer has none), no attachment
// or link); Send (first Send is final); the green "It landed" panel; Leo's reply timed with textContent polling (the panel covers the inbox); close onto "Now it lands on a colleague".
// NEVER presses Continue. Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t02_attack_run "" "--hide-hud --zoom-step 1"
// HIDES (CSS, always on, see HIDE): the giveaway counter p.lpb-tell-counter, .lpb-score, .lpb-live; the red-flag meter, advice, clean line and checklist advisory; tallies; on the flip
// screen everything under the heading and strip. The builder's own Score button is pressed once off the shot's critical frames (the score rows stay hidden; the number is read from the DOM).
// Marks: start, browser-open, note-fernside, note-portal, browser-closed, builder-open, host-chosen, pretext-chosen, urgency-chosen, step-chosen, scored (data: score, passes),
//   attached (if the builder hands off), mail-open, compose, to-line, from slots, pretext-set, ask-set, send, landed, reply-in (data: sSinceSend) or reply-missing, mail-closed, flip-up, flip-held, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, css, checkSprite } from './_ca10.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

export const HIDE = `
p.lpb-tell-counter, .lpb-score, .lpb-live { visibility: hidden !important; }
.mail-redflag-meter, .mail-redflag-advice, .mail-redflag-clean, .mail-redflag-sub, .mail-checklist-advisory, .mail-tally, .tri-tally { visibility: hidden !important; }
.aw-flip > :not(h2.aw-heading):not(.aw-strip) { display: none !important; }`;

export const MAIL_NARROW = `
.mail-client { width: 560px !important; max-width: 560px !important; }
.mail-client select, .mail-compose-to { max-width: 100% !important; }`;

export async function body(page, bridge, mark, narrow) {
  await css(page, HIDE + (narrow ? (await import('./t03_fake_check_builder.mjs')).NARROW + MAIL_NARROW : ''));
  await checkSprite(page, mark);
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); mark(label); await sleep(1100);
  };
  await openKiosk(page, bridge, mark); await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research: the Fernside facts first, the portal block last
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); mark('browser-open'); await sleep(1300);
  await mouseClick(page, '.ob-site[data-site="fernside_site"]', null, { steps: 12, dwell: 400 });
  await waitVisible(page, '.ob-block[data-id="blk_fernside_site"]'); await sleep(800);
  await note('blk_fernside_site', 'note-fernside');
  await mouseClick(page, '.ob-site[data-site="quayholt_site"]', null, { steps: 12, dwell: 400 });
  await waitVisible(page, '.ob-block[data-id="blk_fernside_portal"]'); await sleep(900);
  await note('blk_fernside_portal', 'note-portal'); mark('frame:research-portal'); await sleep(1400);
  await bridge.minigame.close();
  if (!(await waitButton(page, /builder/i, 10000))) throw new Error('builder button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('browser-closed', { buttons: await buttons(page) }); await sleep(1000);

  // builder (same picks as t03)
  await pressButton(page, /builder/i);
  await waitVisible(page, '.lpb-root'); mark('builder-open'); await sleep(2200);
  const chip = (re) => mouseClick(page, 'button.lpb-chip', re, { steps: 12, dwell: 450 });
  await chip(/The real Fernside order page/); await sleep(1000); mark('host-chosen');
  await chip(/Confirm you are human to continue to the order portal/); await sleep(1000); mark('pretext-chosen');
  await chip(/One quick step to continue/); await sleep(1000); mark('urgency-chosen');
  await chip(/A smooth, routine-looking accessibility check/); await sleep(1400); mark('step-chosen'); mark('frame:builder-picks');
  await mouseClick(page, 'button.lpb-score-btn', null, { steps: 12, dwell: 400 });
  await sleep(1200);
  const scored = await page.evaluate(() => {
    const t = (document.querySelector('.lpb-score') || document.body).textContent.replace(/\s+/g, ' ');
    const m = t.match(/Credibility:\s*(\d{1,3})\s*\/\s*100/);
    return { score: m ? Number(m[1]) : null, passes: (t.match(/Pass/g) || []).length };
  });
  mark('scored', scored); mark('frame:builder-scored');
  if (!(scored.score >= 70)) throw new Error('build score ' + scored.score + ' does not clear linkThreshold 70');
  await sleep(900);
  await mouseClick(page, 'button.lpb-attach-btn', null, { steps: 12, dwell: 400 }); mark('attached');
  if (!(await waitButton(page, /mail client/i, 10000))) throw new Error('mail client button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1000);

  // mail
  await pressButton(page, /mail client/i);
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open'); await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template'); mark('compose');
  const to = await page.$eval('select.mail-compose-to', e => e.options[e.selectedIndex].text).catch(() => null);
  mark('to-line', { to }); mark('frame:composer-to'); await sleep(1500);
  const slot = async (name, re, label) => {
    await mouseClick(page, `button.mail-blank[data-slot="${name}"]`, null, { steps: 10, dwell: 400 });
    await waitVisible(page, '.mail-picker-option'); await sleep(600);
    const opts = await page.$$eval('.mail-picker-option', els => els.filter(e => e.offsetParent).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()));
    if (!opts.some(o => re.test(o))) throw new Error('slot ' + name + ' has no option ' + re + '; options: ' + JSON.stringify(opts));
    await mouseClick(page, '.mail-picker-option', re, { steps: 8, dwell: 300 });
    await page.waitForFunction((s) => { const b = document.querySelector(`button.mail-blank[data-slot="${s}"]`); return b && b.dataset.chosen; }, name, { timeout: 5000 });
    await sleep(300); mark(label, { options: opts }); await sleep(800);
  };
  await slot('sender_name', /Quayholt Operations/i, 'slot1');
  await slot('sender_address', /operations@quayholt\.example/i, 'slot2');
  await page.mouse.move(40, 40);
  mark('selects', await page.$$eval('select', els => els.map(e => e.className + '/' + (e.dataset.part || '') + ': ' + [...e.options].map(o => o.value + '=' + o.text.slice(0, 40)).join(' ; '))));
  mark('blanks', await page.$$eval('button.mail-blank', els => els.map(e => e.dataset.slot)));
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'e10_pretext_order_calm'); await sleep(600); mark('pretext-set');
  await page.selectOption('select.mail-compose-subject', 's_order').catch(() => {}); await sleep(400); mark('subject-set'); mark('frame:composer');
  await sleep(900);
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);

  // send (first Send is final)
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  const tSend = Date.now(); mark('send');
  await waitVisible(page, 'body *', /It landed/i, 15000).catch(async () => { throw new Error('"It landed" never showed; text: ' + (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400)))); });
  mark('landed', { msAfterSend: Date.now() - tSend }); await sleep(1200); mark('frame:landed');
  // Leo's reply: the result panel covers the inbox, so poll textContent
  let reply = false;
  while (Date.now() - tSend < 14000 && !reply) { reply = await page.evaluate(() => [...document.querySelectorAll('.mail-row')].some(e => /Re: This week/i.test(e.textContent))); if (!reply) await sleep(150); }
  if (reply) mark('reply-in', { sSinceSend: +((Date.now() - tSend) / 1000).toFixed(2) });
  else mark('reply-missing', { rows: await page.$$eval('.mail-row', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 100))), tail: (await page.evaluate(() => document.body.textContent.replace(/\s+/g, ' '))).slice(-300) });
  // CA0 (ca06 finding): the reply is an inbox mail behind the result panel (emailReplyDelay 6, mail scheduler 1 s tick). Proof: Done, then open the Re: row and read it.
  // "lands variant off": the reply row showed over 6 s after Send, so the edit uses the result panel alone (unless sSinceSend <= 6).
  await mouseClick(page, 'button', /^Done$/, { steps: 10, dwell: 400 }).catch((e) => mark('done-failed', { e: String(e).slice(0, 100) })); mark('done');
  if (reply) {
    await sleep(700);
    await mouseClick(page, '.mail-row', /Re: This week/i, { steps: 12, dwell: 450 }).catch((e) => mark('reply-click-failed', { e: String(e).slice(0, 100) }));
    await sleep(900);
    const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    mark('reply-open', { says: /put the order in now/i.test(body), snippet: (body.match(/.{0,40}put the order in now.{0,20}/i) || [''])[0] }); mark('frame:reply'); await sleep(1500);
  }
  await bridge.minigame.close(); mark('mail-closed');
  await waitVisible(page, 'body *', /Now it lands on a colleague/i, 10000); mark('flip-up'); await sleep(1500); mark('frame:flip'); await sleep(1300); mark('flip-held');
  mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
