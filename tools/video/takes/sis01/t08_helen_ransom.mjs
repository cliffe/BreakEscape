// t08_helen_ransom: Helen Carver, hub "Is the Board thinking of paying?" -> ransom_talk line 1 (ea9420, "One point two million. The Board meets at nine, and they'll ask what the response team thinks.").
// Entry state: tools/video/takes/run-take.sh sis01 t08_helen_ransom "--start-room major_incident_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Fresh game. First talk (helen_met false): lines are skipped after 0.45 s, pick "I'll come back when I know more." (closes the chat). Talk again: the hub opens with the
// bark line "What else?" (voiced, skipped), pick "Is the Board thinking of paying?"; ransom_talk line 1 plays in full, the take closes the chat 0.4 s after it ends
// (line 2 "The note says don't call the police" never starts, and no choice is picked, so ransom_advice stays unset).
// The 12 f amount insert in the edit is cut from t02 (the station), not from here.
// Marks: choices-before-line (the hub list is on screen BEFORE the pick; the edit starts after the pick), bar-rect, helen_start, helen_end, frame:helen_t+N, chat-closed, end.
import { sleep, watchVoice, prepare, sprite, watchTts, playLine, openChat, markChatRects, skipToChoices, visibleChoices } from './_sis01b.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChat(bridge, mark, 'helen_carver');
  await skipToChoices(bridge, mark);
  const r1 = await bridge.minigame.choose(/I'll come back when I know more/i);
  if (!r1 || !r1.ok) throw new Error('choose 1 failed ' + JSON.stringify(r1).slice(0, 200));
  mark('choice:' + r1.chose);
  await sleep(900);
  if ((await bridge.getState()).dialogue) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('first-talk-closed');
  await openChat(bridge, mark, 'helen_carver');
  const d = await skipToChoices(bridge, mark);
  mark('hub-choices', { choices: d.choices.map(c => c.text) });
  await markChatRects(page, mark, 'hub-rects');
  await sleep(700);
  const vwMark = vw.lines.length;
  const r2 = await bridge.minigame.choose(/Is the Board thinking of paying/i);
  if (!r2 || !r2.ok) throw new Error('choose 2 failed ' + JSON.stringify(r2).slice(0, 200));
  mark('choice:' + r2.chose);
  await markChatRects(page, mark, 'bar-rect');
  mark('choices-before-line', await visibleChoices(page));
  await playLine(page, mark, vw, /One point two million/i, 'helen', [0.3, 1.0, 2.5, 4.0, 4.9]);
  await sleep(400);
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await vw.stop(); await sleep(500); mark('end');
};
