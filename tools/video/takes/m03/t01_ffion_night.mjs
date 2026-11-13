// t01_ffion_night (m03): voiced NPC beat, and the live rig's TTS proof. Ffion Rees, back for her charger at night in
// reception_lobby, puts the cover under pressure: "Oh! You made me jump..." / "Is Ms. Sterling expecting you this late?"
// (or, on a reopen before an answer, "Well? Is she expecting you?"); the player answers "She said to come back once the
// building was quiet." and she replies "Sounds like her. She does her best talking after hours. Night, then."
// Once answered, her night hub is the sticky "Night, Ffion." -> "Go on, I'm locking the drawer..." (the take handles both).
// Every line is heard in full (_live.mjs playThrough), all from the committed TTS cache.
// Entry state: LIVE game 82 (playtest03, m03, set 921, all flags in, night phase); no new game.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/82 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m03 t01_ffion_night "" "--zoom-step 1"
// Marks: walk-to-ffion, talk-open, choices-shown, choice:*, line-start:/line-end: per voiced line, ffion-reply-done,
//   tts-response {status, type, bytes, text} for every POST /tts (200 audio/mpeg = voiced), closed.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { watchTts, goRoom, playThrough } from './_live.mjs';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await goRoom(page, bridge, 'reception_lobby');
  const s = await bridge.getState();
  const f = s.nearby.find(n => n.id === 'ffion_rees');
  if (!f) throw new Error('Ffion not in reception_lobby');
  // stand a short walk south-west of her so the take opens on the player approaching
  await bridge.moveTo(f.x - 70, f.y + 60, { timeoutMs: 20000 });
  await sleep(800);
  console.error('SETUP', JSON.stringify({ ffion: f, player: (await bridge.getState()).player }));
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await sleep(1000);
  mark('walk-to-ffion');
  let r = await bridge.interact('ffion_rees', { timeoutMs: 20000 });
  let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 });
  if (!w || w.ok === false) { r = await bridge.interact('ffion_rees', { timeoutMs: 20000 }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }); }
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('talk-open');
  const step = /^(She said to come back once the building was quiet|Night, Ffion)/i;
  const lines = await playThrough(page, bridge, mark, vw, { steps: [step], timeoutMs: 60000 });
  const reply = lines.find(l => /best talking after hours|locking the drawer/i.test(l.text));
  if (!reply) throw new Error('her reply was not voiced: ' + JSON.stringify(lines.map(l => l.text)));
  mark('ffion-reply-done', { durMs: reply.durMs });
  await sleep(1500);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed', { tts });
  await sleep(1200);
  if (!tts.some(e => e.status === 200 && /audio/.test(e.type))) throw new Error('no voiced /tts answer: ' + JSON.stringify(tts));
};
