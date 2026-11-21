// Shared by m03 t09..t11: a character beat. setup() puts the player a short way from the NPC (offset from the NPC's live position); the take
// holds 1 s on the map, walks to the NPC with arrow keys (the APPROACH shot), interacts, lets each target line play in full (voice start/end
// from TTS playback) and HOLDS lingerMs after the LAST target clip ends. No choice is ever picked: the take ends when the last target is done.
// Marks: walk-start, walk-end, interact, conversation-open, line-start:/line-end:, <name>-done {durMs}, targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
export function makeBeat({ npcId, start: [sx, sy], stop: [tx, ty], order = 'xy', targets, lingerMs = 1000 }) {
  let npc = null;
  const find = async (bridge) => (await bridge.getState()).nearby.find(n => n.id === npcId);
  const setup = async (page, bridge) => {
    await clearScreen(page, bridge, () => {});
    npc = await find(bridge);
    if (!npc) throw new Error(npcId + ' not nearby');
    await bridge.moveTo(npc.x + sx, npc.y + sy, { timeoutMs: 20000 });
    await sleep(900);
    console.error('SETUP', JSON.stringify({ npc, player: (await bridge.getState()).player }));
  };
  const run = async (page, bridge, mark) => {
    const vw = await watchVoice(page, mark);
    await sleep(1000);
    npc = await find(bridge);
    mark('walk-start', { npc, player: (await bridge.getState()).player });
    const legs = order === 'xy' ? [['right', npc.x + tx], ['down', npc.y + ty]] : [['down', npc.y + ty], ['right', npc.x + tx]];
    await keyLegs(bridge, legs, SPEED, mark);
    for (let i = 0; i < 12; i++) { const n = await find(bridge); if (n && n.inRange) break; const p = (await bridge.getState()).player; await bridge.walk(Math.abs(n.x - p.x) > Math.abs(n.y - p.y) ? (n.x > p.x ? 'right' : 'left') : (n.y > p.y ? 'down' : 'up'), 90); }
    mark('walk-end', { npc: await find(bridge), player: (await bridge.getState()).player });
    await sleep(350);
    mark('interact');
    const r = await bridge.interact(npcId, { approach: false, timeoutMs: 15000 });
    const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
    if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
    mark('conversation-open');
    await runDialogue(page, bridge, mark, vw, { steps: [], targets, lingerMs });
    mark('choices-visible-after-here');
    await sleep(200);
  };
  return { setup, run };
}
