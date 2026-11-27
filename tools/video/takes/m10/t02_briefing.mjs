// t02_briefing (m10): the opening, voiced briefing with Director Magnus Netherton in forward_post (the spawn room).
// A fresh (non-concluded) m10 game opens straight into this person-chat cutscene. The take records it voiced,
// lets every TTS line finish, picks the first option at any menu (so briefing_played is set and the cutscene
// closes), then holds briefly. ONE-SHOT: skipIfGlobal: briefing_played blocks a replay, so this must run on a
// fresh game before any other drive consumes the briefing. Does NOT finish the mission.
// No secret is on screen (story dialogue only).
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/92 STORAGE_STATE=<playtest01 login.mjs state> \
//   BE_DISPLAY=93 tools/video/takes/run-take.sh m10 t02_briefing "" "--zoom-step 1"
// Marks: briefing-start, tts-response (per voiced line), choose:*, briefing-closed, end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts } from '../m03/_live.mjs';

const ttsPlaying = (page) => page.evaluate(() => {
  const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
  return !!(mg && mg.ttsManager && mg.ttsManager.playing);
}).catch(() => false);

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  // Wait for the briefing person-chat to be up (bootstrap resumes into it).
  for (let i = 0; i < 40; i++) {
    const s = await bridge.getState();
    if (s.dialogue || (s.activeMinigame && /chat/i.test(s.activeMinigame.type || ''))) break;
    await sleep(500);
  }
  await sleep(600);
}

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sleep(1200);
  mark('briefing-start', { minigame: (await bridge.getState()).activeMinigame?.title });
  const seen = new Set();
  let lastText = null, quietSince = Date.now(), picks = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 240000) {
    const s = await bridge.getState();
    const d = s.dialogue;
    if (!d) {
      if (!s.activeMinigame) break;        // conversation closed
      await sleep(200); continue;
    }
    if (await ttsPlaying(page)) { quietSince = Date.now(); await sleep(120); continue; }
    if (d.awaitingChoice && (d.choices || []).length) {
      const labels = d.choices.map((c) => c.text || '');
      let idx = labels.findIndex((l) => !seen.has(l));
      if (idx < 0) idx = 0;
      seen.add(labels[idx]);
      mark('choose:' + (picks + 1), { pick: labels[idx] });
      await sleep(1200);
      await bridge.minigame.chooseIndex(idx + 1).catch(() => {});
      if (++picks >= 12) { mark('max-picks'); break; }
      quietSince = Date.now();
      await sleep(500);
      continue;
    }
    const txt = d.text || '';
    if (txt !== lastText) { lastText = txt; quietSince = Date.now(); }
    if (d.canContinue && Date.now() - quietSince > 1000) {
      await bridge.minigame.continue_().catch(() => {});
      quietSince = Date.now();
    }
    await sleep(150);
  }
  mark('briefing-closed');
  await sleep(2500);
  mark('end');
};
