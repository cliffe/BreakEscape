// t04_ending_debrief (m07): continuation of t03 (the abort + HaX call were filmed there; the closing debrief did not start
// because it opens on the next room entry or UI close). setup() deliberately walks NOWHERE (a room entry starts the debrief,
// which must happen on camera). On camera: enter the adjacent room -> debrief -> End the mission -> credits.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, goRoom } from './_live.mjs';

const CONSOLE_ID = 'crisis_control_system';
const PHONE_NAME = 'Your Phone';

const ttsPlaying = (page) => page.evaluate(() => {
  const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
  return !!(mg && mg.ttsManager && mg.ttsManager.playing);
}).catch(() => false);

const getGlobal = (bridge, name) => bridge.eval((n) => window.gameState?.globalVariables?.[n], name).catch(() => undefined);

/**
 * Generic voiced-dialogue driver (copied from m01 live04_finale). Lets every TTS line finish, handles the
 * ending-check overlay (hold then "End the mission"), continues through lines, and picks a choice at each
 * menu: a `preferred` regex first, then the first option not yet taken. Breaks on `until()`, on the dialogue
 * staying closed for closedBreakMs, on maxPicks, or on timeout.
 */
async function driveDialogue(page, bridge, mark, label, {
  preferred = [], until = async () => false, settleMs = 1100, holdOverlayMs = 3200,
  closedBreakMs = 4000, maxPicks = 60, timeoutMs = 240000,
} = {}) {
  const seen = new Set();
  let lastText = null, quietSince = Date.now(), picks = 0, closedSince = null;
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await until()) { mark(label + ':until-met'); return; }
    const overlay = await page.evaluate(() => {
      const el = document.getElementById('ending-check-overlay');
      if (!el || el.offsetParent === null) return null;
      const items = Array.from(el.querySelectorAll('li, .ending-check-item, .objective'))
        .map((n) => (n.textContent || '').trim()).filter(Boolean);
      return { items };
    }).catch(() => null);
    if (overlay) {
      mark(label + ':ending-check', { items: overlay.items.slice(0, 12) });
      await sleep(holdOverlayMs);
      await page.evaluate(() => document.querySelector('#ending-check-end')?.click()).catch(() => {});
      mark(label + ':ending-check-end-clicked');
      await sleep(1600);
      quietSince = Date.now();
      continue;
    }
    const s = await bridge.getState();
    const d = s.dialogue;
    if (!d) {
      if (closedSince === null) closedSince = Date.now();
      if (!s.activeMinigame && Date.now() - closedSince > closedBreakMs) { mark(label + ':closed'); return; }
      await sleep(200);
      continue;
    }
    closedSince = null;
    if (await ttsPlaying(page)) { quietSince = Date.now(); await sleep(120); continue; }
    if (d.awaitingChoice && (d.choices || []).length) {
      const labels = d.choices.map((c) => c.text || '');
      let idx = labels.findIndex((l) => preferred.some((rx) => new RegExp(rx, 'i').test(l)));
      if (idx < 0) idx = labels.findIndex((l) => !seen.has(l));
      if (idx < 0) idx = 0;
      const chosen = labels[idx];
      seen.add(chosen);
      await sleep(900);
      const ch = await bridge.minigame.chooseIndex(idx + 1).catch(() => null);
      mark(label + ':choose', { chose: chosen, ok: !!(ch && ch.ok) });
      picks++;
      if (picks >= maxPicks) { mark(label + ':max-picks'); return; }
      quietSince = Date.now();
      await sleep(400);
      continue;
    }
    const txt = d.text || '';
    if (txt !== lastText) { lastText = txt; quietSince = Date.now(); }
    if (d.canContinue && Date.now() - quietSince > settleMs) { await bridge.minigame.continue_().catch(() => {}); quietSince = Date.now(); }
    await sleep(150);
  }
  mark(label + ':timeout');
}

export async function setup(page, bridge) {
  page.on('dialog', (dlg) => dlg.accept().catch(() => {}));
  await clearScreen(page, bridge, () => {});
  const dr = await getGlobal(bridge, 'debrief_requested');
  console.error('SETUP debrief_requested', dr, 'room', JSON.stringify((await bridge.getState()).player));
}

const CHAIN = ['security_checkpoint', 'operations_floor', 'server_room', 'scada_control'];

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sleep(2500);
  const cur = (await bridge.getState()).player?.room;
  const i = CHAIN.indexOf(cur);
  const next = CHAIN[i >= 0 && i < CHAIN.length - 1 ? i + 1 : Math.max(i - 1, 0)];
  mark('entering', { from: cur, to: next });
  await bridge.enterRoom(next, { timeoutMs: 45000 }).catch(() => {});
  mark('debrief-wait');
  for (let k = 0; k < 40; k++) { if ((await bridge.getState()).dialogue) break; await sleep(500); }
  mark('debrief-start');
  await driveDialogue(page, bridge, mark, 'debrief', {
    preferred: ['sound on what was known', 'the two that went unanswered', 'understand', 'agreed', 'that is what matters', 'ready', 'thank', 'done'],
    closedBreakMs: 5000, maxPicks: 50, timeoutMs: 280000,
  });
  mark('debrief-closed');
  await sleep(14000);
  mark('credits', { missionEnd: !!(await bridge.getState()).missionEnd });
  await sleep(4000);
  mark('end');
};
