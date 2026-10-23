// Mail client polish (SE design 01 N13, N17 withReply timing; packet P1-N): the composer shows one
// address row, a withReply send hides its verdict until the delivery job runs and then reveals the
// checklist, panels over the reader make it inert, focus survives a rebuild, and the stylesheet
// carries the narrow-layout and reduced-motion rules.
// Run with: bundle exec node --test test/js/social-mail-narrow.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-mail-narrow-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js', 'systems/mail-scheduler.js',
    'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
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

const bridge = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-bridge.js')));
const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const { MailScheduler } = await import(pathToFileURL(join(dir, 'systems/mail-scheduler.js')));

// A slice-shaped social block: Hampshire, a data-only open inbox (trusts "*").
function social() {
    return {
        people: [{ id: 'hampshire', kind: 'cast', address: 'careers@ledgerwell.example', forms: { full: 'Chris Hampshire' } }],
        intelFacts: {
            hampshire_cv_backlog: { provides: [{ type: 'date', value: 'friday', label: 'Friday', kind: 'generic' }] },
            careers_attachment: { provides: [{ type: 'document', value: 'cv', label: 'my CV', kind: 'distinctive' }] }
        },
        templates: {
            from_own: { part: 'from', text: '{account_name} <{account_address}>', slots: [] },
            greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
            pretext_apply: { part: 'pretext', text: "I'm applying for the open role.", slots: [], implies: [{ type: 'document', value: 'cv' }], urgency: 'low' },
            pretext_enquiry: { part: 'pretext', text: 'I have a general enquiry.', slots: [], urgency: 'low' },
            ask_review_cv: { part: 'ask', text: 'Could you review my CV?', slots: [] }
        },
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true }],
            mailboxes: [{ id: 'guest' }],
            contacts: [{ id: 'hampshire', person: 'hampshire', name: 'Chris Hampshire', addresses: ['careers@ledgerwell.example'], role: 'Careers', revealedBy: 'se_intel_hampshire_careers', targetId: 'hampshire' }],
            payloadKit: [{ id: 'kit_cv', label: 'CV.docx', kind: 'document' }],
            checklistTiming: 'onSend'
        },
        phishTargets: [{
            id: 'hampshire', address: 'careers@ledgerwell.example', character: null,
            subjects: [{ id: 's_application', text: 'Application', topic: 'recruitment' }, { id: 's_hello', text: 'Hello', topic: 'general' }],
            interests: { topics: ['recruitment'] }, emailReplyDelay: 15,
            templateSets: { from: ['from_own'], greeting: ['greet_generic'], pretext: ['pretext_apply', 'pretext_enquiry'], ask: ['ask_review_cv'] },
            primedFor: { distinctiveValues: ['cv'], minDistinct: 1, expectedAttachment: 'document', trusts: ['*'] },
            requiredFactors: ['senderTrust', 'pretextRelevant', 'attachmentPlausible'],
            advisoryFactors: ['senderAuth', 'urgencyCalibrated'],
            replies: { landed: "Thanks, I'll get to this CV before Friday." },
            outcome: { setGlobal: { phish_hampshire_landed: true } }
        }]
    };
}

function message(overrides = {}) {
    return {
        fromAccount: 'guest', to: 'careers@ledgerwell.example', targetId: 'hampshire',
        subject: 's_application', headerFrom: { account: true },
        templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_apply', ask: 'ask_review_cv' },
        slots: {}, attachment: 'kit_cv', attachmentKind: 'document', link: null, linkInfo: null,
        ...overrides
    };
}

let clock = 0;
function openClient(globals = {}, timing = 'onSend') {
    const sc = social();
    sc.mailClient.checklistTiming = timing;
    window.gameScenario = { social: sc };
    window.gameState = { globalVariables: { phish_hampshire_attempts: 0, phish_hampshire_landed: false, ...globals } };
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
    return { scene, scheduler, host, social: sc };
}


import { readFileSync as readCss } from 'node:fs';
const css = readCss(join(root, 'public/break_escape/css/mail-client-minigame.css'), 'utf8');

function open(timing, globals = {}) {
    return openClient({ se_intel_hampshire_careers: true, se_intel_hampshire_cv_backlog: true, ...globals }, timing);
}
const sentRow = (host) => { host.querySelector('.mail-folder-btn[data-folder="sent"]').click(); return host.querySelector('.mail-row'); };

