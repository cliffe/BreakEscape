// Scenario and saved-state text that these minigames write with innerHTML must
// render as text: backup recovery outcome tone, warranty verdicts restored from
// gameState, blockchain explorer block/confirmation fields and wallet sublabels
// (escaped once, not twice), the mixer board's currency and fee, and every
// NCSC brief and coverage decision form field. The NCSC brief and the form keep
// the small formatting set their scenario uses (entities, <strong>, <br>).
// The real modules run against jsdom.
// Run with: node --test test/js/minigame-html-sweep-b.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
// SWEEP_JS_ROOT points at a copy of the engine (used to show the tests fail on old code)
const js = process.env.SWEEP_JS_ROOT || join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { BackupRecoveryMinigame } = await imp('minigames/backup-recovery/backup-recovery-minigame.js');
const { WarrantyChecklistMinigame } = await imp('minigames/warranty-checklist/warranty-checklist-minigame.js');
const { BlockchainExplorerMinigame } = await imp('minigames/blockchain-explorer/blockchain-explorer-minigame.js');
const { NcscBriefMinigame } = await imp('minigames/ncsc-brief/ncsc-brief-minigame.js');
const { CoverageDecisionFormMinigame } = await imp('minigames/coverage-decision-form/coverage-decision-form-minigame.js');

// (<u>, not <b>: a bare <b> is in the NCSC brief and form's formatting set)
const HOSTILE = 'Vault <u class="x">bold</u> <img src=x onerror="window.__pwned=1"> & "q" \'s\'';
// Breaks out of a double-quoted attribute in the old code
const ATTR = 'x" onmouseover="window.__pwned=2"><img src=x onerror="window.__pwned=1">';

function fresh() {
    window.__pwned = undefined;
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.gameState = { globalVariables: {} };
    window.npcManager = undefined;
    return document.getElementById('mg');
}

const lockable = (md, sd = {}) => ({ lockable: { scenarioData: { ...sd, minigameData: md } } });

function quietly(fn) {
    try { return fn(); } catch { return undefined; }
}

// Nothing the scenario wrote became an element, attribute or handler
function assertClean(label) {
    const root = document.getElementById('mg');
    assert.equal(root.querySelector('img'), null, `${label}: no img injected`);
    assert.equal(root.querySelector('[onerror], [onmouseover], u'), null, `${label}: no injected handler or element`);
}

test('backup recovery: a scenario outcomeTone cannot break out of the panel class', () => {
    const mg = new BackupRecoveryMinigame(fresh(), {});
    mg.complete = () => {};
    quietly(() => mg.init());
    mg.showOutcomeScreen({ id: 's1', name: 'Tape', outcomeTone: ATTR, outcomeHeader: HOSTILE, outcomeStatus: HOSTILE, outcomeBullets: [HOSTILE] });
    assertClean('outcome');
    const panel = document.querySelector('[class*="backup-recovery-outcome-panel--"]');
    assert.ok(panel, 'outcome panel renders');
    assert.ok(panel.className.includes(ATTR), 'the tone stays inside the class attribute');
    assert.equal(document.querySelector('.backup-recovery-outcome-status').textContent, HOSTILE);
});

test('warranty checklist: a verdict restored from saved state cannot reach the markup', () => {
    const root = fresh();
    window.gameState.warrantyChecklist = { verdicts: { w1: ATTR } };
    const mg = new WarrantyChecklistMinigame(root, { warranties: [{ id: 'w1', code: 'W-01', title: HOSTILE, context: HOSTILE }] });
    quietly(() => mg.init());
    assertClean('warranty');
    assert.equal(document.querySelector('.wcc-row-title').textContent, HOSTILE);
    assert.equal(document.querySelector('.wcc-verdict-badge'), null, 'an unknown verdict shows no badge');
});

function explorer() {
    const md = {
        seedTransaction: 'tx1',
        wallets: [{ address: 'w1', displayName: 'Shell & Co <i>' }, { address: 'w2', displayName: 'B' }],
        transactions: [{
            hash: 'tx1', timestamp: '2026-01-01T00:00:00Z', fee: 0,
            confirmations: HOSTILE, blockHeight: HOSTILE,
            inputs: [{ wallet: 'w1', amount: 1 }], outputs: [{ wallet: 'w2', amount: 1 }]
        }]
    };
    const mg = new BlockchainExplorerMinigame(fresh(), lockable(md));
    quietly(() => mg.init());
    quietly(() => mg.start());
    return mg;
}

test('blockchain explorer: string confirmations and block height render as text', () => {
    explorer();
    assertClean('tx view');
    const meta = [...document.querySelectorAll('.bce-meta-value, .bce-meta-subtle')].map(e => e.textContent);
    assert.ok(meta.filter(t => t === HOSTILE).length >= 2, 'block height and confirmations read back as typed');
});

