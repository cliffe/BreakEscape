// Mail client shell (SE design 01 N1 shell, N3, N5, N9, N12 view, N14, N15 inbox seeds; packet P1-E1).
// The real mail-client sources and framework base classes run in jsdom.
// Run with: bundle exec node --test test/js/social-mail-client-shell.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const fixture = () => JSON.parse(readFileSync(join(here, 'fixtures/social/mail-client-shell.json'), 'utf8'));

// The real files, copied with their relative layout into an ESM folder
const dir = mkdtempSync(join(tmpdir(), 'social-mail-shell-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'minigames/mail-client/mail-client-minigame.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/mail-client/mail-notification.js', 'minigames/mail-client/mail-composer.js',
    'minigames/mail-client/mail-bridge.js', 'systems/global-writer.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};

const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const { notifyNewMail } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-notification.js')));
const data = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-data.js')));

let ended = null;
let current = null;
function open(params = {}, globals = {}) {
    current?.cleanup();
    const host = document.getElementById('host');
    host.textContent = '';
    ended = null;
    const gm = { globalVariables: globals };
    window.gameState = gm;
    const mailState = params.mailState || data.emptyMailState();
    const scene = new MailClientMinigame(host, {
        mailClient: fixture(), mailState, accountIds: ['guest'], ...params
    });
    window.MinigameFramework = {
        currentMinigame: scene,
        endMinigame(success, result) { ended = { success, result }; scene.cleanup(); }
    };
    scene.init();
    scene.start();
    current = scene;
    return { scene, host, mailState };
}
const press = (key) => document.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const rows = (host) => [...host.querySelectorAll('.mail-row')];
const text = (host, sel) => host.querySelector(sel)?.textContent ?? null;

test('the inbox lists seeded mail, newest first, with an unread dot and count', () => {
    const { host, mailState } = open();
    const ids = rows(host).map((r) => r.dataset.id);
    // all three seeded inbox messages share gameTime 0, so the later array entry is first
    assert.deepEqual(ids, ['lookalike', 'newsletter', 'welcome']);
    assert.equal(host.querySelector('.mail-row[data-id="welcome"]').dataset.unread, 'true');
    assert.equal(host.querySelector('.mail-row[data-id="newsletter"]').dataset.unread, 'false');
    assert.ok(host.querySelector('.mail-row[data-id="welcome"] img[src$="mail-unread-dot.png"]'));
    assert.equal(text(host, '.mail-folder-btn[data-folder="inbox"] .mail-folder-count'), '2');
    assert.equal(mailState.mailboxes.guest.unread, 2);
    // timed mail belongs to the scheduler; the sent seed is in Sent only
    assert.equal(mailState.mailboxes.guest.messages.some((m) => m.id === 'timed'), false);
    assert.equal(mailState.mailboxes.guest.messages.find((m) => m.id === 'old_sent').folder, 'sent');
    // the frame art and the readable-type token are what the stylesheet uses
    const css = readFileSync(join(root, 'public/break_escape/css/mail-client-minigame.css'), 'utf8');
    assert.match(css, /var\(--se-font-readable\)/);
    for (const art of ['ui/social/mail-frame.png', 'ui/social/mail-chip-attachment.png']) {
        assert.ok(css.includes(art), art);
        assert.ok(existsSync(join(root, 'public/break_escape/assets', art)), art);
    }
});

test('seeding is idempotent and keeps a restored read flag', () => {
    const state = data.emptyMailState();
    data.seedMailState(state, fixture(), 5);
    state.mailboxes.guest.messages.find((m) => m.id === 'welcome').read = true;
    const again = data.seedMailState(state, fixture(), 99);
    assert.deepEqual(again, []);
    assert.equal(state.mailboxes.guest.messages.filter((m) => m.id === 'welcome').length, 1);
    assert.equal(state.mailboxes.guest.messages.find((m) => m.id === 'welcome').read, true);
    assert.equal(state.mailboxes.guest.messages.find((m) => m.id === 'welcome').gameTime, 5);
    assert.equal(state.mailboxes.guest.unread, 1);
});

test('opening a message shows From name and address, To, subject and body; it marks the message read', () => {
    const changes = [];
    const { host, scene } = open({ onStateChange: (c) => changes.push(c) });
    host.querySelector('.mail-row[data-id="welcome"]').click();
    assert.equal(text(host, '.mail-subject'), 'Your new laptop');
    assert.equal(text(host, '.mail-from-name'), 'IT');
    assert.equal(text(host, '.mail-from-address'), '<it@ledgerwell.example>');
    assert.equal(text(host, '.mail-to'), 'guest@workstation.example');
    assert.equal(text(host, '.mail-body'), 'Welcome aboard.\nYour laptop is ready.');
    assert.equal(host.querySelector('.mail-row[data-id="welcome"]').dataset.unread, 'false');
    assert.equal(text(host, '.mail-folder-btn[data-folder="inbox"] .mail-folder-count'), '1');
    assert.deepEqual(changes, [{ type: 'read', mailbox: 'guest', id: 'welcome' }]);
    assert.equal(scene.getTestState().mail.selectedId, 'welcome');
});

test('authored names, subjects and bodies render as text, never as markup', () => {
    const { host } = open();
    host.querySelector('.mail-row[data-id="lookalike"]').click();
    assert.equal(host.querySelector('.mail-body b'), null);
    assert.equal(host.querySelector('script'), null);
    assert.equal(text(host, '.mail-body'), '<b>not bold</b>');
    assert.equal(text(host, '.mail-from-name'), 'Payroll <b>Team</b>');
    assert.equal(text(host, '.mail-from-address'), '<payroll@ledgervvell.example>');
    assert.equal(text(host, '.mail-subject'), 'Hours <script>x</script>');
});

test('a link chip shows its authored text; hover, focus or tap pins the real destination; attachments show as chips', () => {
    const { host, scene } = open();
    host.querySelector('.mail-row[data-id="newsletter"]').click();
    const chip = host.querySelector('.mail-chip-link');
    assert.equal(chip.textContent, 'ledgerwell.example/policy');
    assert.match(chip.title, /ledgervvell\.example\/policy/);
    assert.equal(text(host, '.mail-link-status'), '');
    chip.dispatchEvent(new window.MouseEvent('mouseenter'));
    assert.equal(text(host, '.mail-link-status'), 'This would go to: ledgervvell.example/policy');
    assert.equal(scene.getTestState().mail.linkNote, 'This would go to: ledgervvell.example/policy');
    const att = host.querySelector('.mail-chip-attachment');
    assert.match(att.textContent, /Digest\.pdf/);
    assert.ok(att.querySelector('img[src$="attach-pdf.png"]'));
});

test('message details is a layer: Esc closes it before the reader or the overlay', () => {
    const { host, scene } = open();
    host.querySelector('.mail-row[data-id="welcome"]').click();
    host.querySelector('.mail-details-toggle').click();
    assert.ok(host.querySelector('.mail-details'));
    assert.match(text(host, '.mail-details'), /Shown as from/);
    assert.deepEqual(scene.getTestState().overlay.layers, ['message-details']);
    press('Escape');
    assert.equal(host.querySelector('.mail-details'), null);
    assert.equal(ended, null);
    assert.equal(scene.getTestState().mail.selectedId, 'welcome');
});

test('the Sent folder lists sent records with the judged line', () => {
    const { host, mailState, scene } = open();
    const box = mailState.mailboxes.guest;
    box.messages.push(
        { id: 'm1', mailbox: 'guest', folder: 'sent', fromAccount: 'guest', from: { name: 'Jed Baker', address: 'j.baker@ledgerwell.example' },
          to: 'careers@ledgerwell.example', subject: 'Quick one', body: 'Hello', landed: true, tells: [], time: '09:12', gameTime: 10, read: true },
        { id: 'm2', mailbox: 'guest', folder: 'sent', fromAccount: 'guest', from: { name: 'Operator', address: 'guest@workstation.example' },
          to: 'careers@ledgerwell.example', subject: 'Again', body: 'Hello again', landed: false, tells: [], time: '09:20', gameTime: 20, read: true },
        { id: 'm3', mailbox: 'guest', folder: 'sent', kind: 'quickReply', from: { name: 'Operator', address: 'guest@workstation.example' },
          to: 'x@ledgerwell.example', subject: 'Re: x', body: 'ok', landed: null, tells: [], time: '09:30', gameTime: 30, read: true });
    host.querySelector('.mail-folder-btn[data-folder="sent"]').click();
    assert.deepEqual(rows(host).map((r) => r.dataset.id), ['m3', 'm2', 'm1', 'old_sent']);
    assert.match(rows(host)[1].textContent, /To: careers@ledgerwell\.example/);
    host.querySelector('.mail-row[data-id="m1"]').click();
    assert.equal(text(host, '.mail-judged'), 'Judged: landed');
    assert.equal(text(host, '.mail-from-address'), '<j.baker@ledgerwell.example>'); // the claimed From, as displayed
    assert.match(text(host, '.mail-details-toggle'), /Message details/);
    host.querySelector('.mail-row[data-id="m2"]').click();
    assert.equal(text(host, '.mail-judged'), 'Judged: did not land');
    host.querySelector('.mail-row[data-id="m3"]').click();
    assert.equal(host.querySelector('.mail-judged'), null);
    assert.equal(scene.getTestState().mail.folder, 'sent');
    // Sent mail never carries an unread dot or count
    assert.equal(host.querySelector('.mail-row[data-unread="true"]'), null);
});

test('in withReply mode a pending sent record hides its verdict', () => {
    const { host, mailState } = open({ checklistTiming: 'withReply' });
    mailState.mailboxes.guest.messages.push({ id: 'p1', mailbox: 'guest', folder: 'sent', from: { name: 'Operator', address: 'guest@workstation.example' },
        to: 'a@b.example', subject: 'Pending', body: 'x', landed: true, judgePending: true, tells: ['senderAuth'], time: '10:00', gameTime: 1, read: true });
    host.querySelector('.mail-folder-btn[data-folder="sent"]').click();
    host.querySelector('.mail-row[data-id="p1"]').click();
    assert.equal(text(host, '.mail-judged'), 'Sent. Waiting for a reply.');
    assert.doesNotMatch(host.querySelector('.mail-sent-note').textContent, /landed/);
});

test('contacts appear once their revealedBy global is true, and per account', () => {
    const globals = {};
    const { host, scene } = open({}, globals);
    host.querySelector('.mail-contacts-btn').click();
    // no revealedBy set: only the contact with none
    assert.deepEqual([...host.querySelectorAll('.mail-contact')].map((c) => c.dataset.id), ['it']);
    press('Escape');
    assert.equal(host.querySelector('.mail-contacts-panel'), null);

    globals.se_intel_hampshire_careers = true;
    globals.se_intel_pierce_role = true;
    host.querySelector('.mail-contacts-btn').click();
    const ids = [...host.querySelectorAll('.mail-contact')].map((c) => c.dataset.id);
    assert.deepEqual(ids, ['hampshire', 'it']); // pierce is revealed but lists accountIds: freemail only
    const hampshire = host.querySelector('.mail-contact[data-id="hampshire"]');
    assert.match(hampshire.textContent, /Chris Hampshire/);
    assert.match(hampshire.textContent, /careers@ledgerwell\.example/);
    assert.match(hampshire.textContent, /Careers/);
    assert.deepEqual(scene.getTestState().mail.contacts, ['hampshire', 'it']);
    assert.equal(scene.getTestState().mail.contactsOpen, true);
});

test('accounts: given is listed, locked and created accounts follow their globals', () => {
    const cfg = fixture();
    assert.deepEqual(data.resolveAccounts(cfg, ['guest', 'freemail'], {}).map((a) => a.id), ['guest']);
    const got = data.resolveAccounts(cfg, ['guest', 'freemail'], { acct_freemail: true, acct_freemail_choice: 'tt1' });
    assert.deepEqual(got.map((a) => [a.id, a.address, a.domain]), [
        ['guest', 'guest@workstation.example', 'workstation.example'],
        ['freemail', 'tarnside.test@freemail.example', 'freemail.example']]);
    const { scene } = open({ accountIds: ['freemail'], defaultAccount: 'freemail' },
        { acct_freemail: true, acct_freemail_choice: 'tt1' });
    assert.equal(scene.getTestState().mail.account.mailbox, 'freemail');
});

test('Close with nothing sent aborts; after a send it is a normal exit with the last result', () => {
    let { host } = open();
    host.querySelector('.se-overlay-close').click();
    assert.deepEqual(ended, { success: false, result: { aborted: true } });

    ({ host } = open());
    const result = { targetId: 'hampshire', landed: true, redFlags: [], tells: [], outcome: 'landed' };
    window.MinigameFramework.currentMinigame.recordSend(result);
    press('Escape'); // no layer, no focused field: Esc is Close
    assert.deepEqual(ended, { success: true, result });
});

test('an arriving message is appended with no bark while the client is open; closed, it notifies', () => {
    const toasts = [];
    window.showNotification = (msg, type) => toasts.push([msg, type]);
    const { host, scene, mailState } = open();
    const reply = { id: 'r1', mailbox: 'guest', folder: 'inbox', from: { name: 'Chris Hampshire', address: 'careers@ledgerwell.example' },
        to: 'guest@workstation.example', subject: 'Re: Quick one', body: 'Thanks', time: '09:27', gameTime: 50, read: false, tells: [], landed: null };
    mailState.mailboxes.guest.messages.push(reply); // the scheduler commits first
    assert.equal(notifyNewMail(reply), 'appended');
    assert.deepEqual(toasts, []);
    assert.equal(rows(host)[0].dataset.id, 'r1');
    assert.equal(text(host, '.mail-folder-btn[data-folder="inbox"] .mail-folder-count'), '3');
    assert.match(text(host, '.mail-notice'), /New message from Chris Hampshire: Re: Quick one/);
    assert.equal(scene.getTestState().mail.unread, 3);
    // another mailbox is not this client's: it notifies
    assert.equal(notifyNewMail({ ...reply, id: 'r2', mailbox: 'freemail' }), 'notified');
    assert.equal(toasts.length, 1);
    assert.match(toasts[0][0], /New mail from Chris Hampshire/);
    // closed
    scene.cleanup();
    assert.equal(notifyNewMail({ ...reply, id: 'r3' }), 'notified');
    assert.equal(toasts.length, 2);
});

test('getTestState has the documented shape and is plain JSON', () => {
    const { scene } = open();
    const s = scene.getTestState();
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.equal(s.overlay.sceneType, null); // set by the framework when registered
    assert.equal(s.overlay.closeMode, 'abort');
    assert.deepEqual(Object.keys(s.mail).sort(), ['account', 'accounts', 'contacts', 'contactsOpen', 'detailsOpen',
        'folder', 'linkNote', 'messages', 'narrow', 'notice', 'selectedId', 'sentThisSession', 'unread']);
    assert.deepEqual(s.mail.messages[0], { id: 'lookalike', who: 'Payroll <b>Team</b>', subject: 'Hours <script>x</script>', time: '09:00', unread: true });
    assert.deepEqual(s.mail.account, { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', mailbox: 'guest' });
});
