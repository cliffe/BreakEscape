// ENG-03b: the landing-page builder's fake-check mode (pageType: "fakeCheck"). A page on a
// genuine (compromised) site has no look-alike domain, so it is scored on four persuasion factors
// (borrowedTrust, pretext, stepWording, urgency) instead of the seven sign-in ones. Runs the real
// model, renderer and episode-model flipPage. Guard: a page with no pageType scores, renders and
// flips exactly as a sign-in page, and normChoices emits no `check` key for a sign-in record.
// No working command, payload or real clipboard write appears anywhere (fixtures hold only
// harmless descriptions).
// Run with: node --test test/js/social-landing-page-fakecheck.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-fakecheck-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/landing-page-builder/landing-page-model.js',
    'minigames/landing-page-builder/landing-page-render.js',
    'minigames/episode-runner/episode-model.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
let clipboardWrites = 0;
try { Object.defineProperty(dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: () => { clipboardWrites += 1; } } }); } catch (e) { /* ignore */ }

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const model = await mod('minigames/landing-page-builder/landing-page-model.js');
const { renderLandingPage } = await mod('minigames/landing-page-builder/landing-page-render.js');
const { flipPage } = await mod('minigames/episode-runner/episode-model.js');
const { scorePage, scoreFakeCheck, buildRecord, CHOICE_KEYS, CHECK_DEFAULT_POINTS } = model;

