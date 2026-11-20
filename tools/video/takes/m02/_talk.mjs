// Shared by t23..t25: open an NPC's conversation and hold on the portrait (talk) view. Never advances; never picks a choice. Logs the on-screen dialogue text for the spoiler check.
import { sleep, clearScreen } from '../lib/lib.mjs';
export function makeTalk({ npcId, hold = 3200 }) {
  const setup = async (page, bridge) => { await clearScreen(page, bridge, () => {}); await sleep(500); };
  const run = async (page, bridge, mark) => {
    await sleep(1000);
    mark('interact');
    let r = await bridge.interact(npcId, { timeoutMs: 20000 });
    let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 5000 });
    if (!w || w.ok === false) { r = await bridge.interact(npcId, { timeoutMs: 20000 }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }); }
    if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
    mark('talk-open');
    let last = '';
    const t0 = Date.now();
    while (Date.now() - t0 < hold) {
      const d = (await bridge.getState()).dialogue;
      if (d && d.awaitingChoice) throw new Error('a choice menu appeared');
      const txt = d ? (d.text || '').split('\n').filter(Boolean).pop() || '' : '';
      if (txt !== last) { last = txt; mark('line', { text: txt.slice(0, 200), canContinue: d && d.canContinue }); }
      await sleep(100);
    }
    mark('hold-end');
    for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
    mark('closed');
    await sleep(600);
  };
  return { setup, run };
}