test('the composer shows the sending address once (Send as), with no second From row', () => {
    clock = 0;
    const { scene, host } = open('onSend');
    scene.openCompose();
    const root = host.querySelector('.mail-composer');
    const addr = 'guest@workstation.example';
    const rowsWith = [...root.querySelectorAll('.mail-compose-row')].filter((r) => r.textContent.includes(addr));
    assert.equal(rowsWith.length, 1, 'one row carries the address');
    assert.equal(rowsWith[0].querySelector('.mail-compose-label').textContent, 'Send as');
    assert.equal(root.querySelector('.mail-compose-part[data-part="from"]'), null);
    assert.ok(root.querySelector('.mail-compose-sendas .mail-compose-from-own'));
});

test('a forced From puts its hint on the Send as row', () => {
    clock = 0;
    const sc = social();
    sc.mailClient.accounts[0].spoofsFrom = false;
    window.gameScenario = { social: sc };
    window.gameState = { globalVariables: { se_intel_hampshire_careers: true } };
    const scheduler = new MailScheduler({ now: () => clock });
    scheduler.init({ scenario: window.gameScenario, saved: null });
    const host = document.getElementById('host');
    host.textContent = '';
    const scene = new MailClientMinigame(host, { social: sc, mailClient: sc.mailClient, accountIds: ['guest'],
        scheduler, mailState: scheduler.state, globals: window.gameState.globalVariables });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() {} };
    scene.init(); scene.start();
    scene.openCompose();
    const row = host.querySelector('.mail-compose-sendas');
    assert.match(row.textContent, /You can only send as yourself/);
    assert.equal(host.querySelectorAll('.mail-compose-hint').length, 1);
    scene.cleanup();
});

test('withReply: the Sent verdict and checklist wait for the job, then both appear', () => {
    clock = 0;
    const { scene, scheduler, host } = open('withReply');
    scene._handleComposeSend(message());
    assert.equal(host.querySelector('.mail-checklist'), null, 'no checklist at send time');
    assert.equal(scheduler.state.jobs.length, 1);
    const row = sentRow(host);
    row.click();
    assert.equal(host.querySelector('.mail-judged').textContent, 'Sent. Waiting for a reply.');
    assert.equal(host.querySelector('.mail-judged.landed'), null);

    clock = 15000;
    scheduler.tick(clock);
    assert.equal(scheduler.state.jobs.length, 0);
    assert.ok(host.querySelector('.mail-checklist'), 'checklist revealed when the job ran');
    assert.ok(host.querySelector('.mail-checklist-banner.landed'));
    assert.match(host.querySelector('.mail-judged').textContent, /Judged: landed/);
});

test('withReply: the verdict waits while the job is queued after a reload, then the checklist is rebuilt (T2-6)', () => {
    clock = 0;
    const { scene, scheduler, host } = open('withReply');
    scene._handleComposeSend(message());
    scene.cleanup();
    host.textContent = '';
    // A new client over the same state (a reload): the in-memory held checklist is gone, the queue is not.
    const again = new MailClientMinigame(host, { social: scene.params.social, mailClient: scene.params.mailClient, accountIds: ['guest'],
        checklistTiming: 'withReply', scheduler, mailState: scheduler.state, globals: window.gameState.globalVariables });
    window.MinigameFramework = { currentMinigame: again, endMinigame() {} };
    again.init(); again.start();
    sentRow(host).click();
    assert.equal(host.querySelector('.mail-judged').textContent, 'Sent. Waiting for a reply.');
    assert.equal(host.querySelector('.mail-checklist'), null, 'nothing to explain until the job runs');
    clock = 15000;
    scheduler.tick(clock);
    assert.match(host.querySelector('.mail-judged').textContent, /Judged: landed/);
    // The teaching checklist is rebuilt from the record's stored message (T2-6), not lost.
    assert.ok(host.querySelector('.mail-checklist'), 'the checklist is rebuilt after the reload');
    assert.ok(host.querySelector('.mail-checklist-banner.landed'));
    again.cleanup();
});

