// t09c_archive: the evidence archive room, closed objects only: the underwriting cabinet (safe) and one closed exhibit folder (evidence_packet_a/b/c). Silent shot.
// Entry state: tools/video/takes/run-take.sh sis03 t09c_archive "--start-room meridian_evidence_archive --set briefing_played=true --set evidence_archive_unlocked=true" "--hide-hud --zoom-step 1"
// Tests that --start-room reaches the archive without the PIN lock. Nothing is opened: no reader, no cabinet PIN, no slip, no tap. ncsc_brief_envelope and the archive door are kept out of the crop.
// Marks: room (current room), player, objects (screen rects of the cabinet, packets A/B/C, pinboard, ncsc envelope: the edit crops to a packet and the cabinet and keeps the envelope out),
//   frame:archive_t0, frame:archive_t3, toast-seen / toast-watch-end, end.
import { sleep, prepare, watchToasts, objScreenRect, globals } from './_sis03.mjs';

export default async (page, bridge, mark) => {
  await prepare(page, bridge, mark);
  const tw = watchToasts(page, mark, 12000);
  const st = await bridge.getState();
  mark('room', { room: st.currentRoom || st.room, player: st.player, globals: await globals(bridge, ['evidence_archive_unlocked']) });
  const o = {}; for (const id of ['underwriting_cabinet', 'evidence_packet_a', 'evidence_packet_b', 'evidence_packet_c', 'network_diagram_pinboard', 'ncsc_brief_envelope']) o[id] = await objScreenRect(page, id);
  mark('objects', o);
  mark('frame:archive_t0'); await sleep(500);
  await sleep(3000); mark('frame:archive_t3'); await sleep(500);
  await tw;
  mark('end');
};
