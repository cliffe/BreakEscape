// Mail composer: template parts, the blank picker fed from held evidence, and
// the pre-send gate (SE design 01 §2 "Compose", N10; contract 00 §10; 04 N11
// runtime; packet P1-E2). The real composer, the rules engine and the mail
// client run in jsdom.
// Run with: bundle exec node --test test/js/social-mail-composer.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'social-mail-composer-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['systems/phish-rules.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
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
const grant = (...ids) => Object.fromEntries(ids.map((id) => [`se_intel_${id}`, true]));

// A standalone composer over the fixture, with the contacts the globals reveal.
function makeComposer(globals = {}, over = {}) {
    const host = document.getElementById('host');
    host.textContent = '';
    const fx = fixture();
    const sends = [];
    const contacts = over.contacts || data.visibleContacts(fx.mailClient, (over.account || GUEST).id, globals);
    const composer = new MailComposer(host, {
        people: fx.people, templates: fx.templates, phishTargets: fx.phishTargets,
        intelFacts: fx.intelFacts, payloadKit: fx.mailClient.payloadKit,
        account: over.account || GUEST, contacts, globals,
        pushLayer: () => () => {},
        onSend: (m) => sends.push(m),
        ...over
    });
    return { composer, host, sends, fx };
}
const entriesFor = (fx, globals) => heldProvides(heldFactIds(fx.intelFacts, globals), fx.intelFacts);
const optionValues = (host) => [...host.querySelectorAll('.mail-picker-option')].map((li) => li.dataset.value);

test('held facts come only from the true se_intel_* globals', () => {
    const fx = fixture();
    assert.deepEqual(heldFactIds(fx.intelFacts, grant('pierce_role')), ['pierce_role']);
    assert.deepEqual(heldFactIds(fx.intelFacts, { se_intel_pierce_role: false }), []);
    assert.deepEqual(heldFactIds(fx.intelFacts, {}), []);
});

test('a blank offers only the values held facts provide, with the type and about filter', () => {
    const fx = fixture();
    const nameSlot = { id: 'name', type: 'name', about: 'recipient' };
    // Only pierce_role held: her recipient forms, and not the Q3-note "Mel" (pierce_short)
    let opts = optionsForSlot(nameSlot, { entries: entriesFor(fx, grant('pierce_role')), people: fx.people });
    assert.deepEqual(opts.map((o) => o.value), ['pierce_first', 'pierce_formal', 'pierce_full']);
    // A sender slot never shows a recipient entry: a different about is filtered out
    const senderSlot = { id: 'sender_name', type: 'name', about: 'sender' };
    opts = optionsForSlot(senderSlot, { entries: entriesFor(fx, grant('pierce_role')), people: fx.people });
    assert.deepEqual(opts, []);
});

test('the picker includes a held stale value and never an unheld one', () => {
    const fx = fixture();
    const senderSlot = { id: 'sender_name', type: 'name', about: 'sender' };
    // The trusted sender (distinctive) and the namesake decoy (stale) are both held
    const opts = optionsForSlot(senderSlot,
        { entries: entriesFor(fx, grant('pierce_trusts_jed', 'baker_namesake')), people: fx.people });
    assert.deepEqual(opts.map((o) => [o.value, o.kind]),
        [['baker_full', 'distinctive'], ['leeds_baker_full', 'stale']]);
    // The portal sender is never offered: its fact is not held
    assert.equal(opts.some((o) => o.value === 'portal_full'), false);
});

test('an address blank builds <person>_address from a held sender name plus the pattern fact', () => {
    const fx = fixture();
    const addrSlot = { id: 'sender_address', type: 'address' };
    // pattern + the trusted sender -> baker_address; the stale namesake -> leeds_baker_address
    let opts = optionsForSlot(addrSlot,
        { entries: entriesFor(fx, grant('email_pattern', 'pierce_trusts_jed', 'baker_namesake')), people: fx.people });
    assert.deepEqual(opts.map((o) => [o.value, o.label]),
        [['baker_address', 'j.baker@ledgerwell.example'], ['leeds_baker_address', 'j.baker@leedsplumbing.example']]);
    // No pattern fact: a rule is not a value, so nothing is built
    opts = optionsForSlot(addrSlot, { entries: entriesFor(fx, grant('pierce_trusts_jed')), people: fx.people });
    assert.deepEqual(opts, []);
    // Pattern but no sender name: still nothing (the rule needs a person)
    opts = optionsForSlot(addrSlot, { entries: entriesFor(fx, grant('email_pattern')), people: fx.people });
    assert.deepEqual(opts, []);
});

