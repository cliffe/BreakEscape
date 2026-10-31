// Mail composer: changing "Send as" keeps the draft parts the new account still offers and
// names the ones it cleared (lab R19 F19-1). The real composer runs in jsdom.
// Run with: bundle exec node --test test/js/social-mail-send-as-carry.test.mjs
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
const fixture = () => JSON.parse(readFileSync(join(here, 'fixtures/social/mail/composer-scenario.json'), 'utf8'));

// The real files, copied with their relative layout into an ESM folder.
const dir = mkdtempSync(join(tmpdir(), 'social-mail-sendas-carry-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['systems/phish-rules.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'systems/mail-ink.js', 'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.error = () => {};

const mod = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-composer.js')));
const { MailComposer, optionsForSlot, heldFactIds, heldProvides, PRE_SEND_GATE_LINE } = mod;
const data = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-data.js')));
const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));

const GUEST = { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', spoofsFrom: true, person: null, mailbox: 'guest' };
const FREE = { id: 'freemail', address: 'tarnside.test@freemail.example', displayName: 'T. Test', spoofsFrom: false, person: null, mailbox: 'freemail' };
const globals = { se_intel_pierce_role: true };

function make(account, over = {}) {
    const host = document.getElementById('host');
    host.textContent = '';
    const fx = fixture();
    return new MailComposer(host, {
        people: fx.people, templates: fx.templates, phishTargets: fx.phishTargets,
        intelFacts: fx.intelFacts, payloadKit: fx.mailClient.payloadKit,
        account, accounts: [GUEST, FREE],
        contacts: data.visibleContacts(fx.mailClient, account.id, globals), globals,
        pushLayer: () => () => {}, ...over
    });
}

test('Send as: recipient, subject, greeting, pretext and ask carry over; an unavailable From is named', () => {
    const a = make(GUEST);
    a.selectContact('pierce', false);
    a.choice = { from: 'from_named', greeting: 'greet_generic', pretext: 'pretext_sheet', ask: 'ask_confirm' };
    a._subjectId = 's_review';
    const prev = a.draft();
    const b = make(FREE, { carryDraft: prev });
    const d = b.draft();
    assert.equal(d.contactId, 'pierce');
    assert.equal(d.to, 'm.pierce@ledgerwell.example');
    assert.equal(d.subject, 's_review');
    assert.equal(d.templates.greeting, 'greet_generic');
    assert.equal(d.templates.pretext, 'pretext_sheet');
    assert.equal(d.templates.ask, 'ask_confirm');
    assert.equal(d.templates.from, 'from_own');   // this account cannot send as someone else
    assert.match(b.carryNotice, /^Cleared for this account: From\.$/);
    assert.ok(b.root.querySelector('.mail-compose-carry'));
    // The next edit drops the notice
    b.setSubject('s_quick');
    assert.equal(b.root.querySelector('.mail-compose-carry'), null);
});

test('Send as: a recipient the new account does not list is cleared and named', () => {
    const a = make(GUEST);
    a.selectContact('pierce', false);
    a.choice.pretext = 'pretext_sheet';
    const prev = a.draft();
    const fx = fixture();
    const only = data.visibleContacts(fx.mailClient, 'freemail', globals).filter((c) => c.id !== 'pierce');
    const b = make(FREE, { carryDraft: prev, contacts: only });
    assert.notEqual(b.draft().contactId, 'pierce');
    assert.match(b.carryNotice, /^Cleared for this account: .*To/);
});

test('Send as: with no differences nothing is reported', () => {
    const a = make(GUEST);
    a.selectContact('pierce', false);
    a.choice = { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_sheet', ask: 'ask_confirm' };
    const b = make(FREE, { carryDraft: a.draft() });
    assert.equal(b.carryNotice, '');
    assert.equal(b.draft().templates.pretext, 'pretext_sheet');
});

test('Send as: the carried draft wins over an older unsent draft the new account holds (lab R20 F20-3)', () => {
    const a = make(GUEST);
    a.selectContact('pierce', false);
    const b = make(FREE, { carryDraft: a.draft(), draft: { contactId: 'hampshire', to: 'careers@ledgerwell.example', templates: {}, slots: {} } });
    assert.equal(b.draft().contactId, 'pierce');
    assert.equal(b.draft().to, 'm.pierce@ledgerwell.example');
});

test('Send as: the composer is not "edited" until something changes, and is after a carry', () => {
    const a = make(GUEST);
    assert.equal(a.edited, false);
    a.selectContact('pierce', true);
    assert.equal(a.edited, true);
    const b = make(FREE, { carryDraft: a.draft() });
    assert.equal(b.edited, true);
});
