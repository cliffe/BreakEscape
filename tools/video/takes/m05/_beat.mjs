// m04 copy of m03/_beat.mjs (NPC position read from window.npcManager, since nearby misses idle NPCs at spawn). Shared by m03 t09..t11: a character beat. setup() puts the player a short way from the NPC (offset from the NPC's live position); the take
// holds 1 s on the map, walks to the NPC with arrow keys (the APPROACH shot), interacts, lets each target line play in full (voice start/end
// from TTS playback) and HOLDS lingerMs after the LAST target clip ends. No choice is ever picked: the take ends when the last target is done.
// Marks: walk-start, walk-end, interact, conversation-open, line-start:/line-end:, <name>-done {durMs}, targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
export function makeBeat({ npcId, start: [sx, sy], stop: [tx, ty], order = 'xy', targets, lingerMs = 1000, preMs = 350, steps = [], align = false }) {
  let npc = null;
  let PG = null;
  const find = async (bridge) => (await PG.evaluate((id) => { const n = window.npcManager.getNPC(id); return n && n._sprite && { id, x: n._sprite.x, y: n._sprite.y }; }, npcId));
  const setup = async (page, bridge) => {
    PG = page;
    await clearScreen(page, bridge, () => {});
    npc = await find(bridge);
    if (!npc) throw new Error(npcId + ' not nearby');
    await bridge.moveTo(npc.x + sx, npc.y + sy, { timeoutMs: 20000 });
    if (align) { // off camera: pulse the player onto the exact start point so the on-camera walk is one clean axis
      for (let i = 0; i < 10; i++) {
        const p = (await bridge.getState()).player; const dx = npc.x + sx - p.x, dy = npc.y + sy - p.y;
        if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) break;
        const useY = Math.abs(dy) > 2;
        await bridge.walk(useY ? (dy > 0 ? 'down' : 'up') : (dx > 0 ? 'right' : 'left'), Math.max(30, Math.round(Math.abs(useY ? dy : dx) / SPEED * 1000)));
        await sleep(150);
      }
    }
    await sleep(900);
    console.error('SETUP', JSON.stringify({ npc, player: (await bridge.getState()).player }));
  };
  const run = async (page, bridge, mark) => {
    PG = page;
    const vw = await watchVoice(page, mark);
    await sleep(1000);
    npc = await find(bridge);
    mark('walk-start', { npc, player: (await bridge.getState()).player });
    const legs = order === 'xy' ? [['right', npc.x + tx], ['down', npc.y + ty]] : [['down', npc.y + ty], ['right', npc.x + tx]];
    await keyLegs(bridge, legs, SPEED, mark);
    for (let i = 0; i < 12; i++) { const n = await find(bridge); const pp = (await bridge.getState()).player; const nb = (await bridge.getState()).nearby.find(m => m.id === npcId); if ((nb && nb.inRange) || Math.hypot(n.x - pp.x, n.y - pp.y) < 56) break; const p = (await bridge.getState()).player; await bridge.walk(Math.abs(n.x - p.x) > Math.abs(n.y - p.y) ? (n.x > p.x ? 'right' : 'left') : (n.y > p.y ? 'down' : 'up'), 90); }
    mark('walk-end', { npc: await find(bridge), player: (await bridge.getState()).player });
    await sleep(preMs);
    mark('interact');
    let r = await bridge.interact(npcId, { timeoutMs: 15000 });
    let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 2500 });
    if (!w || w.ok === false) { mark('interact-retry', { r: JSON.stringify(r).slice(0, 300) }); r = await bridge.interact(npcId, { timeoutMs: 15000 }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }); }
    if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
    mark('conversation-open');
    // own driver: a target line can arrive together with its choice menu (Ffion), so never stop at a menu before every target has played
    const done = new Set(); const t0 = Date.now(); let tLine = Date.now(); let ci = 0;
    while (done.size < targets.length && Date.now() - t0 < 150000) {
      const d = (await bridge.getState()).dialogue;
      if (!d) { await sleep(150); continue; }
      // optional scripted choices (steps: [regex,...]); a menu that shows together with an unplayed target line is left alone
      if (d.awaitingChoice && ci < steps.length && !targets.some(t => !done.has(t.name) && t.re.test((d.text || '').split('\n').filter(Boolean).pop() || ''))) {
        await vw.drain(); mark('choices-shown', { choices: d.choices.map(c => c.text) }); await sleep(700);
        const ch = await bridge.minigame.choose(steps[ci]);
        if (!ch || !ch.ok) throw new Error('choose failed ' + steps[ci]);
        mark('choice:' + ch.chose, { number: ch.number }); ci++; await sleep(300); continue;
      }
      const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
      const tgt = targets.find(t => t.re.test(last) && !done.has(t.name));
      if (tgt) {
        const l = await vw.waitForLine(tgt.re, 20000);
        if (!l) throw new Error(tgt.name + ' never played');
        mark(tgt.name + '-done', { durMs: l.durMs }); done.add(tgt.name);
        // no continue click: the game auto-advances on the audio, and a click would skip the next line's voice
      } else if (d.canContinue && !d.awaitingChoice && Date.now() - tLine > 12000) { await bridge.minigame.continue_().catch(() => {}); tLine = Date.now(); }
      await sleep(120);
    }
    if (done.size < targets.length) throw new Error('targets reached: ' + [...done].join(','));
    await sleep(lingerMs);
    await vw.stop();
    mark('targets-done');
    mark('choices-visible-after-here');
    await sleep(200);
  };
  return { setup, run };
}