test('Hampshire opens with the pretext unchosen; Send waits until one is picked', () => {
    const { composer, host, sends } = makeComposer(grant('hampshire_careers'),
        { contacts: [{ id: 'hampshire', name: 'Chris Hampshire', role: 'Careers', addresses: ['careers@ledgerwell.example'], targetId: 'hampshire' }] });
    let s = composer.getState();
    assert.equal(s.targetId, 'hampshire');
    assert.deepEqual(s.blanks, []);                       // no blanks at all
    assert.equal(host.querySelector('.mail-blank'), null); // nothing to pick
    // The pretext is a deliberate choice, so Send is disabled until the player picks one (P1-T).
    assert.equal(s.sendEnabled, false);
    assert.equal(s.gateReason, 'pretext-unchosen');
    assert.equal(host.querySelector('.mail-compose-send').disabled, true);
    composer.chooseTemplate('pretext', 'pretext_apply');
    s = composer.getState();
    assert.equal(s.sendEnabled, true);
    assert.equal(host.querySelector('.mail-compose-send').disabled, false);
    host.querySelector('.mail-compose-send').click();
    assert.equal(sends.length, 1);
    assert.equal(sends[0].targetId, 'hampshire');
    assert.deepEqual(sends[0].headerFrom, { account: true }); // from_own is forced
    assert.equal(sends[0].templates.from, 'from_own');
    assert.equal(sends[0].templates.pretext, 'pretext_apply');
});

test('with no evidence held, Send is disabled and the neutral line shows, naming no fact', () => {
    const { composer, host } = makeComposer({},
        { contacts: [{ id: 'pierce', name: 'Melanie Pierce', role: 'Finance', addresses: ['m.pierce@ledgerwell.example'], targetId: 'pierce' }] });
    // Pick a blank-free pretext so the gate reaches the empty greeting-name blank, not the
    // pretext-unchosen gate (P1-T: the pretext now opens unchosen).
    composer.chooseTemplate('pretext', 'pretext_invoice');
    const s = composer.getState();
    assert.equal(s.targetId, 'pierce');
    assert.equal(s.sendEnabled, false);
    assert.equal(s.gateReason, 'empty-blank');
    assert.equal(s.gateLine, PRE_SEND_GATE_LINE);
    // The line beside the empty blank names nothing about the missing fact or value
    const gate = host.querySelector('.mail-blank-gate');
    assert.equal(gate.textContent, PRE_SEND_GATE_LINE);
    assert.doesNotMatch(s.gateLine, /pierce|melanie|balance|jed|friday|pattern/i);
    assert.equal(host.querySelector('.mail-compose-send').disabled, true);
});

test('after the fact is granted the picker offers it, and choosing it enables Send', () => {
    const { composer, host, sends } = makeComposer(grant('pierce_role'),
        { contacts: [{ id: 'pierce', name: 'Melanie Pierce', role: 'Finance', addresses: ['m.pierce@ledgerwell.example'], targetId: 'pierce' }] });
    // Isolate a single blank: a blank-free From, pretext and ask, so only the greeting name remains
    composer.chooseTemplate('from', 'from_own');
    composer.chooseTemplate('pretext', 'pretext_invoice');
    composer.chooseTemplate('ask', 'ask_confirm');
    composer.chooseTemplate('greeting', 'greet_named');
    let s = composer.getState();
    assert.deepEqual(s.blanks.map((b) => b.slot), ['name']);
    // Options exist but none chosen: not the neutral line, the "choose" line
    assert.equal(s.sendEnabled, false);
    assert.equal(s.gateReason, 'unchosen');
    assert.notEqual(s.gateLine, PRE_SEND_GATE_LINE);

    host.querySelector('.mail-blank[data-slot="name"]').click();
    assert.deepEqual(optionValues(host), ['pierce_first', 'pierce_formal', 'pierce_full']);
    host.querySelector('.mail-picker-option[data-value="pierce_first"]').click();

    s = composer.getState();
    assert.equal(s.slots.name, 'pierce_first');
    assert.equal(s.sendEnabled, true);
    assert.equal(host.querySelector('.mail-compose-send').disabled, false);
    host.querySelector('.mail-compose-send').click();
    assert.equal(sends.length, 1);
    assert.equal(sends[0].slots.name, 'pierce_first');
    assert.equal(sends[0].subject, 's_quick');
});

