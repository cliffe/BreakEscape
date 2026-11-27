// t17_password_panel (m05, keyless): the server_room door's password panel from server_hallway. Opens, holds, three wrong characters typed (never Enter, never the real password), closed.
// Record: MISSION=m05 run.sh <avatar> t17_password_panel "--imports=none --start-room server_hallway --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: panel-open, typed, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const DOOR = 'door:server_hallway->server_room';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const m = await bridge.moveToNear(DOOR, { timeoutMs: 20000 });
  console.error('NEAR DOOR', JSON.stringify(m).slice(0, 160));
  await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1200);
  const r = await bridge.interact(DOOR, { timeoutMs: 20000 });
  await sleep(1000);
  const st = await bridge.getState();
  mark('panel-open', { ok: r && r.ok, mg: JSON.stringify(st.activeMinigame).slice(0, 120) });
  await sleep(2200);
  for (const k of ['z', 'q', 'x']) { await page.keyboard.press(k); await sleep(350); }
  mark('typed');
  await sleep(1500);
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework && window.MinigameFramework.endMinigame(false)); await sleep(500); }
  mark('closed');
  await sleep(1200);
};
