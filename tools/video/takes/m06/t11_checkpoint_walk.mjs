// t11_checkpoint_walk (m06, keyless): straight key-driven walk across security_checkpoint towards the trading-floor door, guard on his slow patrol in view (he has no sight challenge, only a visible cone). No line, no interaction; out before the door.
// Entry state (new-game): --imports=none --start-room security_checkpoint --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh <avatar> t11_checkpoint_walk "--imports=none --start-room security_checkpoint --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end, linger-end.   TODO first run: read the player's start position in SETUP and pick the leg target (the trading-floor door is on the north wall, door id door:security_checkpoint->trading_floor).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1200); const s = await bridge.getState(); console.error('SETUP', JSON.stringify({ p: s.player, near: s.nearby.map(n => [n.id, Math.round(n.distance)]).slice(0, 10) })); }
export default async (page, bridge, mark) => {
  await sleep(900);
  const p = (await bridge.getState()).player; mark('walk-start', p);
  await keyLegs(bridge, [['up', p.y - Number(process.env.M06_WALK || 90)]], 145, mark);
  mark('walk-end', (await bridge.getState()).player);
  await sleep(700); mark('linger-end');
};
