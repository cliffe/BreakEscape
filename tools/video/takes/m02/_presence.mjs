// Shared by t19..t21: a clean non-speaking presence shot of one NPC. Walks the player to a stand point `dx,dy` from the NPC (no interaction, no dialogue), holds ~3 s.
import { sleep, clearScreen } from '../lib/lib.mjs';
export function makePresence({ re, dx, dy, hold = 3200, label }) {
  let npc = null;
  const setup = async (page, bridge) => {
    await clearScreen(page, bridge, () => {});
    const s = await bridge.getState();
    const all = s.nearby.filter(n => n.kind === 'npc');
    console.error('NPCS', JSON.stringify(all.map(n => [n.id, n.name, Math.round(n.x), Math.round(n.y)])));
    npc = all.find(n => re.test(n.id) || re.test(n.name || ''));
    if (!npc) throw new Error('npc not found for ' + re);
    const pdy = await page.evaluate(() => Math.round(window.player.body.center.y - window.player.y));
    await bridge.moveTo(npc.x + dx, npc.y + dy + pdy, { timeoutMs: 20000 }).catch(() => {});
    await sleep(800);
    console.error('SETUP', JSON.stringify({ npc: [npc.id, Math.round(npc.x), Math.round(npc.y)], player: (await bridge.getState()).player }));
  };
  const run = async (page, bridge, mark) => {
    await sleep(900);
    const p = (await bridge.getState()).player;
    mark('presence-start', { player: p, npc: { id: npc.id, x: npc.x, y: npc.y } });
    await sleep(hold);
    if ((await bridge.getState()).dialogue) throw new Error('a dialogue opened');
    mark('presence-end');
    await sleep(500);
  };
  return { setup, run };
}
