// Extras for the m09 crescendo/flash/walk takes t19..t33 (23 Nov, written, NOT run). Never types a PIN/password/code: only PAD digits (checked by check_digits.rb), never ENTER.
import { sleep } from '../lib/lib.mjs';
import { openChat } from '../m06/_cres.mjs';
import { closeAll } from './_c9.mjs';
export { closeAll } from './_c9.mjs';
export { faceFlash, openMg, typeKeys, pickLock, openChat } from '../m06/_cres.mjs';
export { blurUid, cloneAndSave, buttons, clickBtn } from '../m05/t13_rfid_clone.mjs';
export { goRoom } from '../m05/_live.mjs';
export { setGlobal } from './_c9.mjs';
export const PAD = { safe: ['4', '0', '8'] };   // yes/no checked by check_digits.rb against every PIN lock in the scenario
/** Resolve a door id by the two rooms it joins (either direction), from the nearby list; falls back to a->b. */
export async function doorId(bridge, a, b) {
  const s = await bridge.getState(); const ids = (s.nearby || []).map(n => n.id);
  return ids.find(i => i === `door:${a}->${b}`) || ids.find(i => i === `door:${b}->${a}`) || `door:${a}->${b}`;
}
/** Off camera: open and close an NPC's chat so the server has met them (the cloner and key gifts need it). Close before any menu. */
export async function meetNpc(page, bridge, id) {
  await bridge.moveToNear(id, { timeoutMs: 25000 }).catch(() => {}); await sleep(600);
  await openChat(bridge, id); await sleep(1200); await closeAll(page, bridge); await sleep(800);
}
export const openCloneNpc = (page, id) => page.evaluate((id) => { const rc = window.npcManager.getNPC(id).rfidCard; const cardData = { name: rc.name, card_id: rc.card_id, rfid_protocol: rc.rfid_protocol, type: 'keycard' }; for (const k of ['rfid_hex', 'rfid_facility', 'rfid_card_number', 'rfid_data']) if (rc[k] !== undefined) cardData[k] = rc[k]; window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: cardData, cloneSource: { npc_id: id } }); }, id);
/** One unnamed fingerprint lift in gameState.biometricSamples (the reader refuses with a toast without one); never presented. */
export const injectLift = (page, room) => page.evaluate((room) => { const gs = window.gameState; gs.biometricSamples = gs.biometricSamples || []; gs.biometricSamples.push({ id: 'fp_unknown_lift', type: 'fingerprint', owner: 'Unknown', ownerId: 'unknown', ownerName: 'Unknown', quality: 0.55, rating: 'Fair', pattern: 'loop', identified: false, sourceObjectId: 'x', sourceRoomId: room, sourceName: 'Lift', collectedAt: new Date().toISOString() }); }, room);
// Dusting, BRUSH ONLY (m05 t15 / m06 t25 flow): closes before lift/compare (candidate cards carry names).
const mgState = (page) => page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; if (!mg || typeof mg.getTestState !== 'function') return null; const s = mg.getTestState(); return { step: s.step, coverage: s.coverage, canLift: s.canLift, centre: s.debug && s.debug.printCentre }; });
const toPage = (box, x, y) => ({ x: box.x + (x / 128) * box.width, y: box.y + (y / 128) * box.height });
async function zigzag(page, box, r, rows, steps = 14) {
  const ys = Array.from({ length: rows }, (_, i) => r.y + (r.h * (i + 0.5)) / rows);
  let p = toPage(box, r.x, ys[0]); await page.mouse.move(p.x, p.y); await page.mouse.down();
  for (let i = 0; i < ys.length; i++) { const x1 = i % 2 === 0 ? r.x + r.w : r.x; p = toPage(box, x1, ys[i]); await page.mouse.move(p.x, p.y, { steps }); if (i + 1 < ys.length) { const q = toPage(box, x1, ys[i + 1]); await page.mouse.move(q.x, q.y, { steps: 3 }); } }
  await page.mouse.up();
}
export async function dustBrush(page, bridge, mark, panel) {
  const r = await bridge.interact(panel, { approach: false, timeoutMs: 20000 });
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
  mark('closed'); await sleep(800);
}
