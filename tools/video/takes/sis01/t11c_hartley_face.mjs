// t11c_hartley_face: Dr Fiona Hartley's chat portrait (dr_hartley, major_incident_room), same hold as t11_faces.
// Entry state: tools/video/takes/run-take.sh sis01 t11c_hartley_face "--start-room major_incident_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks as t11_faces for id dr_hartley. Crop bottom y 850, X out.
import { sleep, watchVoice, prepare, sprite } from './_sis01b.mjs';
import { face } from './t11_faces.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await face(page, bridge, mark, vw, 'dr_hartley');
  await vw.stop(); mark('end');
};
