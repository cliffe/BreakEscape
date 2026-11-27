// t16b_ghost_ideology (m02): Ghost terminal, the choice picked EARLY (right after "You found it." finishes typing) so the thread above "We're not here for profit." is as short as possible.
// SPOILER STOP: the take closes the phone the moment the thread text reaches "We're not here for profit." (+ a few chars); it never lets "Gary Whitlock's email"/ProFTPD type. Never reaches the ransom, the wallet or a culprit choice.
// Entry: new-game.rb m02_ransomed_trust --start-room it_department
// Record: tools/video/takes/run-take.sh m02 t16b_ghost_ideology "--start-room it_department" "--hide-hud --zoom-step 1"
// Marks: pickup, phone-open, found-it-done, choice-picked, thread:<text of the thread at each change>, profit-typed, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
const thread = (page) => page.evaluate(() => ({ t: Array.from(document.querySelectorAll('.message-text')).map(e => e.textContent).join('\n'), typing: !!document.querySelector('.terminal-typing') })).catch(() => ({ t: '', typing: false }));
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('pickup');
  const r = await bridge.interact('ghost_terminal_device', { timeoutMs: 20000 });
  const w = await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  if (!w || w.ok === false) throw new Error('phone-chat did not open ' + JSON.stringify(r).slice(0, 200));
  mark('phone-open');
  const t0 = Date.now();
  for (;;) {
    const s = await thread(page);
    if (/You found it\./.test(s.t) && !s.typing) break;
    if (Date.now() - t0 > 40000) throw new Error('"You found it." never finished');
    await sleep(25);
  }
  mark('found-it-done');
  const ch = await bridge.minigame.choose(/^Somebody let you in/i);
  mark('choice-picked', { ok: ch && ch.ok, chose: ch && ch.chose });
  if (!ch || !ch.ok) throw new Error('choose failed ' + JSON.stringify(ch).slice(0, 200));
  let prev = '', ok = false; const t1 = Date.now();
  while (Date.now() - t1 < 40000) {
    const s = await thread(page);
    if (s.t !== prev) { prev = s.t; mark('thread', { text: s.t.slice(-260), typing: s.typing }); }
    if (/Gary|ProFTPD|St\. Catherine/i.test(s.t.split("We're not here for profit.").slice(1).join(''))) { break; }   // past the target: stop at once
    if (/We're not here for profit\./.test(s.t)) { mark('profit-typed'); ok = true; break; }
    await sleep(15);
  }
  await sleep(250);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed');
  if (!ok) throw new Error('profit line never isolated');
  await sleep(600);
};
