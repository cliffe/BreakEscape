// Gap tests for minigames/inbox-triage/triage-messages.js, triage-kinds.js (pure helpers) and
// minigames/mail-client/mail-data.js: empty or malformed sets, repeated seeding and restore,
// account unlock edges, playerSent replay on thin data, action mapping.
// Run with: bin/test-js test/js/social-gap-triage-messages-and-mail-data.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-triage-msgs-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js', 'minigames/mail-client/mail-data.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const load = (rel) => import(pathToFileURL(join(dir, rel)));
const T = await load('minigames/inbox-triage/triage-messages.js');
const K = await load('minigames/inbox-triage/triage-kinds.js');
const D = await load('minigames/mail-client/mail-data.js');

// ═══ mail-data ═══════════════════════════════════════════════════════════════

test('domainOf: last @ wins, lower-cased, non-strings and no-@ give empty', () => {
    assert.equal(D.domainOf('a@b@C.Example'), 'c.example');
    assert.equal(D.domainOf('no-at'), '');
    assert.equal(D.domainOf(''), '');
    assert.equal(D.domainOf(null), '');
    assert.equal(D.domainOf(5), '');
    assert.equal(D.domainOf('trailing@'), '');
});

test('resolveAccounts: no config, no accounts, junk entries', () => {
    for (const cfg of [undefined, null, {}, { accounts: 'x' }]) assert.deepEqual(D.resolveAccounts(cfg, null, {}), []);
});

test('resolveAccounts: a null or non-object entry in accounts is skipped like the other junk (byId already filters it)', () => {
    // The id list is built with all.map((a) => a.id) before the isObject filter, so a null entry throws.
    assert.deepEqual(D.resolveAccounts({ accounts: [null, { id: 'ok', address: 'o@x.example' }] }, null, {}).map((a) => a.id), ['ok']);
});

test('resolveAccounts: unlockedBy needs exactly true; burned flag needs exactly true; accountIds restricts and orders', () => {
    const cfg = { accounts: [
        { id: 'a', address: 'a@x.example' },
        { id: 'b', address: 'b@x.example', unlockedBy: 'gate' },
        { id: 'c', address: 'c@x.example' },
    ] };
    assert.deepEqual(D.resolveAccounts(cfg, null, {}).map((a) => a.id), ['a', 'c']);
    assert.deepEqual(D.resolveAccounts(cfg, null, { gate: 'true' }).map((a) => a.id), ['a', 'c']);
    assert.deepEqual(D.resolveAccounts(cfg, null, { gate: true }).map((a) => a.id), ['a', 'b', 'c']);
    assert.deepEqual(D.resolveAccounts(cfg, ['c', 'a', 'ghost'], {}).map((a) => a.id), ['c', 'a']);
    assert.deepEqual(D.resolveAccounts(cfg, [], {}).map((a) => a.id), ['a', 'c']); // an empty list means "all"

    assert.equal(D.resolveAccounts(cfg, null, { burned_a: 'yes' })[0].burned, false);
    assert.equal(D.resolveAccounts(cfg, null, { burned_a: true })[0].burned, true);
});

test('resolveAccounts: a created account needs acct_<id> true AND a valid saved choice; a stale choice id drops it', () => {
    const cfg = { accounts: [{ id: 'fm', kind: 'created', createMenu: [{ id: 'c1', address: 'x@fm.example', displayName: 'X' }, { id: 'c2', address: 'y@fm.example' }] }] };
    assert.deepEqual(D.resolveAccounts(cfg, null, {}), []);
    assert.deepEqual(D.resolveAccounts(cfg, null, { acct_fm: true }), []);
    assert.deepEqual(D.resolveAccounts(cfg, null, { acct_fm: true, acct_fm_choice: 'removed' }), []);
    const [a] = D.resolveAccounts(cfg, null, { acct_fm: true, acct_fm_choice: 'c2' });
    assert.equal(a.address, 'y@fm.example');
    assert.equal(a.displayName, 'y@fm.example'); // no displayName: the address
    assert.equal(a.domain, 'fm.example');
    assert.equal(D.resolveAccounts(cfg, null, { acct_fm: 'true', acct_fm_choice: 'c1' }).length, 0);
});

