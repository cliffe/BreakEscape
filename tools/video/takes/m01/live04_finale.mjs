// live04_finale (m01): the ONE-SHOT launch-code decision + ending. Film this LAST, immediately before --finish.
//
// Entry state (prepared OFF CAMERA in the headless playtest-session before this take runs):
//   - Derek Lawson confronted (arrest path), the ENTROPY Launch Device is in the inventory.
//   - flag_3 (shatter_server:flag_3) already submitted at the device via the <vmflag:...> token, so
//     launch_code_submitted === true (the device is ARMED). The flag-entry screen is therefore NEVER filmed.
//   - entropy_reveal_read === true, player_aborted_attack === false.
// This take then, on camera and in one continuous recording:
//   1. opens the ARMED device and holds on it, then presses ABORT (heroic path) -> OPERATION ABORTED;
//   2. opens the phone, calls Agent HaX, chooses "ready for debrief" then "On my way";
//   3. if the "optional objectives still open" (ending-check) warning appears, holds on it then clicks
//      "End the mission" on camera;
//   4. plays the closing debrief (voiced) through to the credits / bond_visualiser, holding on them.
// Aborting sets ready_for_debrief; completing the debrief completes the game (which closes the VM console link),
// so --finish happens only after this take is in the can.
//
// Record (LIVE mode, display 90):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/90 STORAGE_STATE=<playtest04 login.mjs state> \
//   BE_DISPLAY=90 tools/video/takes/run-take.sh m01 live04_finale "" "--zoom-step 1"
// Marks: armed-screen, abort-clicked, aborted, phone-open, hax-open, phone:choose, phone:ending-check,
//        ending-check-end-clicked, debrief-start, debrief:choose, debrief-closed, credits, end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts } from './_live.mjs';

const DEVICE_ID = 'entropy_launch_device';
const PHONE_NAME = 'Your Phone';

const ttsPlaying = (page) => page.evaluate(() => {
  const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
  return !!(mg && mg.ttsManager && mg.ttsManager.playing);
}).catch(() => false);

const getGlobal = (bridge, name) => bridge.eval((n) => window.gameState?.globalVariables?.[n], name).catch(() => undefined);

/**
 * Generic voiced-dialogue driver. Lets every TTS line finish, handles the ending-check overlay (hold then
 * "End the mission"), continues through lines, and picks a choice at each menu: a `preferred` regex first,
 * then the first option not yet taken. Breaks on `until()`, on the dialogue staying closed for closedBreakMs,
 * on maxPicks, or on timeout.
 */
async function driveDialogue(page, bridge, mark, label, {
  preferred = [], until = async () => false, settleMs = 1100, holdOverlayMs = 3000,
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
      seen.add(labels[idx]);
      mark(label + ':choose', { pick: labels[idx] });
      await sleep(1000);
      await bridge.minigame.chooseIndex(idx + 1).catch(() => {});
      if (++picks >= maxPicks) { mark(label + ':max-picks'); return; }
      quietSince = Date.now();
      await sleep(500);
      continue;
    }
    const txt = d.text || '';
    if (txt !== lastText) { lastText = txt; quietSince = Date.now(); }
    if (d.canContinue && Date.now() - quietSince > settleMs) {
      await bridge.minigame.continue_().catch(() => {});
      quietSince = Date.now();
    }
    await sleep(150);
  }
  mark(label + ':timeout');
}

export async function setup(page, bridge) {
  page.on('dialog', (dlg) => dlg.accept().catch(() => {})); // the abort/launch buttons gate on confirm()
  await clearScreen(page, bridge, () => {});
  const armed = await getGlobal(bridge, 'launch_code_submitted');
  const aborted = await getGlobal(bridge, 'player_aborted_attack');
  console.error('SETUP armed=', armed, 'aborted=', aborted);
  if (!armed) throw new Error('device not armed (launch_code_submitted !== true) - arm flag_3 off camera first');
  await sleep(600);
}

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sleep(1200);

  // 1. Open the ARMED device and hold, then ABORT on camera.
  const already = await getGlobal(bridge, 'player_aborted_attack');
  const r = await bridge.openInventoryItem(DEVICE_ID);
  if (!r || r.ok === false) throw new Error('could not open launch device ' + JSON.stringify(r).slice(0, 200));
  await sleep(1200);
  mark('armed-screen', { aborted: already });
  await sleep(3800); // hold on OPERATION SHATTER - ARMED + the ABORT / EXECUTE buttons
  if (!already) {
    const clicked = await bridge.eval(() => { const b = document.querySelector('#abort-btn'); if (b) { b.click(); return true; } return false; }).catch(() => false);
    mark('abort-clicked', { clicked });
    await sleep(2800); // OPERATION ABORTED - "Abort signal transmitted. All attack vectors terminated."
  }
  mark('aborted', { global: await getGlobal(bridge, 'player_aborted_attack') });
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(700); }

  // 2. Phone -> Agent HaX -> "ready for debrief" -> "On my way" (ending-check overlay handled by the driver).
  await sleep(1000);
  const p = await bridge.openInventoryItem(PHONE_NAME);
  mark('phone-open', { ok: !!(p && p.ok !== false) });
  await sleep(1600);
  await bridge.minigame.clickText('Agent HaX').catch(() => {});
  mark('hax-open');
  await sleep(2200);
  await driveDialogue(page, bridge, mark, 'phone', {
    preferred: ['ready for debrief', 'Operation Shatter resolved', 'On my way'],
    until: async () => (await getGlobal(bridge, 'start_debrief_cutscene')) === true,
    closedBreakMs: 6000, maxPicks: 10, timeoutMs: 90000,
  });

  // 3. The closing debrief (voiced) plays as a person-chat. Wait for it, then drive it to the credits.
  mark('debrief-wait');
  for (let i = 0; i < 60; i++) { if ((await bridge.getState()).dialogue) break; await sleep(500); }
  mark('debrief-start');
  await driveDialogue(page, bridge, mark, 'debrief', {
    preferred: ['that.s what matters', 'won.t happen again', 'ready', 'understand', 'close', 'done', 'agreed', 'thank'],
    closedBreakMs: 5000, maxPicks: 50, timeoutMs: 260000,
  });

  // 4. Hold on the credits / bond_visualiser conclusion.
  mark('debrief-closed');
  await sleep(14000);
  mark('credits');
  await sleep(4000);
  mark('end');
};
