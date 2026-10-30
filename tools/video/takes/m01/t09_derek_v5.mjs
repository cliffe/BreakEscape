// t09_derek: Derek Lawson's finale conversation in break_room (dialogue view, portrait, subtitle bar). Plays the path to two voiced lines and marks them:
//   derek_5 "Murder? No. Think of it as... forced education."   (scout: 7.1 s)
//   derek_6 "Entropy is inevitable. Trust is a lie. Security through obscurity fails."   (scout: 8.8 s)
// Entry state: head-start (opens the finale confrontation: the ink gates on entropy_reveal_read):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room break_room --set entropy_reveal_read=true --set briefing_played=true
// Record: run-take.sh t09_derek "--start-room break_room --set entropy_reveal_read=true --set briefing_played=true" ""
// Path (ink/m01_derek_confrontation.ink): start -> "I've seen the casualty projections." -> "You calculated how many people would die." -> "Why?" (evil_monologue_part1: derek_5)
//   -> "By killing innocent people." -> "You're rationalizing mass murder." (part3) -> "The Architect taught you this, didn't they?" (architect_reference: derek_6).
// Lines that are not targets are skipped with Space after a short dwell (otherwise the monologue is over two minutes), so only the marked lines
// are clean audio: the editor must cut to the line-start/line-end marks of the two targets. Other lines are on screen briefly (they include the casualty
// figures and "The Architect": spoiler checklist applies to anything outside the two target windows).
import { sleep, clearScreen, watchVoice, awaitChoice } from './lib.mjs';

const TARGETS = [
  { name: 'derek_5', re: /Murder\? No\. Think of it as\.\.\. forced education/i },
  { name: 'derek_6', re: /Entropy is inevitable\. Trust is a lie\. Security through obscurity fails/i },
];
const CHOICES = [
  /^I've seen the casualty projections/i,
  /^You calculated how many people would die/i,
  /^Why\?/i,
  /^By killing innocent people/i,
  /^You're rationalizing mass murder/i,
  /^The Architect taught you this/i,
];

export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(800);
  mark('interact-derek');
  const r = await bridge.interact('derek_lawson', { timeoutMs: 20000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason, mode: r && r.mode });   // ok:false/targetUnverified is possible while the chat still opens
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 400));
  mark('conversation-open');
  let ci = 0; const done = new Set();
  const t0 = Date.now();
  while (Date.now() - t0 < 150000) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    if (d.awaitingChoice) {
      if (ci >= CHOICES.length) break;
      mark('choices-shown', { choices: d.choices.map(c => c.text) });
      await sleep(1100);
      const ch = await bridge.minigame.choose(CHOICES[ci]);
      if (!ch || !ch.ok) throw new Error('choose failed ' + JSON.stringify(ch).slice(0, 300));
      mark('choice:' + ch.chose, { number: ch.number });
      ci++; await sleep(300); continue;
    }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    const tgt = TARGETS.find(t => t.re.test(last) && !done.has(t.name));
    if (tgt) {
      const l = await vw.waitForLine(tgt.re, 20000);
      if (!l) throw new Error(tgt.name + ' never played');
      mark(tgt.name + '-done', { durMs: l.durMs }); done.add(tgt.name);
      await sleep(1300);                              // linger on the payoff
      if (done.size === TARGETS.length) break;
    } else if (d.canContinue) {
      await sleep(450);
      await bridge.minigame.continue_();
    }
    await sleep(120);
  }
  if (done.size !== TARGETS.length) throw new Error('targets reached: ' + [...done].join(','));
  await vw.stop();
  mark('targets-done');
  await sleep(500);
};
