// S8b unit 04: the shared answer-shape file parses, every entry is whole, every `vary` path
// exists, and the helper's guard refuses a change to any other path.
// Run with: node test/js/helpdesk-answer-shapes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { answer, answerWith, answerNames, loadShapes, pathExists, varyPaths } from './helpers/helpdesk-answers.mjs';

const REQUIRED = [
  'helpdesk.granted_password', 'helpdesk.granted_mfa', 'helpdesk.refused', 'helpdesk.refused_last',
  'helpdesk.blocked', 'helpdesk.unavailable', 'helpdesk.not_found', 'helpdesk.bad_request',
  'bootstrap.helpdesk_forms', 'keyring.reset_entry', 'keyring.password_changed',
  'login.mfa_required_own_code', 'login.mfa_required_own_push', 'device.own', 'device.own_used',
  'device.unenrolled', 'device.no_device', 'prompt.waiting_own', 'phone.own', 'phone.own_number_match',
  'phone.no_phone', 'approve.own_passed', 'approve.cancelled', 'verify.own_passed'
];

test('every entry the brief names is present', () => {
  for (const name of REQUIRED) assert.ok(answerNames().includes(name), name);
});

test('every entry has a numeric status, an object body, and list-valued vary and guess', () => {
  for (const [name, e] of Object.entries(loadShapes())) {
    assert.equal(typeof e.status, 'number', name);
    assert.equal(typeof e.body, 'object', name);
    assert.ok(e.body !== null, name);
    assert.ok(Array.isArray(e.vary), `${name} vary`);
    assert.ok(Array.isArray(e.guess), `${name} guess`);
  }
});

test('every vary path exists in its body', () => {
  for (const name of answerNames()) {
    for (const p of varyPaths(name)) assert.ok(pathExists(answer(name), p), `${name}: ${p}`);
  }
});

test('answer() returns a copy', () => {
  const a = answer('device.own');
  a.body.code = 'x';
  assert.notEqual(answer('device.own').body.code, 'x');
});

test('answerWith changes a vary path and refuses any other', () => {
  const changed = answerWith('device.own', { 'body.code': '000111' });
  assert.equal(changed.body.code, '000111');
  assert.throws(() => answerWith('device.own', { 'body.displayName': 'Other' }), /not a vary path/);
  assert.throws(() => answerWith('device.own', { 'status': 500 }), /not a vary path/);
  assert.throws(() => answerWith('nope.nothing', {}), /no answer shape/);
  assert.equal(answerWith('phone.own', { 'body.requests[0].n': 2 }).body.requests[0].n, 2);
});
