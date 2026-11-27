// t05_adaeze_end: the end line. Caught branch: A4 "You stopped the bank-change email, so Harlow got paid the right way." plays first (a verdict: the
// edit must not show it), then A3 "Ring the person back on a number you already hold before you change who gets paid, and the wrong account never sees a penny."
// (6.82 s, cached). The chat is closed right after A3 ends, before "Thanks, Adaeze.". The edit's in point is a3-audio-start - 0.25.
// Entry state (kit_caught stays false so A4, not A5 "The moment that bank-details email was flagged...", is the first line):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca01 t05_adaeze_end "--set kit_defend_done=true --set kit_attack_done=true --set kit_key_caught=true" "--hide-hud --zoom-step 1"
// DRY RUN FIRST: confirm A4 then A3 (the take throws if the first line is not A4, or A3 never plays).
// Walk: straight key legs below Adaeze, then interact.
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, talk, frame:npc-portrait-up, a4-subtitle-start, line-start/line-end per line, a4-audio-start,
//   a4-audio-end, a3-subtitle-start, a3-audio-start (the real TTS start: the cut point), a3-audio-end, menu-up (if shown), chat-closed, end.
import { sleep, prepare, checkSprite, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles } from './_ca01.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const sw = await watchSubtitles(page, mark, [
    { name: 'a4-subtitle-start', re: /You stopped the bank.change email/i },
    { name: 'a3-subtitle-start', re: /Ring the person back on a number you already hold/i }]);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await walkToNpc(bridge, 'adaeze_okafor', mark);
  await talkTo(page, bridge, mark, 'adaeze_okafor', /Adaeze/i);
  const first = await vw.waitForLine(/You stopped the bank.change|The moment that bank.details|Ring the person back|Your message has gone|Welcome to the Brightwell/i, 30000);
  if (!first) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/You stopped the bank.change/i.test(first.text)) throw new Error('first line is not A4: ' + first.text);
  mark('a4-audio-start', null, first.start); mark('a4-audio-end', { durMs: first.durMs }, first.end);
  const a3 = await vw.waitForLine(/Ring the person back on a number you already hold/i, 30000);
  if (!a3) throw new Error('A3 never voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  mark('a3-audio-start', null, a3.start); mark('a3-audio-end', { durMs: a3.durMs }, a3.end);
  await sleep(120);
  await vw.stop(); await sw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
