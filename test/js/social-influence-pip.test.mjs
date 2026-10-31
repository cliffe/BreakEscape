// Influence pip, chat headers and the board's "From the call" section
// (00 S13, 06 N4, 03 N1; plan packet P4-E).
//
//   pip absent for a character with no sprite
//   pip absent when influence.display.pip is false
//   pip shown for a sprite character whose influence has moved, then hidden
//     again when the value returns to the start; a hostile sprite keeps the
//     health bar's place and gets no pip
//   header bar absent when influence.display.bar is false, in both chat
//     headers, while a threshold effect still fires
//   bar and tells sit in both chat headers; phone bubbles are render-only
//
// Run with: bundle exec node --test test/js/social-influence-pip.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-influence-pip-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'ui/pretext-chrome.js', 'ui/influence-bar.js', 'ui/npc-influence-pips.js', 'ui/theme-colours.js',
    'utils/constants.js', 'config/combat-config.js',
    'systems/social-influence.js', 'systems/global-writer.js',
    'minigames/intel-board/board-model.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
window.stateSync = { sync() {} };

const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { formatPretextTells, tellBubble, ChatInfluence, influenceTintFilter } = await imp('ui/pretext-chrome.js');
const { planPips, NPCInfluencePips } = await imp('ui/npc-influence-pips.js');
const { installSocialInfluence, uninstallSocialInfluence } = await imp('systems/social-influence.js');
const { buildBoardModel } = await imp('minigames/intel-board/board-model.js');

function dispatcher() {
    const map = new Map();
    return {
        on(name, fn) { map.set(name, [...(map.get(name) || []), fn]); },
        off(name, fn) { map.set(name, (map.get(name) || []).filter((f) => f !== fn)); },
        emit(name, data) { for (const fn of (map.get(name) || []).slice()) fn(data); }
    };
}

function devScenario(display) {
    const influence = { global: 'dev_influence', min: -100, max: 100, start: -10 };
    if (display) influence.display = display;
    return {
        globalVariables: { dev_influence: -10, dev_latched: '', dev_reported: false, dev_wary: false },
        social: {
            characters: {
                dev: {
                    displayName: 'Dev',
                    channels: { phone: 'dev_phone' },
                    influence,
                    thresholds: [
                        { id: 'wary', at: -40, icon: 'wary', effects: [
                            { type: 'setGlobal', global: 'dev_wary', value: true, clearOnRearm: true }] },
                        { id: 'reports', at: -70, icon: 'reports', effects: [
                            { type: 'setGlobal', global: 'dev_reported', value: true }] }
                    ]
                }
            }
        }
    };
}

const failLine = 'Manager. You said "Jed Baker". Her directory shows Melanie Pierce.';
const priyaSpec = {
    asks: { email_format: { floor: -30 }, pw_reset: { floor: -20 } },
    tells: {
        manager: { fail: failLine, failCategory: 'Manager. That did not match what she can look up.', pass: 'Manager checks out.' },
        award: { pass: 'Shared detail. A real detail she can confirm builds trust.' },
        floor: { unknown: 'Floor. She has no way to check this.' },
        techniques: { urgency: 'Urgency. Helpdesk staff are trained to slow down when pushed.', shared_detail: 'Shared detail. A real detail she can confirm builds trust.' },
        repair: 'Corrected. Owning a slip early costs less than defending it.',
        ask: {
            accepted: 'Low-stakes: she would tell any new starter this.',
            pending: 'She wants to verify you first.',
            refused: 'She needs more before doing this.'
        }
    }
};

