// An NPC seat walk (stand-up step, mount, work-spot walk) that only creeps because something
// is in the way (the player standing beside the seat) counts as blocked, instead of grinding at
// about 0.6 px per tick with the walk animation playing. Fake sprite only; no browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
const { npcWalkTick } = await import('../../public/break_escape/js/systems/seating.js');

function npc(x, y) {
    const sprite = {
        x, y, scaleX: 1, scaleY: 1, displayOriginX: 0, displayOriginY: 0,
        body: { offset: { x: 0, y: 0 }, width: 0, height: 0, velocity: { x: 0, y: 0 },
            setVelocity(vx, vy) { this.velocity.x = vx; this.velocity.y = vy; }, reset(nx, ny) { sprite.x = nx; sprite.y = ny; },
            position: { copy() {} }, prev: { copy() {} }, prevFrame: { copy() {} } }
    };
    const anims = [];
    return { sprite, anims, direction: 'up', isMoving: false, playAnimation: (a) => anims.push(a), updateDepth() {} };
}
const fresh = () => ({ ticks: 0, still: 0, last: Infinity });

test('a walk creeping 0.58 px per tick is stuck within a few ticks', () => {
    const b = npc(100, 233), m = fresh(), target = { x: 100, y: 221 };
    let r = 'moving', n = 0;
    while (r === 'moving' && n < 20) { r = npcWalkTick(b, m, target); n++; b.sprite.y -= 0.58; }
    assert.equal(r, 'stuck');
    assert.ok(n <= 8, `stuck after ${n} ticks`);
    assert.equal(b.sprite.body.velocity.y, 0);
});

test('a walk making full progress keeps moving and arrives', () => {
    const b = npc(100, 233), m = fresh(), target = { x: 100, y: 221 };
    let r = 'moving', n = 0;
    while (r === 'moving' && n < 20) { r = npcWalkTick(b, m, target); n++; if (r === 'moving') b.sprite.y -= 3.5; }
    assert.equal(r, 'arrived');
});
