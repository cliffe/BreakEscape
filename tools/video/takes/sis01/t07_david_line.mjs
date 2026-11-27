// t07_david_line: David Osei, first talk in the major incident room. Feeds the david shot (7b904d, "My job is to stop cyber incidents turning into clinical ones.").
// Entry state: tools/video/takes/run-take.sh sis01 t07_david_line "--start-room major_incident_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Fresh game (the Bed 4 / ICO timers run from game start). Talks to David once; line 1 (7b904d) plays in full; the take closes the chat the moment line 1 ends,
// before line 2 ("Our safety case is a list of claims...") can start, so the hub choices never show.
// Marks: bar-rect (chat-rects, bar + choices + portrait boxes for the crop), choices-before-line (must be []), david_start, david_end, frame:david_t+N, chat-closed, end.
import { sleep, watchVoice, prepare, sprite, watchTts, playLine, openChat, markChatRects, visibleChoices } from './_sis01b.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChat(bridge, mark, 'david_osei');
  mark('choices-before-line', await visibleChoices(page));
  await markChatRects(page, mark, 'bar-rect');
  await playLine(page, mark, vw, /My job is to stop cyber incidents/i, 'david', [0.5, 3.0, 6.9, 9.5, 11.0]);
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await vw.stop(); await sleep(500); mark('end');
};
