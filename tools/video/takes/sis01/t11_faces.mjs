// t11_faces: chat portraits of the Ward 7 cast, one short hold each (the "faces" montage). Cast: patrol_nurse (Amy Clarke), bed4_patient (Mr T. Ahmed),
// bed2_patient (Ms A. Okafor), bed5_patient (Mrs Kowalski). Dr Hartley is in another room: t11c_hartley_face.
// Entry state: tools/video/takes/run-take.sh sis01 t11_faces "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Each chat: openChat, chat-rects (bar, choices, portrait boxes), hold 1 s on the portrait, close BEFORE any line that matters. Edit crop: bottom at y 850 (the dark
// bar gradient starts there), close X (x1876 y17) out of frame. The portrait box is logged per NPC for the crop.
// Marks: chat-open:<id>, face:<id> (speaker, voice lines heard so far, portrait box), frame:<id>_t+0.5, chat-closed:<id>, end.
import { sleep, watchVoice, prepare, sprite, openChat, markChatRects, visibleChoices } from './_sis01b.mjs';

export const CAST = ['patrol_nurse', 'bed4_patient', 'bed2_patient', 'bed5_patient'];
export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export async function face(page, bridge, mark, vw, id) {
  await openChat(bridge, mark, id);
  await sleep(300);
  await markChatRects(page, mark, 'chat-rects:' + id);
  mark('face:' + id, { speaker: (await bridge.getState()).dialogue?.speaker, choicesShown: await visibleChoices(page), linesHeard: (await vw.drain(), vw.lines.length) });
  await sleep(500); mark('frame:' + id + '_t+0.5');
  await sleep(500);
  await bridge.minigame.close().catch(() => {}); mark('chat-closed:' + id);
  await sleep(700);
}

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  for (const id of CAST) await face(page, bridge, mark, vw, id);
  await vw.stop(); mark('end');
};
