import test from 'node:test';
import assert from 'node:assert/strict';
import { withoutChairsIfOthers } from '../../public/break_escape/js/systems/interaction-reach.js';

const chair = { label: 'chair', isChair: true };
const mail = { label: 'Mail Workstation', isChair: false };
const phone = { label: 'Phone' };

test('chair plus one object leaves just the object, so the tap opens it directly', () => {
    const out = withoutChairsIfOthers([mail, chair]);
    assert.deepEqual(out, [mail]);
    assert.equal(out.length, 1);
});

test('chair plus two objects gives a menu of the two', () => {
    assert.deepEqual(withoutChairsIfOthers([chair, mail, phone]), [mail, phone]);
});

test('chairs only are unchanged', () => {
    const two = [chair, { label: 'chair 2', isChair: true }];
    assert.deepEqual(withoutChairsIfOthers(two), two);
    assert.deepEqual(withoutChairsIfOthers([chair]), [chair]);
});

test('empty and chair-free lists are unchanged', () => {
    assert.deepEqual(withoutChairsIfOthers([]), []);
    assert.deepEqual(withoutChairsIfOthers([mail, phone]), [mail, phone]);
});
