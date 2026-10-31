// Step-6 defender inspection (SE design 07 §3 step 6, §4 tells tables, §6; packet P5-E,
// item 07 N5). Two halves:
//   - the pure buildSuspectPage() / tells table (landing-page-inspect.js);
//   - the overlay's inspect view in jsdom: hot-spots, the padlock decoy, "Show the link
//     target", the closing five-habits card, persistence of tellsFound, reload restore,
//     keyboard picks, and Close as a normal exit.
// Run with: bundle exec node --test test/js/social-landing-page-inspect.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-lpb-inspect-'));
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
window.stateSync = { sync: () => {} };
window.eventDispatcher = { emit() {} };
window.MinigameFramework = {
    currentMinigame: null,
    endMinigame(success, result) { ended.push({ success, result }); },
    startMinigame(type, c, params) { started.push({ type, params }); return { type, params }; }
};

const model = await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-model.js')));
const inspectMod = await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-inspect.js')));
const { buildSuspectPage, TELL_REGIONS, tells } = inspectMod;
const { LandingPageBuilderMinigame, PAGES_KEY } =
    await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-builder-minigame.js')));

function makeSocial() {
    const social = clone(fixture.social);
    social.people = [{ id: 'lord', forms: { first: 'Sofia', full: 'Sofia Lord' } }];
    social.intelFacts = { lord_portal: { text: 'Sofia uses a staff payroll portal' } };
    social.landingPages[0].pretext = {
        brandId: 'ledgerwell', purposeId: 'payslip', tone: 'formal',
        story: 'a staff-portal notice that her first payslip is ready', facts: ['lord_portal']
    };
    social.landingPages[0].fields = ['email', 'password', 'one_time_code', 'card_number', 'ni_number'];
    social.landingPages[0].extraSensitiveFields = ['card_number', 'ni_number'];
    return social;
}

const pageDef = () => makeSocial().landingPages[0];

