// t03_attack_run: the whole attack in one take (the script's t03, t04 and t05 are windows of this one capture, retimed from the marks).
// Kiosk Start; "Open the browser": the Friendface People list, Dani Fenwick's profile held with nothing pinned (topic); the leave post and the system post
// pinned one by one (the pin lights up, each gets a "Noted:" line), browser closed; "Open the mail client", Compose (To Yasmin Chaudhry defaults), the pretext
// picked with the drop-down closed, the "next week" and "the new finance system" slots dropped in, the Red flags counter ticking down; Send; the green landed
// panel; the mail client closed onto "Now you're Yasmin" (flip heading, strip), Continue (strip ticks to Defend).
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t03_attack_run "" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare (Skip tutorial, close the Brief), then the standing hide CSS (the Red flags reason lines), plus NARROW_CSS in the b variant.
// SHOT WINDOWS (script times -> marks): topic = profile-up .. pin-leave start (1.5 to 8 s of the script's t03); research = pin-leave - 0.3 .. pin-system + 2.2 (pins at
//   script 8.5 s and 10.5 s: this take paces them 2.0 s apart); build = compose .. slot2 + 1 s; lands = send - 0.3 .. send + 4.2 (ends before mail-closed); flip = flip-up .. strip-defend.
// HIDES: the Red flags reason lines under the counter (class found at the dry run); the finished body is only partly legible by crop (rects logged as marks).
// Marks: start, browser-open, profile-up, pin-leave, pin-system, browser-closed, mail-open, compose, to-set, pretext-set, slot-when, slot-system, redflags:<n>, send,
//   landed, reply-in (soft), mail-closed, flip-up, continue, strip-defend, end; rect:* (bounding boxes for the crop); tts-response none expected (no voiced line).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, addCss, textShowing, NARROW_CSS, spriteCheck } from './_ca14.mjs';

// Real classes (mail-composer.js _renderMeter): the reason lines are .mail-redflag-list (li.mail-redflag-item), the clean line .mail-redflag-clean, the advice .mail-redflag-advice.
// The title and the counter (.mail-redflag-count) stay; the hint .mail-redflag-sub ("Fewer flags means harder to spot") is hidden too.
export const HIDE_CSS = `.mail-redflag-list, .mail-redflag-clean, .mail-redflag-advice, .mail-redflag-sub { display: none !important; }
/* flip page: heading and Continue only (everything between is the sent message with its tells) */
.aw-flip > *:not(.aw-heading):not(.aw-continue) { visibility: hidden !important; }`;
const flagCount = (page) => page.evaluate(() => { const e = [...document.querySelectorAll('.mail-redflag-count')].find(x => x.offsetParent); return e ? e.innerText.trim() : null; });
const rect = (page, sel, re) => page.evaluate(([s, src]) => { const r = src ? new RegExp(src, 'i') : null; const e = [...document.querySelectorAll(s)].find(x => x.offsetParent && (!r || r.test(x.innerText || ''))); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }, [sel, re && re.source]);

