// t16d_desktop (m03 v3): NIGHT, danny_office. Danny's Workstation (pc, unlocked) opened by interacting with it: a desktop that HAS content (his folder
// "GHOST -- Hospital Infrastructure Assessment" and "Personal notes (unsent)" icons, DANNY-WS in the taskbar). Nothing is opened inside it; held 3.5 s then closed.
// Entry state: new-game.rb m03_ghost_in_the_machine --start-room danny_office --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration
// Record (no BE_SPRITE): tools/video/takes/run-take.sh m03 t16d_desktop "--start-room danny_office --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration" "--hide-hud --zoom-step 1"
// Marks: desk-interact, desk-open, desk-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const find = (page) => page.evaluate(() => { for (const r of Object.values(window.rooms || {})) for (const o of Object.values(r.objects || {})) if (o && o.scenarioData && /Danny's Workstation/.test(o.scenarioData.name || '')) return o.scenarioData.id || o.objectId || o.scenarioData.name; return null; });
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, n.kind, Math.round(n.x), Math.round(n.y)])), 'player', s.player.x + ',' + s.player.y, 'pcid', await find(page));
}
const close = async (page, bridge) => { await page.evaluate(() => window.MinigameFramework.endMinigame(false)); await bridge.waitForMinigameClosed({ timeoutMs: 5000 }); };
export default async (page, bridge, mark) => {
  await sleep(1000);
  const id = await find(page);
  if (!id) throw new Error('workstation not found');
  await bridge.moveToNear(id, { timeoutMs: 20000 });
  await sleep(900);
  mark('desk-interact', { id });
  const r = await bridge.interact(id, { timeoutMs: 15000 });
  mark('interact-result', { r: JSON.stringify(r).slice(0, 200) });
  await sleep(900);
  const w = await bridge.waitForMinigame('container', { timeoutMs: 4000 }).catch(() => null);
  mark('desk-open', { w: JSON.stringify(w).slice(0, 200), st: JSON.stringify((await bridge.getState()).minigame || (await bridge.getState()).activeMinigame).slice(0, 200) });
  await sleep(3500);
  await close(page, bridge);
  mark('desk-closed');
  await sleep(900);
};
