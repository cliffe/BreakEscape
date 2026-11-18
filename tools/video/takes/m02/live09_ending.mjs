// live09_ending (m02): the mission ENDING, filmed in ONE live take, voiced, right before --finish.
// ONE-SHOT: this take completes the mission. Run it exactly once, on the live game, after the four flags
// are submitted and the recovery decision is still pending. The permission system blocks agents from
// spending the ending, so a HUMAN runs this; the capturing agent only writes and hand-checks the script.
//
// THE FLOW (engine-verified by reading, 2026-11-17):
//   scenarios/m02_ransomed_trust/scenario.json.erb  +  ink/m02_object_press_terminal.ink
//   + ink/m02_npc_asset.ink (Reeves) + ink/m02_closing_debrief.ink + js/minigames/backup-recovery.
//   1. RECOVERY DECISION (server_room): interact the Hospital Recovery Console (backup_recovery minigame).
//      Select the "Combined Recovery" source tile and confirm. That sets backup_restore_initiated, and the
//      combined_recovery eventMapping sets ransom_decision_made + ward_recovering (the second press-terminal
//      gate). The console then shows its outcome screen; close it. (Ghost's free-keys offer was already
//      made and refused in a prior stage, so no Ghost call re-fires here; if one does, it is driven closed.)
//   2. Walk server_room -> conference_room (the Boardroom; doors already unlocked on the live game).
//   3. PRESS TERMINAL (press_terminal object): decision_menu -> "I'm transmitting everything..." ->
//      confirm_upload -> "Confirmed. Send it all." -> do_upload -> close_decision. The insider was never
//      named, so close_decision sets awaiting_ambush (NOT mission_complete) and exits.
//   4. REEVES AMBUSH (auto, m02_npc_asset press_terminal_ambush): the courteous supervisor steps between the
//      player and the door, reveals himself (badge SC-4471), one reply choice, then he walks out. This knot
//      sets insider_ambushed + mission_complete and exits. (If the insider HAD been named, this beat is
//      skipped and the debrief opens straight from the press terminal; the script tolerates either.)
//   5. CLOSING DEBRIEF (auto, closing_debrief_trigger on mission_complete): the voiced HaX debrief. Driven
//      forward to debrief_close, which fires #complete_task:hear_debrief + #complete_mission + #exit, then
//   6. the MISSION COMPLETE / bond-visualiser credits. The take lingers on them.
//
// Entry state: LIVE game 93 (playtest03, m02, set 931), player parked in server_room with the four
// hospital_backup_server flags submitted (backdoor_fully_exploited), the Verified Restore Manifest + offline
// keys + ENTROPY Key Material held, ghost offer refused, recovery decision NOT made, mission NOT complete.
// A fresh browser context respawns the player in reception_lobby, so setup walks the full route to server_room.
// Record (LIVE mode; the single record command and its check are in the handover "Stage F"):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/93 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m02 live09_ending "" "--zoom-step 1"
// Marks: at every room, console-open, recovery-confirmed, boardroom, press-open, press-sent, ambush-*, debrief-*, credits-*.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, watchTts } from './_live.mjs';

const RECOVERY = 'hospital_recovery_console';
const PRESS = 'press_terminal';
const ROUTE_TO_SERVER = ['reception_lobby', 'ward_vestibule', 'ward_approach', 'hospital_ward', 'ward_hall', 'office_corridor', 'security_office', 'server_room'];
const ROUTE_TO_BOARDROOM = ['security_office', 'office_corridor', 'staff_room', 'conference_room'];

const screenText = (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400)).catch(() => '');
const gv = (page) => page.evaluate(() => (window.gameState && window.gameState.globalVariables) || {}).catch(() => ({}));
const ttsBusy = (page) => page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; return !!(mg && mg.ttsManager && mg.ttsManager.playing); }).catch(() => false);

// The post-upstream-merge objectives panel (top-left) can overlap the inventory/phone; collapse it so no
// stray panel sits over the shot. (This take uses world objects, not the tray, but the brief asks for it.)
const collapseObjectives = async (page) => {
  await page.evaluate(() => {
    const panel = document.querySelector('#objectives-panel, .objectives-panel');
    const toggle = document.querySelector('.objectives-toggle');
    if (panel && toggle && !panel.classList.contains('collapsed')) toggle.click();
  }).catch(() => {});
};

