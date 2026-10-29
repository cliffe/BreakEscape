// t12_maya_line: Maya Chen in her office (dialogue view, portrait, game subtitle bar). Targets, in ink order:
//   maya_v2_4 "You have three days to stop it."  (2.74 s)   then   maya_v2_1 "Anyone who gets too close gets removed."  (3.46 s)
// Entry state: head-start in maya_office:
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room maya_office --set briefing_played=true
// Record: run-take.sh t12_maya_line "--start-room maya_office --set briefing_played=true" ""
// Path: first_meeting 'That's right...' > 'SAFETYNET sent me' > 'Tell me everything' > 'When does it launch?' (maya_v2_4) > hub 'What happened to Patricia?'
// > 'That's suspicious timing' (maya_v2_1). Non-target lines are skipped.
import { sleep, clearScreen, watchVoice } from './lib.mjs';
import { runDialogue } from './dlg.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(800);
  mark('interact-maya');
  const r = await bridge.interact('maya_chen', { timeoutMs: 20000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('conversation-open');
  await runDialogue(page, bridge, mark, vw, {
    steps: [/^That's right/i, /^SAFETYNET sent me/i, /^Tell me everything/i, /^When does it launch/i, /^What happened to Patricia/i, /^That's suspicious timing/i],
    targets: [{ name: 'maya_v2_4', re: /You have three days to stop it/i }, { name: 'maya_v2_1', re: /Anyone who gets too close gets removed/i }],
    dwellMs: 900,
  });
  await sleep(400);
};
