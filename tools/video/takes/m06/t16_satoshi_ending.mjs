// t16_satoshi_ending (m06, keyless): Satoshi Nakamoto II, the ending line "Murder's what they call it when you lose. The winners get statues." (4.66 s). Stops at the end of that line and closes the chat BEFORE mission_complete ("Call your police, then. I'll wait.").
// Route (picks file, "The ending route"): [funding ENTROPY] > [Need it most?] > [criminal with a manifesto] (plays the cached "Take me in..." line, a free fallback clip) > [leaving it running] > [The map's worth more] > arrest_finale > "Do you ever wonder..." > [No. Your ideology doesn't cover murder.] > target.
// Outcome menus (asset choice, final words) are on screen while picked: the edit keeps picture off them.
// Entry state (new-game): --imports=none --unlock executive_wing --unlock satoshi_office --start-room satoshi_office --set briefing_played=true --set found_architects_fund=true   (no minder flags, no cover_strained, Irina untouched)   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh <avatar> t16_satoshi_ending "<flags above>" "--hide-hud --zoom-step 1"
// Marks: conversation-open, choices-shown, choice:*, line-start:/line-end:, takeme-done, murder-done, targets-done. ONE-SHOT: the take never lets mission_complete play, but the game row is a throwaway.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { openChat, ttsPlaying, closeAll } from './_conv.mjs';
const ID = 'satoshi_nakamoto';
const STEPS = [/funding ENTROPY/i, /Need it most/i, /criminal with a manifesto/i, /leaving it running/i, /map.s worth more/i, /Your ideology doesn.t cover murder/i];
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(ID, { timeoutMs: 20000 }); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(900);
  const vw = await watchVoice(page, mark);
  await openChat(bridge, ID); mark('conversation-open');
  let ci = 0; const t0 = Date.now();
  while (Date.now() - t0 < 240000) {
    const s = await bridge.getState(); const d = s.dialogue;
    if (!d) { if (!s.activeMinigame && ci > 0) break; await sleep(150); continue; }
    if (await ttsPlaying(page)) { await sleep(100); continue; }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (ci === STEPS.length && /winners get statues/i.test(last)) {
      const l = await vw.waitForLine(/winners get statues/i, 20000); if (!l) throw new Error('ending line never voiced');
      mark('murder-done', { durMs: l.durMs }); await sleep(450); break;
    }
    if (d.awaitingChoice) {
      await vw.drain();
      if (ci >= STEPS.length) throw new Error('menu after last step');
      mark('choices-shown', { choices: d.choices.map(c => c.text) }); await sleep(900);
      const ch = await bridge.minigame.choose(STEPS[ci]); if (!ch || !ch.ok) throw new Error('choose failed ' + STEPS[ci] + ' ' + JSON.stringify(d.choices.map(c => c.text)));
      mark('choice:' + ch.chose); ci++; await sleep(300); continue;
    }
    if (/Take me in if you like/i.test(last)) { const l = await vw.waitForLine(/Take me in if you like/i, 20000); if (l) mark('takeme-done', { durMs: l.durMs }); }
    await sleep(150);
  }
  await vw.stop(); mark('targets-done');
  await closeAll(page, bridge); // out before mission_complete
};
