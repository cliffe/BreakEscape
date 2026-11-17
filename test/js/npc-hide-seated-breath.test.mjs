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

// An open stand grid under the stub sofa (every cell walkable, nothing solid in the scene), so
// npcStandSpot gives a real spot a little way from the seat.
function openWorld() {
    const cols = 24, rows = 24;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    const built = { grid, bounds: { minX: 0, minY: 0, cols, rows, step: 8 } };
    window.pathfindingManager = { buildWorldGrid: () => built,
        scene: { physics: { world: { staticBodies: { iterate() {} }, bodies: { iterate() {} } } } } };
    return built;
}

function mkNpc(id) {
    const body = { enable: true, immovable: false, width: 10, height: 6, offset: { x: 0, y: 0 },
        checkCollision: { none: false }, position: { x: 0, y: 0, copy() {} }, prev: { copy() {} }, prevFrame: { copy() {} },
        setSize(w, h) { this.width = w; this.height = h; return this; },
        setOffset(x, y) { this.offset.x = x; this.offset.y = y; return this; },
        setVelocity() { return this; }, updateFromGameObject() {}, updateCenter() {} };
    const sprite = { x: 100, y: 120, visible: true, alpha: 1, body, active: true, scaleX: 1, scaleY: 1,
        displayOriginX: 0, displayOriginY: 0, cropped: true, texture: { key: 'stub_npc' }, frame: { name: 'x' },
        anims: { isPlaying: false, stop() {} } };
    body.reset = (x, y) => { body.position.x = x; body.position.y = y; sprite.x = x; sprite.y = y; };
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
    return { behavior, sprite, chair };
}

// A seated NPC seated for real (seating.seatNPC) on a two-place sofa, with stub physics.
function mkSeated(id, opts = {}) {
    const n = mkNpc(id);
    assert.equal(seatingMod.seatNPC(n.behavior, n.chair, opts), true, 'the stub NPC sits');
    return n;
}
const feetOf = (sprite) => ({ x: sprite.x + sprite.body.width / 2, y: sprite.y + sprite.body.height / 2 });

test.afterEach(() => { window.pathfindingManager = undefined; });

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

test('an instant unseat lands the NPC on its stand spot at once, without a step or a chair push', () => {
    const built = openWorld();
    const { behavior, sprite, chair } = mkSeated('d');
    const at = seatingMod.seatedCentre?.(behavior._seat) || feetOf(sprite);
    const mgr = mkManager('d', behavior);
    mgr.setNPCVisible('d', false);
    const f = feetOf(sprite);
    assert.ok(Math.hypot(f.x - at.x, f.y - at.y) >= 8, `landed off the seat (${f.x},${f.y} from ${at.x},${at.y})`);
    const cells = new Set();
    for (let r = 0; r < built.grid.length; r++) for (let c = 0; c < built.grid[0].length; c++) cells.add(`${c * 8 + 4},${r * 8 + 4}`);
    assert.ok(cells.has(`${f.x},${f.y}`), 'the feet are on a stand-grid cell centre');
    assert.equal(behavior._seatMove, undefined, 'no step move is created');
    assert.equal(sprite.body.checkCollision.none, false, 'standing collider restored');
    assert.equal(sprite.body.width, 10);
    assert.equal(chair.body, undefined, 'a sofa has no body to push');
});

test('a hidden needs sitter is let to sit again straight away on show', () => {
    const { behavior } = mkSeated('n1', { needsStop: 'desk:1', standAt: { x: 120, y: 140 } });
    // As if it had been seated a while and tried and given up at this stop
    behavior._seatStopKey = 'desk:1';
    behavior._seatTriedAt = 5000;
    behavior._seatRetries = 3;
    behavior._seatGaveUp = true;
    behavior._seatGaveUpAt = 6000;
    const mgr = mkManager('n1', behavior);
    mgr.setNPCVisible('n1', false);
    mgr.setNPCVisible('n1', true);
    assert.equal(behavior._seat, null);
    // updateNeedsSeat tries again at a stop only through "new stop" (key differs) or a due retry;
    // a null key is the new-stop path, with the retry counts at zero
    assert.equal(behavior._seatStopKey, null, 'the stop is new again on show');
    assert.equal(behavior._seatRetries, 0, 'no retry is spent');
    assert.equal(behavior._seatGaveUp, false);
    assert.equal(behavior._seatTriedAt, undefined);
    assert.equal(behavior._seatGaveUpAt, undefined);
});

