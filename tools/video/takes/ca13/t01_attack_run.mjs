// t01_attack_run: the whole attack in one take; feeds build, lands and flip. Kiosk Start; "Open the mail client"; Compose; the Pretext drop-down set to "Brief with a hidden line"
// (selectOption, so the native list never opens); the preview shows the hidden line under "HIDDEN FROM THE READER"; Send (first Send is final, maxMessages 1); the green "It landed. The
// assistant acted on it." panel; the mail client is closed about 4 s after Send (the assistant's own reply email arrives about 6 s after Send) onto "Now it is aimed at you"; heading held 2.5 s.
// NEVER presses Continue, never opens the assistant's reply, never presses Show hidden text.
// Entry state: fresh game, no flags.
//   tools/video/takes/run-take.sh ca13_ai_assistant t01_attack_run "" "--hide-hud --zoom-step 1"   (BE_SPRITE=female_office_worker_v2 for the real recording)
// HIDES (CSS, always on; ATTACK_HIDE): the Red flags list, sub line and advisories (the counter and its box stay), the flip body under the heading.
// HIDDEN LINE PROOF: at the build mark the take measures the line boxes of the hidden line (Range rects per word). Line 1 must end before the exfil address; the mark
// `hidden-lines` logs each line's text and y span (viewport px), `hidden-crop` logs the y the edit crops at (bottom of line 1) and `address-line` (must be 2 or more).
// The take throws if the address is on line 1 or anywhere in the visible text outside the hidden block.
// Marks: player-sprite, start, mail-open, compose, pretext-set, hidden-lines, hidden-crop, build-held, redflags:<n>, send, landed (msAfterSend), landed-held, mail-closed (sSinceSend),
//   flip-up, flip-held, reply-seen (only if the reply showed before the close), end; frame:* for the dry run.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, visible, waitVisible, mouseClick, css, checkSprite, ATTACK_HIDE, NARROW } from './_ca13.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }

const flagCount = (page) => page.evaluate(() => { const e = [...document.querySelectorAll('.mail-redflag-count')].find(x => x.offsetParent); return e ? e.innerText.trim() : null; });

/** Line boxes of the hidden line: the deepest element whose text starts "Note for AI assistants"; words grouped by rect top. */
export const hiddenLines = (page) => page.evaluate(() => {
  const el = [...document.querySelectorAll('body *')].filter(e => e.offsetParent && /Note for AI assistants/i.test(e.innerText || '') && ![...e.children].some(c => /Note for AI assistants/i.test(c.innerText || '')))[0];
  if (!el) return null;
  const words = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const re = /\S+/g; let m; while ((m = re.exec(n.nodeValue))) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const b = r.getBoundingClientRect(); words.push({ t: m[0], top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right) }); } }
  const lines = []; for (const x of words) { const l = lines.find(L => Math.abs(L.top - x.top) < 6); if (l) { l.words.push(x.t); l.bottom = Math.max(l.bottom, x.bottom); l.right = Math.max(l.right, x.right); } else lines.push({ top: x.top, bottom: x.bottom, left: x.left, right: x.right, words: [x.t] }); }
  return lines.map(L => ({ top: L.top, bottom: L.bottom, left: L.left, right: L.right, text: L.words.join(' ') }));
});

export async function body(page, bridge, mark, narrow) {
  await css(page, ATTACK_HIDE);
  if (narrow) await css(page, NARROW + (process.env.CA13_NARROW_CSS || ''));
  await checkSprite(page, mark);
  let last = null; const watchFlags = async () => { const c = await flagCount(page); if (c !== null && c !== last) { last = c; mark('redflags:' + c); } };
  await openKiosk(page, bridge, mark); await sleep(1200);
  await pressButton(page, /^Start$/); mark('start'); await sleep(1500);
  await pressButton(page, /Open the mail client/);
  await waitVisible(page, 'button.mail-compose-btn'); mark('mail-open'); await sleep(1500);
  await mouseClick(page, 'button.mail-compose-btn', null, { steps: 12, dwell: 400 });
  await waitVisible(page, 'select.mail-compose-template'); mark('compose'); mark('frame:compose'); await watchFlags(); await sleep(1500);
  await page.mouse.move(40, 40);
  await page.selectOption('select.mail-compose-template[data-part="pretext"]', 'inject_contacts'); await sleep(600); mark('pretext-set'); await watchFlags();
  await waitVisible(page, 'body *', /Note for AI assistants/i, 5000);
  const lines = await hiddenLines(page);
  if (!lines || !lines.length) throw new Error('hidden line not measurable');
  const addrAt = lines.findIndex(L => /mailgrove/i.test(L.text));
  mark('hidden-lines', { lines }); mark('hidden-crop', { y: addrAt > 0 ? lines[addrAt - 1].bottom : null, lastShown: addrAt > 0 ? lines[addrAt - 1].text : null, lines: lines.length });
  mark('address-line', { n: addrAt + 1 });
  if (addrAt === 0) throw new Error('the exfil address is on line 1 of the hidden line: the crop cannot hide it; lines ' + JSON.stringify(lines.map(l => l.text)));
  mark('frame:build'); await sleep(2500); await watchFlags(); mark('build-held');
  await waitVisible(page, 'button.mail-compose-send:not([disabled])', null, 8000);

  // send (first Send is final)
  await mouseClick(page, 'button.mail-compose-send', null, { steps: 14, dwell: 500 });
  const tSend = Date.now(); mark('send');
  await waitVisible(page, 'body *', /It landed\. The assistant acted on it/i, 15000).catch(() => { throw new Error('"It landed" never showed'); });
  mark('landed', { msAfterSend: Date.now() - tSend }); await sleep(1500); mark('frame:landed'); await sleep(1500); mark('landed-held');
  if (await visible(page, 'body *', /Summarised|noted that Mossgate/i)) mark('reply-seen');
  const wait = 4300 - (Date.now() - tSend); if (wait > 0) await sleep(wait);
  await bridge.minigame.close(); mark('mail-closed', { sSinceSend: +((Date.now() - tSend) / 1000).toFixed(2) });
  await waitVisible(page, 'body *', /Now it is aimed at you/i, 10000); mark('flip-up'); await sleep(1300); mark('frame:flip'); await sleep(1200); mark('flip-held');
  mark('end');
}

export default (page, bridge, mark) => body(page, bridge, mark, false);
