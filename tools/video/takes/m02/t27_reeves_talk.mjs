// t27_reeves_talk (m02): Graham Reeves's conversation opened, held on the portrait/talk view; never advanced, no choice picked. Silent capture.
// The opening narration names the badge ("SC-4471") and the take is cropped/cut by the edit: the suggested window starts after that line is gone or uses only the portrait region (y 0-940).
// Entry: new-game.rb m02_ransomed_trust --start-room conference_room --set insider_identified=true
// Record: tools/video/takes/run-take.sh m02 t27_reeves_talk "--start-room conference_room --set insider_identified=true" "--hide-hud --zoom-step 1"
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  let r = await bridge.interact('night_security_supervisor', { timeoutMs: 20000 });
  let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 5000 });
  if (!w || w.ok === false) { r = await bridge.interact('night_security_supervisor', { timeoutMs: 20000 }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }); }
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('talk-open');
  await sleep(900);
  const d0 = (await bridge.getState()).dialogue;
  if (d0 && d0.canContinue && /badge number/i.test(d0.text || '')) { mark('continue-past-badge-line'); await bridge.minigame.continue_(); }   // the first narration line says SC-4471: advance once (the edit starts after it)
  let last = ''; const t0 = Date.now();
  while (Date.now() - t0 < 3800) {
    const d = (await bridge.getState()).dialogue;
    if (d && d.awaitingChoice) throw new Error('a choice menu appeared');
    const txt = d ? (d.text || '').split('\n').filter(Boolean).pop() || '' : '';
    if (txt !== last) { last = txt; mark('line', { text: txt.slice(0, 200), canContinue: d && d.canContinue }); }
    await sleep(60);
  }
  mark('hold-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed');
  await sleep(600);
};