test('an account that cannot spoof forces the From to itself (no claimed-From blanks)', () => {
    const freemail = { id: 'freemail', address: 'tarnside.test@freemail.example', displayName: 'T. Test', spoofsFrom: false, person: null, mailbox: 'freemail' };
    const { composer, host } = makeComposer(grant('pierce_role', 'pierce_trusts_jed', 'email_pattern'),
        { account: freemail, contacts: [{ id: 'pierce', name: 'Melanie Pierce', addresses: ['m.pierce@ledgerwell.example'], targetId: 'pierce' }] });
    assert.equal(composer.getState().templates.from, 'from_own');
    assert.ok(host.querySelector('.mail-compose-from-own'));
    // No sender blanks are offered from a non-spoofing account
    assert.equal(host.querySelector('.mail-blank[data-slot="sender_name"]'), null);
    assert.deepEqual(composer.buildMessage().headerFrom, { account: true });
});

test('a single From template with blanks is still drawn, so the gate and the screen agree (F-1)', () => {
    const fx = fixture();
    const pierce = fx.phishTargets.find((t) => t.id === 'pierce');
    // A spoofing account whose target offers one From wording, and that wording has blanks.
    const solo = { ...pierce, templateSets: { ...pierce.templateSets, from: ['from_named'] } };
    const { composer, host } = makeComposer(grant('pierce_role', 'pierce_trusts_jed', 'email_pattern'),
        { phishTargets: [solo],
          contacts: [{ id: 'pierce', name: 'Melanie Pierce', addresses: ['m.pierce@ledgerwell.example'], targetId: 'pierce' }] });
    // The "own account" shortcut must not hide a From template that has blanks.
    assert.equal(composer.templateSet('from').length, 1);
    assert.equal(composer._fromIsOwn(), false);
    assert.equal(host.querySelector('.mail-compose-from-own'), null);
    assert.ok(host.querySelector('.mail-blank[data-slot="sender_name"]'), 'sender_name blank drawn');
    assert.ok(host.querySelector('.mail-blank[data-slot="sender_address"]'), 'sender_address blank drawn');
    // P7 invariant: every blank the gate counts toward Send has a button the player can reach.
    const s = composer.getState();
    assert.ok(s.blanks.some((b) => b.slot === 'sender_name') && s.blanks.some((b) => b.slot === 'sender_address'));
    for (const b of s.blanks) {
        assert.ok(host.querySelector(`.mail-blank[data-slot="${b.slot}"]`), `blank ${b.slot} drawn`);
    }
});

test('a single blank-free From wording still hides the From row (the account row carries it)', () => {
    // hampshire's only From wording is from_own (no slots): the shortcut still applies.
    const { composer, host } = makeComposer(grant('hampshire_careers'),
        { contacts: [{ id: 'hampshire', name: 'Chris Hampshire', role: 'Careers', addresses: ['careers@ledgerwell.example'], targetId: 'hampshire' }] });
    assert.equal(composer.templateSet('from').length, 1);
    assert.equal(composer._fromIsOwn(), true);
    assert.ok(host.querySelector('.mail-compose-from-own'));
    assert.equal(host.querySelector('.mail-blank[data-slot="sender_name"]'), null);
    assert.deepEqual(composer.buildMessage().headerFrom, { account: true });
});

test('Esc on the picker is a layer close: the composer pops it first', () => {
    let popped = 0;
    const { composer, host } = makeComposer(grant('pierce_trusts_jed', 'baker_namesake', 'email_pattern'),
        { contacts: [{ id: 'pierce', name: 'Melanie Pierce', addresses: ['m.pierce@ledgerwell.example'], targetId: 'pierce' }],
          pushLayer: (close) => { const c = close; return () => { popped += 1; }; } });
    composer.chooseTemplate('from', 'from_named');
    host.querySelector('.mail-blank[data-slot="sender_name"]').click();
    assert.equal(composer.pickerOpen, true);
    assert.deepEqual(optionValues(host), ['baker_full', 'leeds_baker_full']); // distinctive then stale
    composer._closePicker(true);
    assert.equal(composer.pickerOpen, false);
    assert.equal(popped, 1);
});

test('a restored draft keeps its recipient and form; the default contact does not overwrite it (D3)', () => {
    const { composer } = makeComposer(grant('hampshire_careers', 'pierce_role'), {
        draft: { contactId: 'pierce', to: 'm.pierce@ledgerwell.example', subject: 's_q3',
                 templates: { pretext: 'pretext_invoice' }, slots: {}, attachment: null, link: null }
    });
    // hampshire is the first contact with a target, but the restored draft wins.
    assert.equal(composer.contactId, 'pierce');
    assert.equal(composer.choice.pretext, 'pretext_invoice');
    assert.equal(composer.toAddress, 'm.pierce@ledgerwell.example');
});

