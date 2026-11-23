import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await sleep(1500);
  const o = await page.evaluate(() => { const r = {}; for (const id of ['patricia_morgan','owen_gallagher','dr_halloran','lisa_park','thandiwe_moyo','niamh_doherty','bernadette_lyons']) { const n = window.npcManager.getNPC(id); r[id] = n && n._sprite && [Math.round(n._sprite.x), Math.round(n._sprite.y), n.roomId]; } return r; });
  console.error('PROBE', JSON.stringify({ o, p: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => { await sleep(300); };
