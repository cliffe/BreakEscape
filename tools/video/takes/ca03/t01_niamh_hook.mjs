// t01_niamh_hook: the hook. Niamh's H1 "Helpdesk's had a run of odd reset calls lately. Keeps us all on our toes." (5.74 s cached) in her person-chat view, not-caught branch.
// Only the FIRST sentence is used: its audio ends 3.79 s into the clip (speech from 0.31 s, silence 3.79 to 4.32 s, measured with ffmpeg silencedetect -25 dB), so the edit cuts at
// h1-audio-start + 3.79 + 0.15 and burns the sentence as the caption. The chat is closed right after the line, so the choice menu never shows, then a 1 s hold on the room.
// Entry state (fresh game, kiosk never touched):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca03_helpdesk_reset t01_niamh_hook "--set kit_defend_done=true --set kit_attack_done=true" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, interact:*, talk, frame:npc-portrait-up, h1-subtitle-start, line-start/line-end, tts-response, h1-audio-start, h1-audio-end,
//   h1-sentence1-end (= h1-audio-start + 3.79), menu-up (only if it showed before the close), chat-closed, end.
import { sleep, prepare, spriteCheck, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, watchTts2 as watchTts } from './_ca03.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true || g.kit_key_caught === true) throw new Error('entry state wrong (need kit_defend_done, not caught): ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught }));
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'h1-subtitle-start', re: /Helpdesk's had a run of odd reset/i }]);
  await spriteCheck(page, mark);
  mark('start-hold'); await sleep(600);
  await walkToNpc(bridge, 'kit_niamh_doherty', mark);
  await talkTo(page, bridge, mark, 'kit_niamh_doherty', /Niamh/i);
  const h1 = await vw.waitForLine(/Helpdesk's had a run of odd reset|Lovely work|Hello there/i, 30000);
  if (!h1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Helpdesk's had a run of odd reset/i.test(h1.text)) throw new Error('wrong first line (not H1): ' + h1.text);
  mark('h1-audio-start', null, h1.start); mark('h1-audio-end', { durMs: h1.durMs }, h1.end); mark('h1-sentence1-end', { est: true }, h1.start + 3790);
  if (!tw.log.some(l => l.status === 200 && /audio/.test(l.ct) && /Helpdesk's had/.test(l.text))) throw new Error('H1 not voiced by /tts: ' + JSON.stringify(tw.log));
  await sleep(120);
  await vw.stop(); await sw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
