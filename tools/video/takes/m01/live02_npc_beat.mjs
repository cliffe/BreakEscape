// live02_npc_beat (m01): one voiced NPC beat for the trailer. Opens an NPC and lets the opening voiced line(s) play in
// full, then STOPS at the first choice menu (commits no story choice), so the beat is replayable. Default target is the
// receptionist Sarah O'Brien (sarah_martinez) in reception_area - always reachable, voiced, and the player's first face.
// Alternatives (set NPC_ID): maya_chen (the informant, "You were right about Derek"), kevin_park (IT, lockpick + keycard).
// NOTE Sarah's FIRST conversation also hands over the Main Office Key + Visitor Badge; for a pure replayable voiced beat
// on a progressed game she re-offers hub lines after that handoff. If you want the handoff itself on camera, film it the
// first time the player meets her (one-shot) and note it in the handover.
// Entry state: LIVE game 90 (playtest04, m01, set 930). Replayable (no choice committed). TTS must be on (keyed :3000).
// Record (LIVE mode):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/90 STORAGE_STATE=<playtest04 login.mjs state> \
//   NPC_ID=sarah_martinez tools/video/takes/run-take.sh m01 live02_npc_beat "" "--hide-hud --zoom-step 1"
// Marks: tts-response (per voiced line), npc-open, choices-shown/menu-reached, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, playThrough } from './_live.mjs';

const NPC_ID = process.env.NPC_ID || 'sarah_martinez';

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