test('tells use the 06 §4.4 lines: delta, band, mark, and the authored reason', () => {
    const session = {
        log: [
            { kind: 'say', id: 'manager_line', band: 1, entries: [
                { delta: -30, reason: 'manager', line: failLine }] },
            { kind: 'say', id: 'repair_line', band: 0, entries: [
                { delta: 10, reason: 'manager', line: 'Manager checks out.' },
                { delta: 10, reason: 'candour', line: priyaSpec.tells.repair }] },
            { kind: 'say', id: 'floor_line', band: 0, entries: [
                { delta: -10, reason: 'floor', line: 'Floor. She has no way to check this.' }] },
            { kind: 'say', id: 'rush', band: 0, entries: [
                { delta: -10, reason: 'urgency', line: priyaSpec.tells.techniques.urgency }] },
            { kind: 'say', id: 'award_line', band: 0, entries: [
                { delta: 10, reason: 'award', line: 'Shared detail. A real detail she can confirm builds trust.' },
                { delta: 10, reason: 'shared_detail', line: priyaSpec.tells.techniques.shared_detail }] },
            { kind: 'ask', id: 'email_format', result: 1, band: 0, entries: [] },
            { kind: 'ask', id: 'pw_reset', result: 2, band: 0, entries: [{ delta: -10, reason: 'pw_reset', line: '' }] },
            { kind: 'ask', id: 'pw_reset', result: 0, band: 1, entries: [] }
        ]
    };
    // After the rows: -30 +20 -10 -10 +20 +0 -10 = -20
    const lines = formatPretextTells(session, priyaSpec, -20);
    assert.equal(lines[0], `-30  WARY  ✗ ${failLine}`);
    assert.equal(lines[1], '+20  CALM  ✓ Corrected. Owning a slip early costs less than defending it.');
    assert.equal(lines[2], '-10  CALM  ? Floor. She has no way to check this.');
    assert.equal(lines[3], '-10  CALM  ! Urgency. Helpdesk staff are trained to slow down when pushed.');
    assert.equal(lines[4], '+20  CALM  ! Shared detail. A real detail she can confirm builds trust.');
    assert.equal(lines[5], 'ASK OK  needs -30 or better, now at -10. Low-stakes: she would tell any new starter this.');
    assert.equal(lines[6], 'ASK PENDING  needs -20 or better, now at -20. She wants to verify you first.');
    assert.equal(lines[7], 'ASK REFUSED  needs -20 or better, now at -20. She needs more before doing this.');
});

test('E12 F3: a still-pending ask reads the current influence, not the value when it was made', () => {
    // The ask is pending at -10; the player then says two more things that drop influence to -60.
    const session = {
        log: [
            { kind: 'ask', id: 'pw_reset', result: 2, band: 1, entries: [] },
            { kind: 'say', id: 'push1', band: 2, entries: [{ delta: -25, reason: 'floor', line: 'Floor. She has no way to check this.' }] },
            { kind: 'say', id: 'push2', band: 2, entries: [{ delta: -25, reason: 'floor', line: 'Floor. She has no way to check this.' }] }
        ]
    };
    const lines = formatPretextTells(session, priyaSpec, -60);
    // The pending ask shows "now at -60" (current), not "-10" (its walked-back historical value).
    assert.equal(lines[0], 'ASK PENDING  needs -20 or better, now at -60. She wants to verify you first.');
    // A resolved ask still walks back: refused-at is the influence it resolved at.
    const resolved = {
        log: [
            { kind: 'ask', id: 'pw_reset', result: 0, band: 1, entries: [] },
            { kind: 'say', id: 'push1', band: 2, entries: [{ delta: -25, reason: 'floor', line: 'x' }] }
        ]
    };
    const r = formatPretextTells(resolved, priyaSpec, -45);
    assert.match(r[0], /ASK REFUSED {2}needs -20 or better, now at -20\./);
});

test('assessment mode keeps the number and the band, and prints the category line', () => {
    const line = 'Manager. That did not match what she can look up.';
    const lines = formatPretextTells({
        log: [{ kind: 'say', band: 1, entries: [{ delta: -30, reason: 'manager', line }] }]
    }, priyaSpec, -40);
    assert.equal(lines[0], `-30  WARY  ✗ ${line}`);
});

test('the portrait tint follows the band, and the player portrait is left alone', () => {
    assert.equal(influenceTintFilter(0), 'none');
    assert.equal(influenceTintFilter(1), 'sepia(0.55) saturate(1.6)');
    assert.match(influenceTintFilter(2), /hue-rotate/);
    assert.equal(influenceTintFilter(3, true), 'none');
});

