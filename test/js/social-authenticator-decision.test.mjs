// E3 MFA-fatigue decision (E3-11, FUN_DECISIONS q_e3mfa). When the authenticator scene is given a
// `choice` block, the learner first picks WHEN to fire the prompts and HOW MANY; the burst then
// plays, the target approves, and an outcome panel explains why this combination landed and names
// the defender's control. Every combination lands — there is no dead end.
//
// The real scene runs in jsdom through the real minigame framework, with a no-op scheduler so the
// timeline is advanced by hand. The scripted (no-`choice`) path is covered by social-authenticator.
// Run with: bundle exec node --test test/js/social-authenticator-decision.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-auth-decision-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/authenticator/authenticator-model.js',
    'minigames/authenticator/authenticator-minigame.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'ui/modal-stack.js'
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

const events = [];
window.eventDispatcher = { emit(name, data) { events.push({ name, data }); } };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { AuthenticatorMinigame } = await load('minigames/authenticator/authenticator-minigame.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('authenticator', AuthenticatorMinigame);

const noopSched = { schedule: () => 0, clearScheduled: () => {}, stepMs: 1 };

const DEC = () => ({
    mode: 'attacker',
    choice: {
        intro: 'Decide when and how many.',
        confirm: 'Start sending prompts',
        timing: {
            legend: 'When do you send them?',
            options: [
                { id: 'work', label: 'During working hours', at: '10:20', outcome: 'Daytime: he nearly reported it.' },
                { id: 'night', label: 'The early hours', at: '02:14', outcome: 'Half-asleep, he tapped Approve.' }
            ]
        },
        count: {
            legend: 'How many prompts?',
            options: [
                { id: 'few', label: 'Two or three', n: 3, note: 'A couple lean on the pretext.' },
                { id: 'flood', label: 'One after another', n: 30, note: 'A flood is the loudest version.' }
            ]
        }
    },
    pushTemplate: { app: 'Quayholt SSO', account: 'gordon.mcleish@quayholt.example', location: 'Rotterdam, Netherlands', device: 'Chrome on Windows' },
    defenderNote: 'Number matching makes a half-asleep tap useless.'
});

const open = (params) => {
    events.length = 0;
    document.body.querySelectorAll('.minigame-container').forEach((n) => n.remove());
    return FW.startMinigame('authenticator', null, {
        requiresKeyboardInput: true, disableClose: true, ...params, deps: noopSched
    });
};
const named = (n) => events.filter((e) => e.name === n);
const pick = (scene, group, id) => {
    const input = scene.container.querySelector(`input[name="auth-${group}"][value="${id}"]`);
    assert.ok(input, `radio auth-${group}=${id} exists`);
    input.checked = true;
    input.dispatchEvent(new window.Event('change', { bubbles: true }));
};
const drain = (scene) => { while (scene.advance()) { /* play out */ } };

test('the choice panel is shown and the phone is held back until a choice is confirmed', () => {
    const scene = open(DEC());
    assert.ok(scene.container.querySelector('.auth-choice'), 'choice panel drawn');
    assert.equal(scene.container.querySelectorAll('input[name="auth-timing"]').length, 2);
    assert.equal(scene.container.querySelectorAll('input[name="auth-count"]').length, 2);
    assert.equal(scene.container.querySelector('.auth-phone').hidden, true, 'phone hidden before a choice');
    assert.equal(scene.container.querySelector('.auth-controls').hidden, true, 'send control hidden before a choice');
    assert.ok(scene.container.textContent.includes('Decide when and how many.'));
    // nothing plays until confirmed
    assert.equal(scene.getTestState().authenticator.decision.decided, false);
    assert.equal(scene.advance(), null, 'no timeline until a choice is made');
    scene.close();
});

test('confirm is disabled until both a time and a count are chosen', () => {
    const scene = open(DEC());
    const confirm = scene.container.querySelector('.auth-confirm');
    assert.equal(confirm.disabled, true);
    pick(scene, 'timing', 'night');
    assert.equal(confirm.disabled, true, 'one choice is not enough');
    pick(scene, 'count', 'few');
    assert.equal(confirm.disabled, false, 'both chosen: confirm enabled');
    scene.close();
});

test('a confirmed choice plays the burst, the target approves, and the outcome explains why', () => {
    const scene = open(DEC());
    pick(scene, 'timing', 'night');
    pick(scene, 'count', 'few');
    scene.container.querySelector('.auth-confirm').click();

    assert.equal(scene.container.querySelector('.auth-phone').hidden, false, 'phone revealed');
    assert.equal(scene.container.querySelector('.auth-choice').hidden, true, 'choice panel hidden');
    assert.equal(scene.getTestState().authenticator.decision.decided, true);

    drain(scene);

    assert.equal(scene.getTestState().authenticator.approvedAt, '02:14', 'target approved');
    assert.equal(scene.container.querySelectorAll('.auth-card').length, 3, 'three cards for "two or three"');
    assert.ok(scene.container.querySelector('.auth-banner').textContent.includes('MFA fatigue'));

    const outcome = scene.container.querySelector('.auth-outcome');
    assert.ok(outcome, 'outcome panel shown');
    assert.ok(outcome.textContent.includes('Half-asleep, he tapped Approve.'), 'the chosen timing outcome');
    assert.ok(outcome.textContent.includes('A couple lean on the pretext.'), 'the chosen count note');
    assert.ok(outcome.textContent.includes('Number matching'), 'the defender control');
    assert.equal(scene.getTestState().authenticator.decision.outcomeShown, true);
    scene.close();
});

test('a large count collapses to a capped set of cards plus a summary line, and still lands', () => {
    const scene = open(DEC());
    pick(scene, 'timing', 'work');
    pick(scene, 'count', 'flood');
    scene.container.querySelector('.auth-confirm').click();
    drain(scene);

    assert.equal(scene.container.querySelectorAll('.auth-card').length, 4, 'cards capped at CHOICE_MAX_CARDS');
    const more = scene.container.querySelector('.auth-feed-more');
    assert.ok(more, 'a summary line stands in for the rest');
    assert.ok(more.textContent.includes('26 more'), '30 chosen, 4 shown, 26 summarised');
    assert.equal(scene.getTestState().authenticator.decision.chosenCount, 30);
    assert.equal(scene.getTestState().authenticator.approvedAt, '10:20', 'the flood lands too — no dead end');
    scene.close();
});

test('every timing/count combination lands (the approval always plays)', () => {
    for (const t of ['work', 'night']) {
        for (const c of ['few', 'flood']) {
            const scene = open(DEC());
            pick(scene, 'timing', t);
            pick(scene, 'count', c);
            scene.container.querySelector('.auth-confirm').click();
            drain(scene);
            assert.notEqual(scene.getTestState().authenticator.approvedAt, null, `${t}/${c} lands`);
            scene.close();
        }
    }
});

test('Close is a normal exit and the result carries the choice', () => {
    const scene = open(DEC());
    pick(scene, 'timing', 'night');
    pick(scene, 'count', 'flood');
    scene.container.querySelector('.auth-confirm').click();
    drain(scene);
    scene.container.querySelector('.se-overlay-close').click();
    assert.equal(named('minigame_failed').length, 0);
    assert.equal(named('minigame_completed').length, 1);
    const result = named('minigame_completed')[0].data.result;
    assert.equal(result.mode, 'attacker');
    assert.equal(result.approvedAt, '02:14');
    assert.equal(result.timing, 'night');
    assert.equal(result.count, 'flood');
    assert.equal(result.sent, 4, 'sent counts the rendered cards');
});
