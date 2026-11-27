// t01_nilesh_hook: the hook. Nilesh's welcome clip (cached e5e91f, 7.90 s): "Welcome to the Tarrowby exercise. Most passwords aren't cracked.
// They're guessed, reused or handed over." Person-chat view, fresh game, first talk. The edit trims the clip to audio in = line-start + 2.55 s
// (just before "Most") and out = line-start + 7.65 s, crops the game subtitle bar out and burns its own two-part caption.
// Entry state: fresh game, no flags, kiosk never opened.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca09 t01_nilesh_hook "" "--hide-hud --zoom-step 1"
// The take plays the welcome in full, then closes the chat 0.2 s after it ends, so the next line (N1b "Start at the kiosk...", which follows after
// about 0.5 s) is barely or not at all heard. The choice menu never shows.
// Marks: start-hold, player-sprite, interact:*, frame:npc-portrait-up, welcome_start, welcome_end (line-start/line-end, real TTS edges),
//   n1b_start (only if it began), chat-closed, tts-response, end. The in point of the edit is welcome_start + 2.55, the out welcome_start + 7.65;
//   the real word edges inside the sentence were inferred from silence detection, so listen to the take before the edit.
import { sleep, prepare, checkSprite, talkTo, watchTts } from './_ca09.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const tts = await watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await talkTo(page, bridge, mark, 'nilesh_solanki', /Nilesh/i);
  const w = await vw.waitForLine(/Welcome to the Tarrowby exercise|Good\. One reused|Both sides done/i, 30000);
  if (!w) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Welcome to the Tarrowby exercise/.test(w.text)) throw new Error('wrong first line (not the welcome): ' + w.text);
  mark('welcome_start', null, w.start); mark('welcome_end', { durMs: w.durMs }, w.end);
  await sleep(200);
  const n1b = vw.lines.find(l => /Start at the kiosk/.test(l.text));
  if (n1b) mark('n1b_start', null, n1b.start);
  await vw.stop(); await tts.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await sleep(700); mark('end');
};