test('bar and tells are in both chat headers; a phone tell bubble is render-only', () => {
    const scenario = devScenario();
    window.gameScenario = scenario;
    window.gameState = { globalVariables: { ...scenario.globalVariables } };
    window.eventDispatcher = dispatcher();
    document.body.innerHTML = '';

    const person = document.createElement('div');
    const phone = document.createElement('div');
    phone.className = 'conversation-header';
    const thread = document.createElement('div');
    thread.className = 'messages-container';
    document.body.append(person, phone, thread);

    const session = { log: [{ kind: 'say', band: 1, entries: [{ delta: -30, reason: 'manager', line: failLine }] }] };
    const personChat = new ChatInfluence({
        parent: () => person, mount: 'person-chat', place: 'start', headerClass: 'person-chat-header'
    });
    const phoneChat = new ChatInfluence({
        parent: () => phone, messages: () => thread, mount: 'phone-chat', place: 'end'
    });
    personChat.mountBar('dev');
    phoneChat.mountBar('dev_phone');
    personChat.mountPretext({ session, spec: priyaSpec, characterId: 'dev' });
    phoneChat.mountPretext({ session, spec: priyaSpec, characterId: 'dev' });

    const personBar = person.querySelector('.person-chat-header .influence-bar');
    const phoneBar = phone.querySelector('.influence-bar');
    assert.ok(personBar, 'person-chat header has the bar');
    assert.equal(personBar.dataset.mount, 'person-chat');
    assert.equal(personBar.querySelector('.ib-infl-number').textContent, '-10');
    assert.ok(phoneBar, 'phone conversation header has the bar');
    assert.equal(phoneBar.dataset.mount, 'phone-chat');
    assert.match(person.querySelector('.pretext-tells').textContent, /Manager/);
    assert.match(phone.querySelector('.conversation-header .pretext-tells, .pretext-tells').textContent, /Manager/);

    const bubble = thread.querySelector('.pretext-tell');
    assert.ok(bubble);
    assert.equal(bubble.dataset.renderOnly, 'true');
    assert.equal(bubble.classList.contains('message-bubble'), true);
    phoneChat.refresh();
    assert.equal(thread.querySelectorAll('.pretext-tell').length, 1);

    const loose = tellBubble('not saved');
    assert.equal(loose.dataset.renderOnly, 'true');
    personChat.destroy();
    phoneChat.destroy();
});

test('header bar is absent when display.bar is false, and the reports threshold still fires', () => {
    const scenario = devScenario({ bar: false, number: true });
    window.gameScenario = scenario;
    window.gameState = { globalVariables: { ...scenario.globalVariables } };
    const events = dispatcher();
    window.eventDispatcher = events;
    document.body.innerHTML = '';
    const svc = installSocialInfluence({ scenario, dispatcher: events });

    const person = document.createElement('div');
    const phone = document.createElement('div');
    phone.className = 'conversation-header';
    document.body.append(person, phone);
    const personChat = new ChatInfluence({
        parent: () => person, mount: 'person-chat', place: 'start', headerClass: 'person-chat-header'
    });
    const phoneChat = new ChatInfluence({ parent: () => phone, mount: 'phone-chat' });
    assert.equal(personChat.mountBar('dev'), null);
    assert.equal(phoneChat.mountBar('dev_phone'), null);
    const session = { log: [{ kind: 'say', band: 3, entries: [{ delta: -80, reason: 'manager', line: failLine }] }] };
    personChat.mountPretext({ session, spec: priyaSpec, characterId: 'dev' });
    phoneChat.mountPretext({ session, spec: priyaSpec, characterId: 'dev' });

    assert.equal(person.querySelector('.influence-bar'), null);
    assert.equal(phone.querySelector('.influence-bar'), null);
    assert.match(person.querySelector('.pretext-tells').textContent, /WARY|REPORTED|Manager/);
    assert.match(phone.querySelector('.pretext-tells').textContent, /Manager/);

    const moved = svc.addInfluence('dev', -80, 'manager');
    assert.ok(moved);
    assert.ok(moved.crossed.includes('reports'));
    assert.equal(window.gameState.globalVariables.dev_reported, true);
    assert.equal(window.gameState.globalVariables.dev_wary, true);
    assert.equal(window.gameState.globalVariables.dev_influence, -90);
    assert.equal(document.querySelector('.influence-bar'), null);

    personChat.destroy();
    phoneChat.destroy();
    uninstallSocialInfluence();
});

function pipWorld(globals, hostileIds = []) {
    const scenario = {
        social: {
            characters: {
                quinn: {
                    displayName: 'Quinn Shah',
                    channels: { person: 'quinn_npc' },
                    influence: { global: 'quinn_influence', min: -100, max: 100, start: 0 },
                    thresholds: []
                },
                dev: {
                    displayName: 'Dev',
                    channels: { phone: 'dev_phone' },
                    influence: { global: 'dev_influence', min: -100, max: 100, start: -10 },
                    thresholds: []
                },
                hidden: {
                    displayName: 'Hidden',
                    channels: { person: 'hidden_npc' },
                    influence: { global: 'hidden_influence', min: -100, max: 100, start: 0, display: { pip: false } },
                    thresholds: []
                }
            }
        }
    };
    const sprites = {
        quinn_npc: { npcId: 'quinn_npc', x: 100, y: 200, active: true, visible: true },
        hidden_npc: { npcId: 'hidden_npc', x: 8, y: 8, active: true, visible: true }
    };
    const hostile = new Set(hostileIds);
    const probe = {
        hasSprite: (id) => !!sprites[id],
        isHostile: (id) => hostile.has(id)
    };
    return { scenario, sprites, hostile, probe, globals };
}

