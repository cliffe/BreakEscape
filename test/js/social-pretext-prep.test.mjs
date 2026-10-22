// Pretext preparation (06 beats 1 and 2, N5, N6; packet P4-C).
// The card offers only held facts, keys blanks by fact id for fillPretextVars,
// and opens phone-chat or person-chat with { npcId, startKnot, pretextCallId, blanks }.
// Run with: bundle exec node --test test/js/social-pretext-prep.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const copies = [
    'minigames/pretext-prep/pretext-card.js',
    'minigames/pretext-prep/pretext-prep-minigame.js',
    'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js',
    'minigames/mail-client/mail-composer.js',
    'minigames/person-chat/person-chat-pretext.js',
    'systems/phish-rules.js',
    'systems/global-writer.js',
    'systems/social-intel.js',
    'systems/social-influence.js',
    'utils/display-dashes.js',
    'ui/modal-stack.js'
];
const dir = mkdtempSync(join(tmpdir(), 'social-pretext-prep-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of copies) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;

const { blankSlot, optionsForFact, blanksPayload, callGate, callLaunch, hintLine } = await import(pathToFileURL(join(dir, 'minigames/pretext-prep/pretext-card.js')));
const { PretextPrepMinigame } = await import(pathToFileURL(join(dir, 'minigames/pretext-prep/pretext-prep-minigame.js')));
const { fillPretextVars } = await import(pathToFileURL(join(dir, 'minigames/person-chat/person-chat-pretext.js')));

const catalogue = {
    pierce_role: {
        text: 'Melanie Pierce runs Finance.',
        provides: [
            { type: 'team', value: 'finance', label: 'Finance', kind: 'generic' },
            { type: 'team', value: 'payroll', label: 'Payroll', kind: 'generic' },
            { type: 'name', about: 'recipient', value: 'pierce_full', label: 'Melanie Pierce', kind: 'generic' }
        ]
    },
    lord_intern: {
        text: 'Sofia Lord is the new intern in Finance.',
        provides: [
            { type: 'name', about: 'intern', value: 'lord_full', label: 'Sofia Lord', kind: 'generic' },
            { type: 'name', about: 'intern', value: 'lord_first', label: 'Sofia', kind: 'generic' },
            { type: 'name', about: 'recipient', value: 'lord_full', label: 'Sofia Lord', kind: 'generic' },
            { type: 'team', about: 'intern', value: 'finance', label: 'Finance', kind: 'generic' }
        ]
    },
    old_org_chart: {
        text: 'An old chart lists Jed Baker as a manager and Accounts as the team.',
        provides: [
            { type: 'name', about: 'manager', value: 'baker_full', label: 'Jed Baker', kind: 'stale' },
            { type: 'team', about: 'intern', value: 'accounts', label: 'Accounts', kind: 'stale' }
        ]
    },
    finance_manager: {
        text: 'Melanie Pierce manages Finance.',
        provides: [
            { type: 'name', about: 'manager', value: 'pierce_full', label: 'Melanie Pierce', kind: 'distinctive' }
        ]
    },
    teague_role: {
        text: 'Morgan Teague manages the Finance team.',
        provides: [
            { type: 'name', about: 'recipient', value: 'teague_full', label: 'Morgan Teague', kind: 'generic' },
            { type: 'name', about: 'recipient', value: 'teague_first', label: 'Morgan', kind: 'generic' }
        ]
    },
    teague_trusts_shah: {
        text: 'Morgan trusts her colleague Ravi Shah.',
        provides: [
            { type: 'name', about: 'sender', value: 'shah_full', label: 'Ravi Shah', kind: 'distinctive' }
        ]
    }
};

const devCall = {
    character: 'dev',
    callId: 'service_desk_call',
    knows: {
        intern: { value: 'lord_full' },
        team: { value: 'finance' },
        manager: { value: 'pierce_full' }
    },
    lines: {
        open_buddy: { blanks: { intern: 'intern', team: 'team' }, text: "I'm with {intern} in {team}." },
        claim_manager: { blanks: { name: 'manager' }, text: '{manager} said to ring you.' }
    }
};

const brandtCall = {
    character: 'brandt',
    callId: 'brandt_desk_call',
    brief: { scope: 'Authorised test. The service desk line is in scope.', objectives: ['Learn the portal name'] },
    knows: { contact: { value: 'shah_full' } },
    lines: {
        open_ref: { blanks: { contact: 'contact' }, text: '{contact} asked me to chase this.' },
        repair_ref: { blanks: { contact: 'contact' } },
        urgent_now: { technique: 'urgency' }
    }
};

const quinnCall = {
    character: 'quinn',
    callId: 'quinn_floor_call',
    startKnot: 'floor',
    knows: { person: { value: 'teague_full' } },
    lines: { open_floor: { blanks: { person: 'person' } } }
};

function socialWith(calls) {
    return {
        people: [],
        characters: {
            brandt: { displayName: 'Brandt' },
            quinn: { displayName: 'Quinn' },
            dev: { displayName: 'Dev' }
        },
        intelFacts: catalogue,
        engagement: { scopeNote: 'Should not show when the call authors its own scope.' },
        pretextNpcs: calls
    };
}

const held = (...ids) => Object.fromEntries(ids.map((id) => [`se_intel_${id}`, true]));

function storyWith(names) {
    const values = {};
    const declared = new Set(names);
    return {
        values,
        variablesState: {
            _defaultGlobalVariables: { has: (name) => declared.has(name) },
            $(name, value) { values[name] = value; }
        }
    };
}

const launches = [];
const ended = [];
let paused = 0;
window.MinigameFramework = {
    currentMinigame: null,
    startMinigame(scene, _container, params) { launches.push({ scene, params }); return { scene }; },
    endMinigame(success, result) { ended.push({ success, result }); }
};
window.pauseKeyboardInput = () => { paused += 1; };
window.npcManager = { getNPC: () => null };

let current = null;
function open({ call, npc, globals, social }) {
    current?.cleanup();
    document.body.innerHTML = '';
    launches.length = 0;
    ended.length = 0;
    window.gameState = { globalVariables: { ...(globals || {}) } };
    window.gameScenario = { social: social || socialWith([call]) };
    window.npcManager.getNPC = (id) => (npc && npc.id === id ? npc : null);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new PretextPrepMinigame(container, {
        callId: call.callId,
        npcId: npc?.id || null,
        social: window.gameScenario.social
    });
    scene._sceneType = 'pretext-prep';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}

const text = (scene) => scene.container.textContent.replace(/\s+/g, ' ');
const blank = (scene, factId) => scene.container.querySelector(`[data-fact="${factId}"]`);

test('a team blank drops untagged finance and keeps the intern-tagged stale team', () => {
    const social = socialWith([devCall]);
    const slot = blankSlot('team', devCall, catalogue);
    assert.deepEqual(slot, { type: 'team', about: 'intern' });
    const onlyUntagged = optionsForFact('team', devCall, social, held('pierce_role'));
    assert.deepEqual(onlyUntagged.map((o) => o.value), [], 'untagged payroll and finance are not offered');
    const options = optionsForFact('team', devCall, social, held('pierce_role', 'lord_intern', 'old_org_chart'));
    assert.deepEqual(options.map((o) => o.value), ['finance', 'accounts']);
    assert.equal(options.find((o) => o.value === 'accounts').kind, 'stale');
});

test('a manager blank prefers about manager, so a recipient form of the same value stays out', () => {
    const social = socialWith([devCall]);
    assert.deepEqual(blankSlot('manager', devCall, catalogue), { type: 'name', about: 'manager' });
    const options = optionsForFact('manager', devCall, social, held('pierce_role', 'finance_manager', 'old_org_chart'));
    assert.deepEqual(options.map((o) => o.value).sort(), ['baker_full', 'pierce_full']);
    assert.equal(options.find((o) => o.value === 'baker_full').kind, 'stale');
});

test('an intern blank does not offer a recipient-only name', () => {
    const social = socialWith([devCall]);
    assert.deepEqual(blankSlot('intern', devCall, catalogue), { type: 'name', about: 'intern' });
    const options = optionsForFact('intern', devCall, social, held('lord_intern', 'pierce_role'));
    assert.deepEqual(options.map((o) => o.value), ['lord_full', 'lord_first']);
});

test('the brief lists held board sentences and the authored scope, and hides what is not held', () => {
    const scene = open({
        call: brandtCall,
        npc: { id: 'brandt_desk', npcType: 'phone', displayName: 'Brandt', currentKnot: 'start' },
        globals: held('teague_trusts_shah')
    });
    const body = text(scene);
    assert.match(body, /Authorised test\. The service desk line is in scope\./);
    assert.match(body, /Learn the portal name/);
    assert.match(body, /Use only details you have found/);
    assert.match(body, /Morgan trusts her colleague Ravi Shah/);
    assert.doesNotMatch(body, /Morgan Teague manages the Finance team/);
    assert.doesNotMatch(body, /Should not show when the call authors/);
    assert.equal(scene.params.requiresKeyboardInput, true);
    assert.equal(scene.params.disableClose, true);
    assert.ok(paused > 0);
});

test('a contact blank offers the held sender name and not a recipient name', () => {
    const scene = open({
        call: brandtCall,
        npc: { id: 'brandt_desk', npcType: 'phone', displayName: 'Brandt', currentKnot: 'start' },
        globals: held('teague_role', 'teague_trusts_shah')
    });
    assert.equal(scene.beginButton.disabled, true);
    assert.match(scene.container.querySelector('.pretext-gate').textContent, /Choose an option for the Contact blank/);
    blank(scene, 'contact').click();
    const values = [...scene.container.querySelectorAll('.pretext-picker-option')].map((el) => el.dataset.value);
    assert.deepEqual(values, ['shah_full']);
    assert.match(scene.container.querySelector('.pretext-picker-kind').textContent, /a specific detail/);
    scene.container.querySelector('.pretext-picker-option').click();
    assert.equal(scene.payload().contact.value, 'shah_full');
    assert.equal(scene.payload().contact.label, 'Ravi Shah');
    assert.match(scene.container.querySelector('[data-line="open_ref"]').textContent, /Ravi Shah asked me to chase this/);
    assert.equal(scene.beginButton.disabled, false);
});

test('nothing held leaves an empty gap, names the blank, and still allows the call', () => {
    const scene = open({
        call: brandtCall,
        npc: { id: 'brandt_desk', npcType: 'phone', displayName: 'Brandt', currentKnot: 'start' },
        globals: {}
    });
    const button = blank(scene, 'contact');
    assert.equal(button.disabled, true);
    assert.match(button.textContent, /Contact: nothing held yet/);
    assert.match(scene.container.querySelector('.pretext-readiness').textContent, /Contact: nothing held yet/);
    assert.match(scene.container.querySelector('[data-line="open_ref"]').textContent, /____ asked me to chase this/);
    assert.equal(scene.beginButton.disabled, false);
    assert.deepEqual(scene.payload(), {});
});

test('Esc closes the picker and leaves the overlay open; Close aborts with no call payload', () => {
    const scene = open({
        call: brandtCall,
        npc: { id: 'brandt_desk', npcType: 'phone', displayName: 'Brandt', currentKnot: 'start' },
        globals: held('teague_trusts_shah')
    });
    blank(scene, 'contact').click();
    assert.equal(scene.getTestState().overlay.layers[0], 'blank-picker');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(scene.container.querySelector('.pretext-picker'), null);
    assert.equal(scene.gameState.isActive, true);
    assert.deepEqual(ended, []);
    scene.container.querySelector('.pretext-close').click();
    assert.deepEqual(ended, [{ success: false, result: { aborted: true } }]);
});

test('Space and E do not start the call or close the overlay', () => {
    const scene = open({
        call: brandtCall,
        npc: { id: 'brandt_desk', npcType: 'phone', displayName: 'Brandt', currentKnot: 'start' },
        globals: held('teague_trusts_shah')
    });
    for (const key of [' ', 'e', 'E']) {
        document.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }
    assert.equal(launches.length, 0);
    assert.equal(ended.length, 0);
    assert.equal(scene.gameState.isActive, true);
});

test('Make the call opens phone-chat with blanks keyed by fact id', () => {
    const scene = open({
        call: brandtCall,
        npc: { id: 'brandt_desk', npcType: 'phone', displayName: 'Brandt', currentKnot: 'desk' },
        globals: held('teague_trusts_shah')
    });
    blank(scene, 'contact').click();
    scene.container.querySelector('.pretext-picker-option').click();
    scene.beginButton.click();
    assert.equal(launches.length, 1);
    assert.equal(launches[0].scene, 'phone-chat');
    assert.deepEqual(launches[0].params, {
        npcId: 'brandt_desk',
        startKnot: 'desk',
        pretextCallId: 'brandt_desk_call',
        blanks: { contact: { value: 'shah_full', label: 'Ravi Shah' } },
        requiresKeyboardInput: true,
        title: 'Brandt'
    });
    assert.equal('channel' in launches[0].params, false);
});

test('an in-person record opens person-chat at the authored start knot', () => {
    const scene = open({
        call: quinnCall,
        npc: { id: 'quinn_desk', npcType: 'person', displayName: 'Quinn', currentKnot: 'start' },
        globals: held('teague_role')
    });
    assert.match(scene.beginButton.textContent, /Approach/);
    blank(scene, 'person').click();
    const labels = [...scene.container.querySelectorAll('.pretext-picker-label')].map((el) => el.textContent);
    assert.deepEqual(labels, ['Morgan Teague', 'Morgan']);
    scene.container.querySelector('.pretext-picker-option').click();
    scene.beginButton.click();
    assert.equal(launches[0].scene, 'person-chat');
    assert.equal(launches[0].params.startKnot, 'floor');
    assert.equal(launches[0].params.pretextCallId, 'quinn_floor_call');
    assert.deepEqual(launches[0].params.blanks, { person: { value: 'teague_full', label: 'Morgan Teague' } });
});

test('a blank name that is not the fact id is still stored under the fact id, and fillPretextVars reads it', () => {
    const social = socialWith([devCall]);
    const facts = [{ factId: 'manager' }];
    const options = { manager: optionsForFact('manager', devCall, social, held('finance_manager', 'old_org_chart')) };
    const chosen = { manager: 'baker_full' };
    const blanks = blanksPayload(facts, options, chosen);
    assert.deepEqual(Object.keys(blanks), ['manager']);
    assert.equal(callGate(facts, options, {}).ok, false);
    assert.equal(callGate(facts, options, chosen).ok, true);
    const story = storyWith(['pretext_manager_name', 'pretext_manager_value', 'pretext_name_name']);
    fillPretextVars(story, blanks);
    assert.equal(story.values.pretext_manager_name, 'Jed Baker');
    assert.equal(story.values.pretext_manager_value, 'baker_full');
    assert.equal(story.values.pretext_name_name, undefined);
    const launch = callLaunch(devCall, { npcType: 'phone', displayName: 'Dev', currentKnot: 'start' }, 'dev_desk', blanks);
    assert.equal(launch.scene, 'phone-chat');
    assert.equal(launch.params.blanks, blanks);
});

test('both blanks must be filled when each has options, and a stale pick is allowed', () => {
    const scene = open({
        call: devCall,
        npc: { id: 'dev_desk', npcType: 'phone', displayName: 'Dev', currentKnot: 'start' },
        globals: held('lord_intern', 'old_org_chart', 'finance_manager'),
        social: socialWith([devCall])
    });
    blank(scene, 'intern').click();
    scene.container.querySelector('.pretext-picker-option').click();
    assert.equal(scene.beginButton.disabled, true);
    blank(scene, 'team').click();
    const list = scene.container.querySelector('.pretext-picker-list');
    list.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    list.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.equal(scene.payload().team.value, 'accounts');
    assert.equal(scene.payload().team.label, 'Accounts');
    blank(scene, 'manager').click();
    scene.container.querySelector('.pretext-picker-option[data-value="pierce_full"]').click();
    assert.equal(scene.beginButton.disabled, false);
    assert.deepEqual(Object.keys(scene.payload()).sort(), ['intern', 'manager', 'team']);
    assert.match(text(scene), /Sofia Lord/);
    assert.match(text(scene), /Accounts/);
    assert.match(text(scene), /Melanie Pierce said to ring you/);
});

test('R-5/R-6: the hint ladder advances by the failed-call counter, not only reports', () => {
    const spec = { callId: 'c1', hints: ['first nudge', 'second nudge', 'recipe step'] };
    assert.equal(hintLine(spec, {}), '', 'no failed call yet, no hint');
    assert.equal(hintLine(spec, { pretext_c1_reports: 0 }), '', 'counter at zero shows nothing');
    assert.equal(hintLine(spec, { pretext_c1_reports: 1 }), 'first nudge', 'one failed call shows hints[0]');
    assert.equal(hintLine(spec, { pretext_c1_reports: 2 }), 'second nudge', 'two advance to hints[1]');
    assert.equal(hintLine(spec, { pretext_c1_reports: 9 }), 'recipe step', 'further failures stay on the last line');
    assert.equal(hintLine({ callId: 'c1' }, { pretext_c1_reports: 3 }), '', 'no hints authored, no line');
});
