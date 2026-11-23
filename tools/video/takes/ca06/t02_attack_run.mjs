// t02_attack_run: the whole attack in one take; feeds research (two windows), write, lands and flip. Kiosk Start; "Open ..." the research browser (opens on the Tarrowby site, "Our depot team"):
// Kaylee Dunford (warehouse operative) noted, Dev Acharya (Facilities) noted (needed for the From line), then "Depot notices" (the YardPass permit scheme noted). Friendface is NOT visited.
// Phone-sized message writer: Compose, From slots (sender's name Dev Acharya, address), greeting, the pretext (pretext_qr_permit) with the closed picker, the permit-scheme slot (YardPass),
// the ask (ask_scan); the red-flag counter read after each step; Send (first Send is final); the green result panel; (CA06_REPLY=1: hold to Kaylee's reply, about 6 s after Send, "Cheers Dev, scanning it
// now so I'm on the list."); then the mail client is closed about 3.0 s after Send onto "Now it lands on you", heading held 2.5 s. NEVER presses Continue.
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca06_texts_and_qr t02_attack_run "" "--hide-hud --zoom-step 1"
// HIDES (CSS, always on; ATTACK_HIDE): the red-flag lines, advice, clean line, result advisory, the flip body. The take asserts the assembled body is not on screen.
// Marks: start, browser-open, note-kaylee, note-dev, notices-open, note-scheme, browser-closed, mail-open, compose, slot1, slot2, pretext-set, slot3, ask-set, redflags:<n>,
//   build-held, send, landed (msAfterSend), landed-held, reply-seen (msAfterSend), mail-closed, flip-up, flip-held, end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, css, checkSprite, ATTACK_HIDE, NARROW_MAIL, NARROW_BROWSER } from './_ca06.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const flagCount = (page) => page.evaluate(() => { const e = document.querySelector('.mail-redflag-count'); return e ? e.innerText.trim() : null; });