test('resolveAccounts: accounts without an address are dropped; defaults for kind, mailbox, spoofsFrom, person', () => {
    const cfg = { accounts: [{ id: 'n' }, { id: 'e', address: '' }, { id: 'ok', address: 'o@x.example', spoofsFrom: 'yes' }] };
    const out = D.resolveAccounts(cfg, null, {});
    assert.equal(out.length, 1);
    assert.deepEqual([out[0].kind, out[0].mailbox, out[0].spoofsFrom, out[0].person], ['given', 'ok', false, null]);
});

test('pendingCreations / createAccountWrites: only unmade created accounts with a usable menu; double create returns null', () => {
    const cfg = { accounts: [
        { id: 'fm', kind: 'created', createMenu: [{ id: 'c1', address: 'x@fm.example' }, { id: 'bad' }, null] },
        { id: 'locked', kind: 'created', unlockedBy: 'gate', createMenu: [{ id: 'c', address: 'l@x.example' }] },
        { id: 'empty', kind: 'created', createMenu: [{ id: 'bad' }] },
        { id: 'given', address: 'g@x.example' },
    ] };
    assert.deepEqual(D.pendingCreations(cfg, null, {}).map((p) => p.id), ['fm']);
    assert.deepEqual(D.pendingCreations(cfg, null, { gate: true }).map((p) => p.id), ['fm', 'locked']);
    assert.deepEqual(D.pendingCreations(cfg, null, {})[0].createMenu, [{ id: 'c1', address: 'x@fm.example', displayName: 'x@fm.example' }]);
    assert.deepEqual(D.createAccountWrites(cfg, 'fm', 'c1', {}), [['acct_fm_choice', 'c1'], ['acct_fm', true]]);
    assert.equal(D.createAccountWrites(cfg, 'fm', 'bad', {}), null);
    assert.equal(D.createAccountWrites(cfg, 'fm', 'nope', {}), null);
    assert.equal(D.createAccountWrites(cfg, 'fm', 'c1', { acct_fm: true }), null);
    assert.equal(D.createAccountWrites(cfg, 'given', 'c1', {}), null);
    assert.equal(D.createAccountWrites(cfg, 'locked', 'c', {}), null);
});

test('pendingCreations: unlockedBy naming acct_<id> itself does not block the first creation', () => {
    const cfg = { accounts: [{ id: 'fm', kind: 'created', unlockedBy: 'acct_fm', createMenu: [{ id: 'c1', address: 'x@fm.example' }] }] };
    assert.equal(D.pendingCreations(cfg, null, {}).length, 1);
});

test('visibleContacts: revealedBy needs true; accountIds restrict; empty accountIds means all; junk skipped', () => {
    const cfg = { contacts: [
        { id: 'a' }, { id: 'b', revealedBy: 'g' }, { id: 'c', accountIds: ['x'] }, { id: 'd', accountIds: [] }, null, 'x',
    ] };
    assert.deepEqual(D.visibleContacts(cfg, 'x', {}).map((c) => c.id), ['a', 'c', 'd']);
    assert.deepEqual(D.visibleContacts(cfg, 'y', {}).map((c) => c.id), ['a', 'd']);
    assert.deepEqual(D.visibleContacts(cfg, undefined, {}).map((c) => c.id), ['a', 'd']);
    assert.deepEqual(D.visibleContacts(cfg, 'x', { g: 'true' }).map((c) => c.id), ['a', 'c', 'd']);
    assert.deepEqual(D.visibleContacts(cfg, 'x', { g: true }).map((c) => c.id), ['a', 'b', 'c', 'd']);
    assert.deepEqual(D.visibleContacts(null, 'x'), []);
});

test('seedMailState is idempotent and a restore keeps the player\'s read state', () => {
    const cfg = { seededMessages: [{ id: 's1', mailbox: 'm', subject: 'Hi', unread: true, gameTime: 5 }, { id: 's2', mailbox: 'm', folder: 'sent' }] };
    const ms = D.emptyMailState();
    assert.deepEqual(D.seedMailState(ms, cfg, 100), ['s1', 's2']);
    assert.equal(ms.mailboxes.m.unread, 1);
    ms.mailboxes.m.messages.find((m) => m.id === 's1').read = true; // player opens it
    D.recountUnread(ms, 'm');
    assert.deepEqual(D.seedMailState(ms, cfg, 200), []);
    assert.equal(ms.mailboxes.m.messages.length, 2);
    assert.equal(ms.mailboxes.m.messages[0].read, true);
    assert.equal(ms.mailboxes.m.unread, 0);
});

