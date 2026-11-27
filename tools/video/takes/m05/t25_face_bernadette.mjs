// t25_face_bernadette (m05): DAY, break_room. Face flash for Bernadette Lyons only (t24 failed to open her chat: she had moved). Reads her live position, moves near, interacts with retries, holds the portrait ~2.4 s, closes.
// Record: MISSION=m05 run.sh <avatar> t25_face_bernadette "--imports=none --start-room break_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: pos, near, open (ok), closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const ID = 'bernadette_lyons';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(900);
  const pos = await page.evaluate((id) => { const n = window.npcManager.getNPC(id); return n && n._sprite && { x: n._sprite.x, y: n._sprite.y, state: n.state || null }; }, ID);
  mark('pos', pos);
  const m = await bridge.moveToNear(ID, { timeoutMs: 25000 });
  mark('near', { ok: m && m.ok, r: JSON.stringify(m).slice(0, 160) });
  await sleep(600);
  let w = null;
  for (let k = 0; k < 4 && !(w && w.ok !== false); k++) {
    const r = await bridge.interact(ID, { timeoutMs: 15000 });
    w = await bridge.waitForMinigame('person-chat', { timeoutMs: 3500 });
    mark('try' + k, { r: JSON.stringify(r).slice(0, 160), ok: !!(w && w.ok !== false) });
    if (!(w && w.ok !== false)) await sleep(700);
  }
  mark('open', { ok: !!(w && w.ok !== false) });
  await sleep(2600);
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework && window.MinigameFramework.endMinigame(false)); await sleep(500); }
  mark('closed');
  await sleep(800);
};
