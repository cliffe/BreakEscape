// t03_owen_network (m05): a voiced NPC beat with Owen Gallagher (sysadmin) in open_office_area. The player walks up to
// Owen, opens the conversation, and plays through one informational, replayable hub topic in full voice ("Walk me through
// the network"), then stops at the next menu without advancing the story. Owen is voiced (#speaker:owen_gallagher).
// This topic is a non-gating ASK (it does not clone the badge, hand the password, or name a suspect), so it is replayable.
// VALIDATED (film pass 2026-11-13, game 86): Owen's opening menu is the hub directly; the "Walk me through the network."
// topic plays three voiced lines (audio/mpeg 200s) and returns to the hub menu. One step is enough.
// Entry state: LIVE game 86 (playtest01, m05, set 924, all four flags in); no new game. Replayable (informational topic).
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/86 STORAGE_STATE=<playtest01 login.mjs state> \
//   tools/video/takes/run-take.sh m05 t03_owen_network "" ""      (no --hide-hud: natural framing of the office beat)
// Marks: at-owen, chat-open, choices-shown, choice:<text>, menu-reached, linger-end, closed; tts-response per voiced line.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, watchTts, playThrough } from './_live.mjs';

const OWEN = 'owen_gallagher';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await goRoom(page, bridge, ['main_corridor', 'open_office_area']);
  const m = await bridge.moveToNear(OWEN, { timeoutMs: 20000 });
  if (!m || !m.ok) throw new Error('moveToNear owen ' + JSON.stringify(m).slice(0, 200));
  await sleep(600);
}

export default async (page, bridge, mark) => {
  const vw = { lines: [], drain: async () => {} };
  const seen = watchTts(page, mark);
  await sleep(1000);
  mark('at-owen', { player: (await bridge.getState()).player });
  const r = await bridge.interact(OWEN, { approach: false, timeoutMs: 20000 });
  await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }).catch(() => {});
  mark('chat-open', { ok: r && r.ok });
  await sleep(1200);
  // Owen's opening menu IS the hub (confirmed on the film pass: no separate intro->hub step). Each ASK topic is
  // sticky ({not topic_X}), so pick an informational, non-gating topic that is still available and plays in full
  // voice: "Where are the security gaps?" (ask_security) - two to three voiced lines, then back to the hub menu.
  await playThrough(page, bridge, mark, vw, {
    steps: [/Where are the security gaps|security gaps|gaps/i],
    dwellMs: 1600, settleMs: 900, timeoutMs: 120000,
  });
  mark('linger-end', { tts: seen.length });
  await sleep(2500);
  for (let i = 0; i < 5 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed', { ttsResponses: seen.length });
  await sleep(800);
  if (seen.filter(e => e.status === 200 && (e.type || '').startsWith('audio')).length === 0) {
    throw new Error('no voiced line played (no audio TTS response) - check this game runs against the keyed :3000 server');
  }
};
