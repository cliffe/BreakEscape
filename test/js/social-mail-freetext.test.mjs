// Free-text body mode (SE design 01 §2 "Body"; contract 00 §10, §13). When a scenario
// turns it on (mailClient.bodyMode "freeText" or freeTextFlavour true) the composer shows
// one extra box. Its text rides on the message as flavour and is shown in the sent mail,
// but it is never judged (phish-rules reads only the template slots) and never reaches the
// ink (the mail runner writes no variable from it). The real composer, rules engine, mail
// client and scheduler run in jsdom.
// Run with: bundle exec node --test test/js/social-mail-freetext.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-mail-freetext-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js',
    'ui/influence-bar.js', 'systems/mail-scheduler.js', 'systems/mail-runner.js', 'systems/mail-ink.js',
    'systems/ink/ink-engine.js',
    'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js'
]) {
    try {
        mkdirSync(dirname(join(dir, rel)), { recursive: true });
        writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
    } catch { /* optional file (ink-engine): only the runner var check touches it */ }
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.error = () => {};
console.warn = () => {};

const { MailComposer } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-composer.js')));
const rules = await import(pathToFileURL(join(dir, 'systems/phish-rules.js')));
const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const { MailScheduler } = await import(pathToFileURL(join(dir, 'systems/mail-scheduler.js')));
const runner = await import(pathToFileURL(join(dir, 'systems/mail-runner.js')));

// A small Hampshire-style social block: an open inbox (trusts "*"), so a send with the
// default From, a chosen pretext and a CV attachment lands. freeTextFlavour is set by the
// caller via over().
function social(over = {}) {
    return {
        people: [{ id: 'hampshire', kind: 'cast', address: 'careers@ledgerwell.example', forms: { full: 'Chris Hampshire' } }],
        intelFacts: {},
        templates: {
            from_own: { part: 'from', text: '{account_name} <{account_address}>', slots: [] },
            greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
            pretext_apply: { part: 'pretext', text: "I'm applying for the open role.", slots: [], implies: [{ type: 'document', value: 'cv' }], urgency: 'low' },
            ask_review_cv: { part: 'ask', text: 'Could you review my CV?', slots: [] }
        },
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true }],
            mailboxes: [{ id: 'guest' }],
            contacts: [{ id: 'hampshire', person: 'hampshire', name: 'Chris Hampshire', addresses: ['careers@ledgerwell.example'], role: 'Careers', revealedBy: 'se_intel_hampshire_careers', targetId: 'hampshire' }],
            payloadKit: [{ id: 'kit_cv', label: 'CV.docx', kind: 'document' }],
            checklistTiming: 'onSend',
            ...over
        },
        phishTargets: [{
            id: 'hampshire', address: 'careers@ledgerwell.example', character: null,
            subjects: [{ id: 's_application', text: 'Application', topic: 'recruitment' }],
            interests: { topics: ['recruitment'] }, emailReplyDelay: 15,
            templateSets: { from: ['from_own'], greeting: ['greet_generic'], pretext: ['pretext_apply'], ask: ['ask_review_cv'] },
            primedFor: { distinctiveValues: ['cv'], minDistinct: 1, expectedAttachment: 'document', trusts: ['*'] },
            requiredFactors: ['senderTrust', 'pretextRelevant', 'attachmentPlausible'],
            advisoryFactors: ['senderAuth', 'urgencyCalibrated'],
            replies: { landed: "Thanks, I'll get to this CV before Friday." },
            outcome: { setGlobal: { phish_hampshire_landed: true } }
        }]
    };
}

