// Key-driven walking for the walking shots (no click-to-move marker on screen). Legs hold an arrow key for a computed time.
import { sleep } from './lib.mjs';

const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
/** Walk legs [[dir, target]]: 'up'/'down' move to world y = target, 'left'/'right' to world x = target. The direction is flipped if the target lies the other way.
 *  Each leg holds the arrow key for the time the distance needs at `speed` px/s, then corrects in short pulses. */
export async function keyLegs(bridge, legs, speed, mark) {
  for (const [dir0, target] of legs) {
    const axis = (dir0 === 'up' || dir0 === 'down') ? 'y' : 'x';
    const cur = (await bridge.getState()).player[axis];
    const dir = ((target - cur) * ((dir0 === 'up' || dir0 === 'left') ? -1 : 1)) >= 0 ? dir0 : OPP[dir0];
    const sign = (dir === 'up' || dir === 'left') ? -1 : 1;
    const ms = Math.max(0, Math.round(Math.abs(target - cur) / speed * 1000) - 60);
    if (mark) mark('leg:' + dir, { from: cur, to: target, ms });
    if (ms > 50) await bridge.walk(dir, ms);
    for (let i = 0; i < 4; i++) {
      const c = (await bridge.getState()).player[axis];
      const rem = (target - c) * sign;
      if (rem <= 2) break;
      await bridge.walk(dir, Math.round(rem / speed * 1000));
    }
  }
}
