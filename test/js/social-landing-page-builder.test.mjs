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
const dir = mkdtempSync(join(tmpdir(), 'social-lpb-'));
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

const { LandingPageBuilderMinigame, PAGES_KEY, DRAFTS_KEY, giveawayLine } =
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

test('opens keyboard-owning, five-step strip, pretext card, nothing typed, preview is inert', () => {
    setGlobals();
    const s = open();
    const b = s.getTestState().builder;
    assert.equal(s.params.requiresKeyboardInput, true);
    assert.equal(s.params.disableClose, true);
    assert.equal(s.getTestState().overlay.sceneType, 'landing-page-builder');
    assert.equal(s.getTestState().overlay.closeMode, 'close');
    assert.equal(b.pageId, 'payroll_login');
    assert.equal(b.targetId, 'lord');
    assert.equal(b.firstName, 'Sofia');
    assert.equal(b.step, 'build');
    assert.equal(s.container.querySelectorAll('.lpb-step').length, 5);
    assert.equal(b.typedInputs, 0);
    assert.equal(s.container.querySelectorAll('input, textarea, select').length, 0);
    assert.equal(b.previewForbidden, 0, 'the preview holds no a/form/input/button/contenteditable');
    assert.ok(s.closeButton, 'own Close control');
    // all seven rows are editable in the (default) student profile
    assert.deepEqual(b.editableRows, ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock']);
});

test('backstop: a target outside the page map refuses and still closes', () => {
    setGlobals();
    const s = open({ targetId: 'pierce' });
    const b = s.getTestState().builder;
    assert.equal(b.invalid, 'This page isn’t for this person.');
    assert.equal(s.container.querySelectorAll('.lpb-row').length, 0);
    click(s.container.querySelector('.se-overlay-close'));
    assert.equal(ended.at(-1).success, true, 'close is a normal exit even when invalid');
});

test('worked example attempt 1 scores 34 with the low verdict and the careful-reader gate line', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT1);
    pickChip(s, 'score');
    const b = s.getTestState().builder;
    assert.equal(b.scored.credibility, 34);
    assert.equal(b.scored.meetsThreshold, false);
    assert.match(b.scored.verdict, /wouldn.t fool anyone/i);
    // a below-threshold page can still be attached anyway
    assert.equal(b.attachAvailable, true);
    assert.equal(b.attachLabel, 'Attach anyway');
    assert.match(s.container.querySelector('.lpb-gate-line').textContent, /reads addresses carefully/i);
    assert.equal(b.recordCredibility, 34, 'the Score is written to the record');
});

test('worked example attempt 2 scores 87 and offers Attach to email', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    const b = s.getTestState().builder;
    assert.equal(b.scored.credibility, 87);
    assert.equal(b.scored.meetsThreshold, true);
    assert.match(b.scored.verdict, /Convincing enough for Sofia/);
    assert.equal(b.step, 'send');
    assert.equal(b.attachLabel, 'Attach to email');
});

test('a choice changed after a Score greys the panel, hides Attach and un-scores the record', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    assert.equal(s.getTestState().builder.attachAvailable, true);
    // change the padlock off
    pickChip(s, 'padlock:off');
    const b = s.getTestState().builder;
    assert.equal(b.scored, null);
    assert.equal(b.stale, false, 'scored cleared, so not "stale" but unscored');
    assert.equal(b.attachAvailable, false);
    assert.equal(b.recordBuilt, false);
    assert.equal(b.recordCredibility, 0, 'the record never pairs new choices with the old credibility');
    assert.equal(window.gameState.globalVariables[PAGES_KEY].payroll_login.meetsThreshold, false);
});

test('Attach anyway below the threshold: globals set, gameResult carries linkInfoFor with saved true', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT1);
    pickChip(s, 'score');
    pickChip(s, 'attach');
    assert.equal(ended.at(-1).success, true, 'attach is a normal exit, no minigame_failed');
    const result = ended.at(-1).result;
    assert.equal(result.saved, true);
    assert.equal(result.inspectionComplete, false);
    assert.equal(result.pageId, 'payroll_login');
    assert.equal(result.domainId, 'd_letter');
    assert.equal(result.domain, 'ledgerwall.example');
    assert.equal(result.meetsThreshold, false);
    assert.equal(window.gameState.globalVariables.landing_payroll_login_built, true);
    assert.equal(window.gameState.globalVariables.landing_payroll_login_domain, 'd_letter');
    assert.equal(window.gameState.globalVariables[PAGES_KEY].payroll_login.built, true);
});

