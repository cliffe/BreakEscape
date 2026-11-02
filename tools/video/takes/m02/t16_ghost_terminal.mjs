// t16_ghost_terminal (m02): the planted attacker device in it_department. Picking up `ghost_terminal_device` fires item_picked_up:phone -> phone-chat on ghost, knot `start`, terminal theme. SILENT (unvoiced): no audio is correct.
// With the engine fix (PhoneChatUI.addMessages typeTerminalOpening) the preloaded opening TYPES OUT line by line with the terminal cursor.
// Records the opening with NO navigation. Window of interest: after "It's been listening ever since." finishes (cursor blink) and BEFORE "Through the budget meetings..." starts typing.
// The take closes the minigame right after the "Through..." line starts (it is not shown for longer than that); the edit cuts before the mark `through-starts`.
// Entry: new-game.rb m02_ransomed_trust --start-room it_department
// Record: tools/video/takes/run-take.sh m02 t16_ghost_terminal "--start-room it_department" "--hide-hud --zoom-step 1"
// Marks: pickup, phone-open, msg-start:<n>, msg-done:<n> (text prefix), clean-window-start (ever-since done), through-starts, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('pickup');
  const r = await bridge.interact('ghost_terminal_device', { timeoutMs: 20000 });
  mark('pickup-result', { ok: r && r.ok, reason: r && r.reason });
  const w = await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  if (!w || w.ok === false) throw new Error('phone-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('phone-open');
  const snap = () => page.evaluate(() => ({
    msgs: Array.from(document.querySelectorAll('.message-text')).map(e => [e.textContent.slice(0, 40), e.classList.contains('terminal-typing')]),
    choices: document.querySelectorAll('.choice-button, .phone-choice, [class*="choice"]').length,
    cursor: !!document.querySelector('.terminal-cursor'),
  })).catch(() => null);
  let prev = '', t0 = Date.now(), cleanMarked = false, done = false;
  while (Date.now() - t0 < 60000) {
    const s = await snap();
    if (s) {
      const key = JSON.stringify(s);
      if (key !== prev && (s.msgs.length !== (prev ? JSON.parse(prev).msgs.length : -1) || s.msgs.some(m => m[1]) !== (prev ? JSON.parse(prev).msgs.some(m => m[1]) : null))) mark('state', { n: s.msgs.length, typing: s.msgs.some(m => m[1]), last: s.msgs.length ? s.msgs[s.msgs.length - 1][0] : '', choices: s.choices, cursor: s.cursor });
      prev = key;
      const last = s.msgs.length ? s.msgs[s.msgs.length - 1] : null;
      if (!cleanMarked && last && /listening ever since/i.test(last[0] + '') === false) {}
      const full = await page.evaluate(() => Array.from(document.querySelectorAll('.message-text')).map(e => e.textContent).join('\n')).catch(() => '');
      if (!cleanMarked && /listening ever since\./i.test(full) && !s.msgs.some(m => m[1])) { cleanMarked = true; mark('clean-window-start'); }
      if (/through the budget/i.test(full)) { mark('through-starts'); done = true; break; }
    }
    await sleep(20);
  }
  if (!done) throw new Error('never reached through-starts');
  await sleep(150);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
