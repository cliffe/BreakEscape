// t13_priya_mixer (m06, keyless): Priya Raghavan, target "You can't see through Monero. You don't need to. Watch what goes in and what comes out." (5.26 s). Ends at the line's end; chat closed before "The pool takes a cut...".
// Path: first chat menu [I'll find Dr Volkova, then.] > "Cheers." closes the chat; reopen > hub [How would you follow money through a mixer?] > mixer_matching first line. (First-meeting opener not read by the scout: TODO confirm.)
// Entry state (new-game): --imports=none --start-room blockchain_lab --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh <avatar> t13_priya_mixer "--imports=none --start-room blockchain_lab --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: conversation-open, choice:*, first-chat-done, conversation-open-2, monero-line (line marks), targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { openChat, pickMenu, closeAll } from './_conv.mjs';
const ID = 'blockchain_analyst';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(ID, { timeoutMs: 20000 }); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(900);
  await openChat(bridge, ID); mark('conversation-open');
  await pickMenu(bridge, /find Dr Volkova/i, mark);
  for (let i = 0; i < 60 && (await bridge.getState()).activeMinigame; i++) await sleep(250);
  mark('first-chat-done'); await sleep(1200);
  await openChat(bridge, ID); mark('conversation-open-2');
  const vw = await watchVoice(page, mark);
  await pickMenu(bridge, /follow money through a mixer/i, mark);
  const l = await vw.waitForLine(/You can't see through Monero/i, 20000);
  if (!l) throw new Error('Monero line never voiced');
  mark('monero-line', { durMs: l.durMs });
  await sleep(500); await vw.stop(); mark('targets-done');
  await closeAll(page, bridge);
};
