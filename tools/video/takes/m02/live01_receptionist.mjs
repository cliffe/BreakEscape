// live01_receptionist (m02): one voiced NPC beat for the trailer. Opens the reception receptionist (Bernie Nwosu,
// npc id `receptionist`) in reception_lobby - the player's first face in the hospital - and lets the opening voiced
// line(s) play in full, then STOPS at the first choice menu (commits no story choice), so the beat is replayable.
// NOTE the receptionist's FIRST conversation hands over the honest opener / IT Department Override Key path; on a
// progressed game she re-offers hub lines. On game 93 (fresh start, briefing already played) this is her opening.
// No flag value, password or credential is on screen - story dialogue only.
// Entry state: LIVE game 93 (playtest03, m02, set 931), at the mission start (reception_lobby). Replayable (no choice
// committed). TTS must be on (keyed :3000) - watchTts logs each voiced line as a mark.
// Record (LIVE mode, see tools/video/takes/run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/93 STORAGE_STATE=<playtest03 login.mjs state> \
//   BE_DISPLAY=99 tools/video/takes/run-take.sh m02 live01_receptionist "" "--hide-hud --zoom-step 1"
// Marks: tts-response (per voiced line), npc-open, choices-shown/menu-reached, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, playThrough } from './_live.mjs';

const NPC_ID = process.env.NPC_ID || 'receptionist';

// A tiny "voice watcher" shim with the drain()/lines interface playThrough expects, backed by watchTts.
function makeVw(seen) {
  return { lines: seen, async drain() { return seen; } };
}

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('SETUP room', s.player && s.player.room, 'target', NPC_ID);
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const seen = watchTts(page, mark);
  const vw = makeVw(seen);
  await sleep(1000);
  await bridge.moveToNear(NPC_ID, { timeoutMs: 20000 }).catch(() => {});
  await sleep(500);
  const r = await bridge.interact(NPC_ID, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('could not open NPC ' + NPC_ID + ' ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForDialogue({ timeoutMs: 10000 }).catch(() => {});
  mark('npc-open', { id: NPC_ID });
  // steps: [] -> hear the opening line(s), then stop at the first menu (no choice committed).
  await playThrough(page, bridge, mark, vw, { steps: [], settleMs: 1100, timeoutMs: 60000 });
  await sleep(2500);
  mark('linger-end', { voicedLines: seen.filter(e => e.status === 200 && /audio/.test(e.type)).length });
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