test('seedMailState skips timed (deliverAt), id-less and mailbox-less seeds and tolerates a missing list', () => {
    const ms = D.emptyMailState();
    assert.deepEqual(D.seedMailState(ms, { seededMessages: [{ id: 't', mailbox: 'm', deliverAt: 60 }, { mailbox: 'm' }, { id: 'x' }, null, 'junk', { id: 'ok', mailbox: 'm' }] }), ['ok']);
    assert.deepEqual(D.seedMailState(D.emptyMailState(), {}), []);
    assert.deepEqual(D.seedMailState(D.emptyMailState(), null), []);
    assert.deepEqual(D.seedMailState(D.emptyMailState(), { seededMessages: 'x' }), []);
});

test('seedMailState with a restored mailState whose mailboxes is junk repairs it', () => {
    const ms = { mailboxes: 'corrupt' };
    D.seedMailState(ms, { seededMessages: [{ id: 'a', mailbox: 'm' }] });
    assert.equal(ms.mailboxes.m.messages.length, 1);
});

test('normaliseSeeded: gameTime from the seed when finite, else now; sent mail is always read; links and highlights copied by reference only when arrays', () => {
    assert.equal(D.normaliseSeeded({ id: 'a', gameTime: 7 }, 99).gameTime, 7);
    assert.equal(D.normaliseSeeded({ id: 'a', gameTime: 'x' }, 99).gameTime, 99);
    assert.equal(D.normaliseSeeded({ id: 'a', gameTime: NaN }, 99).gameTime, 99);
    assert.equal(D.normaliseSeeded({ id: 'a', folder: 'sent', unread: true }).read, true);
    assert.equal(D.normaliseSeeded({ id: 'a', unread: true }).read, false);
    assert.equal(D.normaliseSeeded({ id: 'a', unread: 'yes' }).read, true); // only strict true is unread
    const r = D.normaliseSeeded({ id: 'a', links: 'x', attachments: [1], highlights: null });
    assert.equal('links' in r, false);
    assert.deepEqual(r.attachments, [1]);
    assert.equal('highlights' in r, false);
    assert.equal(r.seeded, true);
    assert.deepEqual(D.normaliseSeeded({ id: 'a', from: 'Just a name' }).from, { name: 'Just a name', address: '' });
    assert.deepEqual(D.normaliseSeeded({ id: 'a', from: { name: null, address: undefined } }).from, { name: '', address: '' });
    assert.equal(D.normaliseSeeded({ id: 'a', folder: 'weird' }).folder, 'inbox');
});

test('recountUnread counts only unread inbox mail and creates a missing mailbox', () => {
    const ms = D.emptyMailState();
    assert.equal(D.recountUnread(ms, 'new'), 0);
    ms.mailboxes.new.messages.push({ folder: 'inbox', read: false }, { folder: 'inbox', read: true }, { folder: 'sent', read: false }, { read: 'false' }, {});
    assert.equal(D.recountUnread(ms, 'new'), 3); // missing folder counts as inbox; only strict true is read
});

test('folderMessages: newest first, ties by later position, sent vs inbox, unknown folder values read as inbox, missing box is []', () => {
    const ms = { mailboxes: { m: { messages: [
        { id: 'a', folder: 'inbox', gameTime: 5 }, { id: 'b', folder: 'inbox', gameTime: 9 }, { id: 'c', folder: 'inbox', gameTime: 5 },
        { id: 'd', folder: 'sent', gameTime: 1 }, { id: 'e', folder: 'trash', gameTime: 100 }, { id: 'f' },
    ] } } };
    assert.deepEqual(D.folderMessages(ms, 'm', 'inbox').map((m) => m.id), ['e', 'b', 'c', 'a', 'f']);
    assert.deepEqual(D.folderMessages(ms, 'm', 'sent').map((m) => m.id), ['d']);
    assert.deepEqual(D.folderMessages(ms, 'none', 'inbox'), []);
    assert.deepEqual(D.folderMessages(null, 'm', 'inbox'), []);
    assert.deepEqual(D.folderMessages({ mailboxes: { m: { messages: 'x' } } }, 'm', 'inbox'), []);
});

