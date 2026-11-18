// t06_ending (m05 Insider Trading), ONE-SHOT, the mission ending. With David Torres named to Patricia (t05) and
// all four flags in, the player presents Torres' lifted print at the key-vault reader, walks into the data
// centre and confronts him at the upload terminal (voiced): "I've seen what you've been staging" -> "They lied to
// you" -> "You knew people would die" -> the fate: ARREST WITH COOPERATION ("It's over. You're staying here until
// the police arrive." -> "Someone who stopped this..." -> "Tell me everything about ENTROPY before they get here,
// and we pay for Elena.") -> "Cancel it, David. Your hand, not mine." (he stops the upload himself). The mission
// has unranked endings (ALIGNMENT_PLAN decision B); arrest with the treatment deal is the lawful, humane payoff:
// SAFETYNET gets the intelligence, Elena gets her treatment, he faces the court.
// Then the sweep (upload schedule, manifest, TalentStack envelope), the phone call-in to Agent HaX ("I'm done
// here. Bring me in." -> "Bring me in." -> "On my way."), which sets mission_complete and opens the closing
// debrief; if the ending check holds on optional objectives the take presses "End the mission" on camera. The
// debrief plays through (voiced), then the credits and the conclusion screen. Syncs at the end.
//
// One-shot: the confrontation, the fate, the call-in and the debrief happen once. setup() refuses unless
// torres_identified is true, final_choice is empty and mission_complete is false. Recorded once, live.
// No flag value, password or code appears (the flag station is never opened; the reader shows the lift only).
// Entry state: LIVE game 86 (playtest01, m05, set 924): all four flags in, Torres named (t05), print lifted.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/86 STORAGE_STATE=<playtest01 login.mjs state> \
//   tools/video/takes/run-take.sh m05 t06_ending "" ""
// Marks: vault-reader, vault-open, enter-dc, confront-open, choices-shown, choice:*, chat-closed, confront-closed,
//        sweep:*, phone-open, hax-picked, end-held, ending-check-end, debrief-open, debrief-done, credits-on,
//        screen, conclusion, synced, linger-end, tts-response.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, goRoom } from './_live.mjs';
import { globals, playChat, closeAll, syncNow } from '../m04/_live.mjs';

const VAULT = 'door:server_room->data_center';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const g = await globals(page, ['torres_identified', 'final_choice', 'mission_complete', 'debrief_played', 'torres_print_collected', 'data_center_entered']);
  console.error('SETUP GLOBALS', JSON.stringify(g));
  if (g.torres_identified !== true || (g.final_choice || '') !== '' || g.mission_complete === true || g.debrief_played === true || g.torres_print_collected !== true)
    throw new Error('not at the ending threshold: ' + JSON.stringify(g));
  await goRoom(page, bridge, ['main_corridor', 'server_hallway', 'server_room']);
  const m = await bridge.moveToNear(VAULT, { timeoutMs: 20000 });
  console.error('SETUP at vault', JSON.stringify(m).slice(0, 160));
  await syncNow(page);
  await sleep(800);
}

const waitMg = async (bridge, id, ms = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const s = await bridge.getState(); if (s.activeMinigame && s.activeMinigame.id === id) return s.activeMinigame; await sleep(250); }
  return null;
};
const waitNoMg = async (bridge, ms = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const s = await bridge.getState(); if (!s.activeMinigame) return true; await sleep(250); }
  return false;
};
const screenText = (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400)).catch(() => '');

