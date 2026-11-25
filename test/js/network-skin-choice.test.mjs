// Skin choice (Ops S6 unit 05). Run with: node test/js/network-skin-choice.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chooseSkin, readPick, writePick, readUrlValue, rememberPress, pressed, forgetPress } from '../../public/break_escape/js/minigames/network-view/skin-choice.js';

const memory = () => {
    const data = {};
    return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v; } };
};
const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
const base = { hasOps: true };

test('the order of the rules', () => {
    assert.equal(chooseSkin({ ...base, pressed: 'gui', urlValue: 'cli', stored: 'cli', scenarioDefault: 'cli' }), 'gui');
    assert.equal(chooseSkin({ ...base, pressed: 'cli', urlValue: 'gui', stored: 'gui', scenarioDefault: 'gui' }), 'cli');
    assert.equal(chooseSkin({ ...base, urlValue: 'cli', stored: 'gui', scenarioDefault: 'gui' }), 'cli');
    assert.equal(chooseSkin({ ...base, stored: 'cli', scenarioDefault: 'gui' }), 'cli');
    assert.equal(chooseSkin({ ...base, scenarioDefault: 'cli' }), 'cli');
    assert.equal(chooseSkin({ ...base }), 'gui');
    assert.equal(chooseSkin(), 'gui');
});

test('unknown values are ignored at every step', () => {
    assert.equal(chooseSkin({ ...base, pressed: 'x', urlValue: 'y', stored: 'z', scenarioDefault: 'cli' }), 'cli');
    assert.equal(chooseSkin({ ...base, stored: 'Terminal' }), 'gui');
});

test('no ops block gives gui under every combination', () => {
    for (const p of [undefined, 'gui', 'cli']) for (const u of [undefined, 'gui', 'cli']) for (const s of [undefined, 'gui', 'cli']) for (const d of [undefined, 'gui', 'cli']) {
        assert.equal(chooseSkin({ hasOps: false, pressed: p, urlValue: u, stored: s, scenarioDefault: d }), 'gui');
    }
});

test('a stored pick is read and a bad one is ignored', () => {
    const s = memory();
    assert.equal(readPick(s), null);
    s.data.be_network_skin = 'cli';
    assert.equal(readPick(s), 'cli');
    s.data.be_network_skin = 'neon';
    assert.equal(readPick(s), null);
    assert.equal(readPick(null), null);
});

test('storage that throws is caught and the skin still switches', () => {
    assert.equal(readPick(throwing), null);
    assert.equal(writePick(throwing, 'cli'), false);
    forgetPress();
    assert.equal(rememberPress('cli', { storage: throwing }), true);
    assert.equal(chooseSkin({ ...base, pressed: pressed(), stored: readPick(throwing) }), 'cli');
    forgetPress();
});

test('the URL query is parsed', () => {
    assert.equal(readUrlValue('?net_skin=cli'), 'cli');
    assert.equal(readUrlValue('?a=1&net_skin=gui'), 'gui');
    assert.equal(readUrlValue('?net_skin=other'), null);
    assert.equal(readUrlValue(''), null);
    assert.equal(readUrlValue(undefined), null);
});

test('a press with no URL value is stored', () => {
    forgetPress();
    const s = memory();
    rememberPress('cli', { urlValue: null, storage: s });
    assert.equal(s.data.be_network_skin, 'cli');
    assert.equal(pressed(), 'cli');
    forgetPress();
});

test('a press with a URL value changes the skin and writes nothing', () => {
    forgetPress();
    const s = memory();
    s.data.be_network_skin = 'gui';
    rememberPress('cli', { urlValue: 'gui', storage: s });
    assert.equal(s.data.be_network_skin, 'gui');
    assert.equal(chooseSkin({ ...base, pressed: pressed(), urlValue: 'gui', stored: readPick(s) }), 'cli');
    forgetPress();
});

test('a bad press name is refused and writes nothing', () => {
    forgetPress();
    const s = memory();
    assert.equal(rememberPress('neon', { storage: s }), false);
    assert.deepEqual(s.data, {});
    assert.equal(pressed(), null);
});

test('importing the module touches no global', () => {
    const source = readFileSync(new URL('../../public/break_escape/js/minigames/network-view/skin-choice.js', import.meta.url), 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\//, '');
    assert.ok(!/\b(localStorage|sessionStorage|window|document|location)\b/.test(code));
    assert.ok(!/^import /m.test(code));
});