// Drive the currently-open conversation forward. At each menu, pick the first choice whose text matches
// `forward`; otherwise pick `fallbackIdx` (1-based; default the LAST choice, which on the debrief hub is
// "Enough. Walk me through what it cost." and never an answer that loops back). Waits for each voiced line
// to finish before advancing. Stops when no dialogue/minigame is active or `until(globals)` is true.
async function driveDialogue(page, bridge, mark, { label, forward = null, fallback = 'last', picks = [], until = null, maxMs = 900000 }) {
  const t0 = Date.now();
  let step = 0;
  while (Date.now() - t0 < maxMs) {
    if (until && until(await gv(page))) { mark(label + ':until'); break; }
    const s = await bridge.getState();
    const d = s.dialogue;
    if (!d) { if (!s.activeMinigame) { mark(label + ':closed'); break; } await sleep(300); continue; }
    if (await ttsBusy(page)) { await sleep(250); continue; }
    if (d.awaitingChoice) {
      const texts = (d.choices || []).map((c) => c.text || '');
      let idx;
      if (step < picks.length) idx = picks[step];
      else if (forward && texts.some((t) => forward.test(t))) idx = texts.findIndex((t) => forward.test(t)) + 1;
      else idx = fallback === 'last' ? texts.length : fallback;
      mark(label + ':choices', { texts, pick: idx });
      await sleep(1400);
      const ch = await bridge.minigame.choose(idx).catch((e) => ({ err: String(e) }));
      if (!ch || ch.ok === false) { mark(label + ':choose-fail', { idx, ch: JSON.stringify(ch).slice(0, 200) }); await sleep(600); }
      step++; await sleep(500);
    } else if (d.canContinue) {
      await sleep(700);
      await bridge.minigame.continue_().catch(() => {});
      await sleep(350);
    } else { await sleep(400); }
  }
}

// Wait for a fresh conversation/minigame to appear (used for the auto-opened ambush and debrief).
async function waitForDialogue(page, bridge, { timeoutMs = 60000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await bridge.getState();
    if (s.dialogue || (s.activeMinigame && /person-chat|phone-chat/.test(s.activeMinigame.id || ''))) return s.activeMinigame;
    await sleep(500);
  }
  return null;
}

