// t05_ending (m04), ONE-SHOT, the mission ending: after the shutdown the player calls Agent HaX from the plant room and
// picks "I'm done here. Bring me in." -> "Bring me in." -> "On my way." (a text phone chat). That sets mission_complete,
// which opens the closing debrief at HQ: Agent HaX's voiced debrief (person chat, lines in tts_cache/m04_critical_failure),
// played through with every line heard and the first offered choice at each menu (the outcome report, Voltage out through
// the dock, the network, the report, disclosure). When the debrief closes the victory cue plays over the credits
// ("MISSION COMPLETE" / "MISSION 4: CRITICAL FAILURE" and the decisions list), then the conclusion screen. Holds on it.
// Recorded on the second run: the first (2026-11-13) reopened the phone on t02's saved mid-call menu and stopped there
// without calling in (nothing consumed); setup() now plays that menu through off camera.
// Third form (2026-11-13, game 83): the second run called in (mission_complete set) but the debrief stayed shut behind the
// open phone, so this take, from that state, walks into the next room to fire the debrief's room-entry backstop.
// One-shot: it finishes the mission's story (mission_complete, report_to_0x99). Recorded once, live, on 2026-11-13.
// Entry state: LIVE game 83 (playtest04, m04, set 922): attack_prevented true, mission_complete false.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/83 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m04 t05_ending "" ""      (HUD kept: the phone opens from the inventory tray)
// Marks: phone-open, contact-picked, choice:*, debrief-open, line, choices-shown, tts-response, chat-closed, credits-*,
// conclusion, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, watchTts, globals, playChat, routeTo, syncNow, closeAll } from './_live.mjs';

let calledIn = false;
export async function setup(page, bridge) {
  const g = await globals(page, ['attack_prevented', 'mission_complete', 'debrief_started', 'voltage_escaped', 'static_left']);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.attack_prevented !== true || g.debrief_started === true) throw new Error('not at the call-in: ' + JSON.stringify(g));
  // Second form: already called in (mission_complete), debrief not yet started. The take walks into the loading dock, and
  // the room-entry backstop re-emits mission_complete, which opens the debrief. Nothing is closed here (a debrief that
  // opened on load is left open and recorded).
  if (g.mission_complete === true) { calledIn = true; console.error('SETUP already called in; mg', JSON.stringify((await bridge.getState()).activeMinigame)); return; }
  await clearScreen(page, bridge, () => {});
  await goRoom(page, bridge, routeTo('plant_room'));
  // Off camera: the HaX phone story was saved mid-call by t02 (its last sync came before the call ended), so it reopens on
  // that call's later menus. Play them through to the hub here, so the take opens on "I'm done here. Bring me in."
  const mark = (l, d) => console.error('SETUP', l, JSON.stringify(d || null).slice(0, 200));
  await bridge.openInventoryItem('phone');
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  await sleep(1200);
  await bridge.minigame.clickText('Agent HaX');
  await sleep(1500);
  const r = await playChat(page, bridge, mark, {
    prefer: [/^The attack comes first/i, /^Ready\. Heading for the plant room/i], avoid: [/.*/],
    stopAt: /^I'm done here\. Bring me in/i, donePicks: 1, dwellMs: 200, settleMs: 300, timeoutMs: 120000
  }).catch(e => ({ error: String(e) }));
  console.error('SETUP phone', JSON.stringify(r).slice(0, 300));
  await closeAll(bridge);
  await syncNow(page);
  await sleep(1000);
}

const screenText = (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400)).catch(() => '');

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(2000);
  if (!calledIn) await callIn(page, bridge, mark);
  // The debrief (person chat agent_0x99_debrief) opens on mission_complete. If the phone held it off, close the phone and
  // walk into the next room: the room-entry backstop re-emits mission_complete.
  let open = null;
  for (let i = 0; i < 16; i++) {
    const s = await bridge.getState();
    if (s.activeMinigame && s.activeMinigame.id === 'person-chat') { open = s.activeMinigame; break; }
    await sleep(500);
  }
  if (!open) {
    await closeAll(bridge);
    await sleep(800);
    const room = (await bridge.getState()).player.room;
    const next = { plant_room: 'loading_dock', loading_dock: 'plant_room', main_entrance: 'operations_office', operations_office: 'main_entrance' }[room] || 'operations_office';
    const e = await bridge.enterRoom(next, { timeoutMs: 45000 }).catch(x => ({ ok: false, e: String(x) }));
    mark('walk-to-trigger', { from: room, to: next, ok: e && e.ok });
    for (let i = 0; i < 40; i++) {
      const s = await bridge.getState();
      if (s.activeMinigame && s.activeMinigame.id === 'person-chat') { open = s.activeMinigame; break; }
      await sleep(500);
    }
  }
  mark('debrief-open', { open, g: await globals(page, ['debrief_started']) });
  if (!open) throw new Error('the debrief did not open');
  await debriefAndCredits(page, bridge, mark, tts);
};

async function callIn(page, bridge, mark) {
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1700);
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('contact-picked', { ok: c && c.ok });
  // The call-in. The phone closes into the debrief when mission_complete lands.
  await playChat(page, bridge, mark, {
    prefer: [/^I'm done here\. Bring me in/i, /^I'm well clear of them\. Bring me in/i, /^Bring me in\.$/i, /^On my way/i],
    avoid: [/.*/], donePicks: 3, timeoutMs: 90000
  }).catch(e => mark('callin-end', { e: String(e).slice(0, 200) }));
  mark('called-in', await globals(page, ['mission_complete']));
}

async function debriefAndCredits(page, bridge, mark, tts) {
  const d = await playChat(page, bridge, mark, { prefer: [], avoid: [], dwellMs: 1700, timeoutMs: 600000 });
  mark('debrief-done', { ...d, voiced: tts.filter(t => t.status === 200 && /audio/.test(t.type)).length, ttsAll: tts.length });
  // Credits, then the conclusion screen.
  const t0 = Date.now();
  let lastTxt = '';
  while (Date.now() - t0 < 150000) {
    const s = await bridge.getState();
    const txt = await screenText(page);
    if (/MISSION COMPLETE|COSTLY SUCCESS/.test(txt) && !/MISSION COMPLETE|COSTLY SUCCESS/.test(lastTxt)) mark('credits-on', { mg: s.activeMinigame && s.activeMinigame.id });
    if (s.activeMinigame && s.activeMinigame.id !== 'person-chat' && (!lastTxt || txt.slice(0, 60) !== lastTxt.slice(0, 60))) mark('screen', { mg: s.activeMinigame.id, text: txt.slice(0, 160) });
    lastTxt = txt;
    if (Date.now() - t0 > 30000 && s.activeMinigame && /conclusion|bond|engagement|report/i.test(s.activeMinigame.id + ' ' + (s.activeMinigame.type || ''))) { mark('conclusion', { mg: s.activeMinigame }); await sleep(12000); break; }
    await sleep(1000);
  }
  mark('synced', { ok: await syncNow(page) });
  mark('linger-end', { g: await globals(page, ['mission_complete', 'debrief_started', 'attack_prevented']) });
  await sleep(1500);
}
