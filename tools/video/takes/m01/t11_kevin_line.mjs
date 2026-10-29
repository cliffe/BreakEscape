// t11_kevin_line: Kevin Park in the IT room (dialogue view, portrait, game subtitle bar). Targets, in ink order:
//   kevin_v2_2 "Honestly? I'm worried."   (2.02 s)   then   kevin_v2_1 "I flagged it to management three times. Nothing happened."   (3.53 s)
// Entry state (head-start in it_room, so the PIN door is skipped):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room it_room --set briefing_played=true
// Record: run-take.sh t11_kevin_line "--start-room it_room --set briefing_played=true" ""
// Path: interact kevin_park; opening lines skipped; first_meeting 'Happy to help. What's the security situation?'; security_situation plays both targets with
// the middle line skipped between them (the editor cuts to the marks).
import { sleep, clearScreen, watchVoice } from './lib.mjs';
import { runDialogue } from './dlg.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(800);
  mark('interact-kevin');
  const r = await bridge.interact('kevin_park', { timeoutMs: 20000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('conversation-open');
  await runDialogue(page, bridge, mark, vw, {
    steps: [/^Happy to help/i],
    targets: [{ name: 'kevin_v2_2', re: /Honestly\? I'm worried/i }, { name: 'kevin_v2_1', re: /I flagged it to management three times/i }],
  });
  await sleep(400);
};
