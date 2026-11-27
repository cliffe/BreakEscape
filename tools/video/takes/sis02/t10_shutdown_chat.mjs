// t10_shutdown_chat: Helen, hub "Should we shut Hall 1 down now?" (side_a, Helen 6b0a5b "If I'm wrong, that's half the site off the grid and a penalty every hour.").
// Entry state: tools/video/takes/run-take.sh sis02 t10_shutdown_chat "--set anomaly_detected=true --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
// Actions: talk to helen_marsh, pick "Should we shut Hall 1 down now?", the line plays, END before any of the three choices is picked (close the chat the moment the line ends).
//   The bar, the three choices (Then press it / five minutes with the historian / Not sure yet) and the toast are cropped or hidden in the edit; the bar text is Helen's two sentences.
// Marks: sprite, choices-before-pick (hub list; must include the shutdown option), bar-rect, choices-before-line, shut_start/shut_end, frame:shut_t+N, bar-text (visible bar text at line start), tts, chat-closed, end.
import { sleep, watchVoice, prepare, sprite, watchTts, playLine, openChat, markChatRects, visibleChoices, pickChoice, awaitChoice } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  watchTts(page, mark); await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChat(bridge, mark, 'helen_marsh');
  const d = await awaitChoice(bridge, 30000);
  mark('choices-before-pick', { text: d && (d.text || '').slice(0, 120), choices: d && d.choices.map(c => c.text) });
  await pickChoice(bridge, /shut Hall 1 down now/i);
  await sleep(150);
  mark('choices-before-line', await visibleChoices(page));
  await markChatRects(page, mark, 'bar-rect');
  mark('bar-text', await page.evaluate(() => (document.querySelector('.person-chat-bar, [class*=dialogue-box], [class*=chat-bar], .person-chat-dialogue') || {}).innerText));
  await playLine(page, mark, vw, /half the site off the grid/i, 'shut', [0.3, 1.0, 2.0, 3.0, 4.0]);
  await sleep(250); mark('choices-after-line', await visibleChoices(page));
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await vw.stop(); await sleep(400); mark('end');
};
