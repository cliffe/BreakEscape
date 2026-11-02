// t15_reeves (m02): the confrontation with the night security supervisor (Graham Reeves; the user's say-so covers showing him). Voice marks for every line. Targets (scout, m02_npc_asset.ink):
//   reeves_1 "So you did the work."  (2.33 s)      reeves_5 "Good. Otherwise I'd have sat here another six hours being helpful, and that's far more tiring than this."  (8.26 s), the line straight after reeves_1
//   reeves_2 "Money. That's the first guess, always."  (3.50 s)  after confrontation_why > "You held the door open for people who put a ward on generators."
// The hostile choice is never picked. Narration before the targets includes "You say the badge number out loud. SC-4471." (a badge id): the edit's in point must be after it.
// Entry state: new-game.rb m02_ransomed_trust --start-room conference_room --set briefing_played=true --set insider_identified=true --set cover_burned=true
// Record: tools/video/takes/run-take.sh m02 t15_reeves "--start-room conference_room --set briefing_played=true --set insider_identified=true --set cover_burned=true" ""
// Path: confrontation (reeves_1, reeves_5 play in full with no key press between them) > confrontation_the_call (cover_burned): "It cost me twenty minutes." > confrontation_why: "You held the door open..." > monologue_1: reeves_2.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
const ttsPlaying = (page) => page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; return !!(mg && mg.ttsManager && mg.ttsManager.playing); }).catch(() => false);
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(800);
  mark('interact-reeves');
  let r = await bridge.interact('night_security_supervisor', { timeoutMs: 20000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason });
  let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 4000 });
  if (!w || w.ok === false) {   // the first click was once swallowed (no-effect-confirmed): click again
    r = await bridge.interact('night_security_supervisor', { timeoutMs: 20000 });
    mark('interact-retry', { ok: r && r.ok, reason: r && r.reason });
    w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  }
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('conversation-open');
  const targets = [
    { name: 'reeves_1', re: /^So you did the work\./i, hold: false },
    { name: 'reeves_5', re: /^Good\. Otherwise I'd have sat here/i, hold: false },
    { name: 'reeves_2', re: /^Money\. That's the first guess, always/i, hold: true },
  ];
  const steps = [/^It cost me twenty minutes/i, /^You held the door open for people who put a ward on generators/i];
  let ci = 0; const done = new Set(); const t0 = Date.now();
  while (Date.now() - t0 < 120000 && done.size < targets.length) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    if (d.awaitingChoice) {
      for (let i = 0; i < 150 && await ttsPlaying(page); i++) await sleep(100);
      await vw.drain();
      if (ci >= steps.length) break;
      mark('choices-shown', { choices: d.choices.map(c => c.text) });
      await sleep(1000);
      const ch = await bridge.minigame.choose(steps[ci]);
      if (!ch || !ch.ok) throw new Error('choose failed ' + steps[ci] + ' ' + JSON.stringify(ch).slice(0, 300));
      mark('choice:' + ch.chose, { number: ch.number });
      ci++; await sleep(300); continue;
    }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    const tgt = targets.find(t => t.re.test(last) && !done.has(t.name));
    if (tgt) {
      const l = await vw.waitForLine(tgt.re, 25000);
      if (!l) throw new Error(tgt.name + ' never played');
      mark(tgt.name + '-done', { durMs: l.durMs }); done.add(tgt.name);
      if (done.size === targets.length) { await sleep(1400); break; }
      if (tgt.name === 'reeves_1') { await sleep(150); continue; }    // no key press: the game advances to the line straight after it by itself
      await sleep(500);
      if (d.canContinue) await bridge.minigame.continue_().catch(() => {});
    } else if (d.canContinue) {
      await sleep(450);
      await bridge.minigame.continue_();
    }
    await sleep(120);
  }
  if (done.size !== targets.length) throw new Error('targets reached: ' + [...done].join(','));
  await vw.stop();
  mark('targets-done');
  await sleep(300);
};
