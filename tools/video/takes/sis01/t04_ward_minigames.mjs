// t04_ward_minigames: the ward montage's first two shots (the third, the pump, is t04p_pump / t04b_pump_narrow).
//   (1) the patient records terminal (ehr-terminal minigame, "SYSTEM UNAVAILABLE"): open, hold 1.5 s, close.  (2) the paper charts in the overworld: walk to mar_charts_stack.
// Entry state: fresh game, run-take.sh sis01 t04_ward_minigames "--set briefing_played=true" "--hide-hud --zoom-step 1"
// FINDING (dry run): __test.interact('mar_charts_stack') does NOT just pick the stack up. It opens the Notes reader ("MAR Charts - Paper Backup", full chart text incl. doses) at once, adds the notepad
//   to the inventory and sets paper_charts_collected (onRead). The script's "pickup, never the reader" shot is therefore the WALK-UP only: the edit uses overworld footage up to 'pickup_click', and
//   the reader (marked 'reader_open') is closed at once and never used. Marks: ehr_open, ehr-info, frame:ehr_*, ehr_closed, charts_walk_start/charts_arrived, pickup_click, reader_open, reader_closed, frame:charts_*.
import { sleep, prepare, sprite, interact, rectOf, frame } from './_sis01.mjs';

export const EHR_SEL = '.ehr-terminal-minigame-container';
export async function ehrShot(page, bridge, mark, narrowed) {
  const r = await interact(bridge, mark, 'ehr_terminal');
  if (!r || !r.ok) throw new Error('ehr interact failed');
  for (let i = 0; i < 60; i++) { if (await page.evaluate((s) => !!document.querySelector(s), EHR_SEL)) break; await sleep(100); }
  mark('ehr_open'); await sleep(250);
  mark('ehr-info', { text: await page.evaluate((s) => ((document.querySelector(s) || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 220), EHR_SEL), rect: await rectOf(page, '.ehr-terminal-minigame-game-container'), container: await rectOf(page, EHR_SEL), narrowed: !!narrowed });
  const t0 = Date.now();
  for (const t of [0.4, 1.0, 1.5]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t0))); frame(mark, 'ehr_t+' + t); }
  await sleep(700);
  await bridge.minigame.close().catch(() => {}); await sleep(600); mark('ehr_closed');
}

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await prepare(page, bridge, mark);
  await ehrShot(page, bridge, mark, false);
  // (2) the paper charts: walk up in the overworld, then the click that picks it up (the reader opens at once).
  const st = await bridge.getState({ radius: 600, limit: 150 });
  const c = (st.nearby || []).find(n => /mar_charts_stack/.test(n.id));
  mark('charts-pos', c ? { x: c.x | 0, y: c.y | 0, inRange: c.inRange } : null);
  if (c) { mark('charts_walk_start'); const w = await bridge.moveTo(Math.round(c.x), Math.round(c.y + 50), { timeoutMs: 15000 }).catch(e => ({ ok: false })); mark('charts_arrived', { ok: w && w.ok }); }
  await sleep(500); frame(mark, 'charts_pre');
  if (process.env.BE_DRY) await sleep(700);
  mark('pickup_click');
  const r = await interact(bridge, mark, 'mar_charts_stack');
  for (let i = 0; i < 60; i++) { if ((await bridge.getState()).activeMinigame) break; await sleep(100); }
  mark('reader_open', { ok: r && r.ok, mg: ((await bridge.getState()).activeMinigame || {}).id });
  await sleep(150);
  await bridge.minigame.close().catch(() => {}); await sleep(500); mark('reader_closed');
  mark('globals', { paper_charts_collected: (await bridge.getState()).globals.paper_charts_collected });
  frame(mark, 'charts_after'); await sleep(200);
  mark('end');
};