export async function body(page, bridge, mark, narrow) {
  await css(page, ATTACK_HIDE);
  if (narrow) await css(page, NARROW_MAIL + NARROW_BROWSER);
  await checkSprite(page, mark);
  let last = null; const watchFlags = async () => { const c = await flagCount(page); if (c !== null && c !== last) { last = c; mark('redflags:' + c); } };
  const note = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); mark(label); await sleep(1100);
  };
  await openKiosk(page, bridge, mark); await sleep(1200);
  const bs0 = await buttons(page); mark('kiosk-buttons', { buttons: bs0 });
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);
  const bs1 = await buttons(page); mark('research-buttons', { buttons: bs1 });

  // research
  const launch = bs1.find(b => /^Open the /i.test(b));
  if (!launch) throw new Error('no "Open the ..." button; buttons: ' + JSON.stringify(bs1));
  await pressButton(page, new RegExp('^' + launch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  await waitVisible(page, '.ob-root'); mark('browser-open', { launch }); await sleep(1500); mark('frame:browser');
  await note('blk_staff', 'note-kaylee'); mark('frame:note-kaylee');
  await note('blk_facilities', 'note-dev');
  await mouseClick(page, 'a.ob-link', /Depot notices/i, { steps: 12, dwell: 350 });
  await waitVisible(page, '.ob-block[data-id="blk_parking"]'); mark('notices-open'); await sleep(900);
  await note('blk_parking', 'note-scheme'); mark('frame:note-scheme'); await sleep(900);
  await bridge.minigame.close();
  if (!(await waitButton(page, /Open the (mail|message|writer)|Write/i, 10000))) throw new Error('write button never showed; buttons: ' + JSON.stringify(await buttons(page)));
  const bs2 = await buttons(page); mark('browser-closed', { buttons: bs2 }); await sleep(1000);

  // write
  const wbtn = bs2.find(b => /^Open the /i.test(b)) || bs2.find(b => /Write/i.test(b));
  await pressButton(page, new RegExp('^' + wbtn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open', { wbtn }); await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template'); mark('compose'); mark('frame:compose'); await watchFlags(); await sleep(1600);
  // The phone-sized writer scrolls inside .mail-compose-panel (708 px visible, about 910 px of content): bring the next control to the middle first.
  const reveal = async (selector) => {
    await page.evaluate((q) => { const e = document.querySelector(q), p = document.querySelector('.mail-compose-panel'); if (!e || !p) return;
      p.scrollTo({ top: Math.max(0, p.scrollTop + e.getBoundingClientRect().top - p.getBoundingClientRect().top - 260), behavior: 'instant' }); }, selector);
    await sleep(500);
  };
  const slot = async (name, re, label) => {
    await reveal(`button.mail-blank[data-slot="${name}"]`);
    await mouseClick(page, `button.mail-blank[data-slot="${name}"]`, null, { steps: 10, dwell: 450 });
    await waitVisible(page, '.mail-picker-option').catch(async (e) => { const d = await page.evaluate((n) => { const b = document.querySelector(`button.mail-blank[data-slot="${n}"]`); return { blank: !!b, chosen: b && b.dataset.chosen, expanded: b && b.getAttribute('aria-expanded'), pickers: [...document.querySelectorAll('[class*="picker"]')].map(x => x.className + ':' + (x.offsetParent ? 'v' : 'h') + ':' + x.children.length).slice(0, 8), scrollers: [...document.querySelectorAll('.mail-client *')].filter(x => x.scrollHeight > x.clientHeight + 4 && getComputedStyle(x).overflowY !== 'visible').map(x => x.className + ' ' + x.scrollTop + '/' + x.scrollHeight + '/' + x.clientHeight) }; }, name); throw new Error(e.message + ' ' + JSON.stringify(d)); });
    await sleep(700);
    const opts = await page.$$eval('.mail-picker-option', els => els.filter(e => e.offsetParent).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()));
    if (!opts.some(o => re.test(o))) throw new Error('slot ' + name + ' has no option ' + re + '; options: ' + JSON.stringify(opts));
    await mouseClick(page, '.mail-picker-option', re, { steps: 8, dwell: 300 });
    await page.waitForFunction((s) => { const b = document.querySelector(`button.mail-blank[data-slot="${s}"]`); return b && b.dataset.chosen; }, name, { timeout: 5000 });
    await sleep(350); mark(label, { options: opts }); await watchFlags(); await sleep(1000); await watchFlags();
  };
  const sel = async (part, value, label) => {
    await reveal(`select.mail-compose-template[data-part="${part}"]`);
    await page.mouse.move(40, 40);
    const opts = await page.$$eval(`select.mail-compose-template[data-part="${part}"] option`, os => os.map(o => o.value + '=' + o.textContent.trim().slice(0, 40)));
    await page.selectOption(`select.mail-compose-template[data-part="${part}"]`, value); await sleep(600); mark(label, { options: opts }); await watchFlags(); await sleep(800);
  };
  await slot('sender_name', /Dev Acharya/i, 'slot1'); mark('frame:slot1');
  await slot('sender_address', /dev\.acharya@tarrowby\.example/i, 'slot2');
  await sel('pretext', 'pretext_qr_permit', 'pretext-set'); mark('frame:pretext');
  await slot('scheme', /YardPass/i, 'slot3'); mark('frame:slot3');
  await sel('ask', 'ask_scan', 'ask-set'); mark('frame:ask');
  await sleep(1200); await watchFlags(); mark('build-held');
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);
  await page.evaluate(() => { const p = document.querySelector('.mail-compose-panel'); if (p) p.scrollTo({ top: 0, behavior: 'instant' }); }); await sleep(600); mark('frame:build-top');

  // send (first Send is final)
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  const tSend = Date.now(); mark('send');
  await sleep(300); mark('frame:send+0.3');
  await sleep(1200); mark('landed-held'); mark('frame:landed');
  if (process.env.CA06_REPLY) {
    // The reply is a mail in Dev's inbox (mail-scheduler _deliverText, emailReplyDelay 6 s for this target), delivered by the scheduler tick; the result panel covers the inbox
    // and never shows it. So: log the job queue at Send, click Done after the panel is held, and watch the inbox row ("Re: ..." from Kaylee) and the toast.
    const mailInfo = () => page.evaluate(() => { const s = window.mailScheduler && window.mailScheduler.state; const box = s && s.mailboxes && Object.values(s.mailboxes)[0];
      return { jobs: s ? s.jobs.map(j => ({ kind: j.kind, remainingMs: j.remainingMs, due: j.dueAt })) : null, inbox: box ? (box.messages || []).filter(m => m.folder === 'inbox').map(m => (m.subject || '') + ' | ' + ((m.from && m.from.name) || '')) : null }; });
    mark('mail-at-send', await mailInfo());
    await sleep(1800);
    await mouseClick(page, 'button.mail-checklist-done', null, { steps: 12, dwell: 450 });
    mark('done-clicked', { msAfterSend: Date.now() - tSend }); await sleep(500); mark('frame:after-done');
    while (Date.now() - tSend < 16000 && !(await visible(page, '.mail-row, .mail-list-pane *', /Kaylee/i))) await sleep(150);
    const seen = await visible(page, '.mail-row, .mail-list-pane *', /Kaylee/i);
    mark(seen ? 'reply-seen' : 'reply-missing', { msAfterSend: Date.now() - tSend, mail: await mailInfo() });
    if (seen) { await sleep(900); mark('frame:reply'); await mouseClick(page, '.mail-row', /Kaylee/i, { steps: 10, dwell: 300 }).catch(() => {}); await sleep(900); mark('frame:reply-open'); await sleep(1200); const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')); mark('reply-text-visible', { scanning: /scanning it now/i.test(body) }); }
  }
  const wait = 3000 - (Date.now() - tSend); if (wait > 0 && !process.env.CA06_REPLY) await sleep(wait);
  await bridge.minigame.close(); mark('mail-closed', { sSinceSend: +((Date.now() - tSend) / 1000).toFixed(2) });
  await waitVisible(page, 'body *', /Now it lands on you/i, 10000); mark('flip-up'); await sleep(1300); mark('frame:flip'); await sleep(1200); mark('flip-held');
  mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
