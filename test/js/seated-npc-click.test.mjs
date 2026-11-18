import test from 'node:test';
import assert from 'node:assert/strict';
import { seatOccupant, occupantUnderTap } from '../../public/break_escape/js/systems/interaction-reach.js';

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