const GUEST = { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', spoofsFrom: true, person: null, mailbox: 'guest' };

function makeComposer(over = {}) {
    const host = document.getElementById('host');
    host.textContent = '';
    const fx = social(over.mailClientOver || {});
    const sends = [];
    const drafts = [];
    const composer = new MailComposer(host, {
        people: fx.people, templates: fx.templates, phishTargets: fx.phishTargets,
        intelFacts: fx.intelFacts, payloadKit: fx.mailClient.payloadKit,
        account: GUEST, accounts: [GUEST],
        contacts: fx.mailClient.contacts, globals: {},
        pushLayer: () => () => {},
        onSend: (m) => sends.push(m),
        onChange: (d) => drafts.push(d),
        bodyMode: over.bodyMode,
        freeTextFlavour: over.freeTextFlavour,
        ...over.opts
    });
    return { composer, host, sends, drafts, fx };
}

// A complete, landing message to Hampshire, optionally carrying free text.
function landingMessage(freeText = null) {
    return {
        fromAccount: 'guest', to: 'careers@ledgerwell.example', targetId: 'hampshire',
        subject: 's_application', headerFrom: { account: true },
        templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_apply', ask: 'ask_review_cv' },
        slots: {}, attachment: 'kit_cv', attachmentKind: 'document', link: null, linkInfo: null,
        freeText
    };
}

// ── the composer box ──────────────────────────────────────────────────────────

test('bodyMode freeText shows the box; the default (templates) does not', () => {
    const on = makeComposer({ bodyMode: 'freeText' });
    assert.equal(on.composer.freeTextEnabled, true);
    assert.ok(on.host.querySelector('textarea.mail-compose-freetext'), 'the box renders');
    assert.ok(on.host.querySelector('.mail-compose-freetext-help'), 'the "not checked" help line renders');

    const off = makeComposer({});
    assert.equal(off.composer.freeTextEnabled, false);
    assert.equal(off.host.querySelector('textarea.mail-compose-freetext'), null, 'no box by default');
});

test('freeTextFlavour true is the same switch as bodyMode freeText', () => {
    const { composer, host } = makeComposer({ freeTextFlavour: true });
    assert.equal(composer.freeTextEnabled, true);
    assert.ok(host.querySelector('textarea.mail-compose-freetext'));
});

test('typing in the box fills message.freeText; it is null when the box is off', () => {
    const on = makeComposer({ bodyMode: 'freeText' });
    const area = on.host.querySelector('textarea.mail-compose-freetext');
    area.value = 'Hope the week is going well!';
    area.dispatchEvent(new on.host.ownerDocument.defaultView.Event('input'));
    assert.equal(on.composer.buildMessage().freeText, 'Hope the week is going well!');

    const off = makeComposer({});
    off.composer.freeText = 'ignored';          // even if set, a disabled box never rides on the message
    assert.equal(off.composer.buildMessage().freeText, null);
});

test('typing updates state without a re-render, so the caret stays in the box', () => {
    const { composer, host } = makeComposer({ bodyMode: 'freeText' });
    const area = host.querySelector('textarea.mail-compose-freetext');
    area.value = 'half a sentence';
    area.dispatchEvent(new host.ownerDocument.defaultView.Event('input'));
    // The same textarea node is still on the page (no render() tore it down and rebuilt it).
    assert.equal(host.querySelector('textarea.mail-compose-freetext'), area);
    assert.equal(composer.freeText, 'half a sentence');
});

test('free text never gates Send: an empty box sends; a filled box does not block', () => {
    const empty = makeComposer({ bodyMode: 'freeText' });
    assert.equal(empty.composer.getState().sendEnabled, true, 'nothing typed, still sendable');
    empty.host.querySelector('.mail-compose-send').click();
    assert.equal(empty.sends.length, 1);
    assert.equal(empty.sends[0].freeText, null);

    const filled = makeComposer({ bodyMode: 'freeText' });
    const area = filled.host.querySelector('textarea.mail-compose-freetext');
    area.value = 'a friendly note';
    area.dispatchEvent(new filled.host.ownerDocument.defaultView.Event('input'));
    assert.equal(filled.composer.getState().sendEnabled, true);
    filled.host.querySelector('.mail-compose-send').click();
    assert.equal(filled.sends.length, 1);
    assert.equal(filled.sends[0].freeText, 'a friendly note');
});

test('the draft round-trips free text; it is empty when the box is off', () => {
    const on = makeComposer({ bodyMode: 'freeText' });
    const area = on.host.querySelector('textarea.mail-compose-freetext');
    area.value = 'draft words';
    area.dispatchEvent(new on.host.ownerDocument.defaultView.Event('input'));
    assert.equal(on.composer.draft().freeText, 'draft words');
    // Restore into a fresh composer.
    const back = makeComposer({ bodyMode: 'freeText', opts: { draft: on.composer.draft() } });
    assert.equal(back.composer.freeText, 'draft words');
    assert.equal(back.host.querySelector('textarea.mail-compose-freetext').value, 'draft words');

    const off = makeComposer({});
    assert.equal(off.composer.draft().freeText, '');
});

// ── the judge ignores it ────────────────────────────────────────────────────

test('evaluateMessage: the EvalResult is identical with and without free text', () => {
    const fx = social();
    const ctx = { accounts: fx.mailClient.accounts, people: fx.people, templates: fx.templates, payloadKit: fx.mailClient.payloadKit };
    const plain = rules.evaluateMessage(fx.phishTargets[0], landingMessage(null), ctx);
    const flavoured = rules.evaluateMessage(fx.phishTargets[0], landingMessage('A long rambling flavour paragraph that mentions cv and Jed and Friday.'), ctx);
    assert.equal(plain.landed, true, 'the templated message lands');
    assert.deepEqual(flavoured, plain, 'free text changes nothing the judge decides');
});

// ── the mail runner never writes it to ink ──────────────────────────────────

test('emailVarsFromResult writes no variable carrying the free text', () => {
    const fx = social();
    const ctx = { accounts: fx.mailClient.accounts, people: fx.people, templates: fx.templates, payloadKit: fx.mailClient.payloadKit };
    const mark = 'FLAVOURMARKER_7f3a';
    const msg = landingMessage(mark);
    const result = rules.evaluateMessage(fx.phishTargets[0], msg, ctx);
    const vars = runner.emailVarsFromResult(fx.phishTargets[0], msg, result, { account: fx.mailClient.accounts[0] });
    for (const [k, v] of Object.entries(vars)) {
        assert.equal(typeof v === 'string' && v.includes(mark), false, `ink var ${k} must not carry the free text`);
    }
});

// ── end to end: the sent record shows it ─────────────────────────────────────

let clock = 0;
function openClient(mailClientOver = {}) {
    const sc = social(mailClientOver);
    window.gameScenario = { social: sc };
    window.gameState = { globalVariables: { phish_hampshire_attempts: 0, phish_hampshire_landed: false, se_intel_hampshire_careers: true } };
    const scheduler = new MailScheduler({ now: () => clock });
    scheduler.init({ scenario: window.gameScenario, saved: null });
    const host = document.getElementById('host');
    host.textContent = '';
    const scene = new MailClientMinigame(host, {
        social: sc, mailClient: sc.mailClient, accountIds: ['guest'],
        scheduler, mailState: scheduler.state, globals: window.gameState.globalVariables
    });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() {} };
    scene.init();
    scene.start();
    return { scene, scheduler, host };
}