test('a draft with no contactId recovers its recipient from `to` (pre-fix drafts) (D3)', () => {
    const { composer } = makeComposer(grant('hampshire_careers', 'pierce_role'), {
        draft: { to: 'm.pierce@ledgerwell.example', templates: { pretext: 'pretext_invoice' }, slots: {} }
    });
    assert.equal(composer.contactId, 'pierce', 'derived from the To address');
    assert.equal(composer.choice.pretext, 'pretext_invoice', 'form kept, not reset to the default contact');
});

test('the mail client Compose button opens the composer over the reader', () => {
    const host = document.getElementById('host');
    host.textContent = '';
    const fx = fixture();
    window.gameState = { globalVariables: grant('hampshire_careers') };
    const scene = new MailClientMinigame(host, {
        social: fx, mailClient: fx.mailClient, accountIds: ['guest'],
        mailState: data.emptyMailState(), globals: window.gameState.globalVariables
    });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() { scene.cleanup(); } };
    scene.init();
    scene.start();
    assert.equal(host.querySelector('.mail-composer'), null);
    host.querySelector('.mail-compose-btn').click();
    assert.ok(host.querySelector('.mail-composer'));
    assert.ok(scene.composer);
    assert.equal(scene.composer.getState().targetId, 'hampshire');
    // Esc closes the compose layer before the overlay
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(host.querySelector('.mail-composer'), null);
    assert.equal(scene.gameState.isActive, true);
    scene.cleanup();
});

// ── P6-M: A4 filled sentences, and the live red-flag meter ───────────────────

// A composer over the fixture for a chosen contact/target.
function composerFor(targetId, name, globals = {}, over = {}) {
    const host = document.getElementById('host');
    host.textContent = '';
    const fx = over.fx || fixture();
    const contacts = [{ id: targetId, name, role: 'Role', addresses: [`${targetId}@ledgerwell.example`], targetId }];
    const composer = new MailComposer(host, {
        people: fx.people, templates: fx.templates, phishTargets: fx.phishTargets,
        intelFacts: fx.intelFacts, payloadKit: fx.mailClient.payloadKit,
        account: GUEST, contacts, globals, pushLayer: () => () => {}, onSend: () => {}, ...over
    });
    return { composer, host, fx };
}

test('A4: part selects show the filled sentence, never a raw {placeholder}', () => {
    const { composer, host } = composerFor('pierce', 'Mel Pierce', grant('pierce_role'));
    const pretextSel = host.querySelector('.mail-compose-template[data-part="pretext"]');
    const pretextText = [...pretextSel.options].map((o) => o.textContent).join(' | ');
    assert.doesNotMatch(pretextText, /[{}]/, 'no raw braces in the pretext options');
    assert.match(pretextText, /\[document\]/, 'an unfilled blank reads as its label in brackets');

    // Greeting defaults to greet_named; filling the recipient name shows it in the option.
    composer.setSlot('name', 'pierce_first');
    const greetSel = host.querySelector('.mail-compose-template[data-part="greeting"]');
    const named = [...greetSel.options].find((o) => o.value === 'greet_named');
    assert.doesNotMatch(named.textContent, /[{}]/);
    assert.match(named.textContent, /^Hi .+,$/, 'the greeting option fills the chosen name');
    assert.doesNotMatch(named.textContent, /\[name\]/);
});

test('red-flag meter: on by meterDefault, lists the draft red flags and clears them as it improves', () => {
    const { composer, host } = composerFor('hampshire', 'Chris Hampshire', grant('hampshire_careers'), { meterDefault: true });
    composer.chooseTemplate('pretext', 'pretext_enquiry'); // wrong pretext, no attachment
    let m = composer.getState().redFlagMeter;
    assert.equal(m.on, true);
    assert.equal(m.clean, false);
    assert.ok(m.flags.length >= 2, 'the wrong pretext and the missing attachment are both flagged');
    const panel = host.querySelector('.mail-redflag-meter');
    assert.ok(panel, 'the meter panel is drawn');
    assert.equal(host.querySelectorAll('.mail-redflag-item').length, m.flags.length);
    assert.equal(panel.dataset.count, String(m.flags.length));

    // The right pretext plus the CV clear every flag.
    composer.chooseTemplate('pretext', 'pretext_apply');
    composer.setAttachment('kit_cv');
    m = composer.getState().redFlagMeter;
    assert.equal(m.clean, true);
    assert.equal(m.flags.length, 0);
    assert.equal(host.querySelector('.mail-redflag-meter').dataset.count, '0');
    assert.ok(host.querySelector('.mail-redflag-clean'), 'a clean draft shows the reassuring line');
    assert.equal(host.querySelector('.mail-redflag-item'), null);
});

