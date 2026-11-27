// live05_debrief_ending (m01): the ENDING beat - companion to live04_finale (which captured the ARMED device +
// ABORT). Operation Shatter is already aborted (player_aborted_attack === true, filmed in live04). This take, on
// camera and voiced, triggers the closing debrief and plays it through to the credits.
//
// THE REAL FLOW (engine-verified 2026-11-17, scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink +
// public/break_escape/js/minigames/phone-chat/phone-ringer.js):
//   1. Phone -> Agent HaX support_hub -> pick "Operation Shatter resolved - I'm ready for debrief". That choice fires
//      #place_call:closing_debrief: the hub phone-chat ends and an OUTGOING call is DIALLED and connects IN PLACE
//      (phone-ringer dial() -> openCall; same phone-chat surface, no incoming ring, the phone is NOT closed).
//      REQUIRES agent_0x99 to carry its scenario `call: [{knot:"closing_debrief", button:false}]` entry; without it
//      place_call refuses to dial and the hub just reopens (the regression that blocked stages 1-6 on game 90).
//   2. The closing_debrief call: HaX speaks the voiced debrief line, then offers the single choice "On my way.
//      #ending_check". Picking it fires #ending_check (raises the "optional objectives still open" overlay) and then
//      #set_global:start_debrief_cutscene:true. THIS is the irreversible step; everything before it is re-runnable.
//   3. "End the mission" on camera on the ending-check overlay.
//   4. start_debrief_cutscene=true opens closing_debrief_person (person-chat, HQ bg): the voiced closing debrief.
//      Drive it to #exit_conversation -> victory music + MISSION COMPLETE credits.
// No flag-entry screen is shown. TTS plays (keyed :3000). ONE-SHOT past "On my way": completing it completes the game.
// Record (LIVE mode, display of your choice):
//   BE_DISPLAY=<n> LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/90 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m01 live05_debrief_ending "" "--zoom-step 1"
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts } from './_live.mjs';
import { globals, playChat, closeAll, syncNow, ttsBusy } from '../m04/_live.mjs';

const screenText = (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400)).catch(() => '');

// After the 2026-11-17 upstream merge the objectives panel (top-left) overlaps the inventory tray and covers the
// phone slot, so openInventoryItem('phone') returns item-obscured. Collapse the panel first via its own toggle.
const collapseObjectives = async (page) => {
  await page.evaluate(() => {
    const panel = document.querySelector('#objectives-panel, .objectives-panel');
    const toggle = document.querySelector('.objectives-toggle');
    if (panel && toggle && !panel.classList.contains('collapsed')) toggle.click();
  }).catch(() => {});
};