test('drafts persist on every change; the record persists on Score', () => {
    setGlobals();
    const s = open();
    pickChip(s, 'brand:ledgerwell');
    pickChip(s, 'domain:d_word');
    const draft = window.gameState.globalVariables[DRAFTS_KEY].payroll_login;
    assert.equal(draft.brand, 'ledgerwell');
    assert.equal(draft.domainId, 'd_word');
    assert.ok(syncs > 0, 'each write syncs to the server');
    assert.equal(window.gameState.globalVariables[PAGES_KEY], undefined, 'no record until a Score');
});

test('reload after a Score restores the choices and the panel', () => {
    setGlobals();
    let s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    const saved = clone(window.gameState.globalVariables);
    // reopen with the persisted globals (a reload)
    window.gameState = { globalVariables: saved };
    s = open();
    const b = s.getTestState().builder;
    assert.equal(b.choices.domainId, 'd_word');
    assert.equal(b.choices.padlock, true);
    assert.ok(b.scored, 'the Score panel comes back');
    assert.equal(b.scored.credibility, 87);
    assert.equal(b.step, 'send');
});

test('reload after a stale change restores the changed choices but no panel', () => {
    setGlobals();
    let s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    pickChip(s, 'logo:none'); // a change after the Score
    const saved = clone(window.gameState.globalVariables);
    window.gameState = { globalVariables: saved };
    s = open();
    const b = s.getTestState().builder;
    assert.equal(b.choices.logo, 'none');
    assert.equal(b.scored, null, 'an unscored change does not restore a panel');
});

test('the pretext card lists a held fact, else offers the Case file nested launch', () => {
    // nothing held → the empty line and the Case file button
    setGlobals();
    let s = open();
    assert.match(s.container.querySelector('.lpb-pretext-empty').textContent, /haven.t found out/i);
    const caseBtn = chip(s, 'case-file');
    assert.ok(caseBtn, 'Case file button when nothing is held and a board exists');
    click(caseBtn);
    assert.equal(started.at(-1).type, 'intel-board');
    assert.equal(started.at(-1).params.mode, 'recon');
    assert.equal(started.at(-1).params.returnTo.sceneType, 'landing-page-builder');
    assert.equal(s.params.suspended, true, 'the parent is suspended while the board is open');

    // a held fact → its text is shown and the Case file prompt is gone
    setGlobals({ se_intel_lord_portal: true });
    s = open();
    assert.match(s.container.querySelector('.lpb-facts').textContent, /staff payroll portal/);
    assert.equal(chip(s, 'case-file'), null);
});

test('the Case file button uses intelBoard.labels.caseButton, defaulting to Case file', () => {
    setGlobals();
    let s = open();
    assert.equal(chip(s, 'case-file').textContent, 'Case file');
    setGlobals();
    social.intelBoard.labels = { caseButton: 'Dossier' };
    s = open();
    assert.equal(chip(s, 'case-file').textContent, 'Dossier');
});

test('concept cards show behind a "What is this?" button and toggle (N7 display)', () => {
    setGlobals();
    const s = open();
    const domainRow = s.container.querySelector('.lpb-row[data-row="domain"]');
    const cardBtn = domainRow.querySelector('[data-focus="card:typo-squat"]');
    assert.ok(cardBtn, 'the typo-squat card is offered on the domain row');
    // E5-12: several of these sit on one screen, so each button names its own topic instead of
    // reading an identical "What is this?".
    assert.match(cardBtn.textContent, /^What is this\? \(.+\)$/, 'the button names what it explains');
    const otherBtns = [...s.container.querySelectorAll('.cc-button')].map((b) => b.textContent);
    assert.equal(new Set(otherBtns).size, otherBtns.length, 'every concept-card button label is distinct');
    assert.equal(cardBtn.getAttribute('aria-expanded'), 'false');
    click(cardBtn);
    assert.equal(cardBtn.getAttribute('aria-expanded'), 'true');
    assert.match(domainRow.querySelector('.cc-text').textContent, /ledgerwall/);
    // five-habits is reserved for step 6 and never shown here
    assert.equal(s.container.querySelector('[data-focus="card:five-habits"]'), null);
});

