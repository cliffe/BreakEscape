// t02_darren_hello (FALLBACK hook, only if the owner prefers Darren to the borrowed Delphine line): Darren's greeting "Welcome aboard. Good to have
// you on the floor with us." (L1, 3.58 s, cached). Person-chat view. Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 BE_PORT=<port> tools/video/takes/run-take.sh ca00_first_play t02_darren_hello "" "--hide-hud --zoom-step 1"
// Marks: player-sprite, start-hold, interact:kit_darren_price, frame:npc-portrait-up, l1_start, l1_end, chat-closed, end. Cut in at l1_start - 0.2.
import { sleep, prepare, checkSprite, interactRetry, waitNpcPortrait } from './_ca00.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Darren/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'kit_darren_price', mark);
  await up;
  const l = await vw.waitForLine(/Welcome aboard/i, 30000);
  if (!l) throw new Error('L1 never voiced; heard: ' + JSON.stringify(vw.lines.map(x => x.text)));
  mark('l1_start', null, l.start); mark('l1_end', { durMs: l.durMs }, l.end);
  await sleep(300);
  await vw.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await sleep(1000); mark('end');
};
