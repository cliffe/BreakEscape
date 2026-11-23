// t12_esd_chat: Helen, hub "Tell me about the emergency shutdown." (mechanic beat audio, Helen 849f3b "There's a station by the hall door, one on my console and one inside. Anybody can press one. Nobody needs to ask." = line 4 of esd_explanation; line 1 is 640ace).
// Entry state: tools/video/takes/run-take.sh sis02 t12_esd_chat "--set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
// Actions: talk to helen_marsh, pick the ESD topic, Continue through lines 1-3 after a 0.45 s dwell (each voiced), line 4 plays in full (marks), close the chat BEFORE the cost question is picked.
//   The picture for the mechanic beat comes from t09; this take is audio plus Helen's face. Bar cropped.
// Marks: sprite, choices-before-pick, line-text (every line seen), esd_start/esd_end (849f3b), bar-rect, frame:esd_t+N, bar-text, tts, chat-closed, end.
import { sleep, watchVoice, prepare, sprite, watchTts, playLine, openChat, markChatRects, pickChoice, awaitChoice } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  watchTts(page, mark); await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChat(bridge, mark, 'helen_marsh');
  const d = await awaitChoice(bridge, 30000);
  mark('choices-before-pick', { choices: d && d.choices.map(c => c.text) });
  await pickChoice(bridge, /emergency shutdown/i);
  const re = /station by the hall door/i; const t0 = Date.now(); let seen = '';
  while (Date.now() - t0 < 60000) {
    const s = (await bridge.getState()).dialogue; const last = s && ((s.text || '').split('\n').filter(Boolean).pop() || '');
    if (last && last !== seen) { seen = last; mark('line-text', { text: last.slice(0, 90) }); }
    if (last && re.test(last)) break;
    if (s && s.canContinue) { await sleep(450); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(120);
  }
  await markChatRects(page, mark, 'bar-rect');
  mark('bar-text', await page.evaluate(() => (document.querySelector('.person-chat-bar, [class*=dialogue-box], [class*=chat-bar], .person-chat-dialogue') || {}).innerText));
  await playLine(page, mark, vw, re, 'esd', [0.3, 1.0, 2.0, 3.0, 4.0, 5.0]);
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await vw.stop(); await sleep(400); mark('end');
};
