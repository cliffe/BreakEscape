// t01_niamh_hook: the hook. Niamh's H1 "Half the floor was locked out of a system earlier. Proper pain when it happens." (5.21 s cached) in her person-chat view,
// not-caught branch (kit_key_caught unset). Only the FIRST sentence is used in the trailer: its audio ends 2.69 s into the clip (speech from 0.25 s, silence 2.69 to 3.13 s,
// then "Proper pain..."), so the edit cuts at h1-audio-start + 2.69 + 0.15 and burns the sentence as the caption. The chat is closed right after the line ends, so the
// choice menu never shows, then a 1 s hold on the room.
// Entry state (fresh game, kiosk never touched; the player spawns beside Niamh, the walk is short; her position is read live because office-life NPCs move):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca08_after_the_click t01_niamh_hook "--set kit_defend_done=true --set kit_attack_done=true" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, interact:*, talk, frame:npc-portrait-up, h1-subtitle-start, line-start/line-end, tts-response, h1-audio-start,
//   h1-audio-end, h1-sentence1-end (= h1-audio-start + 2.69, estimate from the clip's silence), menu-up (only if it showed before the close), chat-closed, end.
import { sleep, prepare, spriteCheck, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, watchTts } from './_ca08.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true || g.kit_key_caught === true) throw new Error('entry state wrong (need kit_defend_done, not caught): ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught }));
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'h1-subtitle-start', re: /Half the floor was locked out/i }]);
  await spriteCheck(page, mark);
  mark('start-hold'); await sleep(600);
  await walkToNpc(bridge, 'kit_niamh_doherty', mark);
  await talkTo(page, bridge, mark, 'kit_niamh_doherty', /Niamh/i);
  const h1 = await vw.waitForLine(/Half the floor was locked out|Lovely work flagging|Hello there/i, 30000);
  if (!h1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Half the floor was locked out/i.test(h1.text)) throw new Error('wrong first line (not H1): ' + h1.text);
  mark('h1-audio-start', null, h1.start); mark('h1-audio-end', { durMs: h1.durMs }, h1.end); mark('h1-sentence1-end', { est: true }, h1.start + 2690);
  if (!tw.log.some(l => l.status === 200 && /audio/.test(l.ct) && /Half the floor/.test(l.text))) throw new Error('H1 not voiced by /tts: ' + JSON.stringify(tw.log));
  await sleep(120);
  await vw.stop(); await sw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