// A working command must never surface from the model (content rule). A loose shell/command shape.
const COMMANDISH = /(curl|wget|powershell|cmd\.exe|mshta|certutil)|[|&;$`><]/i;

// ── a fakeCheck page definition (all authored data; no real command, ever) ─────
const fakePage = () => ({
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
});

const score = (sel) => scorePage(fakePage(), { check: sel }, { id: 'visitor', firstName: 'Priya' });

test('the four persuasion factors score from choices.check; the total matches check.points', () => {
    const p = CHECK_DEFAULT_POINTS;
    const best = score({ hostId: 'genuine', pretextId: 'fits', urgencyId: 'calm', stepsId: 'smooth' });
    assert.equal(best.blocked, false);
    assert.deepEqual(best.factors.map((f) => f.id), ['borrowedTrust', 'pretext', 'stepWording', 'urgency']);
    assert.equal(best.credibility, p.borrowedTrust + p.pretext + p.stepWording + p.urgency);
    assert.equal(best.factors.find((f) => f.id === 'borrowedTrust').result, 'pass');

    // a look-alike host scores partial, an unrelated host low
    assert.equal(score({ hostId: 'lookalike' }).factors.find((f) => f.id === 'borrowedTrust').points, Math.round(p.borrowedTrust / 2));
    assert.equal(score({ hostId: 'random' }).factors.find((f) => f.id === 'borrowedTrust').points, 0);

    // off/pushy/clumsy choices score low
    const weak = score({ hostId: 'random', pretextId: 'off', urgencyId: 'pushy', stepsId: 'clumsy' });
    assert.equal(weak.factors.find((f) => f.id === 'pretext').points, 0);
    assert.equal(weak.factors.find((f) => f.id === 'stepWording').points, 0);
    assert.equal(weak.factors.find((f) => f.id === 'urgency').points, Math.round(p.urgency / 2));
    assert.equal(weak.credibility, 0 + 0 + 0 + Math.round(p.urgency / 2));
});

test('meetsThreshold reads targets[tid].linkThreshold; fake_check_paste is always the one tell', () => {
    const best = score({ hostId: 'genuine', pretextId: 'fits', urgencyId: 'calm', stepsId: 'smooth' });
    assert.equal(best.meetsThreshold, true); // 100 >= 70
    const weak = score({ hostId: 'random', pretextId: 'off', urgencyId: 'pushy', stepsId: 'clumsy' });
    assert.equal(weak.meetsThreshold, false);
    for (const r of [best, weak]) {
        assert.deepEqual(r.tells.map((t) => t.id), ['fake_check_paste']);
        assert.ok(!COMMANDISH.test(r.tells[0].line), 'the tell line is a plain description, not a command');
        for (const f of r.factors) assert.ok(!COMMANDISH.test(f.line));
        assert.ok(!COMMANDISH.test(r.verdict));
    }
    // the model is pure; nothing it does touches the clipboard
    assert.equal(clipboardWrites, 0);
    // calling scoreFakeCheck directly returns the same shape
    const direct = scoreFakeCheck(fakePage(), { check: { hostId: 'genuine' } }, 'visitor');
    assert.deepEqual(Object.keys(direct).sort(), ['blocked', 'credibility', 'factors', 'gateLines', 'gates', 'gatesPassed', 'meetsThreshold', 'tells', 'verdict']);
    assert.equal(direct.gatesPassed, true);
});

test('a sign-in page scores exactly as today, and its record carries no check key', () => {
    const signin = {
        id: 'payroll', brands: [{ id: 'b', name: 'Ledgerwell', realDomain: 'ledgerwell.example', look: 'generic',
            realFields: ['email', 'password'], domains: [{ id: 'd', domain: 'ledgerwell-login.example', tier: 3 }] }],
        purposes: [{ id: 'signin', label: 'Sign in' }],
        wordings: [{ id: 'w', match: true, text: 'x' }],
        targets: { t: { linkThreshold: 50 } }
    };
    const choices = { brand: 'b', purpose: 'signin', domainId: 'd', logo: 'crisp', wording: 'w', fields: ['email', 'password'], padlock: true };
    const r = scorePage(signin, choices, { id: 't', firstName: 'A' });
    assert.equal(r.blocked, false);
    assert.deepEqual(r.factors.map((f) => f.id), ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock']);
    // the record for a sign-in page has exactly the seven CHOICE_KEYS, no `check`
    const rec = buildRecord({ pageId: 'payroll', targetId: 't', choices });
    assert.deepEqual(Object.keys(rec.choices).sort(), [...CHOICE_KEYS].sort());
    assert.ok(!('check' in rec.choices));
    // a fakeCheck record keeps a closed four-key check block
    const fcRec = buildRecord({ pageId: 'e10_check', targetId: 'visitor', choices: { check: { hostId: 'genuine', pretextId: 'fits', urgencyId: 'calm', stepsId: 'smooth', EXTRA: 'no' } } });
    assert.deepEqual(Object.keys(fcRec.choices.check).sort(), ['hostId', 'pretextId', 'stepsId', 'urgencyId']);
});

// ── renderer ───────────────────────────────────────────────────────────────────
const FORBIDDEN = 'form,input,textarea,select,a,button,iframe,script';

test('the fakeCheck preview draws the verify panel and reveal, with no forbidden element', () => {
    const { root, blocked } = renderLandingPage({ pageDef: fakePage(), choices: { check: { hostId: 'genuine', stepsId: 'smooth' } }, doc: document });
    assert.equal(blocked, false);
    assert.equal(root.getAttribute('data-page-type'), 'fakeCheck');
    assert.ok(root.querySelector('.lpb-address-text').textContent.includes('fernside.example'));
    assert.ok(root.querySelector('.lpb-fakecheck-heading'));
    const line = root.querySelector('.lpb-fakecheck-reveal-text');
    assert.ok(line.hidden);
    assert.equal(line.textContent, 'A hidden command that would run a program on your computer');
    assert.ok(!COMMANDISH.test(line.textContent));
    assert.equal(root.querySelectorAll(FORBIDDEN).length, 0, 'no form controls or links in the preview');
    assert.equal(clipboardWrites, 0);
});

test('a sign-in page still renders with its address bar and form (byte-for-byte path unchanged)', () => {
    const signin = {
        id: 'p', brands: [{ id: 'b', name: 'Ledgerwell', realDomain: 'ledgerwell.example',
            domains: [{ id: 'd', domain: 'ledgerwell-login.example', tier: 3 }] }],
        purposes: [{ id: 'signin', label: 'Sign in' }], wordings: [{ id: 'w', match: true, text: 'x' }]
    };
    const { root } = renderLandingPage({ pageDef: signin, choices: { brand: 'b', purpose: 'signin', domainId: 'd', logo: 'crisp', wording: 'w', fields: ['email'], padlock: true }, doc: document });
    assert.equal(root.getAttribute('data-page-type'), null);
    assert.ok(root.querySelector('.lpb-address-text').textContent.includes('ledgerwell-login.example'));
    assert.ok(root.querySelector('.lpb-field'));
});

// ── flipPage ─────────────────────────────────────────────────────────────────
const episode = () => ({ stages: ['brief', 'osint', 'build', 'write', 'flip', 'defend', 'debrief'], attack: { landingPageId: 'e10_check' } });
const social = () => ({ landingPages: [fakePage()] });
const builtGlobals = (choices) => ({ se_landing_pages: { e10_check: { built: true, choices } } });

test('flipPage on a built fakeCheck page takes its host from check.host and the one tell', () => {
    const page = flipPage(episode(), social(), builtGlobals({ check: { hostId: 'genuine', pretextId: 'fits' } }));
    assert.ok(page, 'the flip page resolves for a fakeCheck page with no domain option');
    assert.equal(page.url, 'https://orders.fernside.example/');
    assert.equal(page.padlock, true);
    assert.deepEqual(page.tells, ['fake_check_paste']);
    assert.equal(page.heading, 'Verify you are human');
    assert.equal(page.pageDef.pageType, 'fakeCheck');
    assert.deepEqual(page.choices.check, { hostId: 'genuine', pretextId: 'fits' });
});

test('flipPage on a sign-in page still derives the host from the chosen domain option', () => {
    const signinSocial = { landingPages: [{ id: 'e10_check', brands: [{ id: 'b', domains: [{ id: 'd', domain: 'ledgerwell-login.example', tier: 3 }] }], purposes: [{ id: 's', label: 'Sign in' }] }] };
    const page = flipPage(episode(), signinSocial, builtGlobals({ brand: 'b', domainId: 'd', purpose: 's', fields: [], padlock: true }));
    assert.ok(page);
    assert.equal(page.url, 'https://ledgerwell-login.example/');
    assert.ok(!page.tells.includes('fake_check_paste'));
});
