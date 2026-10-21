// End-to-end check for the Lord playerSent triage replay (IMPL_REVIEW_R1 R-A).
//
// This is the "new end-to-end check" the review asked for: it drives the real send
// path (minigames/mail-client/mail-bridge.performSend) for a look-alike-domain
// landing-page link to Sofia Lord, then feeds the resulting Sent record into the
// real inbox-triage replay (minigames/inbox-triage/triage-messages.buildTriageMessages)
// with the lab's `domainFrom: "landing_domain"` entry and its playerSentAuth.domains.
// It fails on the pre-fix behaviour, where the Sent record dropped the chosen domain,
// so triage could not resolve the look-alike domain, dropped the linkCredible tell and
// replayed the message as a failing guest-workstation spoof. P6-T0 only ever used
// injected mail data and never exercised this seam.
//
// Run with: bundle exec node --test test/js/social-lord-triage-e2e.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-lord-triage-e2e-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js',
    'ui/influence-bar.js', 'ui/modal-stack.js', 'utils/display-dashes.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/mail-client/mail-data.js',
    'minigames/landing-page-builder/landing-page-model.js',
    'minigames/inbox-triage/triage-messages.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const bridge = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-bridge.js')));
const model = await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-model.js')));
const triage = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-messages.js')));

// The look-alike domain the student picks (extra-word trick, tier 2) and the portal's
// real domain. These are the shapes the lab uses (scenario.json.erb payroll_login).
const LOOKALIKE = 'ledgerwell-hr.example';
const REAL = 'ledgerwell.example';

function social() {
    return {
        people: [{ id: 'lord', kind: 'cast', address: 's.lord@ledgerwell.example', forms: { first: 'Sofia', full: 'Sofia Lord' } }],
        intelFacts: {},
        templates: {
            from_own: { part: 'from', text: '{account_name} <{account_address}>', slots: [] },
            greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
            pretext_payslip: { part: 'pretext', text: 'Your payslip is ready.', slots: [], urgency: 'medium' },
            ask_sign_in: { part: 'ask', text: 'Sign in with the link.', slots: [], urgency: 'low' }
        },
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true }],
            mailboxes: [{ id: 'guest' }],
            contacts: [{ id: 'lord', person: 'lord', name: 'Sofia Lord', addresses: ['s.lord@ledgerwell.example'], role: 'Intern', targetId: 'lord' }],
            payloadKit: [
                { id: 'kit_payroll_page', label: 'Link to your landing page', kind: 'link', landingPageId: 'payroll_login' }
            ],
            checklistTiming: 'onSend'
        },
        phishTargets: [{
            id: 'lord', address: 's.lord@ledgerwell.example',
            subjects: [{ id: 's_payslip', text: 'Your payslip', topic: 'hr' }],
            interests: { topics: ['hr'] }, emailReplyDelay: 15,
            templateSets: { from: ['from_own'], greeting: ['greet_generic'], pretext: ['pretext_payslip'], ask: ['ask_sign_in'] },
            primedFor: { trusts: ['*'], story: 'a payslip notice with a sign-in link' },
            expectedLink: { brandId: 'ledgerwell', realDomain: REAL },
            requiredFactors: ['linkCredible'],
            advisoryFactors: ['urgencyCalibrated'],
            replies: { landed: 'Thanks, signing in now.' },
            outcome: { setGlobal: { phish_lord_landed: true } }
        }],
        landingPages: [{
            id: 'payroll_login', linkText: 'ledgerwell.example/payroll',
            targets: { lord: { linkThreshold: 70, minDomainTier: 2 } },
            brands: [{ id: 'ledgerwell', name: 'Ledgerwell', look: 'generic', realDomain: REAL,
                realFields: ['email', 'password'],
                domains: [{ id: 'd_word', domain: LOOKALIKE, trick: 'extra-word', tier: 2 }] }],
            capture: { address: 'sofia.lord@ledgerwell.example', note: 'Sofia Lord was captured. Report it.' }
        }]
    };
}

// The triage set as the lab authors own_lord (scenario.json.erb:845-860, 808-829):
// a playerSent entry pulling from the landing domain, with a domains auth table.
function triageSet() {
    return {
        id: 'blue_team_inbox',
        playerSentAuth: {
            accounts: {
                guest: { spf: 'fail', dkim: 'none', dmarc: 'fail', envelopeFrom: 'workstation.example', replyTo: 'guest@workstation.example' }
            },
            domains: {
                d_word: { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: '{domain}', replyTo: 'no-reply@{domain}' }
            }
        },
        messages: [
            {
                id: 'own_lord', kind: 'playerSent', targetId: 'lord', domainFrom: 'landing_domain',
                notes: {
                    perFlagNote: {
                        senderTrust: 'The From address claims to be the payroll portal, but the message did not come from Ledgerwell.',
                        linkCredible: 'The link text says the real portal, but the address goes to a look-alike domain.'
                    },
                    headerNote: 'A look-alike domain can pass its own SPF, DKIM and DMARC. A pass means consistent, not trustworthy.',
                    reportReply: 'Thanks. Confirmed as a phish.'
                }
            }
        ]
    };
}

