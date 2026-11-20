// t17_ghost_call (m02): Ghost's hooded video call (conversationMode video-call, knot on_recovery_console). SILENT: no voiced flag, no audio is correct.
// Lines shown: "Before you touch that console -- look up." / narrator "The terminal text goes dark. A video window opens..." / "There. I have been a cursor..." / "I won't make this particular offer from behind text..." / "Don't waste the effort on the hood. No name tonight, no face. You get a person." / "That's the part they always leave out..." / "Money is simply a means to your inevitable end."
// SPOILER STOP: never press continue on "Money is simply a means..." (next is "Now. You're standing at the recovery console." then the offer). Never pick a choice.
// Entry state: new-game.rb m02_ransomed_trust --start-room server_room --set restore_manifest_obtained=true
// Record: tools/video/takes/run-take.sh m02 t17_ghost_call "--start-room server_room --set restore_manifest_obtained=true" "--hide-hud --zoom-step 1"
// Marks: interact, call-open, line:<text>, stop-line, hold-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('hospital_recovery_console', { timeoutMs: 20000 }).catch(() => {}); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  const r = await bridge.interact('hospital_recovery_console', { timeoutMs: 20000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('video call did not open ' + JSON.stringify(r).slice(0, 300) + JSON.stringify(w).slice(0, 200));
  mark('call-open');
  let lastSeen = ''; const t0 = Date.now(); let stopped = false;
  while (Date.now() - t0 < 60000) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    if (d.awaitingChoice) throw new Error('reached a choice menu: stopped too late');
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (/standing at the recovery console|decryption keys|Upload them|Ghost's Keys/i.test(d.text || '')) throw new Error('spoiler text on screen: ' + last);
    if (last !== lastSeen) { lastSeen = last; mark('line', { text: last.slice(0, 120) }); }
    if (/Money is simply a means/i.test(last)) { mark('stop-line'); stopped = true; break; }
    if (d.canContinue) { await sleep(2600); await bridge.minigame.continue_(); }
    else await sleep(150);
  }
  if (!stopped) throw new Error('stop line never reached; last=' + lastSeen);
  await sleep(4200);
  mark('hold-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
