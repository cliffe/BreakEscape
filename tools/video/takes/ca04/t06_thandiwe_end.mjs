// t06_thandiwe_end: the end line. Caught branch: T3 plays first (a verdict line naming the catch: the edit must not use it), then T2 "A voice can be copied. Ring her back on a
// number you already hold before anything leaves the account." (6.83 s on the sidecar, cached). The chat is closed right after T2 ends, before the choice menu.
// The edit's in point is t2-audio-start - 0.25 s (T2 starts about 6.5 s after the talk click, so it is NOT 0).
// Entry state (seeded; tell AC0): SEED_END from _ca04.mjs, one fresh game per take (kit_ca04_host_said):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca04_exec_whaling t06_thandiwe_end '<SEED_END flags>' "--hide-hud --zoom-step 1"
// The take throws if the first line is not T3 (or T2 comes first with no T3 in this state), or T2 never plays.
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, talk, frame:npc-portrait-up, t3-audio-start/end, t2-subtitle-start, t2-audio-start (THE cut point),
//   t2-audio-end, tts-response, menu-up (if shown), chat-closed, end.
import { sleep, prepare, checkSprite, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, watchTts } from './_ca04.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 't2-subtitle-start', re: /A voice can be copied/i }]);
  const tts = await watchTts(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await walkToNpc(bridge, 'thandiwe_moyo', mark);
  await talkTo(page, bridge, mark, 'thandiwe_moyo', /Thandiwe/i);
  const first = await vw.waitForLine(/./, 30000);
  if (!first) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (/A voice can be copied/i.test(first.text)) throw new Error('T2 came first (no T3 before it): ' + first.text);
  mark('t3-audio-start', { text: first.text.slice(0, 60) }, first.start); mark('t3-audio-end', { durMs: first.durMs }, first.end);
  const t2 = await vw.waitForLine(/A voice can be copied/i, 30000);
  if (!t2) throw new Error('T2 never voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  mark('t2-audio-start', null, t2.start); mark('t2-audio-end', { durMs: t2.durMs }, t2.end);
  await sleep(120);
  await vw.stop(); await sw.stop(); await tts.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
