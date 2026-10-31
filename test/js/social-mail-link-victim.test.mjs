// The mail `link` kind and the send-path victim record / capture call (SE design 01 N4,
// N6; 07 N10/N11; packet P5-G). A send that carries a built landing page fills
// message.linkInfo from the saved record, judges linkCredible from it, writes the best
// victim outcome back onto se_landing_pages (betterVictim), and adds the capture note once
// (captureGranted). The composer offers the link only for a target the page serves.
// Run with: bundle exec node --test test/js/social-mail-link-victim.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-mail-link-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js',
    'ui/influence-bar.js', 'ui/modal-stack.js', 'utils/display-dashes.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/mail-client/mail-data.js',
    'minigames/landing-page-builder/landing-page-model.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const bridge = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-bridge.js')));
const { MailComposer } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-composer.js')));
const model = await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-model.js')));

// A slice-shaped social: the `lord` link target plus the payroll_login landing page.
function social() {
    return {
        people: [{ id: 'lord', kind: 'cast', address: 's.lord@ledgerwell.example', forms: { first: 'Sofia', full: 'Sofia Lord' } }],
        intelFacts: {},
        templates: {
            from_own: { part: 'from', text: '{account_name} <{account_address}>', slots: [] },
            greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
            pretext_payslip: { part: 'pretext', text: 'Your payslip is ready.', slots: [], urgency: 'low' },
            pretext_portal: { part: 'pretext', text: 'Action needed on your portal.', slots: [], urgency: 'medium' },
            ask_sign_in: { part: 'ask', text: 'Sign in with the link.', slots: [], urgency: 'low' }
        },
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true }],
            mailboxes: [{ id: 'guest' }],
            contacts: [{ id: 'lord', person: 'lord', name: 'Sofia Lord', addresses: ['s.lord@ledgerwell.example'], role: 'Intern', revealedBy: 'se_intel_portal_name', targetId: 'lord' }],
            payloadKit: [
                { id: 'kit_cv', label: 'CV.docx', kind: 'document' },
                { id: 'kit_payroll_page', label: 'Link to your landing page', kind: 'link', landingPageId: 'payroll_login' }
            ],
            checklistTiming: 'onSend'
        },
        phishTargets: [{
            id: 'lord', address: 's.lord@ledgerwell.example',
            subjects: [{ id: 's_payslip', text: 'Your payslip', topic: 'hr' }, { id: 's_hello', text: 'Hello', topic: 'general' }],
            interests: { topics: ['hr'] }, emailReplyDelay: 15,
            templateSets: { from: ['from_own'], greeting: ['greet_generic'], pretext: ['pretext_payslip', 'pretext_portal'], ask: ['ask_sign_in'] },
            primedFor: { trusts: ['*'], story: 'a payslip notice with a sign-in link' },
            expectedLink: { brandId: 'ledgerwell', realDomain: 'ledgerwell.example' },
            requiredFactors: ['senderTrust', 'linkCredible'],
            advisoryFactors: ['urgencyCalibrated'],
            replies: { landed: 'Thanks, signing in now.' },
            outcome: { setGlobal: { phish_lord_landed: true } }
        }],
        landingPages: [{
            id: 'payroll_login', linkText: 'ledgerwell.example/payroll',
            targets: { lord: { linkThreshold: 70, minDomainTier: 2 } },
            brands: [{ id: 'ledgerwell', name: 'Ledgerwell', look: 'generic', realDomain: 'ledgerwell.example',
                realFields: ['email', 'password'],
                domains: [{ id: 'd_word', domain: 'ledgerwell-hr.example', trick: 'extra-word', tier: 2 }] }],
            capture: { address: 'sofia.lord@ledgerwell.example', note: 'Sofia Lord was captured. Report it.' }
        }]
    };
}

// A built, above-threshold page record, as 07's Attach writes it.
function builtRecord(overrides = {}) {
    return model.buildRecord({
        pageId: 'payroll_login', targetId: 'lord',
        choices: { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true },
        credibility: 80, gatesPassed: true, meetsThreshold: true, built: true,
        ...overrides
    });
}

function linkMessage(overrides = {}) {
    return {
        fromAccount: 'guest', to: 's.lord@ledgerwell.example', targetId: 'lord',
        subject: 's_payslip', headerFrom: { account: true },
        templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_payslip', ask: 'ask_sign_in' },
        slots: {}, attachment: null, attachmentKind: null,
        link: 'kit_payroll_page', linkText: 'ledgerwell.example/payroll', linkInfo: null,
        ...overrides
    };
}

