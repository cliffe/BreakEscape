// t01b_hax_stakes (m03): Agent HaX's opening briefing, hook line "Every life St. Catherine's lost, it lost to something Zero Day sold."
// (knot final_instructions in m03_opening_briefing.ink; plays only when knows_m2_connection is true).
// Entry state: fresh game, NO briefing_played gate (the briefing opens itself on load):
//   PLAYTEST_PORT=3017 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m03_ghost_in_the_machine
// Record (the player is not on screen, so no BE_SPRITE): tools/video/takes/run-take.sh m03 t01b_hax_stakes "" ""
// Shortest path: "Skip the background. What's the mission?" (sets skipped_background, so briefing_main takes the short route, which sets
// knows_m2_connection) > two HaX lines > objectives (3 lines) > hub "That's everything. Let's talk approach." > mission_approach
// "I'll be thorough." > HaX reply (2 lines) > final_instructions: the target line. None of these choices raises an Influence toast.
// Stops when the line has played, before its choice menu is used.
// Marks: briefing-open, choices-shown, choice:*, line-start:/line-end:, stakes-done, targets-done.
import { sleep, watchVoice } from '../lib/lib.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null;
  for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open', { speaker: d.speaker });
  // Own driver. Lines before the last choice are clicked through (partly audible, off the cut). After the last choice the replies are NOT
  // clicked: a click skips the screen but the voice queue keeps playing the skipped line (a 6 s line made the target arrive silent in run 1),
  // so the game's own auto-advance carries it to the target.
  const steps = [/^Skip the background/i, /^That's everything/i, /^I'll be thorough/i];
  const target = /Every life St\. Catherine's lost, it lost to something Zero Day sold/i;
  let ci = 0; const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    if (d.awaitingChoice) {
      for (let i = 0; i < 150 && await page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; return !!(mg && mg.ttsManager && mg.ttsManager.playing); }).catch(() => false); i++) await sleep(100);
      await vw.drain();
      if (ci >= steps.length) throw new Error('menu after the last step before the target');
      mark('choices-shown', { choices: d.choices.map(c => c.text) });
      await sleep(700);
      const ch = await bridge.minigame.choose(steps[ci]);
      if (!ch || !ch.ok) throw new Error('choose failed ' + steps[ci]);
      mark('choice:' + ch.chose, { number: ch.number }); ci++; await sleep(300); continue;
    }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (target.test(last)) {
      const l = await vw.waitForLine(target, 20000);
      if (!l) throw new Error('stakes never played (no voice start)');
      mark('stakes-done', { durMs: l.durMs });
      await sleep(400);
      break;
    }
    if (d.canContinue && ci < steps.length) { await sleep(450); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(120);
  }
  await vw.stop();
  mark('targets-done');
  await sleep(200);
};
