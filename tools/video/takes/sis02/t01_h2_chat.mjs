// t01_h2_chat: Helen's hydrogen line in the person-chat (hook, first 2.0 s of the shot; clip 46aae3).
// Feeds: hook (Helen 46aae3, one continuous window 0.04 to 5.38; hook = clip 0.04-4.04, "That's cells venting" continues over t03_alarm_panel).
// Entry state: tools/video/takes/run-take.sh sis02 t01_h2_chat "--set hydrogen_alarm=true --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
//   (--set fires no events: no phone text, no aim toast, no auto bark; helen_briefed=true so Helen's start knot does not replay and no timer starts.)
// Actions: talk to helen_marsh, pick "The hydrogen alarm. How bad is it?", let 46aae3 play (three sentences, 5.57 s), close the chat the moment it ends,
//   before line 2 (052e02, "At two per cent we evacuate...", the ESD instruction follows it).
// The hub choice buttons are on screen BEFORE the pick: the shot must start after the pick (choices-before-pick lists them; choices-before-line must be []).
// Marks: bar-rect (bar, choices, portrait boxes at the moment line 1 starts), choices-before-pick, choices-before-line, hook_start/hook_end (the voice's own clock),
//   frame:hook_t+N, tts (every POST /tts answer), chat-closed, end.
import { sleep, watchVoice, prepare, sprite, watchTts, playLine, openChat, markChatRects, visibleChoices, pickChoice, awaitChoice } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChat(bridge, mark, 'helen_marsh');
  const d = await awaitChoice(bridge, 30000);
  mark('choices-before-pick', { speaker: d && d.speaker, text: d && (d.text || '').slice(0, 120), choices: d && d.choices.map(c => c.text) });
  await pickChoice(bridge, /hydrogen alarm/i);
  await sleep(150);
  mark('choices-before-line', await visibleChoices(page));
  await markChatRects(page, mark, 'bar-rect');
  await playLine(page, mark, vw, /Hydrogen's at one per cent/i, 'hook', [0.3, 1.0, 2.0, 3.0, 3.9, 4.4]);
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await vw.stop(); await sleep(400); mark('end');
};
