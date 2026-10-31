// Shared dialogue driver for dialogue takes: follows a scripted choice path, lets TARGET lines play in full with voice
// marks, skips every other line after a short dwell. Spec: { steps: [regex,...], targets: [{name, re}], lingerMs }.
import { sleep } from './lib.mjs';

const ttsPlaying = (page) => page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; return !!(mg && mg.ttsManager && mg.ttsManager.playing); }).catch(() => false);

export async function runDialogue(page, bridge, mark, vw, { steps, targets, lingerMs = 1300, timeoutMs = 150000, dwellMs = 1100 }) {
  let ci = 0; const done = new Set(); const t0 = Date.now();
  const allDone = () => done.size === targets.length;
  while (Date.now() - t0 < timeoutMs) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    if (d.awaitingChoice) {
      // a voiced line may still be playing as the menu appears: let it finish (and be marked) first
      for (let i = 0; i < 150 && await ttsPlaying(page); i++) await sleep(100);
      await vw.drain();
      if (allDone() || ci >= steps.length) break;
      mark('choices-shown', { choices: d.choices.map(c => c.text) });
      await sleep(dwellMs);
      const ch = await bridge.minigame.choose(steps[ci]);
      if (!ch || !ch.ok) throw new Error('choose failed ' + steps[ci] + ' ' + JSON.stringify(ch).slice(0, 300));
      mark('choice:' + ch.chose, { number: ch.number });
      ci++; await sleep(300); continue;
    }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    const tgt = targets.find(t => t.re.test(last) && !done.has(t.name));
    if (tgt) {
      const l = await vw.waitForLine(tgt.re, 20000);
      if (!l) throw new Error(tgt.name + ' never played (no voice start)');
      mark(tgt.name + '-done', { durMs: l.durMs }); done.add(tgt.name);
      await sleep(allDone() ? lingerMs : 500);
      if (allDone()) break;
      if (d.canContinue) await bridge.minigame.continue_().catch(() => {});
    } else if (d.canContinue) {
      await sleep(450);
      await bridge.minigame.continue_();
    }
    await sleep(120);
  }
  if (!allDone()) throw new Error('targets reached: ' + [...done].join(',') + ' of ' + targets.map(t => t.name).join(','));
  await vw.stop();
  mark('targets-done');
}
