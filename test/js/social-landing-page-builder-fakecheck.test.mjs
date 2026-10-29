// ENG-03b: the landing-page BUILDER overlay in fake-check mode (pageType: "fakeCheck"). The four
// persuasion rows (host, pretext, urgency, steps), the draft/record carrying the closed `check`
// block, attach writing landing_<id>_domain as the chosen host-option id, closeResult/linkInfoFor,
// and the step-6 inspect of the fake_check_paste tell. A sign-in page is proven byte-identical: its
// draft/record carry no `check` key. No working command, payload or real clipboard write appears.
// Run with: node --test test/js/social-landing-page-builder-fakecheck.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-lpb-fc-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/landing-page-builder/landing-page-builder-minigame.js',
    'minigames/landing-page-builder/landing-page-model.js',
    'minigames/landing-page-builder/landing-page-render.js',
    'minigames/landing-page-builder/landing-page-inspect.js',
    'minigames/osint-browser/concept-card.js',
    'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js',
    'utils/display-dashes.js',
    'ui/modal-stack.js',
    'systems/global-writer.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
let clipboardWrites = 0;
try { Object.defineProperty(dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: () => { clipboardWrites += 1; } } }); } catch (e) { /* ignore */ }

const ended = [];
window.stateSync = { sync: () => {} };
window.eventDispatcher = { emit() {} };
window.MinigameFramework = {
    currentMinigame: null,
    endMinigame(success, result) { ended.push({ success, result }); },
    startMinigame(type, c, params) { return { type, params }; }
};

const { LandingPageBuilderMinigame, PAGES_KEY, DRAFTS_KEY } =
    await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-builder-minigame.js')));

