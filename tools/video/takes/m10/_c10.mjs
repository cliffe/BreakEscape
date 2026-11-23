// Shared by the m10 keyless takes t10.. (23 Nov, written, NOT run). Never types a PIN/password/code, never presses ENTER.
import { sleep } from '../lib/lib.mjs';
import { ttsPlaying } from '../m06/_conv.mjs';
export { faceFlash, openMg, typeKeys, pickLock, closeAll, openChat, driveToMenu } from '../m06/_cres.mjs';
/** Drives a conversation with scripted menu picks and skips non-target lines; target lines are detected from voice events BEFORE any menu is handled
 *  (a target can arrive together with its menu, which lib/dlg.mjs runDialogue mishandles). Stops lingerMs after the last target ends. */
export async function driveTargets(page, bridge, mark, vw, { steps = [], targets, lingerMs = 900, timeoutMs = 240000, skipMs = 450, dwellMs = 900 }) {
  const done = new Set(); let ci = 0, quiet = Date.now(), last = null; const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    await vw.drain();
    for (const t of targets) { const l = vw.lines.find(x => t.re.test(x.text)); if (l && !done.has(t.name)) { done.add(t.name); mark(t.name + '-done', { durMs: l.durMs }); } }
    if (done.size === targets.length) { mark('choices-visible-after-here'); await sleep(lingerMs); await vw.stop(); mark('targets-done'); return; }
    const s = await bridge.getState(); const d = s.dialogue;
    if (!d) { if (!s.activeMinigame && Date.now() - t0 > 6000) break; await sleep(150); continue; }
    if (await ttsPlaying(page)) { quiet = Date.now(); await sleep(100); continue; }
    if (d.awaitingChoice) {
      if (ci >= steps.length) throw new Error('menu with no step left: ' + JSON.stringify(d.choices.map(c => c.text)));
      mark('choices-shown', { choices: d.choices.map(c => c.text) }); await sleep(dwellMs);
      const ch = await bridge.minigame.choose(steps[ci]); if (!ch || !ch.ok) throw new Error('choose failed ' + steps[ci]);
      mark('choice:' + ch.chose); ci++; quiet = Date.now(); await sleep(300); continue;
    }
    if ((d.text || '') !== last) { last = d.text || ''; quiet = Date.now(); }
    if (d.canContinue && Date.now() - quiet > skipMs) { await bridge.minigame.continue_().catch(() => {}); quiet = Date.now(); }
    await sleep(120);
  }
  throw new Error('targets reached: ' + [...done].join(',') + ' of ' + targets.map(t => t.name).join(','));
}
export const throttle = (page) => page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} });
/** Call-subtitle observer (calls do not drive the TTS marks). Returns a stop() that drains once more. */
export async function watchSubs(page, mark) {
  await page.evaluate(() => { window.__subs = []; const seen = new WeakSet(); setInterval(() => document.querySelectorAll('.call-subtitle').forEach(n => { if (!seen.has(n)) { seen.add(n); window.__subs.push({ t: performance.timeOrigin + performance.now(), text: n.textContent.trim() }); } }), 40); });
  let n = 0; const drain = async () => { const a = await page.evaluate(() => window.__subs.slice()).catch(() => []); for (; n < a.length; n++) mark('sub:' + a[n].text.slice(0, 60), { text: a[n].text }, a[n].t); };
  const timer = setInterval(drain, 200); return async () => { clearInterval(timer); await drain(); };
}
