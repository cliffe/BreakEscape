// t17_face (m04, keyless): a face flash. Opens one NPC's person chat and holds on the portrait and first line for about 6 s; no choice is taken. NPC from env M04_NPC (default operative_cipher).
// Entry states (new-game flags all start with --imports=none --set briefing_played=true):
//   operative_cipher  --start-room battery_hall_1 (no cipher_walked: he challenges on sight, chat opens by itself)
//   robert_vance      --start-room operations_office
//   ibrahim_diallo / joanne_pell  --start-room main_entrance
//   operative_static  --start-room plant_room (chat may open on entry; else interact)
// Record: M04_NPC=<id> BE_SPRITE=<avatar> tools/video/takes/run-take.sh m04 t17_face_<id> ... "--hide-hud --zoom-step 1"   (the take id picks the file; this script is shared, copy it to t17_face_<id>.mjs or symlink)
// Marks: open {mg}, line {text}, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
const NPC = process.env.M04_NPC || 'operative_cipher';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} });
}
export default async (page, bridge, mark) => {
  await sleep(1200);
  let s = await bridge.getState();
  for (let i = 0; i < 12 && !s.activeMinigame; i++) { await sleep(250); s = await bridge.getState(); }
  if (!s.activeMinigame) {
    const r = await bridge.interact(NPC, { timeoutMs: 30000 });
    mark('interact', { ok: r && r.ok });
    for (let i = 0; i < 40 && !(s = await bridge.getState()).activeMinigame; i++) await sleep(250);
  }
  mark('open', { npc: NPC, mg: s.activeMinigame && (s.activeMinigame.id || s.activeMinigame.type) });
  await sleep(3500);
  const d = (await bridge.getState()).dialogue;
  mark('line', { text: ((d && d.text) || '').slice(0, 100), choices: d && d.choices && d.choices.length });
  await sleep(3000);
  mark('linger-end');
};
