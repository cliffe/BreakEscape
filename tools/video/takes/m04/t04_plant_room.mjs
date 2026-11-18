// t04_plant_room (m04), ONE-SHOT, the mission's climax: the player presents Vance's lifted print to the plant-room reader
// in Battery Hall 2 (the door opens), walks into the plant room, and Static steps out to block ("Voltage. Company."). The
// player talks past him ("I'm not here for you. I'm here to talk to him."), then confronts Voltage at the laptop: the
// voiced standoff, and the choice "Go for the button and let him run." He bolts for the dock, Static goes with him, HaX
// texts that the ESD is live, and the player lifts the flap on the red mushroom-head Emergency Shutdown and presses it:
// "ISOLATED - COOLING ACTIVE - ATTACK ABORTED". Holds on the armed-then-green plant room.
// Voiced: Static, Voltage and the narrator (person chats, lines in tts_cache/m04_critical_failure). HaX's ESD-live line is
// a phone text.
// One-shot: sets voltage_escaped, static_left, esd_authorized and attack_prevented. The mission's ending (call-in, debrief,
// credits) is t05_ending.
// Entry state: LIVE game 83 (playtest04, m04, set 922): all four flags in, attack_mechanism_known, anomaly_detected,
// vance_print_lifted true; plant room never entered; Voltage not dealt with.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/83 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m04 t04_plant_room "" ""      (HUD kept: the phone text and objectives update)
// Marks: reader-open, print-presented, door-open, plant-entered, static:*, voltage:*, line, choice:*, tts-response,
// esd-open, flap, pressed, confirmed {attack_prevented}, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, watchTts, globals, playChat, closeAll, routeTo, syncNow } from './_live.mjs';

const NEED = ['attack_mechanism_known', 'anomaly_detected', 'vance_print_lifted', 'plant_room_entered', 'voltage_neutralised', 'attack_prevented', 'static_stood_aside'];

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  // t03 lifts the print; the lift is saved at once (biometricSamples), but its vance_print_lifted global rode the 30 s timer
  // and t03's page closed first (game 83, 2026-11-13). Restore the global from the saved lift, silently (nothing reads it on
  // the way in: it only colours HaX's hints and the credits).
  const lift = await page.evaluate(() => {
    const gs = window.gameState || {}; const l = (gs.biometricSamples || []).some(x => x && x.ownerId === 'robert_vance' && x.type === 'fingerprint');
    if (l && gs.globalVariables && gs.globalVariables.vance_print_lifted !== true) { gs.globalVariables.vance_print_lifted = true; return 'restored'; }
    return l;
  });
  const g = await globals(page, NEED);
  console.error('GLOBALS', JSON.stringify(g), 'LIFT', lift);
  if (g.attack_mechanism_known !== true || g.anomaly_detected !== true || g.vance_print_lifted !== true || g.voltage_neutralised === true || g.attack_prevented === true || g.plant_room_entered === true) {
    throw new Error('not at the plant-room door with the print: ' + JSON.stringify(g));
  }
  await goRoom(page, bridge, routeTo('battery_hall_2'));
  // Stand a step back from the plant door, off camera.
  const m = await bridge.moveToNear('door:battery_hall_2->plant_room', { timeoutMs: 20000 });
  console.error('NEAR DOOR', JSON.stringify(m).slice(0, 200));
  await sleep(1000);
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1500);
  // The reader: present the lift (key 1).
  const r = await bridge.interact('door:battery_hall_2->plant_room', { approach: false, timeoutMs: 20000 });
  mark('reader-open', { ok: r && r.ok, mg: (await bridge.getState()).activeMinigame });
  await sleep(2500);
  await page.keyboard.press('1');
  mark('print-presented');
  for (let i = 0; i < 40 && (await bridge.getState()).activeMinigame; i++) await sleep(200);
  await sleep(800);
  await closeAll(bridge);
  mark('door-open');
  const e = await bridge.enterRoom('plant_room', { timeoutMs: 45000 });
  mark('plant-entered', { ok: e && e.ok });
  // Static's challenge opens on room entry (person chat).
  await bridge.waitForMinigame('person-chat', { timeoutMs: 15000 }).catch(() => null);
  const st = await playChat(page, bridge, mark, { prefer: [/^I'm not here for you/i], avoid: [/.*/], timeoutMs: 120000 });
  mark('static:done', st);
  await sleep(1500);
  // Voltage at the bench.
  const v = await bridge.interact('voltage', { timeoutMs: 30000 });
  mark('voltage:open', { ok: v && v.ok });
  await bridge.waitForMinigame('person-chat', { timeoutMs: 15000 }).catch(() => null);
  const vt = await playChat(page, bridge, mark, {
    prefer: [/^Go for the button and let him run/i, /^It's over, Voltage/i, /^Make me understand it first/i, /^Why infrastructure/i, /^How many does the hall/i, /^And you came anyway/i],
    avoid: [/taking you down/i, /Back off/i, /^Not yet/i, /^Say nothing/i, /Take him down/i],
    timeoutMs: 240000
  });
  mark('voltage:done', { ...vt, g: await globals(page, ['voltage_escaped', 'voltage_neutralised', 'esd_authorized', 'static_left']) });
  await sleep(2500);
  // The button.
  for (let i = 0; i < 30 && !(await globals(page, ['esd_authorized'])).esd_authorized; i++) await sleep(300);
  const n = await bridge.moveToNear('esd_pushbutton', { timeoutMs: 20000 });
  mark('esd-walk', { ok: n && n.ok });
  await sleep(600);
  const b = await bridge.interact('esd_pushbutton', { approach: false, timeoutMs: 20000 });
  mark('esd-open', { ok: b && b.ok, authorised: (await globals(page, ['esd_authorized'])).esd_authorized });
  await sleep(2500);
  await page.click('#esd-guard'); mark('flap');
  await sleep(1800);
  await page.click('#esd-button'); mark('pressed');
  await sleep(1800);
  if (await page.locator('#esd-confirm').isVisible().catch(() => false)) { await page.click('#esd-confirm'); mark('confirm-clicked'); }
  await sleep(4000);
  mark('confirmed', await globals(page, ['attack_prevented']));
  await sleep(2000);
  await closeAll(bridge);
  await sleep(5000);
  mark('synced', { ok: await syncNow(page) });
  mark('linger-end', { voiced: tts.filter(t => t.status === 200 && /audio/.test(t.type)).length, ttsAll: tts.length });
  await sleep(800);
};
