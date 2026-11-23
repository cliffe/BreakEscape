// t01_gwen_hook: the hook. Gwen's G2 "Heard you've been through the inbox. Some real traps in there lately." (3.94 s, cached) in her
// person-chat view, kit_key_caught unset (the not-caught branch; the caught branch says G3, a verdict). The chat is closed right after
// the line ends, so the "See you later." choice never shows, then a 1 s hold on the room.
// Entry state (fresh game, kiosk never touched; Gwen's caffeine need can send her to the coffee station within ~30 s, so the walk starts at once
// and her position is read live):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca01 t01_gwen_hook "--set kit_defend_done=true --set kit_attack_done=true" "--hide-hud --zoom-step 1"
// Walk: straight key legs (left along the row, then up) to just below Gwen, then interact. Falls back to moveToNear if the legs end out of range.
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, interact:*, talk, frame:npc-portrait-up, g2-subtitle-start, line-start/line-end,
//   g2-audio-start, g2-audio-end, menu-up (only if it showed before the close), chat-closed, end.
import { sleep, prepare, checkSprite, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles } from './_ca01.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'g2-subtitle-start', re: /Heard you.ve been through the inbox/i }]);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(600);
  await walkToNpc(bridge, 'kit_gwen_pritchard', mark);
  await talkTo(page, bridge, mark, 'kit_gwen_pritchard', /Gwen/i);
  const g2 = await vw.waitForLine(/Heard you.ve been through the inbox|Good spot on that bank|Hello there/i, 30000);
  if (!g2) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Heard you.ve been through/i.test(g2.text)) throw new Error('wrong first line (not G2): ' + g2.text);
  mark('g2-audio-start', null, g2.start); mark('g2-audio-end', { durMs: g2.durMs }, g2.end);
  await sleep(120);
  await vw.stop(); await sw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
