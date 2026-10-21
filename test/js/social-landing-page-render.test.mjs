// Landing-page builder preview renderer (SE design 07 N3, N6b renderer half, N8; packet P5-B).
//
// Proves the safety properties by construction, not by convention:
//   - the preview DOM holds none of the forbidden elements, in all six states;
//   - no file in the builder folder calls a network API;
//   - authored domains (homograph letter, `xn--` label) render raw, never through
//     displayDashes;
//   - the N6b runtime guard blocks an off-menu or non-`.example` domain;
//   - every authored domain/address/label is set in var(--se-font-readable) (N8).
// Run with: bundle exec node --test test/js/social-landing-page-render.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const builderDir = join(js, 'minigames/landing-page-builder');

// The renderer imports nothing, so copy it alone into an ESM folder and import it.
const dir = mkdtempSync(join(tmpdir(), 'social-landing-render-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'minigames/landing-page-builder'), { recursive: true });
writeFileSync(
    join(dir, 'minigames/landing-page-builder/landing-page-render.js'),
    readFileSync(join(builderDir, 'landing-page-render.js'), 'utf8'),
);

const { renderLandingPage, resolveDomainOption, isDomainBlocked } =
    await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-render.js')));

function freshDoc() {
    return new JSDOM('<!doctype html><body></body>').window.document;
}

// U+0435 is Cyrillic small letter ie (confusable with Latin e). Written as an escape here,
// exactly as the scenario data must (07 §5).
const HOMO = 'ledgerwеll.example';

// A minimal page definition modelled on 07 §5.
const pageDef = {
    id: 'payroll_login',
    linkText: 'ledgerwell.example/payroll',
    brands: [
        {
            id: 'ledgerwell', name: 'Ledgerwell', look: 'generic', realDomain: 'ledgerwell.example',
            realFields: ['email', 'password'],
            domains: [
                { id: 'd_unrelated', domain: 'payroll-online.example', trick: 'unrelated', tier: 0 },
                { id: 'd_letter', domain: 'ledgerwall.example', trick: 'wrong-letter', tier: 1 },
                { id: 'd_word', domain: 'ledgerwell-hr.example', trick: 'extra-word', tier: 2 },
                { id: 'd_vv', domain: 'ledgervvell.example', trick: 'typo-squat', tier: 3 },
                { id: 'd_homo', domain: HOMO, browserDomain: 'xn--ledgerwll-m0h.example', trick: 'homograph', tier: 3 },
            ],
        },
    ],
    purposes: [
        { id: 'signin', label: 'Sign in' },
        { id: 'payslip', label: 'Payslip ready' },
    ],
    wordings: [
        { id: 'w_formal', match: true, text: 'Your first payslip is ready. Sign in to the staff portal to view it.' },
    ],
    fields: ['email', 'password', 'one_time_code', 'card_number', 'ni_number'],
};

// The attempt-2 worked-example choices (07 §4): credibility 87.
const workedChoices = {
    brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password'], padlock: true,
};
const homoChoices = { ...workedChoices, domainId: 'd_homo' };

const FORBIDDEN = ['a', 'form', 'input', 'textarea', 'select', 'button', 'iframe', 'script'];

function assertDomSafe(root, label) {
    for (const tag of FORBIDDEN) {
        assert.equal(root.querySelectorAll(tag).length, 0, `${label}: preview contains <${tag}>`);
    }
    assert.equal(root.querySelectorAll('[contenteditable]').length, 0, `${label}: preview has contenteditable`);
}

test('six states pass the DOM-safety walk', () => {
    const states = [
        { name: 'build', opts: { pageDef, choices: workedChoices, mode: 'build', doc: freshDoc() } },
        { name: 'score', opts: { pageDef, choices: workedChoices, mode: 'score', doc: freshDoc() } },
        { name: 'inspect (step 6 hot-spots)', opts: { pageDef, choices: workedChoices, mode: 'inspect', doc: freshDoc() } },
        { name: 'blocked placeholder', opts: { pageDef, choices: { ...workedChoices, domainId: 'd_offmenu' }, doc: freshDoc() } },
        { name: 'homograph option', opts: { pageDef, choices: homoChoices, mode: 'build', doc: freshDoc() } },
        { name: 'worked-example page', opts: { pageDef, choices: workedChoices, mode: 'score', doc: freshDoc() } },
    ];
    for (const { name, opts } of states) {
        const { root } = renderLandingPage(opts);
        assertDomSafe(root, name);
    }
});

test('step 6 renders five focusable hot-spots, build does not', () => {
    const inspectRoot = renderLandingPage({ pageDef, choices: workedChoices, mode: 'inspect', doc: freshDoc() }).root;
    // div role="button" hot-spots are allowed (tag names, not roles, are forbidden).
    const spots = inspectRoot.querySelectorAll('[role="button"]');
    assert.equal(spots.length, 5, 'expected padlock, address, logo, wording and form hot-spots');
    for (const s of spots) {
        assert.equal(s.tagName.toLowerCase(), 'div');
        assert.equal(s.getAttribute('tabindex'), '0');
    }
    assert.equal(inspectRoot.getAttribute('role'), 'group');

    const buildRoot = renderLandingPage({ pageDef, choices: workedChoices, mode: 'build', doc: freshDoc() }).root;
    assert.equal(buildRoot.querySelectorAll('[role="button"]').length, 0, 'build mode has no hot-spots');
    assert.equal(buildRoot.getAttribute('role'), 'img');
});

test('form fields are inert boxes, never controls', () => {
    const { root } = renderLandingPage({ pageDef, choices: workedChoices, doc: freshDoc() });
    const boxes = root.querySelectorAll('.lpb-field');
    assert.equal(boxes.length, 2, 'email + password boxes');
    assert.equal(boxes[0].querySelector('.lpb-field-label').textContent, 'Email');
    assert.equal(boxes[1].querySelector('.lpb-field-label').textContent, 'Password');
    // no control of any kind inside the form
    assertDomSafe(root.querySelector('.lpb-form'), 'form');
});

// Strip // line and /* */ block comments so the grep tests executable code, not the
// prose documenting the safety rule (which must name the APIs it forbids).
function stripComments(src) {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

test('no builder file calls a network API', () => {
    const banned = /\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/;
    const files = readdirSync(builderDir).filter((f) => f.endsWith('.js'));
    assert.ok(files.length > 0, 'builder folder has at least the renderer');
    for (const f of files) {
        const src = stripComments(readFileSync(join(builderDir, f), 'utf8'));
        const hit = src.match(banned);
        assert.equal(hit, null, `${f} references ${hit && hit[0]}`);
    }
});

test('the renderer never imports displayDashes', () => {
    const src = readFileSync(join(builderDir, 'landing-page-render.js'), 'utf8');
    assert.equal(/display-dashes|displayDashes/.test(src.replace(/\/\/.*$/gm, '')), false);
});

test('homograph domain and its punycode form render raw', () => {
    const { root } = renderLandingPage({ pageDef, choices: homoChoices, mode: 'build', doc: freshDoc() });
    const text = root.querySelector('.lpb-address').textContent;
    // the Cyrillic letter survives, shown as typed
    assert.ok(text.includes('е'), 'Cyrillic letter present in the address bar');
    assert.ok(text.includes(HOMO), 'domain shown exactly as authored');
    // the xn-- label keeps its double hyphen (not turned into an en dash by displayDashes)
    assert.ok(text.includes('xn--ledgerwll-m0h'), 'punycode shown raw with double hyphen');
    assert.ok(!text.includes('–'), 'no en dash in the address bar');
});

test('authored domain and field labels are set in the readable font (N8)', () => {
    const { root } = renderLandingPage({ pageDef, choices: workedChoices, doc: freshDoc() });
    const addr = root.querySelector('.lpb-address-text');
    assert.match(addr.style.fontFamily, /se-font-readable/);
    const label = root.querySelector('.lpb-field-label');
    assert.match(label.style.fontFamily, /se-font-readable/);
    const copy = root.querySelector('.lpb-copy');
    assert.match(copy.style.fontFamily, /se-font-readable/);
});

test('N6b guard: off-menu and non-.example domains are blocked', () => {
    // (c) a menu domain whose host ends .example: allowed
    assert.equal(isDomainBlocked(pageDef, workedChoices), false);
    assert.ok(resolveDomainOption(pageDef, workedChoices));

    // (b) an id that is not on the authored menu: blocked
    assert.equal(isDomainBlocked(pageDef, { ...workedChoices, domainId: 'd_offmenu' }), true);
    assert.equal(resolveDomainOption(pageDef, { ...workedChoices, domainId: 'd_offmenu' }), null);

    // (a) a menu entry injected with a non-.example host (e.g. ledgerwell.test): blocked
    const injected = {
        ...pageDef,
        brands: [{ ...pageDef.brands[0], domains: [...pageDef.brands[0].domains, { id: 'd_test', domain: 'ledgerwell.test' }] }],
    };
    assert.equal(isDomainBlocked(injected, { ...workedChoices, domainId: 'd_test' }), true);
});

test('blocked placeholder draws the frame only', () => {
    const { root, blocked } = renderLandingPage({ pageDef, choices: { ...workedChoices, domainId: 'd_offmenu' }, doc: freshDoc() });
    assert.equal(blocked, true);
    assert.ok(root.classList.contains('is-blocked'));
    assert.equal(root.querySelector('.lpb-address-text').textContent, 'Blocked address');
    assert.equal(root.querySelector('.lpb-body'), null, 'no page body when blocked');
    assertDomSafe(root, 'blocked');
});

test('a blocked address injected straight into the renderer still draws the placeholder', () => {
    // guard fixture (a): the renderer refuses even a domain that is on the menu object,
    // because its host does not end .example
    const injected = {
        ...pageDef,
        brands: [{ ...pageDef.brands[0], domains: [{ id: 'd_test', domain: 'ledgerwell.test' }] }],
    };
    const { root, blocked } = renderLandingPage({ pageDef: injected, choices: { brand: 'ledgerwell', domainId: 'd_test', fields: [] }, doc: freshDoc() });
    assert.equal(blocked, true);
    assert.equal(root.querySelector('.lpb-address-text').textContent, 'Blocked address');
});
