// A seated NPC hidden with setNPCVisible(false) must leave nothing drawn. Its breathing image (a
// second display object, head and shoulders) used to stay on the chair: a hidden NPC's body is off,
// so NPCBehavior.update never ran to hide it, and the image stayed until a reload (m03 reception
// sofa, Zainab, after the act-2 night turn).
// Run with: node test/js/npc-hide-seated-breath.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
window.matchMedia = () => ({ matches: false });
window.eventDispatcher = { emit() {} };
const seatingMod = await import('../../public/break_escape/js/systems/seating.js');
const { NPCBehaviorManager } = await import('../../public/break_escape/js/systems/npc-behavior.js');
const { NpcPoses } = await import('../../public/break_escape/js/systems/npc-poses.js');
window.seating = seatingMod.default;

function mkImage() {
    const img = { visible: true, destroyed: false };
    img.destroy = () => { img.destroyed = true; };
    img.setVisible = (v) => { img.visible = v; return img; };
    return img;
}
function mkSprite() {
    const s = { visible: true, alpha: 1, body: { enable: true }, cropped: true, active: true };
    s.setVisible = (v) => { s.visible = v; return s; };
    s.setAlpha = (a) => { s.alpha = a; return s; };
    s.setCrop = () => { s.cropped = false; return s; };
    return s;
}
function mkManager(id, behavior) {
    const mgr = Object.create(NPCBehaviorManager.prototype);
    mgr.behaviors = new Map([[id, behavior]]);
    window.npcManager = { getNPC: () => ({ id, isVisible: true }), isHiddenByMapping: () => false, recordNpcVisibility() {} };
    window.npcHostileSystem = undefined;
    window.RoomStateSync = undefined;
    return mgr;
}

// A seated NPC seated for real (seating.seatNPC) on a two-place sofa, with stub physics.
function mkSeated(id) {
    const body = { enable: true, immovable: false, width: 10, height: 6, offset: { x: 0, y: 0 },
        checkCollision: { none: false }, position: { x: 0, y: 0, copy() {} }, prev: { copy() {} }, prevFrame: { copy() {} },
        setSize(w, h) { this.width = w; this.height = h; return this; },
        setOffset(x, y) { this.offset.x = x; this.offset.y = y; return this; },
        setVelocity() { return this; }, reset(x, y) { this.position.x = x; this.position.y = y; },
        updateFromGameObject() {}, updateCenter() {} };
    const sprite = { x: 100, y: 120, visible: true, alpha: 1, body, active: true, scaleX: 1, scaleY: 1,
        displayOriginX: 0, displayOriginY: 0, cropped: true, texture: { key: 'stub_npc' }, frame: { name: 'x' },
        anims: { isPlaying: false, stop() {} } };
    sprite.setVisible = (v) => { sprite.visible = v; return sprite; };
    sprite.setAlpha = (a) => { sprite.alpha = a; return sprite; };
    sprite.setCrop = () => { sprite.cropped = false; return sprite; };
    sprite.setFrame = (f) => { sprite.frame.name = f; };
    sprite.setDepth = () => sprite;
    sprite.setPosition = (x, y) => { sprite.x = x; sprite.y = y; };
    window.game = { textures: { get: () => ({ has: () => true }) } };
    const chair = { x: 80, y: 90, width: 62, height: 40, depth: 10, active: true, objectId: 'sofa',
        texture: { key: 'leather_sofa1' } };
    const behavior = { npcId: id, sprite, config: { patrol: {} }, roomId: 'r', playAnimation() {} };
    assert.equal(seatingMod.seatNPC(behavior, chair, {}), true, 'the stub NPC sits');
    return { behavior, sprite, chair };
}

test('hiding a seated NPC ends its breathing image and crop', () => {
    const { behavior, sprite } = mkSeated('zainab_hussain');
    const img = mkImage();
    behavior._seat.breath = { img, crop: 'sit|9', phase: 0 };
    const mgr = mkManager('zainab_hussain', behavior);
    mgr.setNPCVisible('zainab_hussain', false);
    assert.equal(img.destroyed, true, 'the head and shoulders image is destroyed');
    assert.equal(sprite.visible, false);
    assert.equal(sprite.cropped, false, 'the sprite crop is cleared');
});

test('hiding a seated NPC frees its place, clears its seat and drops it from officeTypists', () => {
    const { behavior, chair } = mkSeated('yusuf');
    assert.deepEqual(chair._places, { 0: 'yusuf' }, 'seated: the place is held');
    window.officeTypists = new Map([['yusuf', { typing: true }]]);
    const mgr = mkManager('yusuf', behavior);
    mgr.setNPCVisible('yusuf', false);
    assert.equal(behavior._seat, null, 'no seat kept');
    assert.deepEqual(chair._places, {}, 'the place is free');
    assert.equal(window.officeTypists.has('yusuf'), false, 'no typing loop for nobody');
    window.officeTypists = undefined;
});

test('a hidden sitter\'s place can be taken by another NPC', () => {
    const { behavior, chair } = mkSeated('a');
    const mgr = mkManager('a', behavior);
    mgr.setNPCVisible('a', false);
    const other = mkSeated('b');
    assert.equal(seatingMod.seatNPC(other.behavior, chair, {}), true, 'the freed place takes another NPC');
    assert.equal(chair._places[0], 'b');
});

test('showing a hidden sitter again leaves it standing, with nothing floating', () => {
    const { behavior, sprite, chair } = mkSeated('c');
    const mgr = mkManager('c', behavior);
    mgr.setNPCVisible('c', false);
    mgr.setNPCVisible('c', true);
    assert.equal(sprite.visible, true);
    assert.equal(sprite.alpha, 1);
    assert.equal(sprite.body.enable, true);
    assert.equal(behavior._seat, null, 'not seated on show');
    assert.equal(behavior._seatTried, true, 'a plain seated NPC does not sit straight back down');
    assert.equal(sprite.body.checkCollision.none, false, 'standing collider restored');
    assert.equal(chair._places[0], undefined);
});

test('hiding an NPC that is not seated is untouched', () => {
    const sprite = mkSprite();
    const behavior = { npcId: 'b', sprite, config: { patrol: {} } };
    const mgr = mkManager('b', behavior);
    mgr.setNPCVisible('b', false);
    assert.equal(sprite.visible, false);
});

test('hiding a posing NPC ends the pose breathing image', () => {
    const sprite = mkSprite();
    const img = mkImage();
    const poses = Object.create(NpcPoses.prototype);
    poses.breath = new Map([['c', { breath: { img, crop: 'p|9', phase: 0 } }]]);
    window.npcPoses = poses;
    const behavior = { npcId: 'c', sprite, config: { patrol: {} } };
    const mgr = mkManager('c', behavior);
    mgr.setNPCVisible('c', false);
    assert.equal(img.destroyed, true);
    assert.equal(poses.breath.has('c'), false);
    window.npcPoses = undefined;
});
