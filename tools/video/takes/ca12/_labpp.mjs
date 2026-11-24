// Shared helpers for the lab_physical_pentest take scripts (ca12 t15_disguise_tailgate, ca15 t10_usb_drop). Real inputs only:
// interact, enterRoom, key walks, the confirm button, the tray's Drop here. Nothing here sets a game global.
import { sleep, prepare, interactRetry, pressButton, watchBubbles, keyLegs } from '../ca01/_ca01.mjs';
export { sleep, prepare, interactRetry, pressButton, watchBubbles, keyLegs };

export const SPEED = 145;
export const globals = async (bridge) => (await bridge.getState()).globals || {};

/** Poll a global (read only) until it equals `val`; throws on timeout. */
export async function waitGlobal(bridge, name, val, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if ((await globals(bridge))[name] === val) return Date.now() - t0; await sleep(100); }
  throw new Error('global ' + name + ' never became ' + val);
}

/** Fresh default game (no flags): close Ruth's opening briefing, read the rules board (so Ruth's "read the rules first" nudge cannot
 *  bark over the drop), close it. All off camera. */
export async function labStart(page, bridge, mark, { readRoe = true } = {}) {
  await prepare(page, bridge, mark);
  for (let i = 0; i < 4; i++) { const s = await bridge.getState(); if (!s.activeMinigame && !s.dialogue) break; mark('close-opening'); await bridge.minigame.close().catch(() => {}); await sleep(900); }
  if (readRoe) { await interactRetry(bridge, 'roe_board', mark); await sleep(800); await bridge.minigame.close().catch(() => {}); await sleep(800); mark('roe-read'); }
}

/** Walk to an item and click it (kit items are takeable). */
export async function takeKit(bridge, id, mark) {
  await bridge.moveToNear(id, { timeoutMs: 15000 }).catch(() => {});
  const r = await bridge.interact(id, { timeoutMs: 15000 }); await sleep(900); mark('take:' + id, { ok: r && r.ok, reason: r && r.reason }); return r;
}

/** briefing_room -> reception -> hall -> open_plan through the real doors. */
export async function toOpenPlan(bridge, mark) {
  for (const room of ['reception', 'hall', 'open_plan']) {
    const r = await bridge.enterRoom(room, { timeoutMs: 20000 }); mark('enter:' + room, { to: r && r.to, ok: r && r.ok, reason: r && r.reason });
    if (!r || r.ok === false) throw new Error('enterRoom ' + room + ' failed: ' + JSON.stringify(r).slice(0, 200));
    await sleep(500);
  }
}
