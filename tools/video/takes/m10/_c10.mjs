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
export const PAD = { cupboard: ['1', '5', '7'], core: ['1', '5', '2', '9'] };   // prefix/position-checked by check_digits.rb (yes/no only); never ENTER
export { blurUid, cloneAndSave, buttons, clickBtn } from '../m05/t13_rfid_clone.mjs';
const mgState = (page) => page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; if (!mg || typeof mg.getTestState !== 'function') return null; const s = mg.getTestState(); return { step: s.step, coverage: s.coverage, canLift: s.canLift, centre: s.debug && s.debug.printCentre }; });
const toPage = (box, x, y) => ({ x: box.x + (x / 128) * box.width, y: box.y + (y / 128) * box.height });
async function zigzag(page, box, r, rows, steps = 14) {
  const ys = Array.from({ length: rows }, (_, i) => r.y + (r.h * (i + 0.5)) / rows);
  let p = toPage(box, r.x, ys[0]); await page.mouse.move(p.x, p.y); await page.mouse.down();
  for (let i = 0; i < ys.length; i++) { const x1 = i % 2 === 0 ? r.x + r.w : r.x; p = toPage(box, x1, ys[i]); await page.mouse.move(p.x, p.y, { steps }); if (i + 1 < ys.length) { const q = toPage(box, x1, ys[i + 1]); await page.mouse.move(q.x, q.y, { steps: 3 }); } }
  await page.mouse.up();
}
/** Fingerprint kit on `panelId`, BRUSH ONLY (m06 t25 / m05 t15 flow): find, powder, dust passes; the take closes before lift/compare (candidate cards carry names; the plate text after a dust may carry digits, so never click lift). */
export async function dustBrush(page, bridge, mark, panelId) {
  const r = await bridge.interact(panelId, { approach: false, timeoutMs: 20000 });
  await bridge.waitForMinigame('dusting', { timeoutMs: 10000 }); mark('kit-open', { ok: r && r.ok }); await sleep(2500);
  await page.click('.dusting-panel [data-action="start"]'); mark('step:find'); await sleep(2500);
  let s = await mgState(page), box = await page.locator('.dusting-canvas').boundingBox(); const c = s.centre;
  for (const [x, y] of [[20, 30], [60, 25], [100, 70], [c.x + 18, c.y + 10]]) { const p = toPage(box, x, y); await page.mouse.move(p.x, p.y, { steps: 18 }); await sleep(250); }
  const pc = toPage(box, c.x, c.y); await page.mouse.move(pc.x, pc.y, { steps: 12 }); await sleep(500); await page.mouse.click(pc.x, pc.y); mark('found', { centre: c });
  for (let i = 0; i < 20 && (s = await mgState(page)).step !== 'powder'; i++) await sleep(150);
  await sleep(1800); await page.click('.dusting-panel [data-action="powder"][data-powder="silver"]'); mark('powder'); await sleep(1500);
  box = await page.locator('.dusting-canvas').boundingBox();
  for (let pass = 0; pass < 6; pass++) { await zigzag(page, box, { x: c.x - 30, y: c.y - 30, w: 60, h: 60 }, 9, 16); s = await mgState(page); mark('dust-pass', { pass, coverage: s.coverage }); if (s.canLift && s.coverage >= 0.5) break; }
  mark('dusted', { coverage: s.coverage }); await sleep(1500);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('dust-closed'); await sleep(800);
}
