// nit3 (format hardening step 8a R1): the JS outage helpers must treat an empty-object `offWhen` as
// "no condition" (never off), the same way Ruby's AccessWork.off_when_present? does (an empty Hash is
// not present). The schema forbids an empty object (minProperties 1) and the server never ships one,
// so this is an edge the corpus cannot reach; the guard keeps the Ruby and JS contracts in step.
//
// Each live helper is read from its module source and built as a callable (no module import, so the
// helpers' own dependencies are not needed): the object branch for `{}` runs before any of them.
//
// Run with: bin/test-js test/js/outage-empty-hash-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');

function read(rel) {
    return readFileSync(join(repo, rel), 'utf8');
}

// Pull the function or method that starts at `marker` out of module text and build it as a callable,
// matching braces from the first `{` so nested blocks do not end it early. `asName` renames the head
// (an `export function NAME`, a bare `function NAME`, or a class method `NAME(`) to an anonymous
// function so it evaluates standalone.
function extract(src, marker, asName) {
    const start = src.indexOf(marker);
    assert.ok(start >= 0, `${marker} found`);
    // Walk the parameter list first (its default values may hold `{}`), then the body opens at the
    // first `{` after the params close.
    const paramsOpen = src.indexOf('(', start);
    assert.ok(paramsOpen >= 0, `${marker} params open paren found`);
    let pd = 0;
    let paramsClose = -1;
    for (let i = paramsOpen; i < src.length; i += 1) {
        if (src[i] === '(') pd += 1;
        else if (src[i] === ')') { pd -= 1; if (pd === 0) { paramsClose = i; break; } }
    }
    assert.ok(paramsClose >= 0, `${marker} params close paren found`);
    const open = src.indexOf('{', paramsClose);
    assert.ok(open >= 0, `${marker} body open brace found`);
    let depth = 0;
    let end = -1;
    for (let i = open; i < src.length; i += 1) {
        const ch = src[i];
        if (ch === '{') depth += 1;
        else if (ch === '}') {
            depth -= 1;
            if (depth === 0) { end = i; break; }
        }
    }
    assert.ok(end >= 0, `${marker} body close brace found`);
    const head = src.slice(start, open);
    const body = src.slice(open, end + 1);
    // eslint-disable-next-line no-eval
    return (0, eval)(`(${head.replace(asName, 'function ')}${body})`);
}

const pcSwitchedOff = extract(read('public/break_escape/js/systems/unlock-system.js'),
    'export function pcSwitchedOff', 'export function pcSwitchedOff');
const offWhenHoldsContainer = extract(read('public/break_escape/js/minigames/container/container-minigame.js'),
    'export function offWhenHolds', 'export function offWhenHolds');
const offWhenHoldsWork = extract(read('public/break_escape/js/systems/npc-work.js'),
    'function offWhenHolds', 'function offWhenHolds');
const isOff = extract(read('public/break_escape/js/systems/npc-needs.js'),
    '_isOff(o)', '_isOff');

test('pcSwitchedOff: an empty-object offWhen is never off', () => {
    assert.equal(pcSwitchedOff({ offWhen: {} }, { anything: true }), false);
    // A sanity check that a real condition still reads: a matching single-key object is off.
    assert.equal(pcSwitchedOff({ offWhen: { x: true } }, { x: true }), true);
});

test('container offWhenHolds: an empty-object offWhen is never off', () => {
    assert.equal(offWhenHoldsContainer({ offWhen: {} }, { anything: true }), false);
    assert.equal(offWhenHoldsContainer({ offWhen: { x: true } }, { x: true }), true);
});

test('npc-work offWhenHolds: an empty-object condition never holds', () => {
    assert.equal(offWhenHoldsWork({}, () => true), false);
    assert.equal(offWhenHoldsWork({ x: true }, name => (name === 'x' ? true : undefined)), true);
});

test('npc-needs _isOff: an empty-object offWhen is never off', () => {
    // The empty-object guard returns before `this` is touched, so a bare object stands in for the
    // NeedsSim instance.
    assert.equal(isOff.call({}, { id: 'pc', offWhen: {} }), false);
});
