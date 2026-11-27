// t03_nilesh_flip: Nilesh after the guess has landed. N2 "Good. One reused password opened his account..." (5.86 s) plays first and is cut by the edit;
// N3 "Now it's your turn in the seat: your phone's buzzing, and someone has a password of yours." (cached, 5.33 s) is the line used.
// Person-chat view. The chat closes right after N3 ends, before the choice menu.
// Entry state: fresh game, kiosk never opened, `--set guess_e9_landed=true`:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca09 t03_nilesh_flip "--set guess_e9_landed=true" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, interact:*, frame:npc-portrait-up, n2_start/n2_end, n3_start/n3_end (real TTS edges), menu-up (if shown), chat-closed,
//   tts-response (one per voiced line), end. The take throws if N3 does not follow N2 in this state.
import { sleep, prepare, checkSprite, talkTo, closeBeforeMenu, watchTts } from './_ca09.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const tts = await watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await talkTo(page, bridge, mark, 'nilesh_solanki', /Nilesh/i);
  const n2 = await vw.waitForLine(/Good\. One reused password|Welcome to the Tarrowby|Both sides done/i, 30000);
  if (!n2) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Good\. One reused password/.test(n2.text)) throw new Error('first line is not N2: ' + n2.text);
  mark('n2_start', null, n2.start); mark('n2_end', { durMs: n2.durMs }, n2.end);
  const n3 = await vw.waitForLine(/your turn in the seat|your phone/i, 20000);
  if (!n3) throw new Error('N3 never voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  mark('n3_start', null, n3.start); mark('n3_end', { durMs: n3.durMs }, n3.end);
  await sleep(120);
  await vw.stop(); await tts.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