export const makeSetup = (narrow) => async (page, bridge) => {
  await prepare(page, bridge);
  await addCss(page, HIDE_CSS);
  if (narrow) await addCss(page, NARROW_CSS(560));
  await sleep(400);
};
export const makeRun = (narrow) => async (page, bridge, mark) => {
  let lastFlags = null;
  const watchFlags = async () => { const c = await flagCount(page); if (c !== null && c !== lastFlags) { lastFlags = c; mark('redflags:' + c); } };
  const logRect = async (name, sel, re) => { const r = await rect(page, sel, re); mark('rect:' + name, r); return r; };

  await openKiosk(page, bridge, mark);
  await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);

  // research: browser, People list, Dani's profile
  await pressButton(page, /Open the browser/);
  await waitVisible(page, '.ob-root'); mark('browser-open'); await sleep(1500);
  mark('frame:people');
  await mouseClick(page, 'a', /Dani Fenwick/i, { steps: 12, dwell: 450 });
  await waitVisible(page, '.ob-block[data-id="post_leave"]');
  await page.mouse.move(40, 40);
  mark('profile-up'); mark('frame:profile-up');
  if (await textShowing(page, /Noted:/)) throw new Error('something already noted at profile-up');
  await sleep(6000);   // topic shot: nothing pinned, the pins visible on each post
  await logRect('browser-root', '.ob-root');
  const pin = async (id, label) => {
    await mouseClick(page, `.ob-block[data-id="${id}"]`, null, { steps: 14, dwell: 500 });
    await waitVisible(page, `.ob-block.is-noted[data-id="${id}"]`); mark(label); mark('frame:' + label);
    await logRect('post-' + id, `.ob-block[data-id="${id}"]`);
  };
  await pin('post_leave', 'pin-leave'); await sleep(1500);
  await pin('post_system', 'pin-system');
  const fb = await page.$$eval('.ob-feedback-text', els => els.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ')));
  mark('noted-lines', { fb });
  await sleep(2300);
  await bridge.minigame.close(); await waitButton(page, /Open the mail client/, 10000); mark('browser-closed'); await sleep(1100);

  // mail client
  await pressButton(page, /Open the mail client/);
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open'); await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template'); mark('compose'); await sleep(1200);
  const to = await page.$eval('select.mail-compose-to', e => e.options[e.selectedIndex].text);
  if (!/Yasmin/.test(to)) throw new Error('To is not Yasmin: ' + to);
  mark('to-set', { to }); mark('frame:compose');
  await logRect('mail-client', '.mail-client'); await logRect('redflags', '.mail-redflag-count');
  await logRect('pretext-select', 'select.mail-compose-template[data-part="pretext"]');   // the select shows the template's first words: crop/cover by this rect
  await watchFlags(); await sleep(1000);

  // pretext (drop-down closed: selectOption sets it without opening the native list)
  await page.mouse.move(40, 40);
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'df_pretext_access_calm');
  await sleep(500); mark('pretext-set'); mark('frame:pretext-set'); await watchFlags(); await sleep(1200); await watchFlags();

  // the two slots, one by one
  const slots = [['when', /next week/i, 'slot-when'], ['system', /new finance system/i, 'slot-system']];
  for (const [slot, re, label] of slots) {
    await mouseClick(page, `button.mail-blank[data-slot="${slot}"]`, null, { steps: 12, dwell: 450 });
    await waitVisible(page, '.mail-picker-option'); await sleep(700);
    const opts = await page.$$eval('.mail-picker-option', els => els.filter(e => e.offsetParent).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()));
    mark('picker-open:' + slot, { opts }); mark('frame:picker-' + slot);
    if (!opts.some(o => re.test(o))) throw new Error('slot ' + slot + ' has no option ' + re + '; options: ' + JSON.stringify(opts));
    await mouseClick(page, '.mail-picker-option', re, { steps: 8, dwell: 300 });
    await page.waitForFunction((s) => { const b = document.querySelector(`button.mail-blank[data-slot="${s}"]`); return b && b.dataset.chosen; }, slot, { timeout: 5000 });
    await sleep(350); mark(label); mark('frame:' + label); await watchFlags(); await sleep(1100); await watchFlags();
  }
  mark('redflags-final', { count: await flagCount(page) });
  await logRect('redflags', '.mail-redflag-count'); await logRect('composer', '.mail-composer');
  if (await textShowing(page, /No plausible reason|No red flags right now/i)) mark('warn-redflag-reason-showing');
  await sleep(1800);

  // send (first Send is final)
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  mark('send');
  await waitVisible(page, '.mail-checklist-banner.landed', null, 15000).catch(() => { throw new Error('landed panel never showed'); });
  mark('landed'); mark('frame:landed');
  mark('landed-rows', { rows: await page.$$eval('.mail-check-text', els => els.filter(e => e.offsetParent).map(e => e.innerText.trim())) });
  const landedAt = Date.now();
  await sleep(1500); mark('frame:landed+1.5');
  let reply = false;
  while (Date.now() - landedAt < 12000 && !reply) { reply = await visible(page, 'body *', /Re: Quick favour/i); if (!reply) await sleep(150); }
  mark(reply ? 'reply-in' : 'reply-missing');
  const wait = 6500 - (Date.now() - landedAt); if (wait > 0) await sleep(wait);

  // close the mail client: the kiosk flip screen opens at once
  await bridge.minigame.close(); mark('mail-closed');
  await waitVisible(page, '.aw-flip .aw-heading', /Now you.re Yasmin/i, 10000); mark('flip-up'); mark('frame:flip-up'); await sleep(3200);
  await pressButton(page, /^Continue$/); mark('continue');
  if (!(await waitButton(page, /Open the cards/, 10000))) throw new Error('Defend panel never showed after Continue; buttons: ' + JSON.stringify(await buttons(page)));
  mark('strip-defend'); mark('frame:strip-defend'); await sleep(1200); mark('end');
};
export const setup = makeSetup(false);
export default makeRun(false);
