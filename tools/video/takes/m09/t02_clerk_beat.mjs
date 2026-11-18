// t02_clerk_beat (m09): a short voiced beat with the night clerk Cody Old Coyote (old_coyote) in open_stacks.
// The player approaches the front desk; the clerk challenges (voiced). The take lets his opening voiced lines play
// in full, holds at the first choice menu WITHOUT picking (so it changes no state / stays replayable), then leaves.
// Purpose: a voiced NPC beat for the trailer AND a live proof that the keyed server voices lines (watchTts marks).
// Entry state: LIVE game 87 (playtest04, m09, set 918); cover already set, so the clerk is still on his round. Replayable.
// Record (LIVE mode):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/87 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m09 t02_clerk_beat "" "--hide-hud --zoom-step 1"
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, watchTts, playThrough } from './_live.mjs';

const NPC = 'old_coyote';
let tts = null;

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await goRoom(page, bridge, ['open_stacks']);
  console.error('SETUP room', (await bridge.getState()).player.room);
}

export default async (page, bridge, mark) => {
  tts = watchTts(page, mark);
  const vw = { lines: [], async drain() {}, };
  await sleep(1200);
  mark('approach');
  // Approaching the desk trips player_spotted → the clerk's challenge conversation. Nudge it with an interact too.
  await bridge.moveToNear(NPC, { timeoutMs: 20000 }).catch(e => console.error('moveToNear', String(e)));
  await sleep(1200);
  let s = await bridge.getState();
  if (!s.dialogue && !s.activeMinigame) {
    await bridge.interact(NPC, { approach: true, timeoutMs: 20000 }).catch(e => console.error('interact', String(e)));
    await sleep(1000);
  }
  mark('conversation-open', { dialogue: !!(await bridge.getState()).dialogue });
  // Play the opening voiced lines; stop at the FIRST choice menu without choosing (no state change).
  const lines = await playThrough(page, bridge, mark, vw, { steps: [], dwellMs: 1400, settleMs: 900, timeoutMs: 60000 });
  mark('lines-heard', { count: lines.length });
  await sleep(1500);
  // Leave the conversation without committing a choice.
  for (let i = 0; i < 6 && (await bridge.getState()).dialogue; i++) {
    const closed = await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^(End Conversation|Close|×)$/.test(e.textContent.trim()));
      if (el) { el.click(); return el.textContent.trim(); }
      return null;
    }).catch(() => null);
    mark('leave-click', { closed });
    await sleep(700);
  }
  mark('closed', { dialogue: !!(await bridge.getState()).dialogue });
  await sleep(600);
  const voiced = (tts || []).filter(e => e.status === 200 && /audio/.test(e.type || ''));
  mark('tts-summary', { responses: (tts || []).length, voicedOk: voiced.length });
  if (voiced.length === 0) throw new Error('no voiced TTS response captured (tts=' + JSON.stringify(tts).slice(0, 300) + ')');
};
