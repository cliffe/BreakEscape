// t15_relay_walkin (m04): the Relay action. The player walks from Battery Hall 1 through the door into Hall 2; Relay's room_entered chat should open on its own (eventMapping outside the start room).
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room battery_hall_1 --unlock battery_hall_2 --set briefing_played=true --set cipher_walked=true
// Record: BE_SPRITE=harjit_singh tools/video/takes/run-take.sh m04 t15_relay_walkin "<same flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, entered, chat-open (or no-chat), choices {texts}, linger-end. Physics throttled to 20 fps.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} });
  const m = await bridge.moveToNear('door:battery_hall_1->battery_hall_2', { timeoutMs: 20000 });
  console.error('NEAR DOOR', JSON.stringify(m).slice(0, 200));
  await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('walk-start');
  const e = await bridge.enterRoom('battery_hall_2', { timeoutMs: 45000 });
  mark('entered', { ok: e && e.ok });
  let open = false;
  for (let i = 0; i < 40 && !open; i++) { open = !!(await bridge.getState()).activeMinigame; if (!open) await sleep(250); }
  const s = await bridge.getState();
  mark(open ? 'chat-open' : 'no-chat', { mg: s.activeMinigame && (s.activeMinigame.id || s.activeMinigame.type) });
  await sleep(4000);
  const d = (await bridge.getState()).dialogue;
  mark('choices', { texts: d && d.choices && d.choices.map(c => c.text) });
  await sleep(2500);
  mark('linger-end');
};
