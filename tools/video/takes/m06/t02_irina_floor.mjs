// t02_irina_floor (m06): a voiced NPC beat with Dr Irina Volkova on the trading floor, and the live rig's TTS proof.
// The CTO is the mission's key NPC (she hands over the audit wordlist and, at the end, is recruited or detained). This
// take opens her hub and plays a voiced exchange in full. It picks the door-access topic ("Tell me about your door
// access.") when it is still on offer, which is a voiced beat that sets up the badge/exec-wing path; if that topic has
// already been taken it falls through to her voiced hub greeting and stops at the menu. Every line is heard in full
// (_live.mjs playThrough), and watchTts proves at least one POST /tts returned audio.
// It never advances the ending: no recruitment, no reveal, no exec-badge handover.
// Entry state: LIVE game 89 (playtest03, m06, set 915, all four flags submitted); no new game.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/89 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m06 t02_irina_floor "" "--zoom-step 1"
// Marks: walk-to-irina, talk-open, choices-shown, choice:*, line-start:/line-end: per voiced line, irina-reply-done,
//   tts-response {status, type, bytes, text} for every POST /tts (200 audio/mpeg = voiced), closed.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { watchTts, goRoom, playThrough } from './_live.mjs';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await goRoom(page, bridge, 'trading_floor');
  const s = await bridge.getState();
  const f = s.nearby.find(n => n.id === 'irina_volkova');
  if (!f) throw new Error('Irina not in trading_floor');
  // stand a short walk south of her so the take opens on the player approaching
  await bridge.moveTo(f.x, f.y + 70, { timeoutMs: 20000 });
  await sleep(800);
  console.error('SETUP', JSON.stringify({ irina: f, player: (await bridge.getState()).player }));
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await sleep(1000);
  mark('walk-to-irina');
  let r = await bridge.interact('irina_volkova', { timeoutMs: 20000 });
  let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 });
  if (!w || w.ok === false) { r = await bridge.interact('irina_volkova', { timeoutMs: 20000 }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }); }
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('talk-open');
  // Take the door-access topic if present; playThrough stops at the first menu after the last named step.
  const step = /Tell me about your door access/i;
  const lines = await playThrough(page, bridge, mark, vw, { steps: [step], timeoutMs: 70000 });
  mark('irina-lines', { count: lines.length });
  await sleep(1500);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed', { tts });
  await sleep(1200);
  if (!tts.some(e => e.status === 200 && /audio/.test(e.type))) throw new Error('no voiced /tts answer: ' + JSON.stringify(tts));
};
