import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await sleep(1500);
  const st = await bridge.getState();
  for (const n of st.nearby) console.error('NB', n.kind, n.id, n.x, n.y, n.state && n.state.lockType, n.inRange);console.error('PL', JSON.stringify(st.player.x+','+st.player.y));
  const d = await page.evaluate(() => { const g = window.game && window.game.scene && window.game.scene.scenes[0]; const out = []; try { for (const [k, v] of Object.entries(window.__test)) out.push(k); } catch (_) {} return out; });
  console.error('TESTAPI', JSON.stringify(d));
  const doors = await page.evaluate(() => { try { return (window.__test.listDoors ? window.__test.listDoors() : null); } catch (e) { return String(e); } });
  console.error('DOORS', JSON.stringify(doors).slice(0, 1500));
}
export default async (page, bridge, mark) => { await sleep(500); };
