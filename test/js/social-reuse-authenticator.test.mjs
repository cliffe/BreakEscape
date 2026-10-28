// Reusability options for the authenticator: params.strings over the default wording, and the
// `authenticator-device` room object (startAuthenticatorDevice, setGlobalPrefix, the validator).
// The real scene runs in jsdom through the real minigame framework with a no-op scheduler.
// Run with: bundle exec node --test test/js/social-reuse-authenticator.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-reuse-auth-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/authenticator/authenticator-model.js',
    'minigames/authenticator/authenticator-minigame.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'ui/modal-stack.js',
    'systems/global-writer.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
// The device starter, cut out of minigame-starters.js (the file pulls in Phaser-side imports).
const starters = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
const cut = (re) => starters.match(re)[0];
writeFileSync(join(dir, 'systems/starter.js'),
    "import { socialOverlayParams } from '../minigames/framework/social-overlay.js';\n" +
    "import { writeGlobal } from './global-writer.js';\n" +
    cut(/export function startAuthenticator\(params[\s\S]*?\nwindow\.startAuthenticator = startAuthenticator;/) + '\n' +
    cut(/export function startAuthenticatorDevice[\s\S]*?\nwindow\.startAuthenticatorDevice = startAuthenticatorDevice;/));

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
await load('systems/starter.js');

const noopSched = { schedule: () => 0, clearScheduled: () => {}, stepMs: 1 };
const open = (params) => {
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    return FW.startMinigame('authenticator', null, {
        requiresKeyboardInput: true, disableClose: true, ...params, deps: noopSched
    });
};
const drain = (scene) => { while (scene.advance()) { /* play out */ } };
const q = (scene, sel) => scene.container.querySelector(sel);

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
const pick = (scene, group, id) => {
    const input = scene.container.querySelector(`input[name="auth-${group}"][value="${id}"]`);
    input.checked = true;
    input.dispatchEvent(new window.Event('change', { bubbles: true }));
};

test('no strings: the scripted scene keeps its default wording', () => {
    const scene = open(SCRIPTED());
    assert.equal(q(scene, '.auth-wordmark').textContent, 'AUTH');
    assert.match(q(scene, '.auth-intro').textContent, /^You are watching the target/);
    assert.equal(q(scene, '.auth-send').textContent, 'Send another push');
    drain(scene);
    assert.equal(q(scene, '.auth-card-request').textContent, 'Are you trying to sign in?');
    assert.equal(q(scene, '.auth-banner').textContent, 'The target tapped Approve. The attacker is now signed in — this is MFA fatigue.');
    scene.close();
});

test('strings override every line in scripted mode, and a partial object keeps the rest', () => {
    const scene = open({ ...SCRIPTED(), strings: STRINGS });
    assert.equal(q(scene, '.auth-wordmark').textContent, 'CORP-ID');
    assert.equal(q(scene, '.auth-intro').textContent, 'Watch the handset.');
    assert.equal(q(scene, '.auth-send').textContent, 'Another one');
    drain(scene);
    assert.equal(q(scene, '.auth-card-request').textContent, 'Was this you?');
    assert.equal(q(scene, '.auth-banner').textContent, 'Signed in.');
    scene.close();
    const partial = open({ ...SCRIPTED(), strings: { wordmark: 'X' } });
    assert.equal(q(partial, '.auth-wordmark').textContent, 'X');
    assert.equal(q(partial, '.auth-send').textContent, 'Send another push');
    partial.close();
});

test('decision mode: defaults unchanged, strings applied, choice.intro and choice.confirm win', () => {
    const plain = open(DEC());
    assert.match(q(plain, '.auth-intro').textContent, /^You have the password/);
    assert.equal(q(plain, '.auth-confirm').textContent, 'Start sending prompts');
    plain.close();

    const scene = open({ ...DEC(), strings: STRINGS });
    assert.equal(q(scene, '.auth-intro').textContent, 'Watch the handset.');
    assert.equal(q(scene, '.auth-confirm').textContent, 'Go');
    pick(scene, 'timing', 'b');
    pick(scene, 'count', 'x');
    q(scene, '.auth-confirm').click();
    drain(scene);
    assert.equal(q(scene, '.auth-card-request').textContent, 'Was this you?');
    assert.equal(q(scene, '.auth-banner').textContent, 'Signed in.');
    scene.close();

    const d = DEC();
    d.choice.intro = 'Choice intro.';
    d.choice.confirm = 'Choice go';
    const both = open({ ...d, strings: STRINGS });
    assert.equal(q(both, '.auth-intro').textContent, 'Choice intro.');
    assert.equal(q(both, '.auth-confirm').textContent, 'Choice go');
    both.close();
});

// ---- the authenticator-device room object ------------------------------------------------

function openDevice(minigameData) {
    let scene = null;
    const real = FW.startMinigame.bind(FW);
    FW.startMinigame = (name, c, params) => {
        scene = real(name, c, { ...params, deps: noopSched });
        return scene;
    };
    let done = null;
    try {
        window.startAuthenticatorDevice({ scenarioData: { name: 'Work phone', type: 'authenticator-device', minigameData } },
            { onComplete: (s, r) => { done = [s, r]; } });
    } finally {
        FW.startMinigame = real;
    }
    return { scene, done: () => done };
}

test('authenticator-device plays the stream held in its own minigameData', () => {
    window.gameState = { globalVariables: { phone_approved: false, phone_sent: 0 } };
    const { scene } = openDevice({ ...SCRIPTED(), strings: STRINGS, setGlobalPrefix: 'phone_' });
    assert.equal(q(scene, '.auth-wordmark').textContent, 'CORP-ID', 'strings reach the scene');
    drain(scene);
    assert.equal(scene.getTestState().authenticator.approvedAt, '02:16');
    scene.close();
});

test('setGlobalPrefix writes <prefix>approved and <prefix>sent on close, and never lowers them', () => {
    window.gameState = { globalVariables: { phone_approved: false, phone_sent: 0 } };
    const { scene, done } = openDevice({ ...SCRIPTED(), setGlobalPrefix: 'phone_' });
    drain(scene);
    scene.close();
    assert.equal(window.gameState.globalVariables.phone_approved, true);
    assert.equal(window.gameState.globalVariables.phone_sent, 2);
    assert.equal(done()[0], true);

    // a second visit closed early sends fewer and is not approved: the globals keep their best
    const again = openDevice({ ...SCRIPTED(), setGlobalPrefix: 'phone_' });
    again.scene.close();
    assert.equal(window.gameState.globalVariables.phone_approved, true);
    assert.equal(window.gameState.globalVariables.phone_sent, 2);
});

test('without setGlobalPrefix nothing is written', () => {
    window.gameState = { globalVariables: { phone_approved: false } };
    const { scene } = openDevice(SCRIPTED());
    drain(scene);
    scene.close();
    assert.deepEqual(window.gameState.globalVariables, { phone_approved: false });
});

// ---- validator ------------------------------------------------------------------------------

const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
function lint(json) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: json['importGlobals'])
    puts JSON.generate(ValidateSocial::AuthenticatorDevice.check(ctx))`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const scenario = (md, globals = { phone_approved: false, phone_sent: 0 }) => ({
    globalVariables: globals,
    social: {},
    rooms: { r: { objects: [{ type: 'authenticator-device', name: 'Phone', minigameData: md }] } }
});

test('validator: a clean device gives no issues', { skip }, () => {
    assert.deepEqual(lint(scenario({ ...SCRIPTED(), setGlobalPrefix: 'phone_' })), []);
    assert.deepEqual(lint(scenario({ ...DEC(), strings: { send: 'x' } })), []);
});

test('validator: the stream rules apply to the object, and the prefix globals must be declared', { skip }, () => {
    const noStream = lint(scenario({ mode: 'attacker' }));
    assert.ok(noStream.some((s) => /minigameData/.test(s) && /pushes/.test(s)), noStream.join('\n'));
    const undeclared = lint(scenario({ ...SCRIPTED(), setGlobalPrefix: 'phone_' }, {}));
    assert.equal(undeclared.filter((s) => /phone_(approved|sent)/.test(s)).length, 2, undeclared.join('\n'));
    const blank = lint(scenario({ ...SCRIPTED(), setGlobalPrefix: '' }));
    assert.ok(blank.some((s) => /setGlobalPrefix must be a non-empty string/.test(s)));
});

// ---- the episode runner forwards strings only when authored ------------------------------------

test('episode mfa: strings are forwarded when authored and absent otherwise', async () => {
    const M = await import(pathToFileURL(join(js, 'minigames/episode-runner/episode-model.js')).href);
    assert.equal('strings' in M.childLaunch({ mfa: SCRIPTED() }, 'mfa').params, false);
    const withStrings = M.childLaunch({ mfa: { ...SCRIPTED(), strings: STRINGS } }, 'mfa');
    assert.deepEqual(withStrings.params.strings, STRINGS);
});