function builtRecord() {
    // A convincing (above-threshold) look-alike page, as 07's Attach writes it.
    return model.buildRecord({
        pageId: 'payroll_login', targetId: 'lord',
        choices: { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true },
        credibility: 80, gatesPassed: true, meetsThreshold: true, built: true
    });
}

function linkMessage() {
    return {
        fromAccount: 'guest', to: 's.lord@ledgerwell.example', targetId: 'lord',
        subject: 's_payslip', headerFrom: { account: true },
        templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_payslip', ask: 'ask_sign_in' },
        slots: {}, attachment: null, attachmentKind: null,
        link: 'kit_payroll_page', linkText: 'ledgerwell.example/payroll', linkInfo: null
    };
}

function fakeScene(globals) {
    const sc = social();
    const acct = { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', mailbox: 'guest', spoofsFrom: true, person: null };
    return {
        social: sc, config: sc.mailClient, globals,
        account: acct, accounts: [acct],
        mailState: { metrics: {}, mailboxes: {}, drafts: {}, jobs: [] },
        scheduler: null,
        checklistTiming: () => 'onSend',
        refresh() {}
    };
}

// Drive a real send of the look-alike link to Lord, then return the scene (its
// mailState now holds the Sent record) and the send result.
function sendToLord() {
    window.gameState = { globalVariables: { se_landing_pages: { payroll_login: builtRecord() } } };
    const scene = fakeScene(window.gameState.globalVariables);
    const info = bridge.performSend(scene, linkMessage());
    return { scene, info };
}

test('the Sent record carries the chosen look-alike domain (bridge half of R-A)', () => {
    const { scene } = sendToLord();
    const rec = scene.mailState.mailboxes.guest.messages.find((m) => m.folder === 'sent' && m.targetId === 'lord');
    assert.ok(rec, 'a Sent record to lord exists');
    assert.ok(rec.link, 'the record carries a link');
    assert.equal(rec.link.domainId, 'd_word', 'the chosen domain id rides the record');
    assert.equal(rec.link.domain, LOOKALIKE, 'the resolved look-alike domain rides the record');
    assert.equal(rec.link.pageId, 'payroll_login');
    assert.ok(Array.isArray(rec.tells) && rec.tells.includes('linkCredible'), 'linkCredible is a tell on the record');
});

test('the own_lord replay resolves the look-alike domain and keeps the linkCredible lesson (R-A)', () => {
    const { scene } = sendToLord();
    const { messages, skipped } = triage.buildTriageMessages(triageSet(), {
        mailState: scene.mailState, social: scene.social, globals: scene.globals
    });

    assert.equal(skipped.length, 0, `own_lord must not be skipped (got: ${JSON.stringify(skipped)})`);
    const msg = messages.find((m) => m.id === 'own_lord');
    assert.ok(msg, 'the own_lord message is in the round');

    // The reader sees the message come from the look-alike domain, not the guest workstation.
    assert.ok(msg.from.address.endsWith(`@${LOOKALIKE}`), `From address resolves to the look-alike domain (got ${msg.from.address})`);

    // The look-alike-domain lesson is taught: linkCredible is flagged and its note is present.
    assert.ok(Array.isArray(msg.truth.flags) && msg.truth.flags.includes('linkCredible'),
        `linkCredible survives the replay (got flags ${JSON.stringify(msg.truth && msg.truth.flags)})`);
    assert.ok(msg.truth.perFlagNote && typeof msg.truth.perFlagNote.linkCredible === 'string',
        'the linkCredible per-flag note is carried through');

    // A look-alike the attacker owns passes its own auth, so senderAuth is NOT a finding here
    // (this is the whole point of the authored headerNote). The pre-fix guest-spoof replay
    // would instead have shown failing SPF/DKIM/DMARC.
    assert.ok(!msg.truth.flags.includes('senderAuth'), 'senderAuth is not a finding for the attacker-owned domain');
    assert.equal(msg.auth.spf, 'pass');
    assert.equal(msg.auth.dkim, 'pass');
    assert.equal(msg.auth.dmarc, 'pass');

    // The replayed link points at the look-alike domain.
    assert.ok(Array.isArray(msg.links) && msg.links.length >= 1, 'the replay carries a link');
    assert.ok(msg.links[0].destination.includes(LOOKALIKE), `the link goes to the look-alike domain (got ${msg.links[0].destination})`);
});
