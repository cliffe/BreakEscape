// Gap tests for the landing-page builder overlay: repeated Score and Attach, restore of odd saved
// state, re-picking the same chip, brand changes, invalid page or target, Close without attaching.
// Same harness as social-landing-page-builder.test.mjs (real files in jsdom).
// Run with: bin/test-js test/js/social-gap-landing-page-builder.test.mjs
//
// Harness notes from the original:
// The landing-page builder overlay (SE design 07 N1, N7 display, N9; packet P5-D): steps 1 to 5
// (Pretext, Build, Score, Send/Attach), the Score panel with the worked-example numbers (34 and
// 87), a choice change after a Score greying the attach and un-scoring the record, Attach and
// Attach anyway, the drafts/record persistence, reload restore, the Case file nested launch, and
// Close/Esc as a normal exit. Uses the real files in a jsdom document.
// Run with: bundle exec node --test test/js/social-landing-page-builder.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social_landing/lp_clean.json'), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));

// Copy the real files into an ESM folder, keeping their relative layout.
const dir = mkdtempSync(join(tmpdir(), 'social-gap-lpb-'));
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

const ended = [];
const started = [];
let syncs = 0;
window.stateSync = { sync: () => { syncs++; } };
window.eventDispatcher = { emit() {} };
window.MinigameFramework = {
    currentMinigame: null,
    endMinigame(success, result) { ended.push({ success, result }); },
    startMinigame(type, c, params) { started.push({ type, params }); return { type, params }; }
};

const { LandingPageBuilderMinigame, PAGES_KEY, DRAFTS_KEY } =
    await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-builder-minigame.js')));

// Build a social block: the canonical page from lp_clean, plus the people, pretext facts and an
// intel board the overlay reads (the validator fixture does not carry these).
function makeSocial() {
    const social = clone(fixture.social);
    social.people = [{ id: 'lord', forms: { first: 'Sofia', full: 'Sofia Lord' } }];
    social.intelFacts = { lord_portal: { text: 'Sofia uses a staff payroll portal' } };
    social.intelBoard = { title: 'Case file' };
    social.landingPages[0].pretext = {
        brandId: 'ledgerwell', purposeId: 'payslip', tone: 'formal',
        story: 'a staff-portal notice that her first payslip is ready', facts: ['lord_portal']
    };
    // The student-only tricks carry minProfile (07 §5); the validator fixture omits it.
    for (const d of social.landingPages[0].brands[0].domains) {
        if (['d_unrelated', 'd_sub', 'd_homo'].includes(d.id)) d.minProfile = 'student';
    }
    // The form field menu and the extra-sensitive list (07 §5); the validator fixture omits them.
    social.landingPages[0].fields = ['email', 'password', 'one_time_code', 'card_number', 'ni_number'];
    social.landingPages[0].extraSensitiveFields = ['card_number', 'ni_number'];
    return social;
}

let social;
function setGlobals(g = {}) {
    social = makeSocial();
    window.gameState = { globalVariables: { ...g } };
    window.gameScenario = { social };
    ended.length = 0; started.length = 0; syncs = 0;
}

let current = null;
function open(params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new LandingPageBuilderMinigame(container, {
        social, landingPageId: 'payroll_login', targetId: 'lord', ...params
    });
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
const esc = () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

function buildAttempt(s, c) {
    pickChip(s, `brand:${c.brand}`);
    pickChip(s, `purpose:${c.purpose}`);
    pickChip(s, `domain:${c.domainId}`);
    pickChip(s, `logo:${c.logo}`);
    pickChip(s, `wording:${c.wording}`);
    // form fields: toggle each one on (start empty)
    for (const f of c.fields) pickChip(s, `form:${f}`);
    pickChip(s, `padlock:${c.padlock ? 'on' : 'off'}`);
}

const ATTEMPT1 = { brand: 'ledgerwell', purpose: 'signin', domainId: 'd_letter', logo: 'blurry',
    wording: 'w_slips', fields: ['email', 'password', 'card_number'], padlock: false };
const ATTEMPT2 = { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password'], padlock: true };


const gv = () => window.gameState.globalVariables;
const bs = (s) => s.getTestState().builder;

// ── repeated actions ─────────────────────────────────────────────────────────

test('scoring twice with no change gives the same score and keeps the record scored', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    const first = clone(gv()[PAGES_KEY].payroll_login);
    pickChip(s, 'score');
    assert.deepEqual(gv()[PAGES_KEY].payroll_login, first);
    assert.equal(bs(s).scored.credibility, 87);
    assert.equal(bs(s).stale, false);
});

test('re-picking the chip that is already selected does not throw away the Score', () => {
    // _set() runs _onChoiceChanged() whatever the value, and that clears the score and rewrites the
    // record as unscored (credibility 0). Clicking the radio you already have should be a no-op.
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    pickChip(s, 'padlock:on');
    assert.ok(bs(s).scored, 'the Score is still there after re-picking the same value');
    assert.equal(bs(s).recordCredibility, 87);
    assert.equal(bs(s).attachAvailable, true);
});

test('toggling a form field on then off returns to the scored signature, but the score is already cleared (a new Score is needed)', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    pickChip(s, 'form:card_number');
    assert.equal(bs(s).scored, null);
    pickChip(s, 'form:card_number');
    assert.deepEqual(bs(s).choices.fields.sort(), ['email', 'password']);
    assert.equal(bs(s).attachAvailable, false);
    pickChip(s, 'score');
    assert.equal(bs(s).scored.credibility, 87);
});

