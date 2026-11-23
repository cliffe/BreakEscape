// t11_lorna_end: the end shot (the script's "t07_lorna_photo second window"). Same entry state as t07_lorna_photo. After Look up, Lorna's bark L1 and then her ask L2
// ("It's all of us at our desks. Fine to post?", 3.29 s) start; once the L2 bubble is up (the ask cue) the take clicks Lorna (`__test.interact('kit_lorna_easton')`) so the
// chat opens on L2 in the portrait view with the game's own bar. The chat closes right after L2 ends, BEFORE the choice menu. No choice is ever picked (Delphine's D1 fires 8 s after a
// pick; the 45 s silent timer is not reached).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t11_lorna_end <step-away flags, see t07_lorna_photo> "--hide-hud --zoom-step 1"
// HAZARD (dry run): the bark audio L2 starts with the bubble and is cut when the chat opens (audio-end with cur < dur), then the chat plays L2 whole. The edit's in = chat l2_start - 0.1
//   or later than the bark's audio-end, so no bark fragment is audible.
// Marks: player-sprite, kiosk-open, look_up, l1_start, l2_bubble_start, interact:*, frame:npc-portrait-up, frame:portrait-held (chat still open, line ended: the portrait fully drawn), l2_start/l2_end (the chat's real voice edges), menu-up (if shown),
//   chat-closed, tts-response (per voiced line), end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, spriteCheck, watchTts, watchBarkAudio, talkTo, closeBeforeMenu } from './_ca14.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true) throw new Error('entry state wrong: kit_defend_done and kit_quiet must be true; got ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet }));
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark); const tw = await watchTts(page, mark); const aw = await watchBarkAudio(page, mark);
  await spriteCheck(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1000); mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let l1 = false, l2 = false;
  while (Date.now() - t0 < 20000 && !l2) {
    await bw.drain(); await aw.drain();
    if (!l1 && bw.seen.some(e => /lovely one of the team/i.test(e.text))) { l1 = true; mark('l1_start'); }
    if (bw.seen.some(e => /all of us at our desks/i.test(e.text.replace(/\s+/g, ' ')))) { l2 = true; mark('l2_bubble_start'); }
    await sleep(60);
  }
  if (!l2) { await bw.stop(); await tw.stop(); throw new Error('L2 bubble never seen'); }
  await bw.stop();
  // the ask cue is up; Lorna is clicked at once (the bark's own audio is cut when the chat opens: log audio-end:kit_lorna_easton, the edit's in must be after it)
  const vw = await watchVoice(page, mark);
  await talkTo(page, bridge, mark, 'kit_lorna_easton', /Lorna/i);
  const ln = await vw.waitForLine(/all of us at our desks/i, 15000);
  if (!ln) throw new Error('the chat did not open on L2; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  mark('l2_start', null, ln.start); mark('l2_end', { durMs: ln.durMs }, ln.end); mark('frame:portrait-held');
  await sleep(120);
  await vw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(300); await aw.stop(); await tw.stop();
  const voiced = tw.all.filter(l => l.status === 200 && /audio/.test(l.type || '') && l.bytes > 0);
  if (!voiced.some(l => /all of us at our desks/i.test(l.text))) throw new Error('L2 not voiced (no 200 audio bytes>0); tts: ' + JSON.stringify(tw.all));
  await sleep(700); mark('end');
};