const CONFRONT = [
  /^I've seen what you've been staging/i, /^They lied to you/i, /^You knew people would die/i,
  /^It's over\. You're staying here until the police arrive/i,
  /^Someone who stopped this/i, /^Tell me everything about ENTROPY/i,
  /^Cancel it, David/i, /^Sit tight/i,
];
const CONFRONT_AVOID = [/Fight him/i, /going public/i, /Help us, and we'll help Elena/i, /not a social worker/i, /ENTROPY's other true believers/i];
const CALL_IN = [/^I'm done here\. Bring me in/i, /^Bring me in/i, /^On my way/i];

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1800);

  // 1. The vault reader: present the lifted print.
  await bridge.interact(VAULT, { timeoutMs: 20000 }).catch(e => ({ ok: false, e: String(e) }));
  const rd = await waitMg(bridge, 'fingerprint-reader', 12000);
  mark('vault-reader', { open: !!rd });
  if (!rd) throw new Error('the vault reader did not open');
  await sleep(2600);
  const pr = await bridge.minigame.clickText('David Torres');
  await waitNoMg(bridge, 15000);
  mark('vault-open', { ok: pr && pr.ok });
  await sleep(1500);

  // 2. Into the data centre, up to Torres at the upload terminal.
  const e = await bridge.enterRoom('data_center', { timeoutMs: 45000 }).catch(x => ({ ok: false, e: String(x) }));
  mark('enter-dc', { ok: e && e.ok, room: (await bridge.getState()).player.room });
  if ((await bridge.getState()).player.room !== 'data_center') throw new Error('did not enter the data centre ' + JSON.stringify(e).slice(0, 200));
  await sleep(2500);
  await clearScreen(page, bridge, () => {});
  const mv = await bridge.moveToNear('david_torres', { timeoutMs: 25000 });
  mark('at-torres', { ok: mv && mv.ok });
  await sleep(1200);
  await bridge.interact('david_torres', { approach: false, timeoutMs: 20000 }).catch(() => {});
  const conf = await waitMg(bridge, 'person-chat', 15000);
  mark('confront-open', { open: !!conf });
  if (!conf) throw new Error('the confrontation did not open');
  const r = await playChat(page, bridge, mark, { prefer: CONFRONT, avoid: CONFRONT_AVOID, dwellMs: 1800, settleMs: 950, timeoutMs: 600000 });
  mark('confront-closed', { ...r, g: await globals(page, ['final_choice', 'torres_arrested', 'elena_treatment_funded']) });
  await closeAll(bridge);
  await sleep(4000);

  // 3. The sweep: schedule, manifest, envelope.
  for (const id of ['upload_schedule', 'data_package_manifest', 'talentstack_envelope']) {
    await clearScreen(page, bridge, () => {});
    const m2 = await bridge.moveToNear(id, { timeoutMs: 20000 }).catch(() => null);
    if (!m2 || !m2.ok) { mark('sweep:' + id, { ok: false }); continue; }
    await sleep(700);
    await bridge.interact(id, { approach: false, timeoutMs: 15000 }).catch(() => {});
    await sleep(3800);
    mark('sweep:' + id, { mg: ((await bridge.getState()).activeMinigame || {}).id || null });
    await closeAll(bridge);
    await sleep(1200);
  }
  await sleep(2000);

  // 4. The call-in: phone Agent HaX, "I'm done here. Bring me in."
  await clearScreen(page, bridge, () => {});
  const ph = await bridge.openInventoryItem('phone');
  if (!ph || !ph.ok) throw new Error('phone did not open ' + JSON.stringify(ph).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1800);
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('hax-picked', { ok: c && c.ok });
  await sleep(1000);
  const ci = await playChat(page, bridge, mark, { prefer: CALL_IN, avoid: [/Not yet/i, /.*/], stopAt: null, donePicks: 3, dwellMs: 1800, timeoutMs: 180000 }).catch(err => ({ error: String(err) }));
  mark('callin-done', { ...ci, g: await globals(page, ['mission_complete']) });

  // 5. The ending warning (optional objectives open), then the debrief.
  let debrief = (ci && ci.next === 'person-chat') ? (await bridge.getState()).activeMinigame : null;
  if (!debrief) {
    for (let i = 0; i < 30; i++) {
      const s = await bridge.getState();
      if (s.activeMinigame && s.activeMinigame.id === 'person-chat') { debrief = s.activeMinigame; break; }
      const held = await page.evaluate(() => !!(window.endingCheck && window.endingCheck.hasHeld && window.endingCheck.hasHeld())).catch(() => false);
      const panel = await page.$('#ending-check-end');
      if (held || panel) {
        await closeAll(bridge); await sleep(800);
        const how = await page.evaluate(() => { const b = document.querySelector('.objectives-end-button'); if (b) { b.scrollIntoView({ block: 'center' }); return 'button'; } return null; });
        await sleep(1400);
        if (how) await page.click('.objectives-end-button').catch(async () => { await page.evaluate(() => window.endingCheck.endHeld()); });
        else if (panel) await page.click('#ending-check-end').catch(() => {});
        else await page.evaluate(() => window.endingCheck && window.endingCheck.endHeld && window.endingCheck.endHeld()).catch(() => {});
        mark('end-held', { how: how || (panel ? 'ending-check-end' : 'endHeld') });
        for (let j = 0; j < 30; j++) {
          const s2 = await bridge.getState();
          if (s2.activeMinigame && s2.activeMinigame.id === 'person-chat') { debrief = s2.activeMinigame; break; }
          if (await page.$('#ending-check-end')) { await sleep(1200); await page.click('#ending-check-end').catch(() => {}); mark('ending-check-end'); }
          await sleep(600);
        }
        break;
      }
      if (i > 3 && s.activeMinigame && s.activeMinigame.id === 'phone-chat') { await closeAll(bridge); }
      await sleep(700);
    }
  }
  mark('debrief-open', { open: !!debrief, g: await globals(page, ['debrief_played', 'mission_complete']) });
  if (debrief) {
    const d = await playChat(page, bridge, mark, { prefer: [], avoid: [], dwellMs: 1700, timeoutMs: 900000 }).catch(e2 => ({ error: String(e2) }));
    mark('debrief-done', { ...d, voiced: tts.filter(t => t.status === 200 && /audio/.test(t.type)).length, ttsAll: tts.length, ttsErr: tts.filter(t => t.status !== 200).length });
  }

  // 6. Credits and the conclusion screen.
  const t0 = Date.now();
  let lastTxt = '';
  while (Date.now() - t0 < 160000) {
    const s = await bridge.getState();
    const txt = await screenText(page);
    if (/MISSION COMPLETE/i.test(txt) && !/MISSION COMPLETE/i.test(lastTxt)) mark('credits-on', { mg: s.activeMinigame && s.activeMinigame.id });
    if (s.activeMinigame && s.activeMinigame.id !== 'person-chat' && (!lastTxt || txt.slice(0, 60) !== lastTxt.slice(0, 60))) mark('screen', { mg: s.activeMinigame.id, text: txt.slice(0, 160) });
    lastTxt = txt;
    if (Date.now() - t0 > 25000 && s.activeMinigame && /conclusion|bond|visualis|report|debrief/i.test(s.activeMinigame.id + ' ' + (s.activeMinigame.type || ''))) { mark('conclusion', { mg: s.activeMinigame }); await sleep(12000); break; }
    await sleep(1000);
  }
  mark('synced', { ok: await page.evaluate(async () => { if (!window.stateSync) return false; return await window.stateSync.syncConfirmed(); }).catch(e3 => String(e3)) });
  mark('linger-end', { g: await globals(page, ['final_choice', 'mission_complete', 'debrief_played', 'torres_arrested', 'elena_treatment_funded']) });
  await sleep(1500);
};