// Record choices for the worked examples (00 §11a record shape).
const CHOICES2 = { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password'], padlock: true };   // 87, padlock on
const CHOICES1 = { brand: 'ledgerwell', purpose: 'signin', domainId: 'd_letter', logo: 'blurry',
    wording: 'w_slips', fields: ['email', 'password', 'card_number'], padlock: false };   // 34, padlock off

function record(choices, extra = {}) {
    return {
        pageId: 'payroll_login', targetId: 'lord', choices, credibility: 0, gatesPassed: true,
        meetsThreshold: true, tellsFound: [], victim: { visited: true, submitted: true, noticed: false },
        built: true, ...extra
    };
}

// ── the pure module ──────────────────────────────────────────────────────────

test('the tells table maps every tell to a region, and `tells` aliases it (07 N5)', () => {
    assert.equal(tells, TELL_REGIONS);
    for (const id of ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock', 'formOrigin', 'hoverMismatch']) {
        assert.ok(TELL_REGIONS[id], `tell ${id} has a region`);
    }
    assert.equal(TELL_REGIONS.domain, 'address');
    assert.equal(TELL_REGIONS.formOrigin, 'form');
    assert.equal(TELL_REGIONS.hoverMismatch, 'link');
});

test('buildSuspectPage: a well-built page keeps only the three unfixable tells', () => {
    const s = buildSuspectPage(pageDef(), record(CHOICES2, { credibility: 87 }), { id: 'lord', firstName: 'Sofia' });
    assert.equal(s.blocked, false);
    assert.equal(s.padlockOn, true);
    assert.deepEqual(s.presentIds.slice().sort(), ['domain', 'formOrigin', 'hoverMismatch']);
    // the domain tell carries the as-typed and real addresses (07 §4)
    const addr = s.tellsById.domain;
    assert.equal(addr.region, 'address');
    assert.match(addr.line, /ledgerwell-hr\.example/);
    assert.match(addr.line, /ledgerwell\.example/);
    // the hover tell is on the link control, not a preview region
    assert.equal(s.byRegion.link.length, 1);
    assert.equal(s.byRegion.link[0].id, 'hoverMismatch');
    assert.match(s.tellsById.hoverMismatch.line, /ledgerwell\.example\/payroll/);
});

test('buildSuspectPage: a weak page carries one tell per flawed factor plus the two page tells', () => {
    const s = buildSuspectPage(pageDef(), record(CHOICES1, { credibility: 34, meetsThreshold: false }), { id: 'lord', firstName: 'Sofia' });
    assert.deepEqual(s.presentIds.slice().sort(),
        ['domain', 'form', 'formOrigin', 'hoverMismatch', 'logo', 'padlock', 'purpose', 'wording']);
    // padlock off is a real tell here (not the decoy)
    assert.equal(s.padlockOn, false);
    assert.equal(s.byRegion.padlock[0].id, 'padlock');
    // purpose shows in the wording region, brand/logo in the logo region
    assert.ok(s.byRegion.wording.some((t) => t.id === 'purpose'));
});

test('buildSuspectPage: only stored tellsFound that still apply are counted', () => {
    // stored ids include one the current (good) choices no longer carry (logo)
    const s = buildSuspectPage(pageDef(),
        record(CHOICES2, { credibility: 87, tellsFound: ['domain', 'logo'] }),
        { id: 'lord', firstName: 'Sofia' });
    assert.deepEqual(s.found, ['domain'], 'logo is dropped: the current page has no logo tell');
    assert.equal(s.allFound, false);
});

test('buildSuspectPage: an off-menu domain is blocked, with nothing to inspect (N6b)', () => {
    const s = buildSuspectPage(pageDef(), record({ ...CHOICES2, domainId: 'nope' }), { id: 'lord', firstName: 'Sofia' });
    assert.equal(s.blocked, true);
    assert.deepEqual(s.tells, []);
    assert.deepEqual(s.presentIds, []);
});

// ── the overlay inspect view ───────────────────────────────────────────────────

let social;
let current = null;
function setGlobals(g = {}) {
    social = makeSocial();
    window.gameState = { globalVariables: clone(g) };
    window.gameScenario = { social };
    ended.length = 0; started.length = 0;
}
function open(params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new LandingPageBuilderMinigame(container, { social, landingPageId: 'payroll_login', targetId: 'lord', ...params });
    scene._sceneType = 'landing-page-builder';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const enter = (el) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
const esc = () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
const region = (s, name) => s.container.querySelector(`[data-region="${name}"]`);
const focus = (s, key) => s.container.querySelector(`[data-focus="${key}"]`);
const seeded = (extra = {}) => ({ [PAGES_KEY]: { payroll_login: record(CHOICES2, { credibility: 87, ...extra }) } });

test('Inspect opens the defender flip: step=inspect, preview is a role=group with hot-spots, nothing forbidden', () => {
    setGlobals(seeded());
    const s = open();
    assert.equal(s.getTestState().builder.canInspect, true);
    click(focus(s, 'inspect'));
    const b = s.getTestState().builder;
    assert.equal(b.inspecting, true);
    assert.equal(b.step, 'inspect');
    assert.equal(s.container.querySelector('.lpb-preview').getAttribute('role'), 'group');
    assert.ok(s.container.querySelectorAll('.lpb-hotspot').length >= 3, 'the preview has focusable hot-spots');
    assert.equal(b.previewForbidden, 0, 'div role=button hot-spots are not forbidden elements');
    assert.equal(b.inspect.totalTells, 3);
    assert.equal(b.inspect.foundCount, 0);
});

test('finding the giveaways: address, form, then Show the link target completes the step', () => {
    setGlobals(seeded());
    const s = open();
    click(focus(s, 'inspect'));
    click(region(s, 'address'));
    assert.deepEqual(s.getTestState().builder.inspect.found, ['domain']);
    assert.match(s.container.querySelector('.lpb-finding[data-tell="domain"]').textContent, /ledgerwell-hr\.example/);
    enter(region(s, 'form')); // keyboard pick
    assert.ok(s.getTestState().builder.inspect.found.includes('formOrigin'));
    // the hover tell is only behind the button
    assert.equal(s.getTestState().builder.inspect.found.includes('hoverMismatch'), false);
    click(focus(s, 'show-link'));
    const b = s.getTestState().builder;
    assert.equal(b.inspect.foundCount, 3);
    assert.equal(b.inspect.complete, true);
    assert.ok(s.container.querySelector('.lpb-closing-card'), 'the closing five-habits card');
    assert.ok(focus(s, 'done'), 'a Done button when the step is complete');
    // the record carries the found tells
    assert.deepEqual(s.getTestState().builder.recordTellsFound.slice().sort(), ['domain', 'formOrigin', 'hoverMismatch']);
});

test('the padlock is a decoy when shown, and counts for nothing', () => {
    setGlobals(seeded());
    const s = open();
    click(focus(s, 'inspect'));
    click(region(s, 'padlock'));
    const b = s.getTestState().builder;
    assert.equal(b.inspect.padlockDecoyShown, true);
    assert.equal(b.inspect.foundCount, 0, 'the decoy adds no tell');
    assert.match(s.container.querySelector('.lpb-decoy-line').textContent, /padlock/i);
});

test('a wrong pick on a clean part says what was fine', () => {
    setGlobals(seeded());
    const s = open();
    click(focus(s, 'inspect'));
    click(region(s, 'logo')); // crisp logo: no giveaway
    assert.equal(s.getTestState().builder.inspect.foundCount, 0);
    assert.match(s.container.querySelector('.lpb-fine-line').textContent, /logo/i);
});

test('Show me reveals every giveaway and ends the step', () => {
    setGlobals(seeded());
    const s = open();
    click(focus(s, 'inspect'));
    click(focus(s, 'show-me'));
    const b = s.getTestState().builder;
    assert.equal(b.inspect.foundCount, 3);
    assert.equal(b.inspect.complete, true);
    assert.equal(focus(s, 'show-me'), null, 'Show me is gone once complete');
    assert.ok(focus(s, 'done'));
});

test('reload part-way through step 6 restores the found tells', () => {
    setGlobals(seeded());
    let s = open();
    click(focus(s, 'inspect'));
    click(region(s, 'address')); // find the domain tell
    const saved = clone(window.gameState.globalVariables);
    assert.deepEqual(saved[PAGES_KEY].payroll_login.tellsFound, ['domain']);
    // reopen with the persisted globals, then re-enter inspect
    window.gameState = { globalVariables: saved };
    s = open();
    assert.equal(s.getTestState().builder.inspectionComplete, false, 'not complete: two tells still to find');
    click(focus(s, 'inspect'));
    const b = s.getTestState().builder;
    assert.deepEqual(b.inspect.found, ['domain'], 'the earlier find is restored');
    assert.equal(b.inspect.foundCount, 1);
});

test('reload after step 6 finished keeps it complete, and the Done exit reports inspectionComplete', () => {
    setGlobals(seeded({ tellsFound: ['domain', 'formOrigin', 'hoverMismatch'] }));
    const s = open();
    assert.equal(s.getTestState().builder.inspectionComplete, true);
    assert.equal(s.getTestState().builder.step, 'inspect');
    click(focus(s, 'inspect'));
    click(focus(s, 'done'));
    assert.equal(ended.at(-1).success, true, 'Done is a normal exit');
    assert.equal(ended.at(-1).result.inspectionComplete, true);
});

test('Esc during inspection is a normal exit with no failure', () => {
    setGlobals(seeded());
    const s = open();
    click(focus(s, 'inspect'));
    esc();
    assert.equal(ended.at(-1).success, true);
    assert.equal(ended.at(-1).result.inspectionComplete, false, 'inspection not finished');
    assert.equal(ended.at(-1).result.saved, false);
});

test('Inspect is not offered until a send has stored a victim record', () => {
    setGlobals(); // no record at all
    const s = open();
    assert.equal(s.getTestState().builder.canInspect, false);
    assert.equal(focus(s, 'inspect'), null);
});