test('splitBody: adjacent tokens, leading/trailing text, bad token names, non-strings', () => {
    assert.deepEqual(D.splitBody('{{link:a}}{{link:b}}'), [{ link: 'a' }, { link: 'b' }]);
    assert.deepEqual(D.splitBody('x{{link:a}}y'), [{ text: 'x' }, { link: 'a' }, { text: 'y' }]);
    assert.deepEqual(D.splitBody('{{link:has space}}'), [{ text: '{{link:has space}}' }]);
    assert.deepEqual(D.splitBody('{{link:}}'), [{ text: '{{link:}}' }]);
    assert.deepEqual(D.splitBody(''), []);
    assert.deepEqual(D.splitBody(null), []);
    assert.deepEqual(D.splitBody(42), []);
    // the regex is global; two calls must not share lastIndex
    assert.deepEqual(D.splitBody('{{link:a}}'), D.splitBody('{{link:a}}'));
});

test('linkDestination: first present of destination, realUrl, href, realDomain, linkText; null-ish fields fall through', () => {
    assert.equal(D.linkDestination({ destination: 'd', href: 'h' }), 'd');
    assert.equal(D.linkDestination({ destination: null, realUrl: 'r' }), 'r');
    assert.equal(D.linkDestination({ href: 'h', linkText: 't' }), 'h');
    assert.equal(D.linkDestination({ linkText: 't' }), 't');
    assert.equal(D.linkDestination({ destination: '' , href: 'h' }), ''); // an empty string is "present" (?? not ||)
    assert.equal(D.linkDestination(null), '');
    assert.equal(D.linkDestination([]), '');
});

test('contactRecordId needs a character with an emailRecord and a string channels.email', () => {
    const social = { characters: { amy: { emailRecord: {}, channels: { email: 'rec1' } }, bob: { emailRecord: {}, channels: {} }, cy: { channels: { email: 'x' } }, di: { emailRecord: {}, channels: { email: '' } } } };
    assert.equal(D.contactRecordId(social, { character: 'amy' }), 'rec1');
    for (const c of ['bob', 'cy', 'di', 'ghost']) assert.equal(D.contactRecordId(social, { character: c }), null);
    assert.equal(D.contactRecordId(social, null), null);
    assert.equal(D.contactRecordId(null, { character: 'amy' }), null);
    assert.equal(D.contactRecordId(social, { character: 5 }), null);
});

// ═══ triage-kinds (pure helpers) ═════════════════════════════════════════════

test('kindOf / isNonEmail: default email, playerSent is an email kind, unknown kinds are not "non-email"', () => {
    assert.equal(K.kindOf(null), 'email');
    assert.equal(K.kindOf({ kind: '' }), 'email');
    assert.equal(K.isNonEmail({ kind: 'sms' }), true);
    assert.equal(K.isNonEmail('push'), true);
    assert.equal(K.isNonEmail({ kind: 'playerSent' }), false);
    assert.equal(K.isNonEmail({ kind: 'fax' }), false);
    assert.equal(K.isNonEmail(undefined), false);
});

test('actionsFor: Verify only when enabled; call hides Ring back unless enabled; push never has verify', () => {
    assert.deepEqual(K.actionsFor('email').map((a) => a.id), ['trust', 'report', 'delete']);
    assert.deepEqual(K.actionsFor('email', true).map((a) => a.id), ['trust', 'report', 'delete', 'verify']);
    assert.deepEqual(K.actionsFor('call').map((a) => a.id), ['comply', 'escalate', 'refuse']);
    assert.equal(K.actionsFor('call', true).length, 4);
    assert.deepEqual(K.actionsFor('push', true).map((a) => a.id), ['approve', 'deny', 'deny_report']);
    assert.deepEqual(K.actionsFor('unknown-kind').map((a) => a.id), ['trust', 'report', 'delete']);
    assert.deepEqual(K.actionsFor(undefined).map((a) => a.id), ['trust', 'report', 'delete']);
});

test('verdictForAction: maps ids and throws for an action from the wrong kind', () => {
    assert.equal(K.verdictForAction('call', 'verify_callback'), 'verify');
    assert.equal(K.verdictForAction('push', 'deny_report'), 'report');
    assert.equal(K.verdictForAction('email', 'trust'), 'trust');
    assert.equal(K.verdictForAction('sms', 'verify'), 'verify');
    assert.throws(() => K.verdictForAction('call', 'approve'), RangeError);
    assert.throws(() => K.verdictForAction('push', 'comply'), RangeError);
    assert.throws(() => K.verdictForAction('email', 'deny'), RangeError);
    assert.throws(() => K.verdictForAction('email', undefined), RangeError);
});

