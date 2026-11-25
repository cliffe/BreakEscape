// S7 R2-5: a flag-lock unlock answer carries `rewards` with a grant_fact and its `entry`; the real
// ApiClient.unlock hands them to the real applyActions, so the fact has its words at once.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
globalThis.window = { gameAlert() {}, gameScenario: { social: { intelFacts: {} } } };
const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'api-unlock-fact-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
mkdirSync(join(dir, 'systems')); mkdirSync(join(dir, 'utils'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'config.js'), 'export const getApiBase = () => "/api";\nexport const getCsrfToken = () => "t";\n');
const copy = (rel) => writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
copy('api-client.js'); copy('systems/apply-actions.js');
for (const f of ['display-dashes', 'author-html', 'escape-html', 'lock-scope-refusal', 'flag-wording']) copy(`utils/${f}.js`);
writeFileSync(join(dir, 'systems/global-writer.js'), 'export function writeGlobal() {}\n');
writeFileSync(join(dir, 'systems/social-intel.js'),
    'export function grantFact(fact, opts) { (globalThis.__granted ||= []).push(fact);'
    + " return { granted: true, label: 'L', readiness: { newlyReady: [] } }; }\n"
    + "export function readyToastText() { return ''; }\nexport function readyToastTitle() { return ''; }\n");
const { ApiClient } = await import(pathToFileURL(join(dir, 'api-client.js')));

test('R2-5: an unlock answer with a grant_fact reward merges its entry and grants the fact', async () => {
    const entry = { text: 'Dana was born in 1990', label: 'Dana born 1990', source: 'flag', subject: 'dana' };
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, rewards: [{ type: 'grant_fact', fact: 'dana_year', entry }] }) });
    await ApiClient.unlock('object', 'safe1', 'flag{x}', 'flag');
    assert.deepEqual(window.gameScenario.social.intelFacts.dana_year, entry);
    assert.deepEqual(globalThis.__granted, ['dana_year']);
});

test('R2-5: an answer with no rewards, or no grant_fact, does nothing extra', async () => {
    globalThis.__granted = [];
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, rewards: [{ type: 'hint', message: 'x' }] }) });
    await ApiClient.unlock('object', 'safe1', 'flag{x}', 'flag');
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
    await ApiClient.unlock('object', 'safe1', 'flag{x}', 'flag');
    assert.deepEqual(globalThis.__granted, []);
});
