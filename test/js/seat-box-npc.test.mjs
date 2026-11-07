// Slice 6 (the NPC needs half, SEAT_BOX_PLAN.md section 6): the sweep-based tuck a needs NPC's
// swivel chair takes when it is pulled out to sit, fetched to a desk, or tucked in on leaving.
// The sweep geometry itself is proved in seat-box.test.mjs; here we check the seating.js glue
// (sweepChairToContact, tuckIn) moves the chair's foot the right distance, and never through a
// desk. Fake bodies only; no browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
const seating = await import('../../public/break_escape/js/systems/seating.js');

const iter = list => ({ iterate(fn) { list.forEach(fn); } });

/** A static desk footprint body (SEAT_BOX_PLAN 2.1: F − foot … F), feet-down geometry. */
const desk = (left, top, w, h, name = 'desk1') =>
    ({ left, top, right: left + w, bottom: top + h, enable: true, immovable: false, physicsType: 1, gameObject: { name } });

/** A swivel chair (office40: body 18 x 8 at offset (11, 31) in a 40 x 40 frame), its foot the body centre. */
function swivel(x, y, statics = []) {
    const scene = { physics: { world: { staticBodies: iter(statics), bodies: iter([]) } } };
    const chair = {
        scene, isSwivelChair: true, originalTexture: 'chair-grey-1-rotate0', texture: { key: 'chair-grey-1-rotate0' },
        currentFrame: 0, x, y, displayOriginX: 0, displayOriginY: 0, scaleX: 1, scaleY: 1, width: 40, height: 40,
        elevation: 0, active: true, objectId: 'c'
    };
    chair.body = {
        gameObject: chair, offset: { x: 11, y: 31 }, width: 18, height: 8, enable: true, immovable: false,
        position: { x: x + 11, y: y + 31, copy(p) { this.x = p.x; this.y = p.y; } },
        prev: { copy() {} }, prevFrame: { copy() {} },
        get left() { return this.position.x; }, get top() { return this.position.y; },
        get right() { return this.position.x + this.width; }, get bottom() { return this.position.y + this.height; },
        setVelocity() {}, reset(nx, ny) { chair.x = nx; chair.y = ny; },
        updateFromGameObject() { this.position.x = chair.x + this.offset.x; this.position.y = chair.y + this.offset.y; },
        updateCenter() {}
    };
    return chair;
}
/** The chair's castor base (its body centre), the point the F + 4 contact line is measured from. */
const foot = chair => ({ x: chair.x + 11 + 9, y: chair.y + 31 + 4 });

test('sweepChairToContact: a front chair within 24 px tucks so the castor lands at F + 4', () => {
    // desk footprint F 216 (bottom), 16 px deep; chair block top 20 px below it (castor 20 past F + 4)
    const d = desk(0, 200, 120, 16);     // F = 216
    const chair = swivel(10, 205, [d]);  // block top = 205 + 31 = 236, castor y = 240
    assert.equal(foot(chair).y, 240);
    seating.sweepChairToContact(chair, 'north');
    assert.equal(foot(chair).y, d.bottom + 4, 'castor at F + 4');  // 220
    assert.equal(chair.body.top, d.bottom, 'block front meets the footprint');
});

test('sweepChairToContact: a desk further than 24 px away leaves the chair where it was pulled out to', () => {
    const d = desk(0, 200, 120, 16);     // F = 216
    const chair = swivel(10, 215, [d]);  // block top = 246, a 30 px gap (> 24)
    const before = { x: chair.x, y: chair.y };
    seating.sweepChairToContact(chair, 'north');
    assert.deepEqual({ x: chair.x, y: chair.y }, before, 'unchanged');
});

test('sweepChairToContact: the back of a desk stops a chair rolled in from behind', () => {
    // chair south-facing, rolling north into a desk whose back edge (top) is just ahead
    const d = desk(0, 230, 120, 16);     // back edge (top) 230, front (bottom) 246
    const chair = swivel(10, 185, [d]);  // block bottom = 185 + 39 = 224, 6 px short of the back edge
    seating.sweepChairToContact(chair, 'south');
    assert.equal(chair.body.bottom, d.top, 'block back meets the footprint back edge');  // 230
    assert.equal(foot(chair).y, d.top - 4, 'castor at back edge − 4');
});

test('sweepChairToContact: no desk in the way leaves the chair put (empty-floor case)', () => {
    const chair = swivel(10, 205, []);
    const before = { x: chair.x, y: chair.y };
    seating.sweepChairToContact(chair, 'north');
    assert.deepEqual({ x: chair.x, y: chair.y }, before);
});

test('tuckIn: moves min(TUCK_PX, sweep) — short of a close desk, the full 12 px with none', () => {
    const seat = seating.seatSpec(swivel(0, 0));
    // Desk 5 px ahead: tuck is clamped to 5, so the block stops at the footprint, not inside it
    const d = desk(0, 200, 120, 16);        // F = 216
    const close = swivel(10, 190, [d]);     // block top = 221, 5 px below F
    seating.tuckIn(close, seat, 'north');
    assert.equal(close.body.top, d.bottom, 'clamped to the contact line, not driven through');  // 216
    // No desk: the full 12 px tuck
    const open = swivel(10, 190, []);
    const y0 = foot(open).y;
    seating.tuckIn(open, seat, 'north');
    assert.equal(foot(open).y, y0 - 12, 'full TUCK_PX with nothing in the way');
});

test('tuckIn: a reserved chair (seatedBy) or a static seat is left alone', () => {
    const seat = seating.seatSpec(swivel(0, 0));
    const d = desk(0, 200, 120, 16);
    const reserved = swivel(10, 190, [d]); reserved.seatedBy = 'someone';
    const before = { x: reserved.x, y: reserved.y };
    seating.tuckIn(reserved, seat, 'north');
    assert.deepEqual({ x: reserved.x, y: reserved.y }, before, 'reserved chair not tucked');
});

// Regression guard for "the chair sprite and its body come apart" (seat box slice 6
// investigation, 2026-11-07): every chair move in this module goes through placeBody,
// which re-syncs the body from the sprite. After a sweep or a tuck the body's top-left
// must still equal the sprite's position plus the body offset — never left at the
// pulled-out spot while the sprite moves to the desk. (Office40 body offset is (11, 31).)
const glued = chair => chair.body.position.x === chair.x + chair.body.offset.x
    && chair.body.position.y === chair.y + chair.body.offset.y;

test('sweepChairToContact: the body stays glued to the sprite after a tuck', () => {
    const d = desk(0, 200, 120, 16);     // F = 216
    const chair = swivel(10, 205, [d]);  // castor 20 px past F + 4 — a real sweep
    seating.sweepChairToContact(chair, 'north');
    assert.notEqual(chair.y, 205, 'the chair actually moved (not a no-op)');
    assert.ok(glued(chair), 'body top-left = sprite + offset after the sweep');
});

test('tuckIn: the body stays glued to the sprite after the tuck', () => {
    const seat = seating.seatSpec(swivel(0, 0));
    const open = swivel(10, 190, []);    // no desk: the full 12 px tuck
    seating.tuckIn(open, seat, 'north');
    assert.notEqual(open.y, 190, 'the chair actually moved');
    assert.ok(glued(open), 'body top-left = sprite + offset after the tuck');
});