test('Attach before any Score, or after a change, does nothing: no built flag, no exit', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    s.attach();
    assert.equal(ended.length, 0);
    assert.equal(gv().landing_payroll_login_built, undefined);
    pickChip(s, 'score');
    pickChip(s, 'logo:none');
    s.attach();
    assert.equal(ended.length, 0);
    assert.equal(gv().landing_payroll_login_built, undefined);
});

test('Attach twice (a stale second call after the overlay ended) does not write a second record or throw', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    pickChip(s, 'attach');
    const rec = clone(gv()[PAGES_KEY].payroll_login);
    const n = ended.length;
    assert.doesNotThrow(() => s.attach());
    assert.deepEqual(gv()[PAGES_KEY].payroll_login, rec);
    assert.ok(ended.length <= n + 1);
});

test('Close after a Score without attaching leaves the record scored but unbuilt and reports saved false', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    click(s.container.querySelector('.se-overlay-close'));
    assert.equal(ended.at(-1).result.saved, false);
    assert.equal(gv()[PAGES_KEY].payroll_login.built, false);
    assert.equal(gv()[PAGES_KEY].payroll_login.credibility, 87);
    assert.equal(gv().landing_payroll_login_built, undefined);
});

test('Close with nothing chosen writes a draft of defaults, no record, and no built flag', () => {
    setGlobals();
    const s = open();
    click(s.container.querySelector('.se-overlay-close'));
    assert.equal(gv()[PAGES_KEY], undefined);
    assert.equal(gv().landing_payroll_login_built, undefined);
    assert.equal(ended.at(-1).success, true);
    assert.equal(ended.at(-1).result.state, 'missing');
});

test('the attach result for an unscored close is the missing linkInfo (no domain), never a stale one', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    pickChip(s, 'padlock:off');
    esc();
    assert.equal(ended.at(-1).result.state, 'missing');
    assert.equal(ended.at(-1).result.saved, false);
});

// ── brand and domain menus ───────────────────────────────────────────────────

test('changing the brand drops a chosen domain that is not on the new brand\'s menu and keeps one that is', () => {
    setGlobals();
    social.landingPages[0].brands.find((b) => b.id === 'cloudboxy').domains.push({ id: 'd_word', domain: 'cloudboxy-hr.example', trick: 'extra-word', tier: 2 });
    const s = open();
    pickChip(s, 'brand:ledgerwell');
    pickChip(s, 'domain:d_letter');
    pickChip(s, 'brand:cloudboxy');
    assert.equal(bs(s).choices.domainId, null, 'd_letter is not on CloudBoxy\'s menu');
    pickChip(s, 'domain:d_word');
    pickChip(s, 'brand:ledgerwell');
    assert.equal(bs(s).choices.domainId, 'd_word', 'a shared id stays');
});

// ── restore of odd saved state ───────────────────────────────────────────────

test('a draft naming a domain id that is no longer on the menu opens, and Score reports it cannot be scored', () => {
    setGlobals({ [DRAFTS_KEY]: { payroll_login: { ...ATTEMPT2, domainId: 'removed_domain' } } });
    const s = open();
    assert.equal(bs(s).choices.domainId, 'removed_domain');
    assert.doesNotThrow(() => s.score());
    assert.equal(bs(s).scored, null);
    assert.match(bs(s).live, /cannot be scored/i);
    assert.equal(gv()[PAGES_KEY], undefined, 'nothing is written for a page that could not be scored');
});

