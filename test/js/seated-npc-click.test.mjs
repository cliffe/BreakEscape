import test from 'node:test';
import assert from 'node:assert/strict';
import { seatOccupant, seatOccupants, occupantUnderTap } from '../../public/break_escape/js/systems/interaction-reach.js';

const amara = { npcId: 'amara', visible: true, _isNPC: true };
const tom = { npcId: 'tom', visible: true, _isNPC: true };
const taken = { name: 'chair', seatedBy: 'amara' };
const empty = { name: 'chair' };

test('a chair with an NPC on it names her as its occupant', () => {
    assert.equal(seatOccupant(taken, [tom, amara]), amara);
});

test('an empty chair has no occupant, so it still describes itself', () => {
    assert.equal(seatOccupant(empty, [tom, amara]), null);
    assert.equal(occupantUnderTap(empty, [amara], { npcOnFigure: () => true }), null);
});

test('a sofa reading full, or an unknown or hidden or destroyed occupant, gives nobody', () => {
    assert.equal(seatOccupant({ seatedBy: 'full' }, [amara]), null);
    assert.equal(seatOccupant({ seatedBy: 'ghost' }, [amara]), null);
    assert.equal(seatOccupant(taken, [{ ...amara, visible: false }]), null);
    assert.equal(seatOccupant(taken, [{ ...amara, destroyed: true }]), null);
    assert.equal(seatOccupant(taken, null), null);
});

test('a knocked-out occupant is not a person to talk to: the chair keeps the tap', () => {
    assert.equal(seatOccupant(taken, [amara], { isKo: () => true }), null);
});

test('the tap goes to the occupant only when it is on her figure', () => {
    assert.equal(occupantUnderTap(taken, [amara], { npcOnFigure: () => true }), amara);
    assert.equal(occupantUnderTap(taken, [amara], { npcOnFigure: () => false }), null);
});

test('another NPC under the tap does not take a chair someone else sits on', () => {
    assert.equal(occupantUnderTap(taken, [tom], { npcOnFigure: () => true }), null);
});

// ── sofas and benches: the places live in chair._places, seatedBy stays unset until full ──
const sofa = { name: 'sofa', _places: { 0: 'amara' } };
const fullSofa = { name: 'sofa', seatedBy: 'full', _places: { 0: 'amara', 1: 'tom' } };

test('a two-place sofa with one NPC on it names her, though seatedBy is unset', () => {
    assert.equal(seatOccupant(sofa, [tom, amara]), amara);
    assert.deepEqual(seatOccupants(fullSofa, [amara, tom]), [amara, tom], 'a full sofa names both');
    assert.deepEqual(seatOccupants({ seatedBy: 'full', _places: { 0: 'player', 1: 'amara' } }, [amara]), [amara], 'the player is not an NPC');
});

test('a tap on one of two sitters on a full sofa goes to the one under it', () => {
    const onTom = (n) => n === tom;
    assert.equal(occupantUnderTap(fullSofa, [amara, tom], { npcOnFigure: onTom }), tom);
});

test('a sofa tap away from her figure (the free place) still reaches the sofa', () => {
    assert.equal(occupantUnderTap(sofa, [amara], { npcOnFigure: () => false }), null);
    assert.equal(occupantUnderTap(sofa, [], { npcOnFigure: () => true }), null);
});

test('a reservation is not a sitter: with isSeated false the chair has no occupant', () => {
    const reserved = { name: 'swivel', seatedBy: 'amara' };
    assert.equal(seatOccupant(reserved, [amara], { isSeated: () => false }), null);
    assert.equal(seatOccupant(reserved, [amara], { isSeated: (n, seat) => n === amara && seat === reserved }), amara);
});

test('an inactive occupant is not considered', () => {
    assert.equal(seatOccupant(taken, [{ ...amara, active: false }]), null);
});
