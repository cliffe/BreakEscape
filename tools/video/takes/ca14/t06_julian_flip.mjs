// t06_julian_flip: Julian after the send. J1 "That's how little it takes to build a convincing message out of a colleague's posts." (5.14 s clip, speech 0.24 to 4.85 s) is the line
// used; J2 ("Now you spot the same moves in a feed and an inbox...", 9.86 s) follows it in the hub and must not be heard: the chat closes right after J1 ends, before J2 and the menu.
// Person-chat view. Entry state: fresh game, kiosk never opened, `--set phish_df_cover_attempts=1`:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t06_julian_flip --set phish_df_cover_attempts=1 "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, interact:*, frame:npc-portrait-up, j1_start/j1_end (real TTS edges from the voice watcher), j2_start (only if J2 began before the close), menu-up (if shown),
//   chat-closed, tts-response (one per voiced line), end. The take throws if the first line voiced is not J1.
import { sleep, prepare, spriteCheck, talkTo, closeBeforeMenu, watchTts } from './_ca14.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const tts = await watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await spriteCheck(page, mark);
  mark('start-hold'); await sleep(1500);
  await talkTo(page, bridge, mark, 'julian_sallow', /Julian/i);
  const j1 = await vw.waitForLine(/That's how little it takes|Welcome to the Merrin|Start at the kiosk|Now you spot/i, 30000);
  if (!j1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/That's how little it takes/.test(j1.text)) throw new Error('first line is not J1: ' + j1.text);
  mark('j1_start', null, j1.start); mark('j1_end', { durMs: j1.durMs }, j1.end);
  await sleep(120);
  await closeBeforeMenu(page, bridge, mark);
  const j2 = vw.lines.find(l => /Now you spot/i.test(l.text));
  if (j2) mark('j2_start-before-close', { text: j2.text.slice(0, 40) }, j2.start);
  await vw.stop();
  await sleep(300); await tts.stop();
  const voiced = tts.all.filter(l => l.status === 200 && /audio/.test(l.type || '') && l.bytes > 0);
  if (!voiced.some(l => /That's how little it takes/.test(l.text))) throw new Error('J1 not voiced (no 200 audio bytes>0); tts: ' + JSON.stringify(tts.all));
  await sleep(700); mark('end');
};
