// E-E: a second flag submitted while the first is still being checked is not dropped
// silently, and the first check's success does not wipe what the player typed next.
// Run with: node --test test/js/flag-station-resubmit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/flag-station/flag-station-minigame.js');
// Mirror js/minigames/flag-station, js/systems, js/utils with stubs.
const root = mkdtempSync(join(tmpdir(), 'flag-station-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'flag-station'), { recursive: true });
mkdirSync(join(dir, 'framework'));
mkdirSync(join(root, 'systems'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(root, 'systems', 'apply-actions.js'), 'export function applyActions() {}\n');
writeFileSync(join(root, 'utils', 'display-dashes.js'), 'export function displayDashes(s) { return s; }\n');
writeFileSync(join(dir, 'flag-station', 'flag-station-minigame.js'), readFileSync(src, 'utf8'));
globalThis.window = {};
globalThis.document = { querySelector: () => null };
const { FlagStationMinigame } = await import(pathToFileURL(join(dir, 'flag-station', 'flag-station-minigame.js')).href);

function el() { return { value: '', style: {}, textContent: '', className: '', disabled: false }; }

function makeStation() {
    const els = { '#flag-input': el(), '#flag-submit-btn': el(), '#flag-result': el(), '#reward-notification': el() };
    const s = Object.create(FlagStationMinigame.prototype);
    Object.assign(s, {
        gameContainer: { querySelector: (q) => els[q] || null },
        gameId: 1, stationId: 'st', mode: 'standard', submittedFlags: [], isSubmitting: false,
    });
    s.updateFlagHistory = () => {};
    s.getCsrfToken = () => 't';
    return { s, els };
}

// fetch stub whose response the test releases by hand
function deferredFetch() {
    const calls = [];
    globalThis.fetch = (url, opts) => new Promise((resolve) => {
        calls.push({ body: JSON.parse(opts.body), resolve: (data) => resolve({ ok: true, json: async () => data }) });
    });
    return calls;
}

test('Enter during an in-flight check shows a message and does not send', async () => {
    const calls = deferredFetch();
    const { s, els } = makeStation();
    els['#flag-input'].value = 'flag{one}';
    const first = s.submitFlag();
    els['#flag-input'].value = 'flag{two}';
    await s.submitFlag();
    assert.equal(calls.length, 1);
    assert.match(els['#flag-result'].textContent, /Still checking the last flag/);
    calls[0].resolve({ success: true, message: 'ok', flagId: 'f1' });
    await first;
    assert.equal(calls[0].body.flag, 'flag{one}');
    // the next flag the player typed survives the first one's success
    assert.equal(els['#flag-input'].value, 'flag{two}');
    assert.equal(s.isSubmitting, false);
});

test('a successful check still clears the input when it holds the submitted flag', async () => {
    const calls = deferredFetch();
    const { s, els } = makeStation();
    els['#flag-input'].value = '  flag{one} ';
    const p = s.submitFlag();
    calls[0].resolve({ success: true, message: 'ok', flagId: 'f1' });
    await p;
    assert.equal(els['#flag-input'].value, '');
    assert.deepEqual(s.submittedFlags, ['flag{one}']);
});

test('the second flag can be submitted once the first check has finished', async () => {
    const calls = deferredFetch();
    const { s, els } = makeStation();
    els['#flag-input'].value = 'flag{one}';
    const p = s.submitFlag();
    els['#flag-input'].value = 'flag{two}';
    calls[0].resolve({ success: true, message: 'ok', flagId: 'f1' });
    await p;
    const p2 = s.submitFlag();
    assert.equal(calls.length, 2);
    assert.equal(calls[1].body.flag, 'flag{two}');
    calls[1].resolve({ success: true, message: 'ok', flagId: 'f2' });
    await p2;
    assert.equal(els['#flag-input'].value, '');
});