export async function setup(page, bridge) {
  page.on('dialog', (dlg) => dlg.accept().catch(() => {}));
  await clearScreen(page, bridge, () => {});
  const g = await globals(page, ['player_aborted_attack', 'ready_for_debrief', 'start_debrief_cutscene', 'entropy_reveal_read']);
  console.error('SETUP', JSON.stringify(g));
  if (g.player_aborted_attack !== true) throw new Error('player_aborted_attack !== true - abort the device (live04) first: ' + JSON.stringify(g));
  if (g.start_debrief_cutscene === true) throw new Error('debrief already started (one-shot already consumed): ' + JSON.stringify(g));
  await sleep(600);
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1500);
  await clearScreen(page, bridge, () => {});

  // 1. Phone -> Agent HaX -> "ready for debrief" (places the call) -> the call connects in place -> "On my way."
  await collapseObjectives(page);
  await sleep(500);
  const ph = await bridge.openInventoryItem('phone');
  if (!ph || !ph.ok) throw new Error('phone did not open ' + JSON.stringify(ph).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1800);
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('hax-picked', { ok: c && c.ok });
  await sleep(1200);

  // Drive the hub pick + the in-place call connect MANUALLY. A `#ending_check` choice ("On my way.") raises a
  // PRE-CHOICE confirm overlay (ending-check.js): the choice is only taken when the player clicks "End the mission
  // now" (#ending-check-end); while the overlay is asking, re-picking the choice does nothing. So "On my way." must
  // be picked EXACTLY ONCE and the overlay answered once - NOT driven by playChat (which re-picks in a loop and
  // leaves the ink unable to resume, the failure seen on earlier takes).
  let placed = false;
  let onMyWayIdx = -1;
  for (let i = 0; i < 90 && onMyWayIdx < 0; i++) {
    const d = (await bridge.getState()).dialogue;
    if (d && d.awaitingChoice) {
      const texts = d.choices.map((x) => x.text);
      const rfd = texts.findIndex((t) => /ready for debrief/i.test(t));
      const omw = texts.findIndex((t) => /on my way/i.test(t));
      if (omw >= 0) { onMyWayIdx = omw; mark('at-on-my-way', { texts }); break; }
      if (rfd >= 0 && !placed) {
        mark('choices-shown', { choices: texts });
        await sleep(1400);
        const ch = await bridge.minigame.choose(rfd + 1);
        if (!ch || !ch.ok) throw new Error('place-call choose failed ' + JSON.stringify(ch).slice(0, 200));
        mark('placed-call', { idx: rfd });
        placed = true;
        await sleep(600);
      } else { throw new Error('unexpected hub/call choices: ' + JSON.stringify(texts)); }
    } else if (d && d.canContinue) {
      mark('call-line', { text: (d.text || '').slice(0, 80) });
      // Let HaX's voiced line finish before advancing / picking.
      for (let w = 0; w < 25 && (await ttsBusy(page)); w++) await sleep(400);
      await sleep(700);
      await bridge.minigame.continue_().catch(() => {});
      await sleep(400);
    } else { await sleep(500); }
  }
  if (onMyWayIdx < 0) throw new Error('never reached the "On my way" choice');

  // Let the HaX debrief line's voice finish, on camera, before the irreversible pick.
  for (let w = 0; w < 25 && (await ttsBusy(page)); w++) await sleep(400);
  await sleep(1600);

  // 2. Pick "On my way." ONCE (fires #ending_check -> pre-choice confirm overlay). Do not await it fully: the choose
  //    promise only settles once the overlay is answered. Then click "End the mission now" ONCE, on camera.
  mark('on-my-way-pick', { idx: onMyWayIdx });
  const choosePromise = bridge.minigame.choose(onMyWayIdx + 1).catch((e) => ({ err: String(e) }));
  let ended = false;
  for (let i = 0; i < 50 && !ended; i++) {
    const asking = await page.evaluate(() => !!(window.endingCheck && window.endingCheck.isAsking && window.endingCheck.isAsking())).catch(() => false);
    const panel = await page.$('#ending-check-end');
    if (asking || panel) {
      await sleep(1800); // show the "optional objectives still open" overlay on camera
      const clicked = await page.evaluate(() => { const b = document.getElementById('ending-check-end'); if (b) { b.click(); return true; } return false; }).catch(() => false);
      if (!clicked) await page.click('#ending-check-end').catch(() => {});
      mark('end-the-mission', { clicked });
      ended = true;
    } else { await sleep(400); }
  }
  await choosePromise.catch(() => {});
  mark('after-pick', { ended, g: await globals(page, ['start_debrief_cutscene']) });

  // Wait for start_debrief_cutscene -> the closing_debrief_person conversation (person-chat).
  let debrief = null;
  for (let i = 0; i < 50 && !debrief; i++) {
    const s = await bridge.getState();
    if (s.activeMinigame && s.activeMinigame.id === 'person-chat') { debrief = s.activeMinigame; break; }
    if (i > 2 && s.activeMinigame && s.activeMinigame.id === 'phone-chat' && !s.dialogue) { await closeAll(bridge); }
    await sleep(700);
  }
  mark('debrief-open', { open: !!debrief, g: await globals(page, ['start_debrief_cutscene']) });

  // 3. The voiced closing debrief.
  if (debrief) {
    const d = await playChat(page, bridge, mark, { prefer: [], avoid: [], dwellMs: 1700, timeoutMs: 900000 }).catch((e2) => ({ error: String(e2) }));
    mark('debrief-done', { ...d, voiced: tts.filter((t) => t.status === 200 && /audio/.test(t.type)).length, ttsAll: tts.length, ttsErr: tts.filter((t) => t.status !== 200).length });
  }

  // 4. Credits / conclusion screen.
  const t0 = Date.now();
  let lastTxt = '';
  while (Date.now() - t0 < 160000) {
    const s = await bridge.getState();
    const txt = await screenText(page);
    if (/MISSION COMPLETE|OPERATION ABORTED|debrief/i.test(txt) && !/MISSION COMPLETE|OPERATION ABORTED|debrief/i.test(lastTxt)) mark('credits-on', { mg: s.activeMinigame && s.activeMinigame.id });
    if (s.activeMinigame && s.activeMinigame.id !== 'person-chat' && (!lastTxt || txt.slice(0, 60) !== lastTxt.slice(0, 60))) mark('screen', { mg: s.activeMinigame.id, text: txt.slice(0, 160) });
    lastTxt = txt;
    if (Date.now() - t0 > 25000 && s.activeMinigame && /conclusion|bond|visualis|report|credits/i.test(s.activeMinigame.id + ' ' + (s.activeMinigame.type || ''))) { mark('conclusion', { mg: s.activeMinigame }); await sleep(12000); break; }
    await sleep(1000);
  }
  mark('synced', { ok: await syncNow(page) });
  mark('linger-end', { g: await globals(page, ['start_debrief_cutscene', 'ready_for_debrief', 'player_aborted_attack']) });
  await sleep(1500);
};
