// The station's "Submitted Flags" list after a reload: it is built from the server's per-station
// `submittedFlags` (room data), merged with this session's own submissions.
// Run with: node --test test/js/flag-station-list-restore.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/flag-station/flag-station-minigame.js');
// Mirror js/minigames/flag-station, js/systems, js/utils with stubs.
const root = mkdtempSync(join(tmpdir(), 'flag-station-restore-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'flag-station'), { recursive: true });
mkdirSync(join(dir, 'framework'));
mkdirSync(join(root, 'systems'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(root, 'systems', 'apply-actions.js'), 'export function applyActions() {}\n');
writeFileSync(join(root, 'utils', 'display-dashes.js'), 'export function displayDashes(s) { return s; }\n');
writeFileSync(join(root, 'utils', 'escape-html.js'), readFileSync(join(here, '../../public/break_escape/js/utils/escape-html.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'lock-scope-refusal.js'), readFileSync(join(here, '../../public/break_escape/js/utils/lock-scope-refusal.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'flag-wording.js'), readFileSync(join(here, '../../public/break_escape/js/utils/flag-wording.js'), 'utf8'));
writeFileSync(join(dir, 'flag-station', 'flag-station-minigame.js'), readFileSync(src, 'utf8'));
globalThis.window = {};
globalThis.document = { querySelector: () => null };
const { FlagStationMinigame } = await import(pathToFileURL(join(dir, 'flag-station', 'flag-station-minigame.js')).href);


const make = (params, session) => {
    globalThis.window = { gameState: session ? { stationSubmittedFlags: session } : {} };
    return new FlagStationMinigame(null, { stationId: 'dropsite', ...params });
};
const items = (s) => [...s.buildFlagHistory().matchAll(/class="flag-value">([^<]*)</g)].map(m => m[1]);

test('after a reload the list shows the flags the server holds for this station', () => {
    const s = make({ submittedFlags: ['flag{a}', 'flag{b}'] }, null);
    assert.deepEqual(items(s), ['flag{a}', 'flag{b}']);
    assert.ok(!s.buildFlagHistory().includes('No flags submitted yet'));
});

test('a flag submitted after the reload is added to the restored ones, not shown alone', () => {
    const s = make({ submittedFlags: ['flag{a}', 'flag{b}'] }, null);
    s.submittedFlags.push('flag{c}');
    assert.deepEqual(items(s), ['flag{a}', 'flag{b}', 'flag{c}']);
});

test('session submissions merge with the server list without duplicates', () => {
    const s = make({ submittedFlags: ['flag{a}', 'flag{b}'] }, { dropsite: ['flag{b}', 'flag{c}'], other: ['flag{z}'] });
    assert.deepEqual(items(s), ['flag{a}', 'flag{b}', 'flag{c}']);
});

test('a station with no server list and no session flags says none yet', () => {
    const s = make({}, null);
    assert.deepEqual(items(s), []);
    assert.ok(s.buildFlagHistory().includes('No flags submitted yet'));
});

// The link from cached door roomData to the minigame: interactions.js builds the minigame params
// from `sprite.scenarioData`, which the client takes from the unlock response's roomData. The
// handler sits inside a large module that needs the whole engine, so the params literal is cut
// out of the source and evaluated against a station built from roomData.
const interactionsSrc = readFileSync(join(here, '../../public/break_escape/js/systems/interactions.js'), 'utf8');
const paramsFrom = (scenarioData) => {
    const start = interactionsSrc.indexOf("startMinigame('flag-station', null, {");
    assert.ok(start > 0, 'flag-station startMinigame call found in interactions.js');
    const open = interactionsSrc.indexOf('{', start);
    let depth = 0, end = open;
    for (; end < interactionsSrc.length; end++) {
        if (interactionsSrc[end] === '{') depth++;
        else if (interactionsSrc[end] === '}' && --depth === 0) break;
    }
    const literal = interactionsSrc.slice(open, end + 1);
    const sprite = { scenarioData, objectId: scenarioData.id };
    return new Function('sprite', 'window', `return (${literal});`)(sprite, { breakEscapeConfig: { gameId: 1 } });
};

test('a station built from cached door roomData shows the restored list in the minigame', () => {
    // As the unlock response serves it: flags stripped to a count, submittedFlags annotated
    const roomData = { objects: [{ type: 'flag-station', id: 'dropsite', name: 'Dropsite', flagCount: 3,
        submittedFlags: ['flag{a}', 'flag{b}'], flagsAllSubmitted: false }] };
    const params = paramsFrom(roomData.objects[0]);
    assert.deepEqual(params.submittedFlags, ['flag{a}', 'flag{b}']);
    assert.equal(params.flagCount, 3);
    const s = make(params, null);
    assert.deepEqual(items(s), ['flag{a}', 'flag{b}']);
    assert.ok(!s.buildFlagHistory().includes('No flags submitted yet'));
});

test('a station from roomData without the annotation falls back to none yet', () => {
    const params = paramsFrom({ type: 'flag-station', id: 'dropsite', name: 'Dropsite', flagCount: 3 });
    assert.equal(params.submittedFlags, undefined);
    assert.ok(make(params, null).buildFlagHistory().includes('No flags submitted yet'));
});
