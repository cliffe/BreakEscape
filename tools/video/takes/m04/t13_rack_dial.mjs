// t13_rack_dial (m04): Hall 1, before anomaly_detected: the rack status panel (all green, 28 C) then the analogue thermometer on the Rack Bank C wall and its "61 degrees" hint.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room battery_hall_1 --set briefing_played=true --set cipher_walked=true
// Record: BE_SPRITE=vivian_ashby tools/video/takes/run-take.sh m04 t13_rack_dial "<same flags>" "--hide-hud --zoom-step 1"
// Marks: panel-interact/-open/-closed, dial-interact, dial-hint (text seen), dial-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, n.kind, Math.round(n.x), Math.round(n.y)])), 'player', s.player.x + ',' + s.player.y);
}
const closeDlg = (page) => page.evaluate(() => { const d = document.querySelector('.game-confirm-dialog, .game-display-dialog'); if (!d) return false; const b = [...d.querySelectorAll('button,div,span')].find(e => /^[×x]$/i.test(e.textContent.trim())) || d.querySelector('button'); if (b) { b.click(); return true; } d.remove(); return 'removed'; });
export default async (page, bridge, mark) => {
  await sleep(1000);
  await bridge.moveToNear('rack_status_panel', { timeoutMs: 20000 });
  await sleep(900);
  mark('panel-interact');
  let r = await bridge.interact('rack_status_panel', { timeoutMs: 20000 });
  console.error('PANEL', JSON.stringify(r).slice(0, 200));
  await sleep(1000);
  mark('panel-open', { mg: (await bridge.getState()).activeMinigame });
  await sleep(2800);
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework.endMinigame(false)); await sleep(400); }
  console.error('CLOSE1', await closeDlg(page)); await sleep(500);
  mark('panel-closed');
  await sleep(700);
  await bridge.moveToNear('analog_thermometer', { timeoutMs: 20000 });
  await sleep(900);
  mark('dial-interact');
  r = await bridge.interact('analog_thermometer', { timeoutMs: 20000 });
  console.error('DIAL', JSON.stringify(r).slice(0, 200));
  await sleep(1200);
  mark('dial-hint', { mg: (await bridge.getState()).activeMinigame });
  await sleep(3000);
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework.endMinigame(false)); await sleep(400); }
  console.error('CLOSE2', await closeDlg(page)); await sleep(500);
  mark('dial-closed');
  await sleep(900);
};
