// t18_lockbox_flag (m05, keyless): server_room. The IT on-call lockbox PIN pad with three wrong digits typed (never Enter, never the real code), then the flag station (empty). Each held and closed.
// Record: MISSION=m05 run.sh <avatar> t18_lockbox_flag "--imports=none --start-room server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: box-open, box-typed, box-closed, station-open, station-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); }
async function endMg(page, bridge) { for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework && window.MinigameFramework.endMinigame(false)); await sleep(500); } }
export default async (page, bridge, mark) => {
  await sleep(1000);
  await bridge.moveToNear('it_oncall_lockbox', { timeoutMs: 20000 });
  await sleep(800);
  const r = await bridge.interact('it_oncall_lockbox', { timeoutMs: 20000 });
  await sleep(900);
  mark('box-open', { ok: r && r.ok, mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 120) });
  await sleep(1800);
  for (const k of ['7', '2', '9']) { await page.keyboard.press(k); await sleep(450); }
  mark('box-typed');
  await sleep(1500);
  await endMg(page, bridge);
  mark('box-closed');
  await sleep(900);
  await bridge.moveToNear('flag_station_evidence', { timeoutMs: 20000 });
  await sleep(800);
  const r2 = await bridge.interact('flag_station_evidence', { timeoutMs: 20000 });
  await sleep(900);
  mark('station-open', { ok: r2 && r2.ok, mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 120) });
  await sleep(2600);
  await endMg(page, bridge);
  mark('station-closed');
  await sleep(1000);
};
