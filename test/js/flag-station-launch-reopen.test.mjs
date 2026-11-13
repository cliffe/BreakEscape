// Launch device (launch-abort mode): reopening it after the code was accepted restores
// the ABORT/LAUNCH choice (or the result), instead of the code prompt. Playtest F1, m01.
// Run with: node --test test/js/flag-station-launch-reopen.test.mjs
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
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor(c, p) { this.params = p; } }\n');
writeFileSync(join(root, 'systems', 'apply-actions.js'), 'export function applyActions() {}\n');
writeFileSync(join(root, 'utils', 'display-dashes.js'), 'export function displayDashes(s) { return s; }\n');
writeFileSync(join(root, 'utils', 'escape-html.js'), readFileSync(new URL('../../public/break_escape/js/utils/escape-html.js', import.meta.url), 'utf8'));
writeFileSync(join(root, 'utils', 'lock-scope-refusal.js'), readFileSync(join(here, '../../public/break_escape/js/utils/lock-scope-refusal.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'flag-wording.js'), readFileSync(join(here, '../../public/break_escape/js/utils/flag-wording.js'), 'utf8'));
writeFileSync(join(dir, 'flag-station', 'flag-station-minigame.js'), readFileSync(src, 'utf8'));
globalThis.window = {};
globalThis.document = { querySelector: () => null };
const { FlagStationMinigame } = await import(pathToFileURL(join(dir, 'flag-station', 'flag-station-minigame.js')).href);


const ABORT = { setGlobal: { player_aborted_attack: true, ready_for_debrief: true }, emitEvent: 'attack_aborted' };
const LAUNCH = { setGlobal: { player_launched_attack: true, ready_for_debrief: true }, emitEvent: 'attack_launched' };
const REWARDS = [{ type: 'set_global', key: 'launch_code_submitted', value: true }];

function open(params, globals = {}, session = {}) {
    window.gameState = { globalVariables: { ...globals }, stationSubmittedFlags: session };
    const s = new FlagStationMinigame({}, {
        stationId: 'dev', mode: 'launch-abort', flagCount: 1,
        onAbort: ABORT, onLaunch: LAUNCH, flagRewards: REWARDS, ...params,
    });
    const shown = [];
    s.showLaunchAbortChoice = () => shown.push('choice');
    s.showFinalState = (title) => shown.push('final:' + title);
    s.restoreLaunchState();
    return { s, shown };
}

test('in session: the code was accepted, the device was closed, reopened with the session list', () => {
    const { s, shown } = open({}, { launch_code_submitted: true }, { dev: ['flag{x}'] });
    assert.deepEqual(shown, ['choice']);
    assert.equal(s.choiceMade, false);
});

test('in session by the submitted list alone (no reward global yet)', () => {
    const { shown } = open({}, {}, { dev: ['flag{x}'] });
    assert.deepEqual(shown, ['choice']);
});

test('reload: a stale inventory copy (flagsAllSubmitted false, no list) still shows the choice', () => {
    const { s, shown } = open({ flagsAllSubmitted: false, submittedFlags: undefined }, { launch_code_submitted: true });
    assert.deepEqual(shown, ['choice']);
    assert.equal(s.choiceMade, false);
});

test('server says all flags are submitted', () => {
    assert.deepEqual(open({ flagsAllSubmitted: true }).shown, ['choice']);
});

test('outcome already chosen: ABORT shows the final state, not the choice', () => {
    const { s, shown } = open({}, { launch_code_submitted: true, player_aborted_attack: true, ready_for_debrief: true });
    assert.deepEqual(shown, ['final:OPERATION ABORTED']);
    assert.equal(s.choiceMade, true);
});

test('outcome already chosen: LAUNCH shows its final state', () => {
    const { shown } = open({}, { launch_code_submitted: true, player_launched_attack: true, ready_for_debrief: true });
    assert.deepEqual(shown, ['final:OPERATION LAUNCHED']);
});

test('ready_for_debrief alone is not an outcome', () => {
    const { shown } = open({}, { launch_code_submitted: true, ready_for_debrief: true });
    assert.deepEqual(shown, ['choice']);
});

test('nothing submitted: the code prompt stays (no choice, no final state)', () => {
    const { s, shown } = open({}, { launch_code_submitted: false });
    assert.deepEqual(shown, []);
    assert.equal(s.choiceMade, false);
});

test('no game state at all: the code prompt stays', () => {
    window.gameState = undefined;
    const s = new FlagStationMinigame({}, { stationId: 'dev', mode: 'launch-abort', flagCount: 1, onAbort: ABORT, flagRewards: REWARDS });
    const shown = [];
    s.showLaunchAbortChoice = () => shown.push('choice');
    s.showFinalState = () => shown.push('final');
    s.restoreLaunchState();
    assert.deepEqual(shown, []);
});
