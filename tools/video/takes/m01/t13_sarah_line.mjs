// t13_sarah_line: Sarah O'Brien at reception (dialogue view, portrait, game subtitle bar). Target:
//   sarah_v2_1 "Next thing you know, HR calls her in and she's gone."  (4.18 s, m01_npc_sarah.ink:174)
// Entry state: fresh game, briefing flagged as played so the cutscene does not open:
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --set briefing_played=true
// Record: run-take.sh t13_sarah_line "--set briefing_played=true" ""
// Path: first_checkin 'Thanks. I'm here to audit...' > (badge/key lines skipped) hub 'I noticed the manager's office is vacant?' > 'That sounds suspicious'.
import { sleep, clearScreen, watchVoice } from './lib.mjs';
import { runDialogue } from './dlg.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(800);
  mark('interact-sarah');
  const r = await bridge.interact('sarah_martinez', { timeoutMs: 20000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('conversation-open');
  await runDialogue(page, bridge, mark, vw, {
    steps: [/^Thanks\. I'm here to audit/i, /^I noticed the manager's office/i, /^That sounds suspicious/i],
    targets: [{ name: 'sarah_v2_1', re: /Next thing you know, HR calls her in/i }],
    dwellMs: 900,
  });
  await sleep(400);
};