test('actionById: id first, then the kind\'s action for the verdict, then any, then Trust', () => {
    assert.equal(K.actionById('call', 'refuse', 'report').id, 'refuse');
    assert.equal(K.actionById('call', undefined, 'report').id, 'escalate');
    assert.equal(K.actionById('push', undefined, 'delete').id, 'deny');
    assert.equal(K.actionById('email', 'comply', 'trust').id, 'trust'); // wrong-kind id ignored
    assert.equal(K.actionById('email', undefined, 'bogus').id, 'trust');
    assert.equal(K.actionById('call', undefined, undefined).id, 'trust'); // no match anywhere: the generic Trust row
});

test('kindVerdictLine: only call and push have lines; every verdict is covered for both truths; unknown verdict is null', () => {
    for (const kind of ['call', 'push']) {
        for (const phish of [true, false]) {
            const vs = kind === 'call' ? ['trust', 'report', 'delete', 'verify'] : ['trust', 'report', 'delete'];
            for (const v of vs) assert.ok(K.kindVerdictLine(kind, phish, v), `${kind}/${phish}/${v}`);
            assert.equal(K.kindVerdictLine(kind, phish, 'bogus'), null);
        }
    }
    assert.equal(K.kindVerdictLine('push', true, 'verify'), null);
    assert.equal(K.kindVerdictLine('email', true, 'report'), null);
    assert.equal(K.kindVerdictLine(undefined, true, 'report'), null);
});

test('defaultSubject: 48-char cut with ellipsis, link tokens and whitespace removed, per-kind fallbacks', () => {
    const long = 'x'.repeat(60);
    assert.equal(K.defaultSubject({ kind: 'sms', body: long }), `${'x'.repeat(45)}...`);
    assert.equal(K.defaultSubject({ kind: 'sms', body: 'x'.repeat(48) }), 'x'.repeat(48));
    assert.equal(K.defaultSubject({ kind: 'sms', body: 'Hi  {{link:a}}\n there' }), 'Hi there');
    assert.equal(K.defaultSubject({ kind: 'sms', body: '{{link:a}}' }), 'Text message');
    assert.equal(K.defaultSubject({ kind: 'sms' }), 'Text message');
    assert.equal(K.defaultSubject({ kind: 'voicemail', duration: '0:42' }), 'Voicemail (0:42)');
    assert.equal(K.defaultSubject({ kind: 'voicemail' }), 'Voicemail');
    assert.equal(K.defaultSubject({ kind: 'qr' }), 'Printed notice');
    assert.equal(K.defaultSubject({ kind: 'page', page: { heading: 'Sign in' } }), 'Sign in');
    assert.equal(K.defaultSubject({ kind: 'page', page: {} }), 'Web page');
    assert.equal(K.defaultSubject({ kind: 'call' }), 'Incoming call');
    assert.equal(K.defaultSubject({ kind: 'push', push: { app: 'Authy' } }), 'Authy: sign-in request');
    assert.equal(K.defaultSubject({ kind: 'push' }), 'Sign-in request');
    assert.equal(K.defaultSubject({ kind: 'email' }), '');
});

test('hostOf (triage-kinds): scheme, path, query, fragment, port and case are removed; junk gives empty', () => {
    assert.equal(K.hostOf('HTTPS://Evil.Example:8443/a?b#c'), 'evil.example');
    assert.equal(K.hostOf('evil.example?x'), 'evil.example');
    assert.equal(K.hostOf('evil.example#x'), 'evil.example');
    assert.equal(K.hostOf('  evil.example  '), 'evil.example');
    assert.equal(K.hostOf(null), '');
    assert.equal(K.hostOf(undefined), '');
    assert.equal(K.hostOf(''), '');
    assert.equal(K.hostOf(42), '42');
});

test('hashString / qrPattern / waveBars: deterministic, bounded, and safe for empty ids and odd sizes', () => {
    assert.equal(K.hashString('a'), K.hashString('a'));
    assert.notEqual(K.hashString('a'), K.hashString('b'));
    assert.equal(K.hashString(''), K.hashString(null));
    const g = K.qrPattern('', 21);
    assert.equal(g.length, 21);
    assert.deepEqual(K.qrPattern('', 21), g);
    assert.ok(g[0][0] && g[0][6] && g[6][0] && g[1][1] === false && g[3][3]);
    for (const n of K.waveBars('', 40)) assert.ok(n >= 1 && n <= 9);
    assert.equal(K.waveBars('x', 0).length, 0);
    assert.deepEqual(K.waveBars('seed'), K.waveBars('seed'));
    assert.notDeepEqual(K.waveBars('seed'), K.waveBars('seed2'));
});

