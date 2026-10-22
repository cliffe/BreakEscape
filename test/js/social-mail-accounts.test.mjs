// Mail client accounts (SE design 01 N11; contract 00 §10a; packet P1-L): own-account
// resolution, unlockedBy, the switcher, Create account, Send as, burned_<id>, unread per
// mailbox, and a character contact's headless record id.
// Run with: bundle exec node --test test/js/social-mail-accounts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// Copy the real client and everything it imports (relative imports, followed) into an ESM folder.
const dir = mkdtempSync(join(tmpdir(), 'social-mail-accounts-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const copied = new Set();
function copy(rel) {
    if (copied.has(rel)) return;
    copied.add(rel);
    const src = readFileSync(join(js, rel), 'utf8');
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), src);
    for (const m of src.matchAll(/(?:import|export)[^'"]*?from\s+'(\.[^']+)'/g)) {
        copy(resolve('/', dirname(rel), m[1]).slice(1));
    }
}
copy('minigames/mail-client/mail-client-minigame.js');
copy('minigames/mail-client/mail-notification.js');

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};

const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const { notifyNewMail } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-notification.js')));
const data = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-data.js')));

const config = () => ({
    accounts: [
        { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true },
        { id: 'freemail', kind: 'created', person: null, unlockedBy: 'acct_freemail', mailbox: 'freemail', spoofsFrom: false,
          createMenu: [ { id: 'tt1', address: 'tarnside.test@freemail.example', displayName: 'T. Test' },
                        { id: 'nt2', address: 'n.assurance@freemail.example', displayName: 'N. Assurance' } ] },
        { id: 'jed_pc', address: 'j.baker@ledgerwell.example', displayName: 'Jed Baker', kind: 'found', person: 'baker',
          unlockedBy: 'acct_jed_pc', mailbox: 'jed', spoofsFrom: false }
    ],
    mailboxes: [ { id: 'guest' }, { id: 'freemail' }, { id: 'jed' } ],
    contacts: [
        { id: 'hampshire', person: 'hampshire', name: 'Chris Hampshire', addresses: ['careers@ledgerwell.example'], role: 'Careers' },
        { id: 'pierce', person: 'pierce', name: 'Melanie Pierce', addresses: ['m.pierce@ledgerwell.example'], role: 'Finance', character: 'pierce' },
        { id: 'ghost', person: 'ghost', name: 'No Record', addresses: ['g@ledgerwell.example'], character: 'ghost' }
    ],
    seededMessages: [
        { id: 'g1', mailbox: 'guest', from: { name: 'IT', address: 'it@ledgerwell.example' }, to: 'guest@workstation.example',
          subject: 'One', body: 'a', time: '08:00', unread: true },
        { id: 'g2', mailbox: 'guest', from: { name: 'IT', address: 'it@ledgerwell.example' }, to: 'guest@workstation.example',
          subject: 'Two', body: 'b', time: '08:10', unread: true },
        { id: 'f1', mailbox: 'freemail', from: { name: 'Freemail', address: 'welcome@freemail.example' }, to: 'x',
          subject: 'Welcome', body: 'c', time: '09:00', unread: true },
        { id: 'j1', mailbox: 'jed', from: { name: 'Pat', address: 'pat@ledgerwell.example' }, to: 'j.baker@ledgerwell.example',
          subject: 'Lunch', body: 'd', time: '10:00', unread: true }
    ]
});
const social = () => ({
    characters: {
        pierce: { channels: { email: 'pierce_mail' }, emailRecord: { displayName: 'Melanie Pierce' } },
        ghost: { channels: { email: 'ghost_mail' } }
    }
});

let current = null;
function open(params = {}, globals = {}) {
    current?.cleanup();
    const host = document.getElementById('host');
    host.textContent = '';
    window.gameState = { globalVariables: globals };
    window.writes = [];
    const scene = new MailClientMinigame(host, {
        mailClient: config(), social: social(), mailState: data.emptyMailState(),
        accountIds: ['guest', 'freemail', 'jed_pc'], ...params
    });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() { scene.cleanup(); } };
    scene.init();
    scene.start();
    current = scene;
    return { scene, host, globals: window.gameState.globalVariables };
}
const press = (key) => document.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const pick = (select, value) => { select.value = value; select.dispatchEvent(new window.Event('change', { bubbles: true })); };
const mail = (scene) => scene.getTestState().mail;

test('resolution: a locked account is not listed until its global is true; burned follows burned_<id>', () => {
    const cfg = config();
    assert.deepEqual(data.resolveAccounts(cfg, ['guest', 'freemail', 'jed_pc'], {}).map((a) => a.id), ['guest']);
    const got = data.resolveAccounts(cfg, ['guest', 'jed_pc'], { acct_jed_pc: true, burned_guest: true });
    assert.deepEqual(got.map((a) => [a.id, a.kind, a.domain, a.burned]), [
        ['guest', 'given', 'workstation.example', true], ['jed_pc', 'found', 'ledgerwell.example', false]]);
    // a created account whose choice id is not on the menu stays out
    assert.deepEqual(data.resolveAccounts(cfg, ['freemail'], { acct_freemail: true, acct_freemail_choice: 'nope' }), []);
});

test('pendingCreations and createAccountWrites', () => {
    const cfg = config();
    const p = data.pendingCreations(cfg, ['guest', 'freemail', 'jed_pc'], {});
    assert.deepEqual(p.map((c) => [c.id, c.createMenu.map((m) => m.id)]), [['freemail', ['tt1', 'nt2']]]);
    assert.deepEqual(data.pendingCreations(cfg, ['guest'], {}), []);           // the device does not offer it
    assert.deepEqual(data.pendingCreations(cfg, ['freemail'], { acct_freemail: true }), []); // already made
    assert.deepEqual(data.createAccountWrites(cfg, 'freemail', 'nt2', {}),
        [['acct_freemail_choice', 'nt2'], ['acct_freemail', true]]);
    assert.equal(data.createAccountWrites(cfg, 'freemail', 'bogus', {}), null);
    assert.equal(data.createAccountWrites(cfg, 'guest', 'tt1', {}), null);
    // an unlockedBy other than acct_<id> gates the offer
    const gated = config();
    gated.accounts[1].unlockedBy = 'met_register';
    assert.deepEqual(data.pendingCreations(gated, ['freemail'], {}), []);
    assert.equal(data.pendingCreations(gated, ['freemail'], { met_register: true }).length, 1);
});

test('contactRecordId: a character with an emailRecord resolves to its channels.email id', () => {
    const s = social();
    const cs = config().contacts;
    assert.equal(data.contactRecordId(s, cs[1]), 'pierce_mail');
    assert.equal(data.contactRecordId(s, cs[2]), null);   // no emailRecord: no headless record
    assert.equal(data.contactRecordId(s, cs[0]), null);   // no character
    assert.equal(data.contactRecordId({}, cs[1]), null);
});

test('a lone account shows its label and no switcher', () => {
    const { scene, host } = open({ accountIds: ['guest'] });
    assert.equal(mail(scene).switcher.visible, false);
    assert.match(host.querySelector('.mail-account-label').textContent, /Operator <guest@workstation\.example>/);
});

test('the switcher lists accounts with unread per mailbox and a Create account entry', () => {
    const { scene, host } = open({}, { acct_jed_pc: true });
    const m = mail(scene);
    assert.equal(m.switcher.visible, true);
    assert.deepEqual(m.switcher.options.map((o) => o.value), ['guest', 'jed_pc', 'create:freemail']);
    assert.match(m.switcher.options[0].text, /Operator <guest@workstation\.example> \(2 unread\)/);
    assert.match(m.switcher.options[1].text, /Jed Baker .* \(1 unread\)/);
    assert.equal(m.switcher.options[2].text, 'Create account');
    assert.deepEqual(m.unreadByAccount, { guest: 2, jed_pc: 1 });
    assert.equal(host.querySelector('.mail-account-label').hidden, true);
});

test('switching account shows that mailbox, resets to Inbox and keeps counts per mailbox', () => {
    const { scene, host } = open({}, { acct_jed_pc: true });
    pick(host.querySelector('.mail-account-select'), 'jed_pc');
    let m = mail(scene);
    assert.equal(m.account.id, 'jed_pc');
    assert.equal(m.account.mailbox, 'jed');
    assert.deepEqual(m.messages.map((x) => x.id), ['j1']);
    assert.equal(m.unread, 1);
    host.querySelector('.mail-row[data-id="j1"]').click();
    m = mail(scene);
    assert.equal(m.unread, 0);
    assert.deepEqual(m.unreadByAccount, { guest: 2, jed_pc: 0 });
    assert.doesNotMatch(m.switcher.options[1].text, /unread/);
    pick(host.querySelector('.mail-account-select'), 'guest');
    assert.equal(mail(scene).account.id, 'guest');
    assert.equal(mail(scene).unread, 2);
});

test('mail arriving for another account of the device raises its count and does not bark', () => {
    const { scene } = open({}, { acct_jed_pc: true });
    const rec = { id: 'j2', mailbox: 'jed', folder: 'inbox', from: { name: 'Pat', address: 'pat@ledgerwell.example' },
        to: 'j', subject: 'Later', body: 'x', time: '11:00', gameTime: 5, read: false };
    window.showNotification = () => { throw new Error('should not toast'); };
    assert.equal(notifyNewMail(rec), 'appended');
    delete window.showNotification;
    assert.equal(mail(scene).account.id, 'guest');
    assert.equal(mail(scene).unreadByAccount.jed_pc, 2);
    assert.match(mail(scene).notice, /New message for j\.baker@ledgerwell\.example/);
    // a mailbox the device does not hold still goes to the toast path
    let toast = null;
    window.showNotification = (t) => { toast = t; };
    assert.equal(notifyNewMail({ ...rec, id: 'x', mailbox: 'elsewhere' }), 'notified');
    assert.match(toast, /New mail from Pat/);
    delete window.showNotification;
});

test('Create account: panel lists the menu, Confirm waits for a pick, then both globals are written and the account opens', () => {
    const events = [];
    const { scene, host, globals } = open({ accountIds: ['guest', 'freemail'], onAccountCreated: (id, c) => events.push([id, c]) });
    pick(host.querySelector('.mail-account-select'), 'create:freemail');
    let m = mail(scene);
    assert.equal(m.createOpen, true);
    assert.deepEqual(m.createMenu, [{ id: 'tt1', checked: false }, { id: 'nt2', checked: false }]);
    assert.equal(m.account.id, 'guest'); // the switcher snaps back to the current account
    const panel = host.querySelector('.mail-create-panel');
    assert.match(panel.textContent, /T\. Test/);
    assert.match(panel.textContent, /<tarnside\.test@freemail\.example>/);
    const confirm = panel.querySelector('.mail-create-confirm');
    // Confirm is enabled even before a pick so an empty press gives feedback rather
    // than being a dead button (lab R1 F11); it writes nothing until an address is chosen.
    assert.equal(confirm.disabled, false);
    confirm.click();
    assert.equal(globals.acct_freemail, undefined);

    const radio = panel.querySelectorAll('input')[1];
    radio.checked = true;
    radio.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.equal(confirm.disabled, false);
    confirm.click();

    assert.equal(globals.acct_freemail_choice, 'nt2');
    assert.equal(globals.acct_freemail, true);
    m = mail(scene);
    assert.equal(m.createOpen, false);
    assert.equal(host.querySelector('.mail-create-panel'), null);
    assert.equal(m.account.id, 'freemail');
    assert.equal(m.account.address, 'n.assurance@freemail.example');
    assert.equal(m.account.displayName, 'N. Assurance');
    assert.deepEqual(m.creatable, []);
    assert.deepEqual(m.switcher.options.map((o) => o.value), ['guest', 'freemail']);
    assert.match(m.notice, /Account created: n\.assurance@freemail\.example/);
    assert.deepEqual(events, [['freemail', 'nt2']]);
    assert.deepEqual(m.messages.map((x) => x.id), ['f1']);
});

test('Create account: the choice is written in order (choice first) and emits both change events', () => {
    const seen = [];
    const { scene, host } = open({ accountIds: ['guest', 'freemail'] });
    window.eventDispatcher = { emit: (name, d) => seen.push([name, d.value]) };
    pick(host.querySelector('.mail-account-select'), 'create:freemail');
    scene.chooseCreateEntry('tt1');
    scene.confirmCreateAccount();
    delete window.eventDispatcher;
    // The choice and the account flag, then the remembered account so a reload reopens
    // on it (lab R1 F11).
    assert.deepEqual(seen, [['global_variable_changed:acct_freemail_choice', 'tt1'],
        ['global_variable_changed:acct_freemail', true],
        ['global_variable_changed:se_mail_last_account', 'freemail']]);
});

test('Create account: Esc leaves the panel without creating, then Esc again closes the overlay', () => {
    const { scene, host, globals } = open({ accountIds: ['guest', 'freemail'] });
    pick(host.querySelector('.mail-account-select'), 'create:freemail');
    scene.chooseCreateEntry('tt1');
    press('Escape');
    assert.equal(mail(scene).createOpen, false);
    assert.equal(globals.acct_freemail, undefined);
    assert.equal(globals.acct_freemail_choice, undefined);
    assert.deepEqual(mail(scene).creatable, ['freemail']);
    // reopening starts with nothing picked
    scene.openCreateAccount('freemail');
    assert.deepEqual(mail(scene).createMenu.map((x) => x.checked), [false, false]);
    scene.closeCreateAccount();
});

test('Create account Esc order: the panel closes before the composer under it, then the composer', () => {
    const { scene, host } = open({ accountIds: ['guest', 'freemail'] });
    scene.openCompose();
    pick(host.querySelector('.mail-account-select'), 'create:freemail');
    assert.equal(mail(scene).createOpen, true);
    press('Escape');
    assert.equal(mail(scene).createOpen, false);
    assert.equal(scene.composeOpen, true);   // the composer underneath is untouched
    press('Escape');
    assert.equal(scene.composeOpen, false);
});

test('creating an account with the composer open rebuilds the composer for the new account', () => {
    const { scene, host } = open({ accountIds: ['guest', 'freemail'] });
    scene.openCompose();
    assert.equal(scene.composer.getState().account, 'guest');
    pick(host.querySelector('.mail-account-select'), 'create:freemail');
    scene.chooseCreateEntry('tt1');
    scene.confirmCreateAccount();
    assert.equal(scene.composeOpen, true);
    assert.equal(scene.composer.getState().account, 'freemail');
});

test('a device that does not list freemail offers no Create account', () => {
    const { scene } = open({ accountIds: ['guest'] });
    assert.deepEqual(mail(scene).creatable, []);
    assert.equal(scene.openCreateAccount('freemail'), false);
});

test('burned_<id>: the switcher says reported, Send as greys it, Send is refused on it', () => {
    const { scene, host } = open({ accountIds: ['guest', 'freemail'] },
        { acct_freemail: true, acct_freemail_choice: 'tt1', burned_freemail: true });
    const m = mail(scene);
    assert.deepEqual(m.burned, ['freemail']);
    assert.match(m.switcher.options[1].text, /\(reported\)/);

    scene.openCompose();
    const sel = host.querySelector('.mail-compose-sendas-select');
    const opts = [...sel.options];
    assert.equal(opts[1].disabled, true);
    assert.match(opts[1].textContent, /this address has been reported/);
    assert.equal(opts[0].disabled, false);

    // viewing the reported account is allowed; sending from it is not
    pick(host.querySelector('.mail-account-select'), 'freemail');
    const st = scene.composer.getState();
    assert.equal(st.sendEnabled, false);
    assert.equal(st.gateReason, 'account-burned');
    assert.match(st.gateLine, /has been reported/);
    assert.equal(host.querySelector('.mail-compose-send').disabled, true);
    assert.equal(host.querySelector('.mail-compose-sendas-select').classList.contains('mail-burned'), true);
});

test('Send as: choosing another account switches the sending mailbox and that account\'s draft', () => {
    const drafts = {};
    const { scene, host } = open({ accountIds: ['guest', 'freemail'] },
        { acct_freemail: true, acct_freemail_choice: 'tt1' });
    scene.mailState.drafts = drafts;
    scene.openCompose();
    assert.equal(scene.composer.getState().account, 'guest');
    drafts.freemail = { contactId: 'pierce', to: 'm.pierce@ledgerwell.example', templates: {}, slots: {} };
    pick(host.querySelector('.mail-compose-sendas-select'), 'freemail');
    assert.equal(mail(scene).account.id, 'freemail');
    assert.equal(scene.composeOpen, true);
    assert.equal(scene.composer.getState().account, 'freemail');
    assert.equal(scene.composer.getState().contactId, 'pierce');   // freemail's own draft came back
    assert.deepEqual(scene.composer.getState().sendAs, [{ id: 'guest', burned: false }, { id: 'freemail', burned: false }]);
});

test('the forced-From hint adds "Switch account" only when another listed account can spoof', () => {
    const cfg = config();
    const withGuest = open({ accountIds: ['guest', 'freemail'], defaultAccount: 'freemail', mailClient: cfg },
        { acct_freemail: true, acct_freemail_choice: 'tt1' });
    assert.equal(withGuest.scene.account.id, 'freemail');
    withGuest.scene.openCompose();
    assert.equal(withGuest.scene.composer.anotherSpoofs, true);
    withGuest.scene.closeCompose();

    const alone = open({ accountIds: ['freemail'], mailClient: cfg },
        { acct_freemail: true, acct_freemail_choice: 'tt1' });
    alone.scene.openCompose();
    assert.equal(alone.scene.composer.anotherSpoofs, false);
});

test('contacts of a character carry the headless record id; others carry none', () => {
    const { scene } = open({ accountIds: ['guest'] });
    const byId = Object.fromEntries(scene.contacts().map((c) => [c.id, c.recordId]));
    assert.equal(byId.pierce, 'pierce_mail');
    assert.equal(byId.hampshire, undefined);
    assert.equal(byId.ghost, undefined);
    assert.deepEqual(mail(scene).contactRecords, { pierce: 'pierce_mail' });
});

test('the account switcher and Create-account panel are reachable by keyboard (native controls, in tab order)', () => {
    const { host } = open({ accountIds: ['guest', 'freemail'] });
    const sw = host.querySelector('.mail-account-select');
    assert.equal(sw.tagName, 'SELECT');
    assert.equal(sw.getAttribute('aria-label'), 'Account');
    assert.ok(sw.tabIndex >= 0);
    pick(sw, 'create:freemail');
    const panel = host.querySelector('.mail-create-panel');
    assert.equal(panel.getAttribute('role'), 'dialog');
    assert.equal(panel.querySelector('[role="radiogroup"]').querySelectorAll('input[type="radio"]').length, 2);
    for (const b of panel.querySelectorAll('button')) assert.notEqual(b.tabIndex, -1);
});