function fakeScene(globals) {
    const sc = social();
    return {
        social: sc, config: sc.mailClient, globals,
        account: { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', mailbox: 'guest', spoofsFrom: true, person: null },
        accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', mailbox: 'guest', spoofsFrom: true, person: null }],
        mailState: { metrics: {}, mailboxes: {}, drafts: {}, jobs: [] },
        scheduler: null,
        checklistTiming: () => 'onSend',
        refresh() {}
    };
}

test('a built page: linkInfo is filled, linkCredible passes, and the message lands', () => {
    window.gameState = { globalVariables: { se_landing_pages: { payroll_login: builtRecord() } } };
    const scene = fakeScene(window.gameState.globalVariables);
    const msg = linkMessage();
    const info = bridge.performSend(scene, msg);
    assert.equal(msg.linkInfo.state, undefined, 'a built record is not "missing"');
    assert.equal(msg.linkInfo.domain, 'ledgerwell-hr.example');
    assert.equal(msg.linkInfo.meetsThreshold, true);
    assert.equal(info.result.landed, true, 'senderTrust + linkCredible both pass');
});

test('a submitted send writes the victim record and adds the capture note once', () => {
    const notes = [];
    window.addNote = (t) => notes.push(t);
    window.gameState = { globalVariables: { se_landing_pages: { payroll_login: builtRecord() } } };
    const scene = fakeScene(window.gameState.globalVariables);

    bridge.performSend(scene, linkMessage());
    const rec = window.gameState.globalVariables.se_landing_pages.payroll_login;
    assert.deepEqual(rec.victim, { visited: true, submitted: true, noticed: false, domainId: 'd_word' }, 'meets + landed = submitted');
    assert.equal(notes.length, 1, 'capture note added on the first submit');
    assert.equal(notes[0], 'Sofia Lord was captured. Report it.');

    // A second submitting send does not add the note again (captureGranted is false).
    bridge.performSend(scene, linkMessage());
    assert.equal(notes.length, 1, 'no second capture note');
    delete window.addNote;
});

test('a below-threshold page: victim is noticed, no capture, linkCredible fails', () => {
    const notes = [];
    window.addNote = (t) => notes.push(t);
    const weak = builtRecord({ credibility: 40, meetsThreshold: false, gatesPassed: false });
    window.gameState = { globalVariables: { se_landing_pages: { payroll_login: weak } } };
    const scene = fakeScene(window.gameState.globalVariables);
    const msg = linkMessage();
    const info = bridge.performSend(scene, msg);
    assert.equal(info.result.landed, false, 'linkCredible fails below threshold');
    const rec = window.gameState.globalVariables.se_landing_pages.payroll_login;
    assert.deepEqual(rec.victim, { visited: true, submitted: false, noticed: true, domainId: 'd_word' });
    assert.equal(notes.length, 0, 'no capture note for a noticed outcome');
    delete window.addNote;
});

test('an earlier submitted outcome is not erased by a later below-threshold send (betterVictim)', () => {
    window.gameState = { globalVariables: { se_landing_pages: { payroll_login: builtRecord() } } };
    const scene = fakeScene(window.gameState.globalVariables);
    bridge.performSend(scene, linkMessage());
    // Now the saved record is submitted. Swap in a below-threshold record and resend.
    const g = window.gameState.globalVariables;
    const keptVictim = g.se_landing_pages.payroll_login.victim;
    g.se_landing_pages.payroll_login = builtRecord({ credibility: 40, meetsThreshold: false, gatesPassed: false, victim: keptVictim });
    bridge.performSend(scene, linkMessage());
    assert.deepEqual(g.se_landing_pages.payroll_login.victim, { visited: true, submitted: true, noticed: false, domainId: 'd_word' },
        'the submitted outcome survives a later weaker send');
});

test('an unbuilt page: linkInfo reads missing and linkCredible does not pass', () => {
    window.gameState = { globalVariables: { se_landing_pages: {} } };
    const scene = fakeScene(window.gameState.globalVariables);
    const msg = linkMessage();
    const info = bridge.performSend(scene, msg);
    assert.equal(msg.linkInfo.state, 'missing');
    assert.equal(info.result.landed, false);
    assert.equal(window.gameState.globalVariables.se_landing_pages.payroll_login, undefined, 'no victim written for an unbuilt page');
});

// ── composer: the link control is offered only for a target the page serves ──

function composer(globals) {
    const sc = social();
    const host = document.getElementById('host');
    host.textContent = '';
    const c = new MailComposer(host, {
        people: sc.people, templates: sc.templates, phishTargets: sc.phishTargets,
        intelFacts: sc.intelFacts, payloadKit: sc.mailClient.payloadKit, landingPages: sc.landingPages,
        account: sc.mailClient.accounts[0], accounts: sc.mailClient.accounts,
        contacts: sc.mailClient.contacts, globals,
        onAttachLink: (kit) => { c._launched = kit.id; }
    });
    return c;
}

test('the composer offers the link kit for the lord target, built or not', () => {
    const c = composer({});
    c.selectContact('lord');
    const kits = c.linkKitsForTarget();
    assert.equal(kits.length, 1);
    assert.equal(kits[0].id, 'kit_payroll_page');
});

test('choosing a link with no built page asks the host to open the builder; a built one attaches', () => {
    // No record: setLink hands off to the host and attaches nothing.
    const c1 = composer({ se_landing_pages: {} });
    c1.selectContact('lord');
    c1.setLink({ id: 'kit_payroll_page', landingPageId: 'payroll_login', kind: 'link' });
    assert.equal(c1.link, null, 'unbuilt: not attached');
    assert.equal(c1._launched, 'kit_payroll_page', 'host asked to open the builder');

    // Built record: setLink attaches at once and buildMessage carries it.
    const c2 = composer({ se_landing_pages: { payroll_login: builtRecord() } });
    c2.selectContact('lord');
    c2.setLink(c2.linkKitsForTarget()[0]);
    assert.equal(c2.link, 'kit_payroll_page');
    const msg = c2.buildMessage();
    assert.equal(msg.link, 'kit_payroll_page');
    assert.equal(msg.linkText, 'ledgerwell.example/payroll');
});

test('attachLinkIfBuilt attaches only when the page record is now built (builder return path)', () => {
    const globals = { se_landing_pages: {} };
    const c = composer(globals);
    c.selectContact('lord');
    c.attachLinkIfBuilt('kit_payroll_page');
    assert.equal(c.link, null, 'still unbuilt on return');
    globals.se_landing_pages.payroll_login = builtRecord();
    c.attachLinkIfBuilt('kit_payroll_page');
    assert.equal(c.link, 'kit_payroll_page', 'attaches once the page is built');
});