// ═══ triage-messages ═════════════════════════════════════════════════════════

test('normaliseTriageMessage: string from, object from with null parts, read flag only for unread === false', () => {
    assert.deepEqual(T.normaliseTriageMessage({ id: 'a', from: 'Jo' }).from, { name: 'Jo', address: '' });
    assert.deepEqual(T.normaliseTriageMessage({ id: 'a', from: { name: null } }).from, { name: '', address: '' });
    assert.deepEqual(T.normaliseTriageMessage({ id: 'a' }).from, { name: '', address: '' });
    assert.equal(T.normaliseTriageMessage({ id: 'a' }).read, false);
    assert.equal(T.normaliseTriageMessage({ id: 'a', unread: true }).read, false);
    assert.equal(T.normaliseTriageMessage({ id: 'a', unread: false }).read, true);
    assert.equal(T.normaliseTriageMessage({ id: 'a', unread: 0 }).read, false);
});

test('normaliseTriageMessage: always inbox folder (even if authored sent), default truth, links and attachments filtered', () => {
    const m = T.normaliseTriageMessage({ id: 'a', folder: 'sent', links: [null, 'x', { id: 'l', text: 'T' }, { id: 'm', destination: 'D' }, { id: 'n' }], attachments: [null, { label: 'f' }, 'x'], truth: 'bad' });
    assert.equal(m.folder, 'inbox');
    assert.deepEqual(m.truth, { isPhish: false, flags: [] });
    assert.deepEqual(m.links.map((l) => l.linkText), ['T', 'D', '']);
    assert.deepEqual(m.attachments, [{ label: 'f' }]);
    assert.equal(T.normaliseTriageMessage({ id: 'a', links: 'x', attachments: 'y' }).links.length, 0);
});

test('normaliseTriageMessage: a linkText of "" wins over text (?? keeps empty strings)', () => {
    assert.equal(T.normaliseTriageMessage({ id: 'a', links: [{ linkText: '', text: 'T' }] }).links[0].linkText, '');
});

test('normaliseTriageMessage: non-email stand-ins only fill blanks, never overwrite an authored sender or subject', () => {
    const m = T.normaliseTriageMessage({ id: 'a', kind: 'page', page: { url: 'https://Login.Evil.Example:443/x', heading: 'H' } });
    assert.equal(m.from.name, 'login.evil.example');
    assert.equal(m.subject, 'H');
    const authored = T.normaliseTriageMessage({ id: 'a', kind: 'page', from: 'Real', subject: 'Mine', page: { url: 'https://x.example' } });
    assert.equal(authored.from.name, 'Real');
    assert.equal(authored.subject, 'Mine');
    assert.equal(T.normaliseTriageMessage({ id: 'a', kind: 'push' }).from.name, 'Sign-in prompt');
    assert.equal(T.normaliseTriageMessage({ id: 'a', kind: 'call', callerId: 'Unknown' }).from.name, 'Unknown');
    assert.equal(T.normaliseTriageMessage({ id: 'a', kind: 'qr', qr: { location: 'Lobby' } }).from.name, 'Lobby');
    assert.equal(T.normaliseTriageMessage({ id: 'a', kind: 'email' }).subject, '');
});

test('normaliseTriageMessage does not mutate its input', () => {
    const src = { id: 'a', kind: 'sms', body: 'hi', links: [{ id: 'l', text: 'T' }] };
    const snap = JSON.stringify(src);
    T.normaliseTriageMessage(src);
    assert.equal(JSON.stringify(src), snap);
});

test('buildTriageMessages: no set, no messages, junk entries and id-less entries', () => {
    for (const set of [undefined, null, {}, { messages: 'x' }]) assert.deepEqual(T.buildTriageMessages(set), { messages: [], skipped: [] });
    const out = T.buildTriageMessages({ messages: [null, 'x', 5, { subject: 'no id' }, { id: '' }, { id: 'ok' }] });
    assert.deepEqual(out.messages.map((m) => m.id), ['ok']);
});

test('buildTriageMessages: duplicate ids are both kept (no de-duplication here)', () => {
    assert.equal(T.buildTriageMessages({ messages: [{ id: 'd' }, { id: 'd' }] }).messages.length, 2);
});