test('blockchain explorer: a wallet name is escaped once in the graph sublabel', () => {
    explorer();
    const labels = [...document.querySelectorAll('.bce-gn-sublabel')].map(e => e.textContent);
    assert.ok(labels.includes('Shell & Co <i>'), `graph sublabel reads back as typed (got ${JSON.stringify(labels)})`);
    const side = [...document.querySelectorAll('.bce-link-sublabel')].map(e => e.textContent);
    assert.ok(side.includes('Shell & Co <i>'), 'detail sublabel reads back as typed');
});

test('mixer board: currency and fee percent render as text', () => {
    const md = {
        mode: 'mixer_match', currency: HOSTILE,
        mixer: { name: 'Pool', feePercent: HOSTILE, minHoldHours: 1 },
        deposits: [{ id: 'd1', wallet: 'w1', amount: 100, time: '2026-01-01T00:00:00Z' }],
        withdrawals: [{ id: 'o1', slot: 'A', amount: 99, time: '2026-01-01T03:00:00Z' }]
    };
    const mg = new BlockchainExplorerMinigame(fresh(), lockable(md));
    quietly(() => mg.init());
    const board = mg._mixerBoard;
    board.selected = 'd1';
    board.working.add('d1');
    board.render();
    assertClean('mixer board');
    assert.ok(document.querySelector('.bce-mx-amt').textContent.includes(HOSTILE), 'currency reads back');
    assert.ok(document.querySelector('.bce-mx-working').textContent.includes(`${HOSTILE}% of`), 'fee reads back');
});

function brief(extra = {}) {
    const md = {
        caseRef: HOSTILE, openableStatusBadge: HOSTILE, briefTitle: HOSTILE, briefMeta: HOSTILE,
        reviewedVar: 'brief_seen',
        sections: [
            { type: 'section', title: HOSTILE, confidence: { text: HOSTILE, cssClass: ATTR }, body: HOSTILE, bullets: [HOSTILE], note: { title: HOSTILE, body: HOSTILE } },
            { type: 'legal-gap', title: HOSTILE, paragraphs: [HOSTILE] },
            { type: 'coverage-note', title: HOSTILE, paragraphs: [HOSTILE] }
        ],
        ...extra
    };
    const mg = new NcscBriefMinigame(fresh(), lockable(md, { sealedMessage: HOSTILE, openableReadyMessage: HOSTILE }));
    quietly(() => mg.init());
    return mg;
}

test('NCSC brief: sealed and openable envelopes render scenario text as text', () => {
    const mg = brief();
    mg._renderSealed();
    assertClean('sealed');
    assert.equal(document.querySelector('.ncsc-envelope-ref').textContent, HOSTILE);
    assert.equal(document.querySelector('.ncsc-sealed-message').textContent, HOSTILE);
    mg._renderOpenable();
    assertClean('openable');
    assert.ok(document.querySelector('.ncsc-status-ready').textContent.endsWith(HOSTILE));
});

test('NCSC brief: every content field renders as text', () => {
    const mg = brief();
    mg._renderContent();
    assertClean('content');
    for (const sel of ['.ncsc-brief-title', '.ncsc-brief-meta', '.ncsc-section-title', '.ncsc-note-title', '.ncsc-list li']) {
        assert.equal(document.querySelector(sel).textContent, HOSTILE, sel);
    }
    const badge = document.querySelector('.ncsc-badge');
    assert.ok(badge.className.includes(ATTR), 'the confidence class stays inside the attribute');
    assert.ok(document.querySelector('.ncsc-legal-gap-title').textContent.endsWith(HOSTILE));
});

test('NCSC brief: the scenario formatting set still works (entities, strong, br)', () => {
    const mg = brief({
        briefMeta: 'Albion&rsquo;s ref<br>Date: 23 March',
        sections: [{ type: 'section', title: 'Section 1 &mdash; X', body: 'This is a <strong>technical assessment</strong> -- not more <strong onclick="x">no</strong>' }]
    });
    mg._renderContent();
    assertClean('formatting');
    const meta = document.querySelector('.ncsc-brief-meta');
    assert.equal(meta.querySelectorAll('br').length, 1);
    assert.equal(meta.textContent, 'Albion’s refDate: 23 March');
    assert.equal(document.querySelector('.ncsc-section-title').textContent, 'Section 1 — X');
    const strong = document.querySelectorAll('.ncsc-section p strong');
    assert.equal(strong.length, 1, 'a bare <strong> is kept, one with attributes is not');
    assert.equal(strong[0].textContent, 'technical assessment');
    assert.ok(document.querySelector('.ncsc-section p').textContent.includes('– not more <strong onclick="x">no'), "an unlisted form stays text");
});

