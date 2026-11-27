import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await sleep(1500);
  const o = await page.evaluate(() => { const r = {}; for (const id of ['voltage','operative_static']) { const n = window.npcManager.getNPC(id); r[id] = n && n._sprite && [n._sprite.x, n._sprite.y]; } return r; });
  console.error('SETUP', JSON.stringify({ o, p: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => { await sleep(500); };