test('a needs sitter lands on its work spot when hidden', () => {
    const { behavior, sprite } = mkSeated('n2', { needsStop: 'desk:1', standAt: { x: 120, y: 140 } });
    const mgr = mkManager('n2', behavior);
    mgr.setNPCVisible('n2', false);
    assert.deepEqual(feetOf(sprite), { x: 120, y: 140 });
    assert.equal(behavior._seatMove, undefined);
});

test('hiding a needs NPC mid-fetch releases the chair it reserved', () => {
    const { behavior, chair } = mkNpc('f1');
    chair.seatedBy = 'f1';
    behavior._fetch = { chair, spot: { x: 90, y: 100 }, toward: null, stopKey: 'desk:1', phase: 'to_chair',
                        until: Date.now() + 60000, issued: true };
    // A fetch is started with the re-sit gate set at the stop; hiding mid-fetch must clear it too
    behavior._seatStopKey = 'desk:1';
    behavior._seatTriedAt = 5000;
    behavior._seatRetries = 2;
    behavior._seatGaveUp = true;
    behavior._seatGaveUpAt = 6000;
    let cancelled = false;
    behavior._goToStayDest = { x: 1, y: 1 };
    behavior.cancelMove = () => { cancelled = true; behavior._goToStayDest = null; };
    const mgr = mkManager('f1', behavior);
    mgr.setNPCVisible('f1', false);
    assert.equal(behavior._fetch, null, 'the fetch is ended');
    assert.equal(chair.seatedBy, undefined, 'the chair reservation is released');
    assert.equal(cancelled, true, 'the walk to the chair is dropped');
    // The gate is reset, so a shown NPC takes the new-stop path and sits at once
    assert.equal(behavior._seatStopKey, null, 'the stop is new again on show');
    assert.equal(behavior._seatRetries, 0, 'no retry is spent');
    assert.equal(behavior._seatGaveUp, false);
    assert.equal(behavior._seatTriedAt, undefined);
    assert.equal(behavior._seatGaveUpAt, undefined);
});

test('hiding a needs NPC mid-fetch leaves another NPC\'s reservation alone', () => {
    const { behavior, chair } = mkNpc('f2');
    chair.seatedBy = 'someone_else';
    behavior._fetch = { chair, spot: { x: 90, y: 100 }, toward: null, stopKey: 'desk:1', phase: 'to_chair',
                        until: Date.now() + 60000, issued: true };
    mkManager('f2', behavior).setNPCVisible('f2', false);
    assert.equal(chair.seatedBy, 'someone_else');
});

test('hiding an NPC that is stepping off a seat ends the step move', () => {
    openWorld();
    const { behavior, sprite } = mkSeated('s1');
    seatingMod.unseatNPC(behavior); // a normal stand-up: a step move to the stand spot
    assert.equal(behavior._seatMove?.stage, 'step', 'stepping off');
    assert.equal(sprite.body.immovable, false);
    const mgr = mkManager('s1', behavior);
    mgr.setNPCVisible('s1', false);
    assert.equal(behavior._seatMove, null, 'the step move is ended');
});

test('hiding a needs NPC mid seat move ends the move and resets the re-sit gate', () => {
    const { behavior, sprite, chair } = mkNpc('w1');
    chair.seatedBy = 'w1';
    behavior._seatMove = { chair, stopKey: 'desk:1', stage: 'walk', savedImm: false, savedBody: null, ticks: 0, still: 0, last: Infinity };
    behavior._seatStopKey = 'desk:1';
    behavior._seatTriedAt = 5000;
    behavior._seatRetries = 3;
    behavior._seatGaveUp = true;
    behavior._seatGaveUpAt = 6000;
    mkManager('w1', behavior).setNPCVisible('w1', false);
    assert.equal(behavior._seatMove, null, 'the walk is ended');
    assert.equal(chair.seatedBy, undefined, 'the chair reservation is released');
    assert.equal(behavior._seatStopKey, null, 'the stop is new again on show');
    assert.equal(behavior._seatRetries, 0);
    assert.equal(behavior._seatGaveUp, false);
    assert.equal(behavior._seatTriedAt, undefined);
    assert.equal(behavior._seatGaveUpAt, undefined);
    assert.equal(sprite.visible, false);
});
