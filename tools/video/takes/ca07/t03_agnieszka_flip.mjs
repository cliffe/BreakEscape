// t03_agnieszka_flip: Agnieszka's A1 after the send: "Your message has gone over to accounts payable. Now take the other seat at the kiosk and cover the finance line
// the way a call like that would land." (9.62 s, cached; the edit uses the second sentence only, audio 3.00-9.23 s, in = 2.80 s). Person-chat view; the chat is closed right
// after the line, before the choice menu. The kiosk is never opened.
// Entry state: defend seed (ink needs phish_ceo_voice_target_attempts > 0 and defend not done):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca07_voice_ceo t03_agnieszka_flip "--set episode_e7_voice_ceo_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_ceo_voice_target_attempts=1" "--hide-hud --zoom-step 1"
// The take throws if the first line is not A1. Walk: key legs below Agnieszka (she stands about (5.5, 3.8)), then interact.
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, talk, frame:npc-portrait-up, a1-subtitle-start, a1-audio-start, a1-audio-end, tts, menu-up (if shown before the close), chat-closed, end.
import { sleep, prepare, checkSprite, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, watchVoice, watchTts } from './_ca07.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const tw = watchTts(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'a1-subtitle-start', re: /Your message has gone/i }, { name: 'a1-sentence2-subtitle', re: /Now take the other seat/i }]);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await walkToNpc(bridge, 'agnieszka_duda', mark);
  await talkTo(page, bridge, mark, 'agnieszka_duda', /Agnieszka/i);
  const a1 = await vw.waitForLine(/Your message has gone|Welcome to the Brightwell|Both ends done|Ring the person back|You didn.t release|You stopped/i, 30000);
  if (!a1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Your message has gone/i.test(a1.text)) throw new Error('first line is not A1: ' + a1.text);
  mark('a1-audio-start', null, a1.start); mark('a1-audio-end', { durMs: a1.durMs }, a1.end);
  await sleep(120);
  await vw.stop(); await sw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
