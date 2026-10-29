// Key-driven walking for the walking shots (no click-to-move marker on screen). Legs hold an arrow key for a computed time.
import { sleep } from './lib.mjs';

/** Measure walking speed (px/s) with a short off-camera walk in a safe direction. */
export async function measureSpeed(bridge, dir = 'up') {
  const p0 = (await bridge.getState()).player;
  await bridge.walk(dir, 400);
  const p1 = (await bridge.getState()).player;
  await sleep(200);
  return Math.hypot(p1.x - p0.x, p1.y - p0.y) / 0.4;
}
/** Walk legs [['up', targetY] | ['left'|'right', targetX]] by holding the key for the estimated time, then correcting in short pulses. */
export async function keyLegs(bridge, legs, speed, mark) {
  for (const [dir, target] of legs) {
    const axis = (dir === 'up' || dir === 'down') ? 'y' : 'x';
    const sign = (dir === 'up' || dir === 'left') ? -1 : 1;
    const cur = (await bridge.getState()).player[axis];
    const ms = Math.max(0, Math.round(((target - cur) * sign) / speed * 1000) - 60);
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