function sentRecords(scheduler) {
    const box = scheduler.state.mailboxes.guest;
    return (box ? box.messages : []).filter((m) => m.folder === 'sent');
}

test('end to end: a landed send stores the free text in the body, after the templated parts, and still lands', () => {
    clock = 0;
    const { scene, scheduler, host } = openClient({ bodyMode: 'freeText' });
    scene.openCompose();
    const area = host.querySelector('textarea.mail-compose-freetext');
    assert.ok(area, 'the box shows because the scene passed bodyMode through to the composer');
    area.value = 'PS: congrats on the new role posting!';
    area.dispatchEvent(new host.ownerDocument.defaultView.Event('input'));
    // A CV attachment makes the send land for this open inbox.
    scene.composer.setAttachment('kit_cv');
    host.querySelector('.mail-compose-send').click();

    const sent = sentRecords(scheduler);
    assert.equal(sent.length, 1, 'one sent record');
    assert.equal(sent[0].landed, true, 'the templated parts still decide: it lands');
    assert.match(sent[0].body, /Could you review my CV\?/, 'the templated body is there');
    assert.match(sent[0].body, /PS: congrats on the new role posting!$/, 'the free text is appended at the end');
    // The judged/stored slots are untouched by the flavour.
    assert.equal(sent[0].body.indexOf('PS:') > sent[0].body.indexOf('Could you review'), true, 'flavour comes after the templated parts');
});

test('end to end: with the box off, nothing stray is stored even if the message carried free text', () => {
    clock = 0;
    const { scene, scheduler, host } = openClient({});
    scene.openCompose();
    assert.equal(host.querySelector('textarea.mail-compose-freetext'), null);
    scene.composer.setAttachment('kit_cv');
    host.querySelector('.mail-compose-send').click();
    const sent = sentRecords(scheduler);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].body, "Hello,\n\nI'm applying for the open role.\n\nCould you review my CV?");
});
