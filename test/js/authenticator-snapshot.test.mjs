// Snapshot of the authenticator scene's markup after init, for three parameter sets: the `mfa`
// block of ca03_helpdesk_reset's episode (decision mode, phone hidden), a timeline set
// { pushes, approvesAt }, and the fixtures of social-reuse-authenticator.test.mjs. The live
// authenticator split (S8a unit 19) must keep this green without touching the snapshot.
// Record with: UPDATE_SNAPSHOT=1 node --test test/js/authenticator-snapshot.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const FIXTURE = join(here, 'fixtures/authenticator_snapshot.json');

const dir = mkdtempSync(join(tmpdir(), 'auth-snapshot-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/authenticator/authenticator-model.js',
    'minigames/authenticator/authenticator-minigame.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'utils/escape-html.js', 'utils/author-html.js', 'ui/modal-stack.js',
    'systems/global-writer.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.Event = dom.window.Event;
console.log = () => {};
console.warn = () => {};
console.error = () => {};
window.eventDispatcher = { emit() {} };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { AuthenticatorMinigame } = await load('minigames/authenticator/authenticator-minigame.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('authenticator', AuthenticatorMinigame);

const noopSched = { schedule: () => 0, clearScheduled: () => {}, stepMs: 1 };
const open = (params) => {
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    return FW.startMinigame('authenticator', null, {
        requiresKeyboardInput: true, disableClose: true, ...params, deps: noopSched
    });
};

// The fixtures of social-reuse-authenticator.test.mjs.
const PUSHES = [
    { at: '02:14', app: 'SecureAuth', account: 'a.b', location: 'Lagos, NG', device: 'Chrome' },
    { at: '02:15', app: 'SecureAuth', account: 'a.b', location: 'Lagos, NG', device: 'Chrome' }
];
const SCRIPTED = () => ({ mode: 'attacker', pushes: PUSHES.map((p) => ({ ...p })), approvesAt: '02:16' });
const DEC = () => ({
    mode: 'attacker',
    choice: {
        timing: { legend: 'When?', options: [
            { id: 'a', label: 'Day', at: '10:20', outcome: 'Day.' }, { id: 'b', label: 'Night', at: '02:14', outcome: 'Night.' }] },
        count: { legend: 'How many?', options: [
            { id: 'x', label: 'Few', n: 2, note: 'Few.' }, { id: 'y', label: 'Many', n: 9, note: 'Many.' }] }
    },
    pushTemplate: { app: 'SSO', account: 'a.b' },
    defenderNote: 'Number matching.'
});
const STRINGS = {
    intro: 'Watch the handset.', approved: 'Signed in.', send: 'Another one', confirm: 'Go',
    wordmark: 'CORP-ID', request: 'Was this you?'
};

// Inputs: ca03_helpdesk_reset's episode `mfa` block is stored here as a copy (it is a generated
// scenario value), so this test does not depend on rendering the scenario.
const stored = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const CASES = {
    ca03_decision: () => ({ ...stored.inputs.ca03_decision }),
    timeline: () => ({ mode: 'attacker', pushes: PUSHES.map((p) => ({ ...p })), approvesAt: '02:16' }),
    reuse_scripted: SCRIPTED,
    reuse_scripted_strings: () => ({ ...SCRIPTED(), strings: STRINGS }),
    reuse_decision: DEC,
    reuse_decision_strings: () => ({ ...DEC(), strings: STRINGS })
};

const render = (name) => {
    const scene = open(CASES[name]());
    const html = scene.container.innerHTML;
    scene.close();
    return html;
};

test('authenticator markup after init matches the stored snapshot', () => {
    for (const name of Object.keys(CASES)) {
        assert.equal(render(name), stored.snapshots[name], `snapshot for ${name}`);
        assert.equal(render(name), render(name), `${name} renders the same twice`);
    }
});

test('ca03 decision mode starts with the phone hidden', () => {
    const scene = open(CASES.ca03_decision());
    assert.equal(scene.container.querySelector('.auth-phone').hidden, true);
    scene.close();
});

if (process.env.UPDATE_SNAPSHOT === '1') {
    const snapshots = {};
    for (const name of Object.keys(CASES)) snapshots[name] = render(name);
    writeFileSync(FIXTURE, JSON.stringify({ inputs: stored.inputs, snapshots }, null, 2) + '\n');
}
