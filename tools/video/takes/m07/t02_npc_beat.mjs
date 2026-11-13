// t02_npc_beat (m07): one voiced NPC beat for the trailer. Opens an NPC and lets the opening voiced line(s) play in full,
// then STOPS at the first choice menu (commits no story choice), so the beat is replayable. Default target is Elena
// Rodriguez (elena_rodriguez) in server_room -- the conflicted engineer, voiced, the player's first face past the badge door.
// Alternatives (set NPC_ID): james_mercer ("Blackout", scada_control, cold), thomas_park (cable_vault, hostile).
// NOTE Elena's FIRST conversation is where she hands over the SCADA control-room password / the rule for the vault code
// (a story handoff). This beat stops at the first menu so it does not commit that branch; but if you want the handoff
// itself on camera, film it the first time the player meets her (one-shot) and note it in the handover. On a progressed
// game she re-offers hub lines after that handoff.
// Entry state: a LIVE m07 game past the server-zone badge reader (server_room reachable), NOT concluded. TTS on (keyed :3000).
// Record (LIVE mode):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/<game> STORAGE_STATE=<playtest01 login.mjs state> \
//   NPC_ID=elena_rodriguez tools/video/takes/run-take.sh m07 t02_npc_beat "" "--hide-hud --zoom-step 1"
// Marks: tts-response (per voiced line), npc-open, choices-shown/menu-reached, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, playThrough, goRoom } from './_live.mjs';

const NPC_ID = process.env.NPC_ID || 'elena_rodriguez';
// Room each supported NPC lives in (for the off-camera approach in setup).
const NPC_ROOM = { elena_rodriguez: 'server_room', james_mercer: 'scada_control', thomas_park: 'cable_vault' };

// A tiny "voice watcher" shim with the drain()/lines interface playThrough expects, backed by watchTts.
function makeVw(seen) {
  return { lines: seen, async drain() { return seen; } };
}

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const room = NPC_ROOM[NPC_ID] || 'server_room';
  // server_room sits past the (persisted-unlocked) badge door, reached through operations_floor.
  const route = room === 'server_room' ? ['operations_floor', 'server_room']
    : room === 'scada_control' ? ['operations_floor', 'server_room', 'scada_control']
    : ['operations_floor', 'server_room', 'generator_room', 'cable_vault'];
  await goRoom(page, bridge, route);
  console.error('SETUP room', (await bridge.getState()).player && (await bridge.getState()).player.room, 'target', NPC_ID);
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