test('red-flag meter: off when neither the target nor the default turns it on, and the per-target flag overrides the default', () => {
    // Default off, no per-target flag: no meter.
    const a = composerFor('hampshire', 'Chris Hampshire', grant('hampshire_careers'), { meterDefault: false });
    a.composer.chooseTemplate('pretext', 'pretext_enquiry');
    assert.equal(a.composer.getState().redFlagMeter.on, false);
    assert.equal(a.host.querySelector('.mail-redflag-meter'), null);

    // Default on, but the target sets redFlagMeter:false -> off (the per-target flag wins).
    const fx = fixture();
    fx.phishTargets.find((t) => t.id === 'hampshire').redFlagMeter = false;
    const b = composerFor('hampshire', 'Chris Hampshire', grant('hampshire_careers'), { meterDefault: true, fx });
    assert.equal(b.composer.getState().redFlagMeter.on, false);
    assert.equal(b.host.querySelector('.mail-redflag-meter'), null);
});

// ── P1 F1/m5: the forged-From line in the meter, and the calm default (E6 F3) ─

// pierce trusts baker and can be spoofed (from_named): the forged-From scenario.
const forgeable = () => grant('pierce_trusts_jed', 'email_pattern', 'pierce_role');

test('red-flag meter: the forged-From warning is held back while the sender is a placeholder', () => {
    const { composer } = composerFor('pierce', 'Mel Pierce', forgeable(), { meterDefault: true, accounts: [GUEST] });
    // The From defaults to from_named with its name/address blanks unfilled.
    assert.equal(composer.getState().templates.from, 'from_named');
    const m = composer.getState().redFlagMeter;
    assert.equal(m.on, true);
    assert.ok(m.flags.length >= 1, 'other gaps (pretext, attachment) still flag');
    assert.ok(!m.flags.some((f) => /Sender address doesn't match/.test(f)),
        'the senderTrust red flag is not shown before a sender is picked');
    assert.equal(m.advice.length, 0, 'no advice until a trusted sender is forged');
});

test('red-flag meter: a forged trusted sender shows as advice, not a counted fault', () => {
    const { composer, host } = composerFor('pierce', 'Mel Pierce', forgeable(), { meterDefault: true, accounts: [GUEST] });
    composer.setSlot('sender_name', 'baker_full');
    composer.setSlot('sender_address', 'baker_address');
    const m = composer.getState().redFlagMeter;
    assert.equal(m.advice.length, 1, 'the forged From is surfaced as advice');
    assert.match(m.advice[0], /forged/i);
    assert.equal(m.clean, false, 'a forged From means the meter does not read as all-clear');
    assert.ok(!m.flags.includes(m.advice[0]), 'the advice is not counted among the red flags');
    const panel = host.querySelector('.mail-redflag-meter');
    assert.equal(panel.dataset.count, String(m.flags.length), 'the count badge excludes advice');
    assert.equal(host.querySelectorAll('.mail-redflag-advice').length, 1, 'the advice renders as a note');
    assert.ok(!m.flags.some((f) => /Sender address doesn't match/.test(f)),
        'a trusted forged From raises no senderTrust fault');
});

test('a defaulted part takes the calmest wording, never a pre-selected urgent line (E6 F3)', () => {
    const fx = fixture();
    // Put the urgent ask first in the set; the calm one second.
    fx.templates.ask_open_attached.urgency = 'high';
    fx.templates.ask_confirm.urgency = 'low';
    fx.phishTargets.find((t) => t.id === 'pierce').templateSets.ask = ['ask_open_attached', 'ask_confirm'];
    const { composer } = composerFor('pierce', 'Mel Pierce', grant('pierce_role'), { fx });
    assert.equal(composer.getState().templates.ask, 'ask_confirm',
        'the default is the low-urgency ask, not the first (urgent) one');
});

test('a defaulted part with no authored urgency keeps the first option', () => {
    const fx = fixture();
    // greeting templates carry no urgency: the default stays the first listed.
    const { composer } = composerFor('pierce', 'Mel Pierce', grant('pierce_role'), { fx });
    assert.equal(composer.getState().templates.greeting,
        fx.phishTargets.find((t) => t.id === 'pierce').templateSets.greeting[0]);
});
