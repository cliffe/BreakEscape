// t03_recruiter_call (m09): the recruiter phone-call payoff beat. With the cage open, stepping into reading_room
// trips a voiced phone call from the recruiter. The take walks into reading_room, lets the call play in full
// (every voiced line heard), takes the conversation's choices to their conclusion, and leaves. This is a required
// story gate (it sets deck_choice_made, which the tape-room reader needs), so the take advances the live game by
// exactly one beat and does not finish the mission.
// Entry state: LIVE game 87 (playtest04, m09, set 918), cage_opened true, deck_choice_made false. ONE-SHOT (the call
// plays once): if re-run after deck_choice_made it will simply find no call. Not freely replayable.
// Record (LIVE mode):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/87 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m09 t03_recruiter_call "" "--hide-hud --zoom-step 1"
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, watchTts, playThrough } from './_live.mjs';

let tts = null;

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  // Reach reading_room's doorway WITHOUT entering it yet (so the call is captured from the first frame in-room).
  await goRoom(page, bridge, ['open_stacks']);
  console.error('SETUP room', (await bridge.getState()).player.room);
}

export default async (page, bridge, mark) => {
  tts = watchTts(page, mark);
  const vw = { lines: [], async drain() {} };
  await sleep(1000);
  mark('enter-reading-room');
  await goRoom(page, bridge, ['reading_room']);
  await sleep(1500);
  mark('in-room', { dialogue: !!(await bridge.getState()).dialogue });
  // Play the call through, choosing in order: "Go on", then option 1, then option 1.
  const steps = ['Go on', 1, 1];
  const lines = await playThrough(page, bridge, mark, vw, { steps, dwellMs: 1500, settleMs: 950, timeoutMs: 150000 });
  mark('call-played', { lines: lines.length });
  await sleep(1200);
  // Close out the conversation cleanly.
  for (let i = 0; i < 8 && (await bridge.getState()).dialogue; i++) {
    const closed = await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^(End Conversation|Close|×|Skip \[SPACE\]|Skip)$/.test(e.textContent.trim()));
      if (el) { el.click(); return el.textContent.trim(); }
      return null;
    }).catch(() => null);
    mark('close-click', { closed });
    await sleep(700);
  }
  const deck = await page.evaluate(() => window.gameState && window.gameState.globalVariables && window.gameState.globalVariables.deck_choice_made).catch(() => null);
  mark('deck-choice-made', { deck });
  const voiced = (tts || []).filter(e => e.status === 200 && /audio/.test(e.type || ''));
  mark('tts-summary', { responses: (tts || []).length, voicedOk: voiced.length });
  if (deck !== true) throw new Error('deck_choice_made not set after call (deck=' + deck + ')');
};