// Review R4 m1 and n1: entity-encoded tags stay literal, tags restore only as pairs, any case
test('NCSC brief: an entity-encoded tag stays text and a stray tag cannot restyle what follows', () => {
    const mg = brief({
        briefMeta: 'Shown as &lt;b&gt;x&lt;/b&gt;',
        sections: [
            { type: 'section', title: 'One', body: 'Open <i>italic and <b onclick=1>bad</b> then <BR> and <Strong>Bold</Strong>' },
            { type: 'section', title: 'Two', body: 'After <b><i>both</i></b>' }
        ]
    });
    mg._renderContent();
    assertClean('stray tags');
    const meta = document.querySelector('.ncsc-brief-meta');
    assert.equal(meta.querySelector('b'), null, 'no real <b> from &lt;b&gt;');
    assert.equal(meta.textContent, 'Shown as <b>x</b>');
    const [one, two] = document.querySelectorAll('.ncsc-section p');
    assert.equal(one.querySelector('i'), null, 'an unclosed <i> stays text');
    assert.equal(one.querySelectorAll('b').length, 0, 'a </b> without its own opening tag stays text');
    assert.ok(one.textContent.includes('<i>italic and <b onclick=1>bad</b>'), one.textContent);
    assert.equal(one.querySelectorAll('br').length, 1, 'upper-case <BR> works');
    assert.equal(one.querySelector('strong')?.textContent, 'Bold', 'mixed-case <Strong> pair works, lower case out');
    assert.equal(two.closest('i, b'), null, 'the next section is not inside a carried-over tag');
    assert.equal(two.querySelector('b > i')?.textContent, 'both', 'one level of nesting is restored');
});

test('coverage decision form: an entity-encoded tag stays text and a stray tag stays text', () => {
    const md = { headerRef: 'MC-007', sections: [{ id: 's1', title: 'Show &lt;em&gt;this&lt;/em&gt;', description: 'Open <em>never closed', options: [{ value: 'A1', label: '<b>A1</b> ok' }] }] };
    const mg = new CoverageDecisionFormMinigame(fresh(), lockable(md));
    quietly(() => mg.init());
    assert.equal(document.querySelector('.cdf-section-title').textContent, 'Show <em>this</em>');
    assert.equal(document.querySelector('.cdf-section-title em'), null);
    assert.equal(document.querySelector('.cdf-section-desc em'), null);
    assert.equal(document.querySelector('.cdf-section-desc').textContent, 'Open <em>never closed');
    assert.equal(document.querySelector('.cdf-radio-row b')?.textContent, 'A1');
});

test('coverage decision form: every field renders as text, ids and values stay inside attributes', () => {
    const md = {
        headerRef: HOSTILE, claimsManager: HOSTILE, formTitle: HOSTILE, outcomeSpeaker: HOSTILE,
        outcomeQuoteSection: ATTR,
        outcomeQuotes: { [ATTR]: 'Agreed.' },
        sections: [{ id: ATTR, title: HOSTILE, description: HOSTILE, options: [{ value: ATTR, label: HOSTILE, sublabel: HOSTILE }] }],
        completionActions: [{ setVariable: 'pick', fromSection: ATTR }]
    };
    const mg = new CoverageDecisionFormMinigame(fresh(), lockable(md));
    quietly(() => mg.init());
    assertClean('form');
    for (const sel of ['.cdf-header-title', '.cdf-outcome-speaker', '.cdf-section-title', '.cdf-section-desc', '.cdf-radio-sublabel']) {
        assert.equal(document.querySelector(sel).textContent, HOSTILE, sel);
    }
    assert.ok(document.querySelector('.cdf-header-sub').textContent.includes(`Policy Ref: ${HOSTILE}`));
    const radio = document.querySelector('input[type="radio"]');
    assert.equal(radio.name, ATTR);
    assert.equal(radio.value, ATTR);
    // Selecting and submitting still work with an id that is not selector-safe
    radio.checked = true;
    radio.dispatchEvent(new window.Event('change'));
    assert.equal(document.querySelector('#cdf-submit-btn').disabled, false, 'submit enables');
    document.querySelector('#cdf-submit-btn').click();
    assert.equal(document.querySelector('#cdf-outcome-text').textContent, 'Agreed.');
    assert.equal(window.gameState.globalVariables.pick, ATTR);
});

test('coverage decision form: the scenario formatting set still works', () => {
    const md = { headerRef: 'MC-007', sections: [{ id: 's1', title: 'Section 1 &mdash; Coverage', description: 'Meridian&rsquo;s view', options: [{ value: 'A1', label: 'A1 &mdash; Accept (&pound;8.2M)' }] }] };
    const mg = new CoverageDecisionFormMinigame(fresh(), lockable(md));
    quietly(() => mg.init());
    assert.equal(document.querySelector('.cdf-section-title').textContent, 'Section 1 — Coverage');
    assert.equal(document.querySelector('.cdf-section-desc').textContent, 'Meridian’s view');
    assert.equal(document.querySelector('.cdf-radio-row span span').textContent, 'A1 — Accept (£8.2M)');
    assert.equal(document.querySelector('.cdf-radio-sublabel').textContent, '', 'a missing sublabel is empty, not "undefined"');
    assert.ok(document.querySelector('#cdf-submitted-badge').textContent.endsWith('— MC-007'));
});
