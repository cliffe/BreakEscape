// t03_ama_flip: Ama after the campaign has landed. A4 "See how little it took: a staff list, a few words off the website, one password tried across everyone." (7.18 s) and A5 "A stolen list from another
// site opened a few more. ..." play first and are cut by the edit; A6 "Now it's your seat, and the alerts are arriving, some real, some fakes meant to finish the job." (cached, 5.93 s, speech 0.23 to 5.58 s) is the
// line used. Person-chat view; the chat closes right after A6 ends, BEFORE the choice menu. The sidecar for A6 has a colon where the ink has a comma: the take needs a real POST /tts for A6 to answer 200
// with audio (mark `a6-tts`), and records the exact text sent.
// Entry state: fresh game, kiosk never opened, `--set guess_e18_landed=true`:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca18 t03_ama_flip --set guess_e18_landed=true "" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, interact:*, frame:npc-portrait-up, a4_start/a4_end, a5_start/a5_end, a6_start/a6_end (real TTS edges), a6-tts (status, bytes, text sent), menu-up (if shown), chat-closed, tts-response (per line), end.
import { sleep, prepare, checkSprite, talkTo, closeBeforeMenu, watchTts } from './_ca18.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const tts = await watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await talkTo(page, bridge, mark, 'ama_owusu', /Ama/i);
  const a4 = await vw.waitForLine(/See how little it took|Welcome to the Merrin|Attackers rarely/i, 30000);
  if (!a4) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/See how little it took/.test(a4.text)) throw new Error('first line is not A4: ' + a4.text);
  mark('a4_start', null, a4.start); mark('a4_end', { durMs: a4.durMs }, a4.end);
  const a5 = await vw.waitForLine(/stolen list from another site/i, 20000);
  if (!a5) throw new Error('A5 never voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  mark('a5_start', null, a5.start); mark('a5_end', { durMs: a5.durMs }, a5.end);
  const a6 = await vw.waitForLine(/your seat|alerts are arriving/i, 20000);
  if (!a6) throw new Error('A6 never voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  mark('a6_start', null, a6.start); mark('a6_end', { durMs: a6.durMs }, a6.end);
  await sleep(150);
  await vw.stop(); await tts.stop();
  const v6 = tts.all.find(l => /your seat|alerts are arriving/i.test(l.text || ''));
  mark('a6-tts', v6 ? { status: v6.status, type: v6.type, bytes: v6.bytes, text: v6.text } : { missing: true, all: tts.all.map(l => ({ s: l.status, t: String(l.text).slice(0, 50) })) });
  if (!v6 || v6.status !== 200 || !/audio/.test(v6.type || '') || !(v6.bytes > 0)) throw new Error('A6 did not answer 200 with audio: ' + JSON.stringify(v6));
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