test('a draft with junk field types is cleaned to the seven keys with safe types', () => {
    setGlobals({ [DRAFTS_KEY]: { payroll_login: { brand: 5, fields: 'email', padlock: 'yes', extra: 'x', logo: null } } });
    const s = open();
    const c = bs(s).choices;
    assert.deepEqual(Object.keys(c).sort(), ['brand', 'domainId', 'fields', 'logo', 'padlock', 'purpose', 'wording']);
    assert.deepEqual(c.fields, []);
    assert.equal(c.padlock, false);
    assert.equal(c.logo, null);
});

test('drafts and pages globals of the wrong type (string, array, null) are treated as empty', () => {
    for (const bad of ['junk', [], null, 5]) {
        setGlobals({ [DRAFTS_KEY]: bad, [PAGES_KEY]: bad });
        const s = open();
        assert.equal(bs(s).invalid, null, JSON.stringify(bad));
        assert.deepEqual(bs(s).choices.fields, []);
        assert.doesNotThrow(() => pickChip(s, 'brand:ledgerwell'));
        assert.equal(gv()[DRAFTS_KEY].payroll_login.brand, 'ledgerwell');
    }
});

test('a record whose choices differ from the draft restores the draft and no panel; the draft wins', () => {
    setGlobals();
    let s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    const g = clone(gv());
    g[DRAFTS_KEY].payroll_login.padlock = false; // draft edited after the score
    window.gameState = { globalVariables: g };
    s = open();
    assert.equal(bs(s).choices.padlock, false);
    assert.equal(bs(s).scored, null);
});

test('a record with credibility 0 (an unscored stale write) does not restore a panel even if choices match', () => {
    setGlobals();
    let s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    pickChip(s, 'padlock:off');
    pickChip(s, 'padlock:on'); // back to the scored choices, but the record says 0
    const g = clone(gv());
    window.gameState = { globalVariables: g };
    s = open();
    assert.equal(bs(s).scored, null);
});

test('reopening after Attach keeps the record built until a choice changes, then un-builds it (the mail bridge then sees "missing")', () => {
    setGlobals();
    let s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    pickChip(s, 'attach');
    window.gameState = { globalVariables: clone(gv()) };
    s = open();
    assert.equal(bs(s).recordBuilt, true);
    assert.ok(bs(s).scored, 'the panel restores');
    pickChip(s, 'logo:blurry');
    assert.equal(bs(s).recordBuilt, false);
});

// ── invalid pages and targets ────────────────────────────────────────────────

test('an unknown landingPageId refuses with its own message and still closes normally', () => {
    setGlobals();
    const s = open({ landingPageId: 'no_such_page' });
    assert.equal(bs(s).invalid, 'This page is not available.');
    click(s.container.querySelector('.se-overlay-close'));
    assert.equal(ended.at(-1).success, true);
    assert.equal(gv()[DRAFTS_KEY], undefined, 'an invalid page writes no draft');
});

test('no landingPageId at all refuses; no social block at all refuses', () => {
    setGlobals();
    assert.equal(bs(open({ landingPageId: undefined })).invalid, 'This page is not available.');
    window.gameScenario = {};
    assert.equal(bs(open({ social: {} })).invalid, 'This page is not available.');
});

test('a page with exactly one target works without a targetId; with two it needs one', () => {
    setGlobals();
    assert.equal(bs(open({ targetId: undefined })).targetId, 'lord');
    social.landingPages[0].targets.extra = { linkThreshold: 50 };
    const s = open({ targetId: undefined });
    assert.equal(bs(s).invalid, 'This page isn’t for this person.');
});

test('a target id that is an inherited property name ("constructor") is refused, not accepted', () => {
    setGlobals();
    const s = open({ targetId: 'constructor' });
    assert.equal(bs(s).invalid, 'This page isn’t for this person.');
});

// ── profile edge ─────────────────────────────────────────────────────────────

test('an unknown page profile reads as student (all rows editable)', () => {
    setGlobals();
    social.landingPages[0].profile = 'wizard';
    const s = open();
    assert.equal(bs(s).editableRows.length, 7);
});

test('awareness profile: a stale restored draft cannot override the preset rows', () => {
    setGlobals({ [DRAFTS_KEY]: { payroll_login: { ...ATTEMPT1 } } });
    social.landingPages[0].profile = 'awareness';
    const s = open();
    const c = bs(s).choices;
    assert.equal(c.logo, 'crisp');
    assert.equal(c.wording, 'w_formal');
    assert.deepEqual(c.fields, ['email', 'password']);
    assert.equal(c.purpose, 'payslip');
});

test('the preview region never contains links, forms or inputs even after a Score with the worst page', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT1);
    pickChip(s, 'score');
    assert.equal(bs(s).previewForbidden, 0);
    assert.equal(bs(s).typedInputs, 0);
});
