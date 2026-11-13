// t02_mechanism_call (m04): the flag payoff on the phone. With the four jump-server flags in, the player calls Agent HaX
// and picks "I've got their attack mechanism mapped.": HaX says the flags are in and grid control can see it, the SCADA
// layer is theirs, the answer is the hardwired shutdown in the plant room, and Voltage is worth more in a cell. The player
// answers "The software's theirs...", then "The attack comes first. Voltage second." and "Ready. Heading for the plant
// room.", and the call closes on HaX's sign-off. Spoken (HaX's phone voice, Aoede): these phone lines were not in
// tts_cache/ before this take, so the keyed server generated them (about 12 lines).
// One-shot: the call sets voltage_priority_discussed, which retires the topic. It does not finish the mission.
// Entry state: LIVE game 83 (playtest04, m04, set 922, all four flags in, attack_mechanism_known true, Voltage not yet dealt
// with); no new game. Stands in Battery Hall 1 for the call.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/83 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m04 t02_mechanism_call "" ""      (no --hide-hud: the phone opens from the inventory tray)
// Marks: phone-open, contact-picked, line {speaker,text}, choices-shown, choice:<text>, tts-response {status,type,bytes},
// chat-closed, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, watchTts, globals, playChat, closeAll, routeTo } from './_live.mjs';
import { syncNow } from './_live.mjs';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const g = await globals(page, ['attack_mechanism_known', 'voltage_priority_discussed', 'voltage_neutralised', 'all_flags_in']);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.attack_mechanism_known !== true || g.voltage_priority_discussed === true || g.voltage_neutralised === true) throw new Error('the mechanism topic is not on offer: ' + JSON.stringify(g));
  await goRoom(page, bridge, routeTo('battery_hall_1'));
  await sleep(800);
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1500);
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1700);
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('contact-picked', { ok: c && c.ok });
  const res = await playChat(page, bridge, mark, {
    prefer: [/^I've got their attack mechanism mapped/i, /^The software's theirs/i, /^The attack comes first/i, /^Ready\. Heading for the plant room/i],
    avoid: [/.*/],
    donePicks: 4,
    timeoutMs: 240000
  }).catch(e => { mark('chat-error', { e: String(e).slice(0, 300) }); return { error: String(e) }; });
  await sleep(2500);
  mark('synced', { ok: await syncNow(page) });
  mark('linger-end', { res, voiced: tts.filter(t => t.status === 200 && /audio/.test(t.type)).length, ttsAll: tts.length });
  await closeAll(bridge);
  mark('closed', { discussed: (await globals(page, ['voltage_priority_discussed'])).voltage_priority_discussed });
  await sleep(800);
};