test('withReply: an unopened data-only send gets a silent job that only reveals the verdict', () => {
    const jobs = [];
    const closed = {
        people: [{ id: 'gate', kind: 'cast', address: 'gate@ledgerwell.example', forms: { full: 'Gate Keeper' } }],
        intelFacts: {},
        templates: { from_own: { part: 'from', text: '{account_name}', slots: [] } },
        phishTargets: [{ id: 'gate', address: 'gate@ledgerwell.example', character: null,
            subjects: [{ id: 's1', text: 'Hi', topic: 'general' }], interests: { topics: ['recruitment'] },
            templateSets: { from: ['from_own'], greeting: [], pretext: [], ask: [] }, primedFor: { trusts: [] },
            requiredFactors: ['senderTrust'], advisoryFactors: [], replies: { landed: 'thanks' }, outcome: { setGlobal: { phish_gate_landed: true } } }]
    };
    const msg = { fromAccount: 'guest', to: 'gate@ledgerwell.example', targetId: 'gate', subject: 's1',
        headerFrom: { account: true }, templates: { from: 'from_own' }, slots: {}, attachment: null, link: null };
    const scene = (timing) => ({
        social: closed, config: { ...social().mailClient, checklistTiming: timing }, account: { id: 'guest', mailbox: 'guest', address: 'guest@workstation.example', displayName: 'Operator', spoofsFrom: true },
        accounts: [], mailState: { mailboxes: { guest: { messages: [], unread: 0 } }, jobs: [], metrics: {}, drafts: {} },
        globals: {}, checklistTiming: () => timing,
        scheduler: { addMessage: (b, r) => r, scheduleTextJob: (j) => jobs.push(j), setDraft() {} }, refresh() {}
    });
    try { bridge.performSend(scene('onSend'), msg); } catch (e) { /* the fake scene is minimal; only the job matters */ }
    const onSendJobs = jobs.length;
    jobs.length = 0;
    try { bridge.performSend(scene('withReply'), msg); } catch (e) { /* as above */ }
    assert.equal(onSendJobs, 0);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].text, '');
    assert.equal(jobs[0].outcomeGlobal, null);
});

test('a panel over the reader makes the toolbar and reader inert, and Tab-order controls come back on close', () => {
    clock = 0;
    const { scene, host } = open('onSend');
    const inert = () => [host.querySelector('.mail-toolbar'), host.querySelector('.mail-reader')].map((n) => n.hasAttribute('inert'));
    assert.deepEqual(inert(), [false, false]);
    scene.openContacts();
    assert.deepEqual(inert(), [true, true]);
    scene.closeContacts();
    assert.deepEqual(inert(), [false, false]);
    scene.openCompose();
    assert.deepEqual(inert(), [true, true]);
    scene.closeCompose();
    assert.deepEqual(inert(), [false, false]);
});

test('focus returns to the blank after a pick and to the template select after a change', () => {
    clock = 0;
    const { scene, host } = open('onSend');
    scene.openCompose();
    const c = scene.composer;
    const sel = host.querySelector('.mail-compose-template[data-part="pretext"]');
    assert.ok(sel);
    sel.focus();
    assert.equal(document.activeElement, sel);
    c.chooseTemplate('pretext', 'pretext_enquiry');
    const after = host.querySelector('.mail-compose-template[data-part="pretext"]');
    assert.notEqual(after, sel, 'the form was rebuilt');
    assert.equal(document.activeElement, after, 'focus put back on the rebuilt control');
});

test('Back returns focus to the row the player left; the details toggle keeps focus', () => {
    clock = 0;
    const { scene, host } = open('onSend');
    scene.reader.root.parentNode; // reader exists
    const rows = () => [...host.querySelectorAll('.mail-row')];
    // seed one inbox message
    scene.mailState.mailboxes.guest.messages.push({ id: 'a1', mailbox: 'guest', folder: 'inbox', from: { name: 'A', address: 'a@x.example' }, to: 'guest@workstation.example', subject: 'Hello', body: 'b', time: '09:00', gameTime: 1, read: true });
    scene.refresh();
    rows()[0].click();
    host.querySelector('.mail-details-toggle').click();
    assert.equal(document.activeElement, host.querySelector('.mail-details-toggle'));
    scene.reader.back();
    assert.equal(document.activeElement, rows()[0]);
});

test('every control in the composer is a native, tabbable element (no positive tabindex)', () => {
    clock = 0;
    const { scene, host } = open('onSend');
    scene.openCompose();
    for (const n of host.querySelectorAll('.mail-composer button, .mail-composer select, .mail-composer [tabindex]')) {
        assert.ok(n.tabIndex >= 0, `${n.className} is tabbable`);
        assert.ok(!n.hasAttribute('tabindex') || Number(n.getAttribute('tabindex')) <= 0);
    }
});

test('the empty notice stays in the layout tree so a later notice is announced', () => {
    assert.match(css, /\.mail-notice:empty\s*\{[^}]*height: 0/);
    assert.doesNotMatch(css, /\.mail-notice:empty\s*\{\s*display:\s*none/);
});

test('the stylesheet has the narrow layout at 767px, 44px targets and reduced motion', () => {
    assert.match(css, /@media \(max-width: 767px\)/);
    assert.match(css, /\.mail-reader\.has-selection \.mail-list-pane\s*\{\s*display:\s*none/);
    assert.match(css, /\.mail-picker \{ align-items: flex-end; \}/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /animation: none !important/);
    assert.match(css, /min-height: 44px/);
    assert.match(css, /focus-visible/);
});