test('Esc is a normal exit that saves the draft and emits no failure', () => {
    setGlobals();
    const s = open();
    pickChip(s, 'brand:ledgerwell');
    esc();
    assert.equal(ended.at(-1).success, true);
    assert.equal(ended.at(-1).result.saved, false, 'closing without attaching reports saved false');
    assert.equal(window.gameState.globalVariables[DRAFTS_KEY].payroll_login.brand, 'ledgerwell');
});

test('the awareness profile edits only brand, domain and padlock, with the rest preset correct', () => {
    setGlobals();
    social.landingPages[0].profile = 'awareness';
    const s = open();
    const b = s.getTestState().builder;
    assert.deepEqual(b.editableRows, ['brand', 'domain', 'padlock']);
    // the non-edited rows are preset to the correct values
    assert.equal(b.choices.purpose, 'payslip');
    assert.equal(b.choices.logo, 'crisp');
    assert.equal(b.choices.wording, 'w_formal');
    assert.deepEqual(b.choices.fields, ['email', 'password']);
    // and the homograph domain is hidden below the student profile
    assert.equal(s.container.querySelector('[data-focus="domain:d_homo"]'), null);
    assert.ok(s.container.querySelector('[data-focus="domain:d_letter"]'));
});

test('E5-13: a choice changed after a Score replaces the old verdict in the live line', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    assert.match(s.live.textContent, /Convincing enough/);
    pickChip(s, 'padlock:off');
    assert.doesNotMatch(s.live.textContent, /Convincing enough/);
    assert.match(s.live.textContent, /Score again/);
});

test('P3 N-7: when the brand\'s logo image fails to load, the score panel leaves out the Logo line', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT2);
    pickChip(s, 'score');
    const logoLine = () => s.container.querySelector('.lpb-check-item[data-factor="logo"]');
    assert.ok(logoLine(), 'shown while the logo loads');
    const img = s.container.querySelector('.lpb-logo-img');
    img.dispatchEvent(new window.Event('error'));
    assert.equal(logoLine(), null);
    assert.equal(s.container.querySelector('.lpb-logo-img'), null);
});

test('P4-4: the giveaway count names every giveaway it counts, including the two no score row shows', () => {
    assert.equal(giveawayLine([{ id: 'domain' }, { id: 'formOrigin' }, { id: 'hoverMismatch' }]),
        'This page has 3 giveaways: the address, where the form sends what you type and where the link really goes.');
    assert.equal(giveawayLine([{ id: 'domain' }]), 'This page has 1 giveaway: the address.');
    assert.equal(giveawayLine([{ id: 'domain' }, { id: 'zzz' }]), 'This page has 2 giveaways.');
    setGlobals();
    social.landingPages[0].tellCounter = true;
    const s = open();
    buildAttempt(s, ATTEMPT1);
    pickChip(s, 'score');
    const line = s.container.querySelector('.lpb-tell-counter');
    assert.ok(line, 'counter shown after Score');
    const n = Number(/has (\d+) giveaway/.exec(line.textContent)[1]);
    assert.ok(n >= 3);
    assert.equal((line.textContent.match(/,| and /g) || []).length, n - 1, 'one name per giveaway');
});

test('P4-11: with the Brand row failing, a passing Page row is neutral, not a green Pass', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, { ...ATTEMPT2, brand: 'cloudboxy', domainId: 'c_letter' });
    pickChip(s, 'score');
    const row = s.container.querySelector('.lpb-check-item[data-factor="purpose"]');
    assert.ok(row.classList.contains('is-neutral'));
    assert.equal(row.querySelector('.lpb-check-word').textContent, 'Fits');
    assert.doesNotMatch(row.textContent, /✓/);
    assert.ok(s.container.querySelector('.lpb-check-item[data-factor="brand"]').classList.contains('is-fail'));
});

test('P5-14: every giveaway the count names has a row; the two every fake carries are neutral "Always" rows', () => {
    setGlobals();
    const s = open();
    buildAttempt(s, ATTEMPT1);
    pickChip(s, 'score');
    const tells = s.scored.tells.map((t) => t.id);
    for (const id of ['formOrigin', 'hoverMismatch']) {
        if (!tells.includes(id)) continue;
        const row = s.container.querySelector(`.lpb-check-item[data-factor="${id}"]`);
        assert.ok(row, `a row for ${id}`);
        assert.ok(row.classList.contains('is-neutral'));
        assert.equal(row.querySelector('.lpb-check-word').textContent, 'Always');
    }
    assert.ok(tells.includes('formOrigin') || tells.includes('hoverMismatch'), tells.join(','));
});