test('the pip is absent with no sprite, with pip: false, at the start value, and while hostile', () => {
    const moved = { quinn_influence: -20, dev_influence: -40, hidden_influence: -20 };
    const world = pipWorld(moved);
    const shown = planPips(world.scenario, moved, world.probe).map((p) => p.characterId);
    assert.deepEqual(shown, ['quinn']);

    const noSprite = planPips(world.scenario, moved, { hasSprite: () => false, isHostile: () => false });
    assert.deepEqual(noSprite, []);

    const back = planPips(world.scenario, { quinn_influence: 0, dev_influence: -10, hidden_influence: 0 }, world.probe);
    assert.deepEqual(back, []);

    const hostile = planPips(world.scenario, moved, { ...world.probe, isHostile: () => true });
    assert.deepEqual(hostile, []);
});

test('a sprite character gets a pip above the sprite, and loses it when influence returns to the start', () => {
    const globals = { quinn_influence: -20, dev_influence: -40, hidden_influence: -20 };
    const world = pipWorld(globals);
    const made = [];
    const scene = {
        add: {
            graphics() {
                const g = {
                    depth: null, x: 0, y: 0, destroyed: false,
                    setDepth(d) { this.depth = d; return this; },
                    setPosition(x, y) { this.x = x; this.y = y; return this; },
                    clear() {}, fillStyle() {}, fillRect() {},
                    destroy() { this.destroyed = true; }
                };
                made.push(g);
                return g;
            }
        }
    };
    const pips = new NPCInfluencePips(scene, {
        getScenario: () => world.scenario,
        getGlobals: () => globals,
        hasSprite: world.probe.hasSprite,
        spriteFor: (id) => world.sprites[id] || null,
        isHostile: world.probe.isHostile
    });
    pips.update();
    assert.equal(made.length, 1);
    assert.equal(pips.pips.size, 1);
    assert.equal(made[0].depth, 850);
    assert.equal(made[0].x, 100);
    assert.equal(made[0].y, 160);
    assert.equal(made[0].destroyed, false);

    globals.quinn_influence = 0;
    pips.update();
    assert.equal(pips.pips.size, 0);
    assert.equal(made[0].destroyed, true);

    globals.quinn_influence = -20;
    world.hostile.add('quinn_npc');
    pips.update();
    assert.equal(pips.pips.size, 0);
    assert.equal(made.length, 1);

    pips.destroy();
});

test('the board files call-granted facts under From the call, not as recon finds', () => {
    const social = {
        people: [
            { id: 'pierce', forms: { full: 'Melanie Pierce' } },
            { id: 'lord', forms: { full: 'Sofia Lord' } }
        ],
        intelFacts: {
            pierce_role: { text: 'Melanie Pierce works in Finance.', subject: 'pierce' },
            lord_intern: { text: 'Sofia Lord is the new intern in Finance.', subject: 'lord' },
            lord_portal_name: { text: 'The staff portal is called Ledgerwell Staff.', subject: 'lord' },
            lord_payslip_date: { text: 'Payslips go out on Monday the 6th.', subject: 'lord' },
            email_pattern: { text: 'Staff addresses follow a pattern.', subject: 'company' }
        },
        intelBoard: { people: ['pierce', 'lord'], readinessSlots: { lord: [
            { label: 'Who she is', needsIntel: ['lord_intern'], goalString: 'missing', doneString: 'done' }
        ] } },
        pretextNpcs: [{
            callId: 'service_desk_call',
            asks: {
                portal_name: { grants: { intel: ['lord_portal_name'] } },
                payslip_date: { grants: { intel: ['lord_payslip_date'] } }
            }
        }]
    };
    const globals = {
        se_intel_pierce_role: true,
        se_intel_lord_intern: true,
        se_intel_lord_portal_name: true,
        se_intel_lord_payslip_date: true,
        se_intel_email_pattern: true
    };
    const model = buildBoardModel(social, globals);
    const lord = model.targets.find((t) => t.id === 'lord');
    const pierce = model.targets.find((t) => t.id === 'pierce');
    assert.deepEqual(lord.factIds, ['lord_intern']);
    assert.deepEqual(lord.fromCall.map((f) => f.id), ['lord_portal_name', 'lord_payslip_date']);
    assert.equal(lord.slots[0].done, true);
    assert.deepEqual(pierce.factIds, ['pierce_role']);
    assert.deepEqual(pierce.fromCall, []);
    assert.deepEqual(model.company.factIds, ['email_pattern']);
    assert.deepEqual(model.company.fromCallIds, []);
});
