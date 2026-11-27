// t03_brief_cards: the kiosk's seven brief cards as drawn (16:9). Feeds welcome (card 1), how (card 2), real (card 3), record (card 4),
// habit (card 6) and report (card 7); card 5 "Why anyone targets you" is not used (held 2 s only).
// Entry state: fresh game, no flags (Skip tutorial and the Mission Brief closed in setup()).
//   BE_PORT=<port> tools/video/takes/run-take.sh ca00_first_play t03_brief_cards "" "--hide-hud --zoom-step 1"
// Path: interact training_kiosk (opens on card 1), hold each card with the mouse still, Next x6. Stops on card 7 without pressing "Got it"
// (the brief is not completed; the take ends on the last card). The mouse is never moved. Card 1 shows the scope note under its text.
// Holds (s): 7 on the used cards 1, 3, 4, 6, 7; 9 on card 2 (two VO lines, 8 s needed); 2 on card 5.
// Marks: interact:training_kiosk, card1 .. card7 (logged when "Card n of 7" is on screen: the edit's in points are mark + 0.2 s), end.
import { sleep, prepare, openKiosk, readCards } from './_ca00.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  await openKiosk(page, bridge, mark);
  await readCards(page, mark, [7, 9, 7, 7, 2, 7, 7]);
  mark('end');
};
