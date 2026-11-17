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

test('hiding a seated NPC ends its breathing image and crop', () => {
    const sprite = mkSprite();
    const img = mkImage();
    const behavior = { npcId: 'zainab_hussain', sprite, config: { patrol: {} }, _seat: { breath: { img, crop: 'sit|9', phase: 0 } } };
    const mgr = mkManager('zainab_hussain', behavior);
    mgr.setNPCVisible('zainab_hussain', false);
    assert.equal(img.destroyed, true, 'the head and shoulders image is destroyed');
    assert.equal(behavior._seat.breath, null, 'the holder lets a later reveal start fresh');
    assert.equal(sprite.visible, false);
    assert.equal(sprite.cropped, false, 'the sprite crop is cleared');
});

test('showing the seated NPC again restores the sprite and holds no stale image', () => {
    const sprite = mkSprite();
    const behavior = { npcId: 'a', sprite, config: { patrol: {} }, _seat: { breath: { img: mkImage(), crop: 'x', phase: 0 } } };
    const mgr = mkManager('a', behavior);
    mgr.setNPCVisible('a', false);
    mgr.setNPCVisible('a', true);
    assert.equal(sprite.visible, true);
    assert.equal(sprite.alpha, 1);
    assert.equal(behavior._seat.breath, null, 'recreated by the next seated update, not left stale');
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
