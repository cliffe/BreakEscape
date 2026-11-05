// Seating (systems/seating.js): chair facings, frame orders and seat lookup.
// The live paths (player sit/roll/stand/jump, placed and needs NPCs, chair fetching)
// are proved by headless runs of scenarios/test_seating.
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
const seating = await import('../../public/break_escape/js/systems/seating.js');
const { COMPASS, seatSpec, chairFacing, snapFacing, isStaticSeatTexture } = seating;

/** A swivel chair sprite as rooms.js builds it. */
function swivel(base, frame) {
    return { isSwivelChair: true, originalTexture: `${base}${frame}`, currentFrame: frame - 1, texture: { key: `${base}${frame}` } };
}

test('rotation sheets map to facings per chair (they do not share one order)', () => {
    const cases = {
        // clockwise from south
        'chair-exec-rotate': ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'],
        // anticlockwise from south
        'chair-grey-4-rotate': ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'],
        'chair-darkgray-1-rotate': ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'],
        'chair-white-2-rotate': ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'],
        // clockwise from north
        'chair-white-1-rotate': ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
    };
    for (const [base, facings] of Object.entries(cases)) {
        facings.forEach((f, i) => assert.equal(chairFacing(swivel(base, i + 1)), f, `${base}${i + 1}`));
    }
});

test('only known chairs are seats; trolleys and carts are not', () => {
    assert.equal(seatSpec(swivel('chair-grey-1-rotate', 1))?.kind, 'swivel');
    assert.equal(seatSpec(swivel('crash-cart-rotate', 1)), null);
    assert.equal(seatSpec(swivel('wheelchair-rotate', 2)), null);
    assert.equal(seatSpec({ texture: { key: 'hospital_chair_north' } })?.facing, 'north');
    assert.equal(seatSpec({ texture: { key: 'chair-waiting-left-1' } })?.facing, 'west');
    assert.equal(seatSpec({ texture: { key: 'leather_sofa1' } })?.places.length, 2); // two places
    assert.equal(seatSpec({ texture: { key: 'm10_steel_chair1' } })?.facing, 'south');
    assert.equal(seatSpec({ texture: { key: 'm10_steel_bench1' } }), null); // a workbench
    assert.equal(seatSpec({ texture: { key: 'lecture_seat_row1' } }), null);
    assert.ok(isStaticSeatTexture('exec_chair_back1'));
    assert.ok(!isStaticSeatTexture('chair-grey-1')); // a static image that becomes a swivel chair
});

test('a static image placed as a swivel chair is not also a static seat', () => {
    // exec_chair_back1 used as a texture by a swivel sprite must read as swivel
    const s = { isSwivelChair: true, originalTexture: 'chair-exec-rotate5', currentFrame: 4, texture: { key: 'exec_chair_back1' } };
    assert.equal(seatSpec(s)?.kind, 'swivel');
});

test('snapFacing keeps a valid facing and picks the nearest otherwise', () => {
    assert.equal(snapFacing('east'), 'east');
    assert.equal(snapFacing('north-east', ['north', 'south']), 'north');
    assert.equal(snapFacing('south-west', ['south', 'west', 'east']), 'south');
    assert.equal(snapFacing('west', ['north', 'south']), 'north'); // a tie keeps list order
    assert.equal(COMPASS.length, 8);
});
