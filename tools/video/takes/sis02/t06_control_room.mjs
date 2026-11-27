// t06_control_room: montage_a pieces in the control room, each opened, held, closed: alarm panel at rest, Incident Response Folder (header), Network Architecture (levels, attack
//   paths and the details panel hidden by CSS), NIS form (clipboard note), then the walk to the Hall 1 badge door (north door, (48,32) in room px).
// Entry state: tools/video/takes/run-take.sh sis02 t06_control_room "--set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
//   Fresh game, no hydrogen_alarm (panel at rest: H2 GAS lamp green).
// Actions: interact(alarm_panel / incident_response_folder / network_architecture_diagram / nis_notification_form) one by one with bridge.minigame.close() between; then
//   bridge.moveTo toward the north door and stop one step short (the door is NOT opened here; t07 owns the walk into the hall).
// Hides (CSS): .nad-line-attack, the Attack-path legend item (5th .nad-leg-item), #nad-detail (the attack-path panel, shown only on a node click), the "Note Added" toast.
// Marks per piece: <piece>-open, <piece>-rect (panel box), <piece>-text (first 300 chars, spoiler read), frame:<piece>_t+N; walk-start, walk-end (player pos), frame:walk_*, bark-check, end.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

const HIDE_CSS = '.nad-line-attack,.nad-leg-item:nth-child(5),#nad-detail,.minigame-message-container,.notification,.toast{display:none !important}';

export async function run(page, bridge, mark, narrowPx) {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  await page.addStyleTag({ content: HIDE_CSS });
  if (narrowPx) await page.addStyleTag({ content: `.console-window{width:${narrowPx}px !important;max-width:${narrowPx}px !important;left:50% !important;transform:translateX(-50%) !important;box-sizing:border-box !important}` });
  const piece = async (id, name, sel, holds) => {
    const r = await interact(bridge, mark, id);
    if (!r || !r.ok) throw new Error(id + ' interact failed');
    for (let i = 0; i < 80; i++) { if (await page.evaluate((s) => !!document.querySelector(s), sel)) break; await sleep(100); }
    mark(name + '-open'); await sleep(700);
    mark(name + '-rect', await rectOf(page, sel));
    mark(name + '-text', await page.evaluate((s) => (document.querySelector(s) || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 300), sel));
    const t1 = Date.now();
    for (const t of holds) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, name + '_t+' + t); await says.drain(); }
    await sleep(700);
    await bridge.minigame.close().catch(() => {}); await sleep(600); mark(name + '-closed', { active: (await bridge.getState()).activeMinigame });
  };
  await piece('alarm_panel', 'alarm', '.ap-game-container > *', [0.4, 1.2]);
  await piece('incident_response_folder', 'folder', '.notes-minigame-notepad', [0.4, 1.0]);
  await piece('network_architecture_diagram', 'network', '.console-window', [0.5, 1.4]);
  await piece('nis_notification_form', 'nis', '.game-display-dialog', [0.4, 0.9]);
  // walk to the badge door and stop short
  const p0 = (await bridge.getState()).player; mark('walk-start', { x: p0.x, y: p0.y });
  const w = await bridge.moveTo(48, 62, { timeoutMs: 15000 }).catch(e => ({ ok: false, err: String(e).slice(0, 80) }));
  await sleep(600);
  const p1 = (await bridge.getState()).player; mark('walk-end', { ok: w && w.ok, x: p1.x, y: p1.y, room: (await bridge.getState()).room });
  await sleep(300); frame(mark, 'walk_end');
  await sleep(700);
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, 0);
