// t09c_derek_optimisation: Derek Lawson's coldest line in break_room (dialogue view, portrait, subtitle bar), for the m01 trailer. One voiced line, marked:
//   derek_opt "Sixty deaths to save tens of thousands per year. That's not murder. That's optimisation."   (cached, 9.14 s via tts-test.mjs; ink/m01_derek_confrontation.ink:234, knot evil_monologue_part3)
// Entry state: same as t09_derek_v5 (opens the finale confrontation: the ink gates on entropy_reveal_read):
//   --start-room break_room --set entropy_reveal_read=true --set briefing_played=true
// Record: BE_DISPLAY=113 FOOTAGE_ROOT=$HOME/video-takes-local BE_PORT=3025 tools/video/takes/run-take.sh m01 t09c_derek_optimisation "--start-room break_room --set entropy_reveal_read=true --set briefing_played=true" "--hide-hud --zoom-step 1"
// Path: start -> "I've seen the casualty projections." -> "You calculated how many people would die." -> "Why?" (part1)
//   -> "By killing innocent people." -> "You're rationalising mass murder." (part3: the target is its last line)
// Other lines are advanced after a short dwell (so they are only partly audible: cut to the line-start/line-end marks). The take ends when part3's choice menu appears
// (it is not filmed). The choice regex takes s or z (the ink says "rationalising"). The first interact can be swallowed, so it retries.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';

const TARGET = { name: 'derek_opt', re: /Sixty deaths to save tens of thousands per year\. That's not murder\. That's optimisation/i };
const CHOICES = [
  /^I've seen the casualty projections/i,
  /^You calculated how many people would die/i,
  /^Why\?/i,
  /^By killing innocent people/i,
  /^You're rationali[sz]ing mass murder/i,
];

export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(800);
  mark('interact-derek');
  let r, w;
  for (let attempt = 0; attempt < 3; attempt++) {
    r = await bridge.interact('derek_lawson', { timeoutMs: 20000 });
    mark('interact-result', { ok: r && r.ok, reason: r && r.reason, mode: r && r.mode, attempt });
    w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
    if (w && w.ok !== false) break;
    await sleep(1500);
  }
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 1200));
  mark('conversation-open');
  let ci = 0, done = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 150000) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    if (d.awaitingChoice) {
      if (ci >= CHOICES.length) break;                 // part3's menu: not filmed
      mark('choices-shown', { choices: d.choices.map(c => c.text) });
      await sleep(1100);
      const ch = await bridge.minigame.choose(CHOICES[ci]);
      if (!ch || !ch.ok) throw new Error('choose failed ' + JSON.stringify(ch).slice(0, 300));
      mark('choice:' + ch.chose, { number: ch.number });
      ci++; await sleep(300); continue;
    }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (!done && TARGET.re.test(last)) {
      const l = await vw.waitForLine(TARGET.re, 20000);
      if (!l) throw new Error('derek_opt never played');
      mark('derek_opt-done', { durMs: l.durMs }); done = true;
      await sleep(600);                                // part3's menu follows at once; it is not filmed
      break;
    } else if (d.canContinue) {
      await sleep(450);
      await bridge.minigame.continue_();
    }
    await sleep(120);
  }
  if (!done) throw new Error('target not reached');
  await vw.stop();
  mark('targets-done');
  await sleep(300);
};
