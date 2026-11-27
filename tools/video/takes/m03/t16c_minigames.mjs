// t16c_minigames (m03): executive_office: pc desktop of the Executive Computer via the engine's desktop opener (no password typed; the password screen is NOT filmed: its text and post-it give the hint). Nothing is opened inside the desktop.
// Entry state: new-game.rb ... --start-room executive_office --unlock executive_office --set briefing_played=true
// Record: BE_SPRITE=marcus_hale tools/video/takes/run-take.sh m03 t16c_minigames "--start-room executive_office --unlock executive_office --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: desk-interact, desk-open, desk-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const PC = 'victoria_computer';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, n.kind, Math.round(n.x), Math.round(n.y)])), 'player', JSON.stringify(s.player.x + ',' + s.player.y));
}
const close = async (page, bridge) => { await page.evaluate(() => window.MinigameFramework.endMinigame(false)); await bridge.waitForMinigameClosed({ timeoutMs: 5000 }); };
export default async (page, bridge, mark) => {
  await sleep(1000);
  await bridge.moveToNear(PC, { timeoutMs: 20000 });
  await sleep(900);
  mark('desk-interact');
  // the engine's own desktop opener (container minigame, sign-in desktop mode); the password screen is skipped, its text and post-it spell out the hint
  const ok = await page.evaluate((id) => { for (const r of Object.values(window.rooms || {})) for (const o of Object.values(r.objects || {})) if (o && o.scenarioData && o.scenarioData.id === id) { window.openLoginDesktop ? window.openLoginDesktop(o) : window.startContainerMinigame(o, null, false, true); return true; } return false; }, PC);
  if (!ok) throw new Error('pc not found');
  await sleep(900);
  mark('desk-open', { mg: (await bridge.getState()).activeMinigame });
  await sleep(2500);
  await close(page, bridge);
  mark('desk-closed');
  await sleep(900);
};
