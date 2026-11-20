import test from 'node:test';
import assert from 'node:assert/strict';
import { withoutChairsIfOthers, takeablesBeforeChairs } from '../../public/break_escape/js/systems/interaction-reach.js';

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

// USB habit review R3 m1: a far tap acts on the first sprite under it, in depth order
const seat = { id: 'kim_chair', interactable: true, seat: true, scenarioData: { takeable: false } };
const stick = { id: 'kim_usb', interactable: true, scenarioData: { takeable: true } };
const desk = { id: 'desk', interactable: true, scenarioData: { takeable: false } };
const isSeat = (s) => !!s.seat;

test('far tap: a takeable item drawn under a chair comes before the chair', () => {
    assert.deepEqual(takeablesBeforeChairs([seat, stick], isSeat).map(s => s.id), ['kim_usb', 'kim_chair']);
});

test('far tap: an item already above the chair keeps its place', () => {
    assert.deepEqual(takeablesBeforeChairs([stick, seat], isSeat).map(s => s.id), ['kim_usb', 'kim_chair']);
});

test('far tap: only takeable items move; furniture under the chair stays behind it', () => {
    const out = takeablesBeforeChairs([desk, seat, { ...desk, id: 'desk2' }, stick], isSeat);
    assert.deepEqual(out.map(s => s.id), ['desk', 'kim_usb', 'kim_chair', 'desk2']);
});

test('far tap: no chair, or no takeable item, leaves the order alone', () => {
    const noChair = [desk, stick];
    assert.equal(takeablesBeforeChairs(noChair, isSeat), noChair);
    const noItem = [seat, desk];
    assert.equal(takeablesBeforeChairs(noItem, isSeat), noItem);
    assert.deepEqual(takeablesBeforeChairs(null, isSeat), []);
});

test('far tap: a non-interactable takeable sprite does not jump the chair', () => {
    const hidden = { id: 'ghost', interactable: false, scenarioData: { takeable: true } };
    const list = [seat, hidden];
    assert.equal(takeablesBeforeChairs(list, isSeat), list);
});
