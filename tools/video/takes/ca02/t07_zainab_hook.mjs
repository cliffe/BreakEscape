// t07_zainab_hook: the hook. Zainab's after-defend talk, else-branch (enable-content card missed), person-chat view. Only the FIRST sentence is used:
// "Heard HR had a scare with an application." (the full line is "... Easy to click when the inbox is heaving.", 5.42 s cached; speech 0.20 to 2.69 s, silence 2.69 to 3.04 s
// by silencedetect on the clip). The edit cuts at h1-audio-start + 2.69 + 0.15 and burns the sentence as the caption. The chat is closed right after the line, so the choice
// menu never shows, then a 1 s hold on the room. A one-shot state: retake on a fresh game.
// Entry state (defend done, enable-content card NOT caught: no kit_key_caught, no kit_ca02_cv_choice, no kit_ca02_moved/out; Look up never pressed):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca02_cv_lures t07_zainab_hook "--set episode_e2_cv_lures_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]} --set episode_e2_cv_lures_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, interact:*, talk, frame:npc-portrait-up, z1-subtitle-start, line-start/line-end, tts-response, z1-audio-start,
//   z1-audio-end, z1-sentence1-end (= z1-audio-start + 2.69, est from the clip), menu-up (only if it showed before the close), chat-closed, end.
import { sleep, prepare, spriteCheck, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, watchTts2 as watchTts } from './_ca02.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_key_caught === true || g.kit_caught === true) throw new Error('entry state wrong (need kit_defend_done, not caught): ' + JSON.stringify({ d: g.kit_defend_done, k: g.kit_key_caught, c: g.kit_caught, ep: g.kit_ep }));
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'z1-subtitle-start', re: /Heard HR had a scare/i }]);
  await spriteCheck(page, mark);
  mark('start-hold'); await sleep(600);
  await walkToNpc(bridge, 'kit_zainab_hussain', mark);
  await talkTo(page, bridge, mark, 'kit_zainab_hussain', /Zainab/i);
  const z1 = await vw.waitForLine(/Heard HR had a scare|Nice catch|Welcome|Hello/i, 30000);
  if (!z1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Heard HR had a scare/i.test(z1.text)) throw new Error('wrong first line (not the else-branch hook): ' + z1.text);
  mark('z1-audio-start', null, z1.start); mark('z1-audio-end', { durMs: z1.durMs }, z1.end); mark('z1-sentence1-end', { est: true }, z1.start + 2690);
  if (!tw.log.some(l => l.status === 200 && /audio/.test(l.ct) && /Heard HR had a scare/.test(l.text))) throw new Error('hook line not voiced by /tts: ' + JSON.stringify(tw.log));
  await sleep(120);
  await vw.stop(); await sw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
