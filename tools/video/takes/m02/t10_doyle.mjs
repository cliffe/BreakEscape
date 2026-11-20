// t10_doyle (m02): Sister Doyle in hospital_ward (dialogue view, portrait, game subtitle bar). Target: doyle_1 "The machines still run. Nobody's watching them."  (scout 3.70 s, m02_npc_ward_nurse.ink stakes)
// Entry state: head-start in the ward (patient timers run from game start: shoot early): new-game.rb m02_ransomed_trust --start-room hospital_ward --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t10_doyle "--start-room hospital_ward --set briefing_played=true" ""
// Path: first_meeting > "Security consultant. I'm here to get your monitoring back." > stakes (first line skipped) > target plays in full.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(800);
  mark('interact-doyle');
  const r = await bridge.interact('ward_nurse', { timeoutMs: 20000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('conversation-open');
  await runDialogue(page, bridge, mark, vw, {
    steps: [/^Security consultant\. I'm here to get your monitoring back/i],
    targets: [{ name: 'doyle_1', re: /The machines still run\. Nobody's watching them/i }],
    dwellMs: 900,
  });
  await sleep(400);
};
