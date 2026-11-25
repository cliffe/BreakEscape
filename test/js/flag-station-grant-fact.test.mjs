// S7 unit 06: a grant_fact flag reward handed to the flag station's processRewardEvents reaches
// grantFact (through the real applyActions). No flag-station code changes.
// Run with: node test/js/flag-station-grant-fact.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const jsRoot = join(here, '../../public/break_escape/js');
const read = rel => readFileSync(join(jsRoot, rel), 'utf8');

const root = mkdtempSync(join(tmpdir(), 'flag-grant-fact-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'flag-station'), { recursive: true });
mkdirSync(join(dir, 'framework'));
mkdirSync(join(root, 'systems'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
// the real action executor, with its own imports stubbed
writeFileSync(join(root, 'systems', 'apply-actions.js'), read('systems/apply-actions.js'));
writeFileSync(join(root, 'systems', 'global-writer.js'), 'export function writeGlobal() {}\n');
writeFileSync(join(root, 'systems', 'social-intel.js'),
    'export function grantFact(fact, opts) { (globalThis.__granted ||= []).push({ fact, opts });'
    + " return { granted: true, label: 'Label ' + fact, readiness: { newlyReady: [] } }; }\n"
    + "export function readyToastText() { return ''; }\nexport function readyToastTitle() { return ''; }\n");
for (const f of ['display-dashes', 'author-html', 'escape-html', 'lock-scope-refusal', 'flag-wording']) {
    writeFileSync(join(root, 'utils', `${f}.js`), read(`utils/${f}.js`));
}
writeFileSync(join(dir, 'flag-station', 'flag-station-minigame.js'), read('minigames/flag-station/flag-station-minigame.js'));
globalThis.window = { gameAlert() {} };
globalThis.document = { querySelector: () => null };
const { FlagStationMinigame } = await import(pathToFileURL(join(dir, 'flag-station', 'flag-station-minigame.js')).href);

test('a grant_fact reward reaches grantFact with the flag_reward source', () => {
    globalThis.__granted = [];
    const s = Object.create(FlagStationMinigame.prototype);
    s.gameId = 5;
    s.processRewardEvents([
        { type: 'grant_fact', fact: 'danaPet', label: 'Dana named her cat' },
        { type: 'grant_fact', fact: 'danaStreet' }
    ]);
    assert.deepEqual(globalThis.__granted.map(g => g.fact), ['danaPet', 'danaStreet']);
    assert.equal(globalThis.__granted[0].opts.source, 'flag_reward');
});
