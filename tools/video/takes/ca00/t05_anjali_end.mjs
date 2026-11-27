// t05_anjali_end: Anjali after the brief is done: "That's you set. Start your first episode whenever you're ready, and report anything that
// doesn't sit right." (L4, 6.65 s, cached). Person-chat view with the game's bar. The edit cuts before the reply menu ("Thanks, Anjali.").
// Entry state: fresh game, no flags. setup() finishes the brief off camera (kiosk, seven cards, Got it, close) so the real flag is set by play;
// no --set is used (a --set fires no events, so the objective would stay open).
//   BE_SPRITE=female_office_worker_v2 BE_PORT=<port> tools/video/takes/run-take.sh ca00_first_play t05_anjali_end "" "--hide-hud --zoom-step 1"
// The take refuses if the first line voiced is not L4 (L3, the welcome line, means the brief was not counted).
// Marks: player-sprite, start-hold, interact:anjali_rao, frame:npc-portrait-up, line-start/line-end per line, l4_start (the cut-in is about
// l4_start - 0.25 s), l4_end, menu-up (if it shows), chat-closed, end.
import { sleep, prepare, finishBrief, checkSprite, interactRetry, waitNpcPortrait } from './_ca00.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await finishBrief(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Anjali/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'anjali_rao', mark);
  await up;
  const l = await vw.waitForLine(/That's you set|Welcome\. I'm Anjali/i, 30000);
  if (!l) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(x => x.text)));
  if (!/That's you set/.test(l.text)) throw new Error('first line is not L4: ' + l.text);
  mark('l4_start', null, l.start); mark('l4_end', { durMs: l.durMs }, l.end);
  await sleep(150);
  const d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice) mark('menu-up');
  await vw.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await sleep(1000); mark('end');
};
