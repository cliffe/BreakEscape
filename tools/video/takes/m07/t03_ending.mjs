// t03_ending (m07): the ONE-SHOT climax + ending. Film this LAST, immediately before --finish.
//
// Entry state (prepared OFF CAMERA before this take runs):
//   - All four VM flags already submitted at flag_station_safetynet_relay via the <vmflag:...> tokens
//     (the flag-entry screen is therefore NEVER filmed): recover_coordination_traffic, intercept_c2_channel,
//     escalate_on_attack_host and terminate_cascade_scripts are complete, so concludeRequires is satisfied
//     and flag 4's unlock_object reward has UNLOCKED crisis_control_system (the abort console).
//   - The server_room -> scada_control door is a password keypad (the control-room code, = the operator
//     password, sensitive). OPEN IT OFF CAMERA first (a session: interact the door, type the code, submit;
//     the unlock persists on reload). This take walks through the already-open door, so the code is never
//     filmed. setup() will throw "could not reach scada_control" if the door is still locked.
// This take then, on camera and in one continuous recording:
//   1. walks to scada_control and opens the Cascade Control System (crisis_control_system). Opening it
//      completes shut_down_the_cascade (grid_saved, mission_complete) and prints the "Sequence Abort
//      Confirmation" -> the flag-4 payoff. Holds on it, then closes.
//   2. collapses the objectives panel (it can cover the inventory phone slot), opens the phone, calls
//      Agent HaX and chooses "Bring me in." (-> debrief_requested).
//   3. the closing debrief (voiced) opens as a person-chat; drives it to the credits. If the
//      "optional objectives still open" ending-check overlay appears (assign_tactical_team is open on
//      game 94), holds on it then clicks "End the mission" on camera.
//   4. holds on the bond_visualiser credits.
// Completing the debrief concludes the game (which closes the VM console link), so --finish happens only
// after this take is in the can.
//
// Record (LIVE mode):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/<game> STORAGE_STATE=<playtest01 login.mjs state> \
//   tools/video/takes/run-take.sh m07 t03_ending "" "--zoom-step 1"
// Marks: abort-console-open, abort-printout, abort-closed, objectives-collapsed, phone-open, hax-open,
//        call:choose, call:bring-me-in, debrief-wait, debrief-start, debrief:choose, debrief:ending-check,
//        debrief:ending-check-end-clicked, debrief-closed, credits, end.
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
  page.on('dialog', (dlg) => dlg.accept().catch(() => {})); // any confirm() gate
  await clearScreen(page, bridge, () => {});
  // All four flag tasks must already be in (concludeRequires), which also unlocked the abort console.
  const done = await bridge.eval(() => {
    const o = window.__test.getState().objectives || {};
    return (o.completedTasks || []);
  }).catch(() => []);
  const need = ['recover_coordination_traffic', 'intercept_c2_channel', 'escalate_on_attack_host', 'terminate_cascade_scripts'];
  const missing = need.filter((t) => !done.includes(t));
  console.error('SETUP completed tasks:', JSON.stringify(done), 'missing flag tasks:', JSON.stringify(missing));
  if (missing.length) throw new Error('flag tasks not all complete, submit them off camera first: ' + missing.join(','));
  await goRoom(page, bridge, ['operations_floor', 'server_room', 'scada_control']);
  await sleep(600);
}

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sleep(1200);

  // 1. Open the (now unlocked) Cascade Control System -> abort printout, completing shut_down_the_cascade.
  await bridge.moveToNear(CONSOLE_ID, { timeoutMs: 20000 }).catch(() => {});
  await sleep(400);
  const r = await bridge.interact(CONSOLE_ID, { timeoutMs: 20000 });
  mark('abort-console-open', { ok: !!(r && r.ok !== false) });
  await sleep(1600);
  // The printout is inside the control-system container; surface it (gameDisplay) and hold.
  await bridge.minigame.take?.(0).catch(() => {});
  await sleep(600);
  mark('abort-printout', { grid_saved: await getGlobal(bridge, 'grid_saved') });
  await sleep(4200); // hold on "SEQUENCE ABORT ACCEPTED ... 8.4 million people will never read about."
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(700); }
  mark('abort-closed', { shut: await getGlobal(bridge, 'mission_complete') });

  // 2. Collapse the objectives panel (it can cover the phone slot), then phone -> Agent HaX -> "Bring me in."
  await sleep(800);
  await page.evaluate(() => {
    const p = document.querySelector('.objectives-panel');
    if (p && !p.classList.contains('collapsed')) {
      const h = p.querySelector('.objectives-toggle, .objectives-header, .objectives-title') || p;
      h.click();
    }
  }).catch(() => {});
  mark('objectives-collapsed');
  await sleep(700);
  const ph = await bridge.openInventoryItem(PHONE_NAME);
  mark('phone-open', { ok: !!(ph && ph.ok !== false) });
  await sleep(1600);
  await bridge.minigame.clickText('Agent HaX').catch(() => {});
  mark('hax-open');
  await sleep(2200);
  await driveDialogue(page, bridge, mark, 'call', {
    preferred: ['bring me in', 'ready to be brought in', 'put me through', 'call it', 'ready for the debrief'],
    until: async () => (await getGlobal(bridge, 'debrief_requested')) === true,
    closedBreakMs: 6000, maxPicks: 12, timeoutMs: 90000,
  });
  mark('call:bring-me-in', { debrief_requested: await getGlobal(bridge, 'debrief_requested') });
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(700); }

  // 3. The closing debrief (voiced) opens as a person-chat; drive it to the credits.
  mark('debrief-wait');
  for (let i = 0; i < 80; i++) { if ((await bridge.getState()).dialogue) break; await sleep(500); }
  mark('debrief-start');
  await driveDialogue(page, bridge, mark, 'debrief', {
    preferred: ['sound on what was known', 'the two that went unanswered', 'understand', 'agreed', 'that is what matters', 'ready', 'thank', 'done'],
    closedBreakMs: 5000, maxPicks: 50, timeoutMs: 280000,
  });

  // 4. Hold on the bond_visualiser credits.
  mark('debrief-closed');
  await sleep(14000);
  mark('credits', { missionEnd: !!(await bridge.getState()).missionEnd });
  await sleep(4000);
  mark('end');
};
