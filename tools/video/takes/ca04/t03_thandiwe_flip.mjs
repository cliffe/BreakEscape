// t03_thandiwe_flip: Thandiwe's T1 after the send: "Your email has gone to Tomás. Now take his seat at the kiosk and work the inbox the way it lands on a travel day."
// (7.34 s on the sidecar, cached). Person-chat view; the chat is closed right after the line so the choice menu never shows. The kiosk is never opened.
// Entry state (seeded; tell AC0): ink needs phish_exec_pa_attempts > 0 and defend not done. Run via run-take.sh with the new-game flags SEED_DEFEND from _ca04.mjs:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca04_exec_whaling t03_thandiwe_flip '--set episode_e4_exec_whaling_state={"done":["brief","osint","write","flip"]} --set phish_exec_pa_attempts=1' "--hide-hud --zoom-step 1"
// The take throws if the first line is T7 "Welcome to the Merrin & Sallow exercise" (the unseeded greeting) or no line voices.
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, talk, frame:npc-portrait-up, t1-subtitle-start, tts-response (status, bytes), t1-audio-start/end,
//   menu-up (if shown before the close), chat-closed, end.
import { sleep, prepare, checkSprite, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, watchTts } from './_ca04.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 't1-subtitle-start', re: /Your email has gone to Tom/i }]);
  const tts = await watchTts(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await walkToNpc(bridge, 'thandiwe_moyo', mark);
  await talkTo(page, bridge, mark, 'thandiwe_moyo', /Thandiwe/i);
  const t1 = await vw.waitForLine(/Your email has gone to Tom|Welcome to the Merrin|A voice can be copied|You.ve worked/i, 30000);
  if (!t1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Your email has gone to Tom/i.test(t1.text)) throw new Error('first line is not T1: ' + t1.text);
  mark('t1-audio-start', null, t1.start); mark('t1-audio-end', { durMs: t1.durMs }, t1.end);
  await sleep(120);
  await vw.stop(); await sw.stop(); await tts.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
