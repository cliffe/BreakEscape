// A needs NPC back at its post sits on the sofa place nearest its post (stand cell), not the one
// nearest the feet it arrived on. m03 slice 7 finding 1: Zainab's post is the west place of the
// reception sofa; back from the coffee machine (east) she took the east place and stayed there.
// Run with: node test/js/seating-post-side-place.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
window.matchMedia = () => ({ matches: false });
window.eventDispatcher = { emit() {} };
const seating = await import('../../public/break_escape/js/systems/seating.js');

// Sofa at (80,90), 62x40: place feet at (99,130) west and (123,130) east.
function mk(id, feetX) {
    const body = { enable: true, immovable: false, width: 10, height: 6, offset: { x: 0, y: 0 },
        checkCollision: { none: false }, position: { x: 0, y: 0, copy() {} }, prev: { copy() {} }, prevFrame: { copy() {} },
        setSize(w, h) { this.width = w; this.height = h; return this; },
        setOffset(x, y) { this.offset.x = x; this.offset.y = y; return this; },
        setVelocity() { return this; }, updateFromGameObject() {}, updateCenter() {} };
    const sprite = { x: feetX - 5, y: 127, visible: true, alpha: 1, body, active: true, scaleX: 1, scaleY: 1,
        displayOriginX: 0, displayOriginY: 0, texture: { key: 'stub_npc' }, frame: { name: 'x' }, anims: { isPlaying: false, stop() {} } };
    body.reset = (x, y) => { sprite.x = x; sprite.y = y; };
    sprite.setVisible = () => sprite; sprite.setAlpha = () => sprite; sprite.setCrop = () => sprite;
    sprite.setFrame = () => {}; sprite.setDepth = () => sprite; sprite.setPosition = (x, y) => { sprite.x = x; sprite.y = y; };
    window.game = { textures: { get: () => ({ has: () => true }) } };
    return { npcId: id, sprite, config: { patrol: {} }, roomId: 'r', playAnimation() {} };
}
function sofa() {
    return { x: 80, y: 90, width: 62, height: 40, depth: 10, active: true, objectId: 'sofa', texture: { key: 'leather_sofa1' } };
}
const WEST_POST = { x: 99, y: 130 };

test('arriving from the far (east) side, a needs NPC takes the post-side place', () => {
    const chair = sofa(), b = mk('zainab', 128);
    assert.equal(seating.seatNPC(b, chair, { needsStop: 'desk:1', standAt: WEST_POST }), true);
    assert.equal(b._seat.place, 0, 'west place, the one by the post');
});

test('with no stand cell it still takes the place nearest its feet', () => {
    const chair = sofa(), b = mk('visitor', 128);
    assert.equal(seating.seatNPC(b, chair, {}), true);
    assert.equal(b._seat.place, 1);
});

test('post-side place taken: the nearest free place is the fallback', () => {
    const chair = sofa();
    assert.equal(seating.seatNPC(mk('player_friend', 99), chair, {}), true); // west place held
    const b = mk('zainab', 128);
    assert.equal(seating.seatNPC(b, chair, { needsStop: 'desk:1', standAt: WEST_POST }), true);
    assert.equal(b._seat.place, 1);
});
