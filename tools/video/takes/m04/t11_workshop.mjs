// t11_workshop (m04): engineering_workshop: the flag station (drop-site terminal, no flags submitted yet) then the Network Monitoring Station desktop, each opened, held, closed; no action inside.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room engineering_workshop --unlock engineering_workshop --set briefing_played=true
// Record: BE_SPRITE=marcus_hale tools/video/takes/run-take.sh m04 t11_workshop "<same flags>" "--hide-hud --zoom-step 1"
// Marks: station-interact/-open/-closed, desk-interact/-open/-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const findPc = (page) => page.evaluate(() => { for (const r of Object.values(window.rooms || {})) for (const o of Object.values(r.objects || {})) if (o && o.scenarioData && /Network Monitoring Station/.test(o.scenarioData.name || '')) return o.scenarioData.id || o.objectId || o.scenarioData.name; return null; });
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, n.kind, Math.round(n.x), Math.round(n.y)])), 'player', s.player.x + ',' + s.player.y, 'pcid', await findPc(page));
}
async function moment(page, bridge, mark, id, tag, hold) {
  await bridge.moveToNear(id, { timeoutMs: 20000 });
  await sleep(900);
  mark(tag + '-interact', { id });
  const r = await bridge.interact(id, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + id + JSON.stringify(r).slice(0, 200));
  await sleep(900);
  mark(tag + '-open', { mg: (await bridge.getState()).activeMinigame });
  await sleep(hold);
  await page.evaluate(() => { if (window.MinigameFramework && window.MinigameFramework.endMinigame) window.MinigameFramework.endMinigame(false); });
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 });
  mark(tag + '-closed');
  await sleep(900);
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  await moment(page, bridge, mark, 'flag_station_dropsite', 'station', 2500);
  const pc = await findPc(page);
  if (!pc) throw new Error('netmon pc not found');
  await moment(page, bridge, mark, pc, 'desk', 3000);
};