export async function setup(page, bridge) {
  page.on('dialog', (dlg) => dlg.accept().catch(() => {}));
  await clearScreen(page, bridge, () => {});
  const g = await gv(page);
  if (g.mission_complete === true) throw new Error('mission already complete (one-shot already consumed): ' + JSON.stringify({ mission_complete: g.mission_complete }));
  const room = (await bridge.getState()).player && (await bridge.getState()).player.room;
  console.error('SETUP', JSON.stringify({
    room, backdoor_fully_exploited: g.backdoor_fully_exploited, ransom_decision_made: g.ransom_decision_made,
    ghost_offer_made: g.ghost_offer_made, ghost_deal_refused: g.ghost_deal_refused,
    insider_identified: g.insider_identified, awaiting_ambush: g.awaiting_ambush,
    restore_manifest_obtained: g.restore_manifest_obtained, offline_keys_recovered: g.offline_keys_recovered,
  }));
  if (g.backdoor_fully_exploited !== true) console.error('WARN backdoor_fully_exploited is not true - the press terminal may show RELAY LOCKED (submit all four flags first)');
  await sleep(600);
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1200);
  await collapseObjectives(page);
  await clearScreen(page, bridge, () => {});

  // ---- 1. walk to server_room, make the recovery decision ----
  if (((await bridge.getState()).player || {}).room !== 'server_room') await goRoom(page, bridge, ROUTE_TO_SERVER);
  mark('at-server-room');
  await sleep(800);
  await bridge.moveToNear(RECOVERY, { timeoutMs: 20000 }).catch(() => {});
  await sleep(500);
  const ri = await bridge.interact(RECOVERY, { timeoutMs: 20000 });
  mark('console-interact', { ok: ri && ri.ok !== false });
  await bridge.waitForMinigame(null, { timeoutMs: 12000 }).catch(() => {});
  await sleep(1200);

  // If a Ghost call opened instead of the console (shouldn't - already refused), close it and re-open.
  let mg = (await bridge.getState()).activeMinigame;
  if (mg && /person-chat|phone-chat/.test(mg.id || '')) {
    mark('ghost-call-intervened', { id: mg.id });
    await driveDialogue(page, bridge, mark, { label: 'ghost-call', fallback: 'last', maxMs: 120000 });
    await sleep(800);
    await bridge.interact(RECOVERY, { timeoutMs: 20000 }).catch(() => {});
    await bridge.waitForMinigame(null, { timeoutMs: 12000 }).catch(() => {});
    await sleep(1000);
    mg = (await bridge.getState()).activeMinigame;
  }
  mark('console-open', { minigame: mg && mg.id });
  await sleep(1600); // let the console title/sources read on camera

  // Select the Combined Recovery source (escrow keys + ENTROPY key material) and confirm.
  const sel = await bridge.minigame.clickSelector('.backup-recovery-tile[data-source-id="combined_recovery"]').catch((e) => ({ err: String(e) }));
  mark('recovery-source-selected', { ok: sel && sel.ok !== false, sel: JSON.stringify(sel).slice(0, 160) });
  await sleep(1500);
  const conf = await bridge.minigame.clickSelector('#backup-recovery-confirm').catch((e) => ({ err: String(e) }));
  mark('recovery-confirm', { ok: conf && conf.ok !== false });
  await sleep(2500); // the outcome screen (4-hour restore) holds on camera
  mark('recovery-confirmed', { g: await gv(page) });
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  await sleep(1000);

  // ---- 2. walk to the Boardroom ----
  await goRoom(page, bridge, ROUTE_TO_BOARDROOM);
  mark('boardroom');
  await sleep(800);

  // ---- 3. the press terminal: transmit everything, confirm ----
  await bridge.moveToNear(PRESS, { timeoutMs: 20000 }).catch(() => {});
  await sleep(500);
  const pi = await bridge.interact(PRESS, { timeoutMs: 20000 });
  mark('press-interact', { ok: pi && pi.ok !== false });
  await bridge.waitForMinigame(null, { timeoutMs: 12000 }).catch(() => {});
  await sleep(1400);
  // decision_menu -> transmit everything ; confirm_upload -> confirm send. Match by text so the "step away"
  // option (which would loop) is never picked. Never pick the suppress/"undisclosed" option.
  await driveDialogue(page, bridge, mark, {
    label: 'press',
    forward: /transmitting everything|public needs to see|confirmed\.? send it all|send it all/i,
    fallback: 1,
    until: (g) => g.mission_complete === true || g.awaiting_ambush === true || g.exposed_hospital === true,
    maxMs: 120000,
  });
  mark('press-sent', { g: await gv(page) });
  await sleep(1200);

  // ---- 4. the Reeves ambush (auto) if the insider was never named; otherwise this is a no-op ----
  const ambush = await waitForDialogue(page, bridge, { timeoutMs: 20000 });
  if (ambush) {
    mark('ambush-open', { id: ambush.id });
    await driveDialogue(page, bridge, mark, {
      label: 'ambush', fallback: 1,
      until: (g) => g.mission_complete === true,
      maxMs: 180000,
    });
    mark('ambush-done', { g: await gv(page) });
  } else {
    mark('ambush-skipped', { g: await gv(page) });
  }

  // ---- 5. the closing debrief (auto on mission_complete) ----
  const debrief = await waitForDialogue(page, bridge, { timeoutMs: 40000 });
  mark('debrief-open', { id: debrief && debrief.id, g: await gv(page) });
  if (debrief) {
    await driveDialogue(page, bridge, mark, {
      label: 'debrief',
      forward: /walk me through what it cost|enough\.|let'?s take them down|take them down/i,
      fallback: 'last',
      maxMs: 900000,
    });
    mark('debrief-done', {
      voiced: tts.filter((t) => t.status === 200 && /audio/.test(t.type)).length, ttsAll: tts.length,
      ttsErr: tts.filter((t) => t.status !== 200).length, g: await gv(page),
    });
  }

  // ---- 6. the MISSION COMPLETE / bond-visualiser credits ----
  const t0 = Date.now();
  let lastTxt = '';
  while (Date.now() - t0 < 150000) {
    const s = await bridge.getState();
    const txt = await screenText(page);
    if (/MISSION COMPLETE|debrief|operation|bond/i.test(txt) && !/MISSION COMPLETE|debrief|operation|bond/i.test(lastTxt)) mark('credits-on', { mg: s.activeMinigame && s.activeMinigame.id });
    if (s.activeMinigame && s.activeMinigame.id !== 'person-chat' && (!lastTxt || txt.slice(0, 60) !== lastTxt.slice(0, 60))) mark('screen', { mg: s.activeMinigame.id, text: txt.slice(0, 140) });
    lastTxt = txt;
    if (Date.now() - t0 > 20000 && s.activeMinigame && /conclusion|bond|visualis|report|credits/i.test((s.activeMinigame.id || '') + ' ' + (s.activeMinigame.type || ''))) { mark('conclusion', { mg: s.activeMinigame }); await sleep(12000); break; }
    await sleep(1000);
  }
  mark('ending-linger', { g: await gv(page) });
  await sleep(1500);
};