test('buildTriageMessages: a playerSent entry with no mail state is skipped with no-sent-record, order of the rest is kept', () => {
    const out = T.buildTriageMessages({ messages: [{ id: 'a' }, { id: 'own', kind: 'playerSent', targetId: 't' }, { id: 'b' }] });
    assert.deepEqual(out.messages.map((m) => m.id), ['a', 'b']);
    assert.deepEqual(out.skipped, [{ id: 'own', reason: 'no-sent-record' }]);
});

const sentRec = (over = {}) => ({ id: 'r1', folder: 'sent', targetId: 't', fromAccount: 'g', from: { name: 'Me', address: 'me@x.example' }, to: 'v@y.example', subject: 'S', body: 'B', gameTime: 1, tells: ['senderTrust'], ...over });
const ms = (...recs) => ({ mailboxes: { g: { messages: recs } } });
const psSet = { playerSentAuth: { accounts: { g: { spf: 'pass' } } } };
const psSocial = { mailClient: { accounts: [{ id: 'g', address: 'g@x.example', displayName: 'G' }] } };

test('resolvePlayerSent: a send whose only record has no tells says sent-without-tells; none at all says no-sent-record', () => {
    assert.equal(T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, ms(sentRec({ tells: [] })), psSocial).skipped, 'sent-without-tells');
    assert.equal(T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, ms(sentRec({ tells: undefined })), psSocial).skipped, 'sent-without-tells');
    assert.equal(T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, ms(), psSocial).skipped, 'no-sent-record');
    assert.equal(T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, undefined, psSocial).skipped, 'no-sent-record');
    assert.equal(T.resolvePlayerSent(undefined, psSet, ms(sentRec()), psSocial).skipped, 'no-sent-record');
});

test('resolvePlayerSent: fromMailbox limits the search to one box', () => {
    const state = { mailboxes: { g: { messages: [sentRec({ id: 'in-g' })] }, h: { messages: [sentRec({ id: 'in-h', gameTime: 99 })] } } };
    assert.equal(T.pickSentRecord(state, { targetId: 't' }).rec.id, 'in-h');
    assert.equal(T.pickSentRecord(state, { targetId: 't', fromMailbox: 'g' }).rec.id, 'in-g');
    assert.equal(T.pickSentRecord(state, { targetId: 't', fromMailbox: 'zzz' }), null);
});

test('pickSentRecord: gameTime ties go to the later array position; missing gameTime counts as 0', () => {
    assert.equal(T.pickSentRecord(ms(sentRec({ id: 'a', gameTime: 5 }), sentRec({ id: 'b', gameTime: 5 })), { targetId: 't' }).rec.id, 'b');
    assert.equal(T.pickSentRecord(ms(sentRec({ id: 'a', gameTime: undefined }), sentRec({ id: 'b', gameTime: 'x' })), { targetId: 't' }).rec.id, 'b');
    assert.equal(T.pickSentRecord(ms(sentRec({ id: 'a', gameTime: 1 }), sentRec({ id: 'b', gameTime: 0 })), { targetId: 't' }).rec.id, 'a');
});

test('pickSentRecord: no entry, no target and junk records are safe', () => {
    assert.equal(T.pickSentRecord(ms(sentRec()), undefined), null);
    assert.equal(T.pickSentRecord(ms(sentRec()), {}), null);
    assert.equal(T.pickSentRecord(ms(null, 'x', 5, sentRec({ id: 'ok' })), { targetId: 't' }).rec.id, 'ok');
    assert.equal(T.pickSentRecord({ mailboxes: { g: null } }, { targetId: 't' }), null);
});

test('resolvePlayerSent: duplicate tells collapse; non-string tells are dropped; a tellless entry after filtering is skipped', () => {
    const r = T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, ms(sentRec({ tells: ['senderTrust', 'senderTrust'] })), psSocial);
    assert.deepEqual(r.message.truth.flags, ['senderTrust']);
    const none = T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, ms(sentRec({ tells: [5, null, ''] })), psSocial);
    assert.equal(none.skipped, 'sent-without-tells');
});

test('resolvePlayerSent: notes cannot override isPhish or flags', () => {
    const r = T.resolvePlayerSent({ id: 'o', targetId: 't', notes: { isPhish: false, flags: ['x'], headerNote: 'h' } }, psSet, ms(sentRec()), psSocial);
    assert.equal(r.message.truth.isPhish, true);
    assert.deepEqual(r.message.truth.flags, ['senderTrust']);
    assert.equal(r.message.truth.headerNote, 'h');
});

