// t11_control_grid: the Facility Status Board (object id scada_control_room_screens_7, "Facility Status Board") in the control room (side_a, 1.67 s after the Helen chat cut). No reading text beyond the board header.
// Entry state: tools/video/takes/run-take.sh sis02 t11_control_grid "--set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
// Actions: interact('scada_control_room_screens_7'), hold 3 s, close. If the interaction opens nothing the take frames the overworld board instead (mark 'opened' says which).
// Marks: sprite, opened (active minigame / dialog), rects (panel), text (spoiler read: no 28/51/SIS tamper/verdict), frame:grid_t+N, bark-check, end.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export async function run(page, bridge, mark, narrowPx) {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  if (narrowPx) await page.addStyleTag({ content: `.game-display-dialog,.minigame-game-container,.console-window{width:${narrowPx}px !important;max-width:${narrowPx}px !important;margin-left:auto !important;margin-right:auto !important;box-sizing:border-box !important}` });
  const r = await interact(bridge, mark, 'scada_control_room_screens_7');
  await sleep(1200);
  const st = await bridge.getState();
  const sel = '.game-display-dialog, .console-window, .minigame-game-container, .notes-minigame-notepad';
  mark('opened', { ok: r && r.ok, active: st.activeMinigame, panel: await rectOf(page, sel) });
  // Redact "Temperature: 28C." (spoiler list: 28 never on screen) from the DOM text.
  mark('redact', await page.evaluate(() => { let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let t = w.nextNode(); t; t = w.nextNode()) { if (/Temperature:\s*28/.test(t.nodeValue)) { t.nodeValue = t.nodeValue.replace(/\s*Temperature:\s*28[^.]*\./, ''); n++; } } return n; }));
  const text = await page.evaluate(() => { const c = document.querySelector('.game-display-dialog, .console-window, .minigame-container') || document.body; return (c.innerText || '').replace(/\n+/g, ' | ').slice(0, 700); });
  mark('text', text); mark('spoiler-read', { has51: /\b51\b/.test(text), has28: /\b28\b/.test(text), hasSIS: /SIS/.test(text), hasVerdict: /verdict|tamper/i.test(text) });
  const t1 = Date.now();
  for (const t of [0.4, 1.2, 2.2]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, 'grid_t+' + t); await says.drain(); }
  await sleep(600); await bridge.minigame.close().catch(() => {}); await sleep(500); mark('closed');
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, 0);