// A working command must never surface anywhere (content rule).
const COMMANDISH = /(curl|wget|powershell|cmd\.exe|mshta|certutil)|[|&;$`><]/i;

function fakeCheckPage() {
    return {
        id: 'e10_check',
        pageType: 'fakeCheck',
        targets: { visitor: { linkThreshold: 70 } },
        check: {
            host: 'orders.fernside.example',
            heading: 'Verify you are human',
            clipboardReveal: 'A hidden command that would run a program on your computer',
            hosts: [
                { id: 'genuine', label: "Fernside's own order portal", trust: 'genuine' },
                { id: 'lookalike', label: 'A look-alike you set up', trust: 'lookalike' },
                { id: 'random', label: 'An unrelated page', trust: 'unrelated' }
            ],
            pretexts: [
                { id: 'fits', label: 'Confirm you are human to continue to the order portal', match: true },
                { id: 'generic', label: 'Security update required' },
                { id: 'off', label: 'You have won a prize', slips: true }
            ],
            urgencies: [
                { id: 'calm', label: 'One quick step to continue', match: true },
                { id: 'pushy', label: 'Do this now or lose access' }
            ],
            steps: [
                { id: 'smooth', label: 'A smooth, plausible accessibility check', match: true },
                { id: 'clumsy', label: 'A clumsy demand to act on your computer' }
            ]
        }
    };
}

function signinPage() {
    return {
        id: 'payroll_login',
        brands: [{ id: 'ledgerwell', name: 'Ledgerwell', realDomain: 'ledgerwell.example', look: 'generic',
            realFields: ['email', 'password'],
            domains: [{ id: 'd_word', domain: 'ledgerwell-login.example', tier: 3 }] }],
        purposes: [{ id: 'signin', label: 'Sign in' }],
        wordings: [{ id: 'w_formal', match: true, text: 'Please sign in' }],
        fields: ['email', 'password'],
        pretext: { brandId: 'ledgerwell', purposeId: 'signin' },
        targets: { visitor: { linkThreshold: 50 } }
    };
}

function makeSocial(page) {
    return {
        landingPages: [page],
        people: [{ id: 'visitor', forms: { first: 'Priya', full: 'Priya Nair' } }]
    };
}

let current = null;
function open(page, g = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const social = makeSocial(page);
    window.gameState = { globalVariables: { ...g } };
    window.gameScenario = { social };
    ended.length = 0;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new LandingPageBuilderMinigame(container, { social, landingPageId: page.id, targetId: 'visitor' });
    scene._sceneType = 'landing-page-builder';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}

const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const chip = (s, focus) => s.container.querySelector(`[data-focus="${focus}"]`);
const pickChip = (s, focus) => { const el = chip(s, focus); assert.ok(el, `chip ${focus} exists`); click(el); };

function buildBest(s) {
    pickChip(s, 'check-host:genuine');
    pickChip(s, 'check-pretext:fits');
    pickChip(s, 'check-urgency:calm');
    pickChip(s, 'check-steps:smooth');
}

test('a fakeCheck page draws the four persuasion rows, not the seven sign-in rows', () => {
    const s = open(fakeCheckPage());
    assert.ok(!s.getTestState().builder.invalid, 'a well-formed fakeCheck page is valid');
    const rows = [...s.container.querySelectorAll('.lpb-row')].map((r) => r.getAttribute('data-row'));
    assert.deepEqual(rows, ['check-host', 'check-pretext', 'check-urgency', 'check-steps']);
    // no sign-in rows
    assert.equal(s.container.querySelector('[data-row="brand"]'), null);
    assert.equal(s.container.querySelector('[data-row="domain"]'), null);
    // the preview is the fake-check surface, inert
    assert.equal(s.container.querySelector('.lpb-preview').getAttribute('data-page-type'), 'fakeCheck');
    assert.equal(s.getTestState().builder.previewForbidden, 0);
    assert.equal(s.getTestState().builder.typedInputs, 0);
    assert.equal(clipboardWrites, 0);
});

test('scoring the best picks reaches the threshold and names the fake_check_paste tell', () => {
    const s = open(fakeCheckPage());
    buildBest(s);
    pickChip(s, 'score');
    const b = s.getTestState().builder;
    assert.equal(b.scored.credibility, 100);
    assert.equal(b.scored.meetsThreshold, true);
    assert.equal(b.step, 'send');
    // the always-row for the paste tell is present and is a plain description, not a command
    const always = s.container.querySelector('.lpb-check-always .lpb-check-line');
    assert.ok(always, 'the paste-step always-row is shown');
    assert.ok(!COMMANDISH.test(always.textContent));
    for (const line of s.container.querySelectorAll('.lpb-check-line, .lpb-verdict')) {
        assert.ok(!COMMANDISH.test(line.textContent));
    }
});

test('the draft and record carry the closed four-key check block; attach writes the host id', () => {
    const s = open(fakeCheckPage());
    buildBest(s);
    pickChip(s, 'score');
    // draft carries check
    const draft = window.gameState.globalVariables[DRAFTS_KEY].e10_check;
    assert.deepEqual(Object.keys(draft.check).sort(), ['hostId', 'pretextId', 'stepsId', 'urgencyId']);
    assert.equal(draft.check.hostId, 'genuine');
    // record carries check
    const rec = window.gameState.globalVariables[PAGES_KEY].e10_check;
    assert.deepEqual(rec.choices.check, { hostId: 'genuine', pretextId: 'fits', urgencyId: 'calm', stepsId: 'smooth' });
    // attach writes the globals; landing_<id>_domain holds the chosen host-option id
    pickChip(s, 'attach');
    const g = window.gameState.globalVariables;
    assert.equal(g.landing_e10_check_built, true);
    assert.equal(g.landing_e10_check_domain, 'genuine');
    assert.equal(ended.at(-1).success, true);
    // closeResult carries the fakeCheck link info
    const res = ended.at(-1).result;
    assert.equal(res.pageType, 'fakeCheck');
    assert.equal(res.host, 'orders.fernside.example');
    assert.equal(res.hostId, 'genuine');
    assert.equal(res.meetsThreshold, true);
    assert.equal(res.saved, true);
});

test('a reload after a score restores the four picks and the score', () => {
    const s1 = open(fakeCheckPage());
    buildBest(s1);
    pickChip(s1, 'score');
    const g = { ...window.gameState.globalVariables };
    const s2 = open(fakeCheckPage(), g);
    const b = s2.getTestState().builder;
    assert.deepEqual(b.choices.check, { hostId: 'genuine', pretextId: 'fits', urgencyId: 'calm', stepsId: 'smooth' });
    assert.equal(b.scored.credibility, 100, 'the score is restored, not stale');
    assert.equal(b.step, 'send');
});

test('the inspect step finds the fake_check_paste tell on the steps panel; no link button', () => {
    // seed a built record with a victim so Inspect is offered
    const g = { [PAGES_KEY]: { e10_check: {
        pageId: 'e10_check', targetId: 'visitor',
        choices: { check: { hostId: 'genuine', pretextId: 'fits', urgencyId: 'calm', stepsId: 'smooth' } },
        credibility: 100, gatesPassed: true, meetsThreshold: true, tellsFound: [], victim: { visited: true, submitted: true, noticed: false }, built: true
    } } };
    const s = open(fakeCheckPage(), g);
    assert.equal(s.getTestState().builder.canInspect, true);
    pickChip(s, 'inspect');
    assert.equal(s.getTestState().builder.inspecting, true);
    // the one tell is on the steps region
    assert.equal(s.getTestState().builder.inspect.totalTells, 1);
    assert.deepEqual(s.getTestState().builder.inspect.presentIds, ['fake_check_paste']);
    // no "Show the link target" button for a fake check (no hoverMismatch tell)
    assert.equal(s.container.querySelector('[data-focus="show-link"]'), null);
    // click the steps hot-spot to find it
    const steps = s.container.querySelector('.lpb-preview [data-region="steps"]');
    assert.ok(steps, 'the steps hot-spot exists in inspect mode');
    click(steps);
    const b = s.getTestState().builder;
    assert.equal(b.inspect.foundCount, 1);
    assert.equal(b.inspectionComplete, true);
    const finding = s.container.querySelector('.lpb-finding');
    assert.ok(finding && !COMMANDISH.test(finding.textContent));
    assert.equal(clipboardWrites, 0);
});

test('UNCHANGED: a sign-in page is byte-identical — its draft and record carry no check key', () => {
    const s = open(signinPage());
    const rows = [...s.container.querySelectorAll('.lpb-row')].map((r) => r.getAttribute('data-row'));
    assert.deepEqual(rows, ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock']);
    assert.equal(s.container.querySelector('.lpb-preview').getAttribute('data-page-type'), null);
    pickChip(s, 'brand:ledgerwell');
    pickChip(s, 'purpose:signin');
    pickChip(s, 'domain:d_word');
    pickChip(s, 'logo:crisp');
    pickChip(s, 'wording:w_formal');
    pickChip(s, 'form:email');
    pickChip(s, 'form:password');
    pickChip(s, 'padlock:on');
    pickChip(s, 'score');
    const draft = window.gameState.globalVariables[DRAFTS_KEY].payroll_login;
    assert.ok(!('check' in draft), 'the sign-in draft has no check key');
    const rec = window.gameState.globalVariables[PAGES_KEY].payroll_login;
    assert.ok(!('check' in rec.choices), 'the sign-in record choices have no check key');
    // the builder test state reports the seven sign-in keys only
    assert.ok(!('check' in s.getTestState().builder.choices));
});