test('resolvePlayerSent: the replay is marked playerSent, tied to its source record, and shows no real From override with missing fields', () => {
    const r = T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, ms(sentRec({ from: undefined, subject: undefined, body: undefined })), psSocial);
    assert.equal(r.message.playerSent, true);
    assert.equal(r.message.sourceRecordId, 'r1');
    assert.deepEqual(r.message.from, { name: '', address: '' });
    assert.equal(r.message.body, '');
});

test('resolvePlayerSent: an attachment with no kit label uses its own label, then kitId, then "Attachment"', () => {
    const att = (a) => T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, ms(sentRec({ attachment: a })), psSocial).message.attachments[0];
    assert.deepEqual(att({ label: 'L', kind: 'pdf' }), { label: 'L', kind: 'pdf' });
    assert.deepEqual(att({ kitId: 'k9' }), { label: 'k9', kind: 'document' });
    assert.deepEqual(att({}), { label: 'Attachment', kind: 'document' });
});

test('resolvePlayerSent with a page and an existing {{link:id}} token reuses that id and does not append another', () => {
    const social = { ...psSocial, landingPages: [{ id: 'p', linkText: 'real.example/x', domainMenu: [{ id: 'd1', domain: 'fake.example' }] }] };
    const set = { playerSentAuth: { accounts: { g: { spf: 'pass' } }, domains: { d1: { spf: 'pass' } } } };
    const rec = sentRec({ tells: ['linkCredible'], body: 'Click {{link:mine}} now', link: { pageId: 'p', domainId: 'd1' } });
    const m = T.resolvePlayerSent({ id: 'o', targetId: 't' }, set, ms(rec), social).message;
    assert.equal(m.links[0].id, 'mine');
    assert.equal(m.links[0].destination, 'https://fake.example/');
    assert.equal(m.links[0].linkText, 'real.example/x');
    assert.equal((m.body.match(/\{\{link:/g) || []).length, 1);
    const bare = sentRec({ tells: ['linkCredible'], body: 'No token', link: { pageId: 'p', domainId: 'd1' } });
    const m2 = T.resolvePlayerSent({ id: 'o', targetId: 't' }, set, ms(bare), social).message;
    assert.equal(m2.body, 'No token\n{{link:sent_link}}');
    const empty = sentRec({ tells: ['linkCredible'], body: '', link: { pageId: 'p', domainId: 'd1' } });
    assert.equal(T.resolvePlayerSent({ id: 'o', targetId: 't' }, set, ms(empty), social).message.body, '{{link:sent_link}}');
});

test('resolvePlayerSent: a link whose domain id is off the menu keeps the record but no link, and still needs another tell', () => {
    const rec = sentRec({ tells: ['linkCredible'], link: { pageId: 'p', domainId: 'gone' } });
    const social = { ...psSocial, landingPages: [{ id: 'p', domainMenu: [] }] };
    const r = T.resolvePlayerSent({ id: 'o', targetId: 't' }, psSet, ms(rec), social);
    assert.equal(r.message?.links?.length ?? 0, 0);
});

test('lookupDomain: record domain wins, falls back to the page menu (domainMenu, domains, domainOptions), pageId must match when given', () => {
    const social = { landingPages: [{ id: 'p1', domains: [{ id: 'd', domain: 'one.example' }] }, { id: 'p2', domainOptions: [{ id: 'd', domain: 'two.example', browserDomain: 'xn--b' }] }] };
    assert.deepEqual(T.lookupDomain({ domainId: 'd', domain: 'rec.example' }, social), { domain: 'rec.example', browserDomain: null });
    assert.equal(T.lookupDomain({ domainId: 'd' }, social).domain, 'one.example');
    assert.deepEqual(T.lookupDomain({ domainId: 'd', pageId: 'p2' }, social), { domain: 'two.example', browserDomain: 'xn--b' });
    assert.equal(T.lookupDomain({ domainId: 'd', pageId: 'p3' }, social), null);
    assert.equal(T.lookupDomain({ domainId: 'nope' }, social), null);
    assert.equal(T.lookupDomain({ domainId: 'd' }, undefined), null);
    assert.equal(T.lookupDomain(null, social), null);
    assert.equal(T.lookupDomain({}, social), null);
});
