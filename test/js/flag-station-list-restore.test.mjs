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
