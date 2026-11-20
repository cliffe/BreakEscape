// t14c_supply_cabinet (m02): the container screen of emergency_supply_cabinet (emergency_equipment_storage). Nothing is taken. The contents text is logged to stderr and in the 'contents' mark for the spoiler check.
// Entry state: head-start in emergency_equipment_storage: new-game.rb m02_ransomed_trust --start-room emergency_equipment_storage --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t14c_supply_cabinet "--start-room emergency_equipment_storage --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: interact, container-open, contents, hold-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('emergency_supply_cabinet', { timeoutMs: 20000 });
  await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  const r = await bridge.interact('emergency_supply_cabinet', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame(null, { timeoutMs: 8000 });
  const st = await bridge.minigame.getState();
  mark('container-open', { id: st && st.id, title: st && st.title });
  await sleep(1200);   // the contents load asynchronously ("Loading contents...")
  const st2 = await bridge.minigame.getState();
  mark('contents', { text: String(st2 && st2.text).slice(0, 600) });
  console.error('CONTENTS', JSON.stringify(st2 && st2.text).slice(0, 800));
  await sleep(2200);
  mark('hold-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
