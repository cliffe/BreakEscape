// t01_anjali_hook: the cold open (replaces t01_chatter_hook: the cooler chatter never fires for a lone drinker, owner decision 23 Nov).
// PLACEHOLDER (owner question): hook. Anjali's first sentence in person-chat, "Had a device pulled for a dodgy download today." (cached; speech 0.26 to 3.27 s of the
// 6.17 s clip; the second sentence "The fake check looked genuine enough." is NOT used: it is a tell). Runner-up: Darren "Had a laptop out of action this week." (0.26 to 2.52 s of 5.33 s).
// Entry state: defend done (the ink's ca10 knot needs kit_defend_done and kit_ep ca10; kit_ca10_moved false). The kiosk is never opened, Look up never pressed.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t01_anjali_hook "--set episode_e10_downloads_and_fake_checks_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\",\"defend\"]} --set episode_e10_downloads_and_fake_checks_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e10_downloads_and_fake_checks_defend_percent=100" "--hide-hud --zoom-step 1"
// Never click in the chat (the choice is "See you later."). The edit cuts in at n_start - 0.3 and out at n_start + 3.4 (sentence one ends at +3.0 of speech); the take closes the chat after the first
// sentence has played, before the second sentence's words are needed.
// Marks: player-sprite, start-hold, interact, npc_portrait_up, frame:npc-portrait-up, hook_start (voiced line start), hook_end, tts, chat-closed, end.
import { sleep, prepare, interactRetry, waitNpcPortrait, checkSprite, closeBeforeMenu, watchVoice, watchTts } from './_ca10.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
  await sleep(400);
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const tw = watchTts(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Anjali/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'kit_anjali_rao', mark);
  await up; mark('npc_portrait_up'); mark('frame:npc-portrait-up');
  const l = await vw.waitForLine(/Had a device pulled|Hello\. Grab a drink|Well caught|Nicely done/i, 30000);
  if (!l) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(x => x.text)));
  if (!/Had a device pulled for a dodgy download today/i.test(l.text)) throw new Error('wrong line: ' + l.text);
  mark('hook_start', { text: l.text.slice(0, 60) }, l.start); mark('hook_end', { durMs: l.durMs }, l.end);
  await sleep(120);
  await vw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(800); mark('end');
};
