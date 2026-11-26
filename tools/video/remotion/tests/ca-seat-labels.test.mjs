// withSeatLabels: edit-level seat_labels merge under shot-level ones (Teaser.tsx uses it for ca15's ATTACKER / THE SHORTCUT tabs).
// Run: node --test tests/ca-seat-labels.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { buildTimeline, withSeatLabels } from '../src/timeline.js';

const edit = () => ({ fps: 30, shots: [
  { id: 'a', duration: 1 },
  { id: 'b', duration: 1, seat_labels: { attack: 'ATTACKER' } },
  { id: 'c', duration: 1, seat_labels: { defend: 'YOUR TURN' } },
] });

test('shot-level seat_labels win per key over the edit-level ones', () => {
  const tl = withSeatLabels(buildTimeline(edit()), { attack: 'THE SHORTCUT', defend: 'DEFENDER' });
  assert.deepEqual(tl.shots[0].seat_labels, { attack: 'THE SHORTCUT', defend: 'DEFENDER' });
  assert.deepEqual(tl.shots[1].seat_labels, { attack: 'ATTACKER', defend: 'DEFENDER' });
  assert.deepEqual(tl.shots[2].seat_labels, { attack: 'THE SHORTCUT', defend: 'YOUR TURN' });
});

test('no edit-level seat_labels leaves the timeline unchanged', () => {
  const tl = buildTimeline(edit());
  assert.equal(withSeatLabels(tl, undefined), tl);
  assert.equal(withSeatLabels(tl, null).shots[1].seat_labels.attack, 'ATTACKER');
  assert.equal(withSeatLabels(tl, undefined).shots[0].seat_labels, undefined);
});

test('the merge does not mutate the input timeline or change timing', () => {
  const tl = buildTimeline(edit());
  const out = withSeatLabels(tl, { attack: 'X' });
  assert.equal(tl.shots[0].seat_labels, undefined);
  assert.equal(out.totalFrames, tl.totalFrames);
  assert.equal(out.shots[2].startFrame, tl.shots[2].startFrame);
});
