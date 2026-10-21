// Inbox triage playerSent replay (SE design 05 N9, 00 section 10a "Triage"; packet P3-B).
// The replayed record is the latest send to the target whose tells include senderTrust or
// senderAuth, else the latest with any tell; a later freemail retry does not shadow a spoofed
// send; a record with no tells is never replayed; auth rows are authored literals with only
// {account_address} and {domain} substituted; the page-less and domainFrom cases follow 05.
// Run with: bundle exec node --test test/js/social-player-sent.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-player-sent-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/inbox-triage/triage-messages.js', 'minigames/mail-client/mail-data.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const { buildTriageMessages, resolvePlayerSent, pickSentRecord, lookupDomain } =
    await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-messages.js')));

// ── fixture ───────────────────────────────────────────────────────────────────
const social = {
    mailClient: {
        accounts: [
            { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', mailbox: 'guest', spoofsFrom: true },
            { id: 'freemail', kind: 'created', mailbox: 'freemail', spoofsFrom: false,
              createMenu: [{ id: 'tt1', address: 'tarnside.test@freemail.example', displayName: 'T. Test' }] }
        ],
        payloadKit: [{ id: 'kit_ledger', label: 'Q3-ledger.xlsx', kind: 'spreadsheet' }]
    },
    phishTargets: [{ id: 'lord', expectedLink: { realDomain: 'ledgerwell.example' } }],
    landingPages: [{ id: 'payroll_login', linkText: 'ledgerwell.example/payroll',
        domainMenu: [{ id: 'd_word', domain: 'ledgerwell-hr.example' }, { id: 'd_homo', domain: 'ledgеrwell.example', browserDomain: 'xn--ledgrwell-x.example' }] }]
};
const row = (envelope, reply) => ({ spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: envelope, replyTo: reply });
const set = {
    id: 'lab',
    playerSentAuth: {
        accounts: {
            guest: { spf: 'fail', dkim: 'none', dmarc: 'fail', envelopeFrom: 'workstation.example', replyTo: 'guest@workstation.example' },
            freemail: { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'freemail.example', replyTo: '{account_address}' }
        },
        domains: { d_word: row('bounce.{domain}', 'payroll-notices@{domain}'), d_homo: row('bounce.{domain}', 'payroll-notices@{domain}') }
    },
    messages: []
};
const globals = { acct_freemail: true, acct_freemail_choice: 'tt1' };

let seq = 0;
function sent(over = {}) {
    seq += 1;
    return {
        id: `s${seq}`, folder: 'sent', mailbox: 'guest', fromAccount: 'guest', targetId: 'lord',
        from: { name: 'Jed Baker', address: 'j.baker@ledgerwell.example' }, to: 'lord@ledgerwell.example',
        subject: 'Payroll check', body: 'Please confirm your details today.', time: '09:12', gameTime: seq * 1000,
        attachment: null, link: null, landed: false, tells: ['senderTrust', 'senderAuth'], read: true, ...over
    };
}
const state = (...perBox) => ({ mailboxes: Object.fromEntries(perBox.map(([id, msgs]) => [id, { messages: msgs }])) });
const entry = (over = {}) => ({ kind: 'playerSent', id: 'own_lord', targetId: 'lord', notes: { perFlagNote: { senderTrust: 'n1' }, headerNote: 'h', ifTrusted: 'i' }, ...over });

// ── selection ─────────────────────────────────────────────────────────────────
test('the latest send with a spoof tell wins; a later freemail retry with only urgency does not shadow it', () => {
    const spoofed = sent({ id: 'spoof', gameTime: 1000, tells: ['senderTrust', 'urgencyCalibrated'] });
    const retry = sent({ id: 'retry', mailbox: 'freemail', fromAccount: 'freemail', gameTime: 5000, tells: ['urgencyCalibrated'] });
    const picked = pickSentRecord(state(['guest', [spoofed]], ['freemail', [retry]]), entry());
    assert.equal(picked.rec.id, 'spoof');
    const out = resolvePlayerSent(entry(), set, state(['guest', [spoofed]], ['freemail', [retry]]), social, { globals });
    assert.equal(out.message.sourceRecordId, 'spoof');
    assert.deepEqual(out.message.truth.flags, ['senderTrust', 'urgencyCalibrated']);
});

test('among spoofed sends the later one wins, across mailboxes', () => {
    const a = sent({ id: 'a', gameTime: 1000 });
    const b = sent({ id: 'b', mailbox: 'jed', gameTime: 3000, tells: ['senderAuth'] });
    assert.equal(pickSentRecord(state(['guest', [a]], ['jed', [b]]), entry()).rec.id, 'b');
    assert.equal(pickSentRecord(state(['guest', [a]], ['jed', [b]]), entry({ fromMailbox: 'guest' })).rec.id, 'a');
});

test('with no spoof tell the latest record with any tell is used', () => {
    const a = sent({ id: 'a', gameTime: 1000, tells: ['urgencyCalibrated'] });
    const b = sent({ id: 'b', gameTime: 2000, tells: ['addressedTo'] });
    assert.equal(pickSentRecord(state(['guest', [a, b]]), entry()).rec.id, 'b');
});

test('records with no tells, quick replies, seeded stubs and other targets are never replayed', () => {
    const msgs = [
        sent({ id: 'none', tells: [] }),
        sent({ id: 'qr', kind: 'quickReply', tells: ['senderTrust'] }),
        sent({ id: 'seed', seeded: true, tells: ['senderTrust'] }),
        sent({ id: 'other', targetId: 'pierce', tells: ['senderTrust'] }),
        { id: 'inbox', folder: 'inbox', targetId: 'lord', tells: ['senderTrust'] }
    ];
    assert.equal(pickSentRecord(state(['guest', msgs]), entry()), null);
    const out = resolvePlayerSent(entry(), set, state(['guest', msgs]), social, { globals });
    assert.equal(out.skipped, 'no-sent-record');
});

test('truth.flags is the stored tells whether or not the phish landed', () => {
    const landed = sent({ landed: true, tells: ['senderTrust', 'urgencyCalibrated'] });
    const failed = sent({ id: 'f', landed: false, tells: ['senderTrust', 'urgencyCalibrated'], gameTime: 99999 });
    for (const rec of [landed, failed]) {
        const m = resolvePlayerSent(entry(), set, state(['guest', [rec]]), social, { globals }).message;
        assert.equal(m.truth.isPhish, true);
        assert.deepEqual(m.truth.flags, ['senderTrust', 'urgencyCalibrated']);
        assert.equal(m.truth.headerNote, 'h');
        assert.equal(m.truth.perFlagNote.senderTrust, 'n1');
    }
});

// ── auth ──────────────────────────────────────────────────────────────────────
test('no page: the auth row is the real account\'s, linkCredible is dropped, and the From is as stored', () => {
    const rec = sent({ tells: ['senderTrust', 'senderAuth', 'linkCredible'], link: null });
    const m = resolvePlayerSent(entry(), set, state(['guest', [rec]]), social, { globals }).message;
    assert.deepEqual(m.truth.flags, ['senderTrust', 'senderAuth']);
    assert.equal(m.auth.spf, 'fail');
    assert.equal(m.auth.envelopeFrom, 'workstation.example');
    assert.deepEqual(m.links, []);
    assert.equal(m.from.address, 'j.baker@ledgerwell.example');
});

test('no page and linkCredible the only tell: the entry is skipped', () => {
    const rec = sent({ tells: ['linkCredible'], link: null });
    const out = resolvePlayerSent(entry(), set, state(['guest', [rec]]), social, { globals });
    assert.equal(out.skipped, 'no-tells');
});

test('a page with domainFrom landing_domain: domain row, tokens filled, senderAuth removed, linkCredible kept', () => {
    const rec = sent({ tells: ['senderTrust', 'senderAuth', 'linkCredible', 'urgencyCalibrated'],
        link: { kitId: 'kit_page', pageId: 'payroll_login', domainId: 'd_word' }, from: { name: 'Payroll', address: 'payroll-notices@ledgerwell.example' } });
    const m = resolvePlayerSent(entry({ domainFrom: 'landing_domain' }), set, state(['guest', [rec]]), social, { globals }).message;
    assert.deepEqual(m.truth.flags, ['senderTrust', 'linkCredible', 'urgencyCalibrated']);
    assert.equal(m.auth.spf, 'pass');
    assert.equal(m.auth.envelopeFrom, 'bounce.ledgerwell-hr.example');
    assert.equal(m.auth.replyTo, 'payroll-notices@ledgerwell-hr.example');
    assert.equal(m.from.address, 'payroll-notices@ledgerwell-hr.example');
    assert.equal(m.from.address.split('@')[0], m.auth.replyTo.split('@')[0]);   // no implied reply_to_differs
    assert.equal(m.links.length, 1);
    assert.equal(m.links[0].linkText, 'ledgerwell.example/payroll');
    assert.equal(m.links[0].destination, 'https://ledgerwell-hr.example/');
    assert.match(m.body, /\{\{link:sent_link\}\}$/);
});

test('a homograph pick keeps its letters as typed', () => {
    const rec = sent({ tells: ['linkCredible'], link: { pageId: 'payroll_login', domainId: 'd_homo' } });
    const m = resolvePlayerSent(entry({ domainFrom: 'landing_domain' }), set, state(['guest', [rec]]), social, { globals }).message;
    assert.equal(m.links[0].destination, 'https://ledgеrwell.example/');
    assert.equal(lookupDomain(rec.link, social).browserDomain, 'xn--ledgrwell-x.example');
});

test('a page without domainFrom: the real account\'s auth row, senderAuth and linkCredible both stay', () => {
    const rec = sent({ tells: ['senderAuth', 'linkCredible'], link: { pageId: 'payroll_login', domainId: 'd_word' } });
    const m = resolvePlayerSent(entry(), set, state(['guest', [rec]]), social, { globals }).message;
    assert.deepEqual(m.truth.flags, ['senderAuth', 'linkCredible']);
    assert.equal(m.auth.spf, 'fail');
    assert.equal(m.links[0].destination, 'https://ledgerwell-hr.example/');
});

test('{account_address} is the created account\'s chosen address', () => {
    const rec = sent({ mailbox: 'freemail', fromAccount: 'freemail', tells: ['urgencyCalibrated'] });
    const m = resolvePlayerSent(entry(), set, state(['freemail', [rec]]), social, { globals }).message;
    assert.equal(m.auth.replyTo, 'tarnside.test@freemail.example');
    assert.equal(m.auth.dmarc, 'pass');
});

test('a missing account or domain row skips the entry; unknown tokens are left as written', () => {
    const noRow = sent({ fromAccount: 'jed_pc', tells: ['senderTrust'] });
    assert.equal(resolvePlayerSent(entry(), set, state(['guest', [noRow]]), social, { globals }).skipped, 'no-auth-row');
    const noDomain = sent({ tells: ['linkCredible'], link: { pageId: 'payroll_login', domainId: 'd_other' } });
    assert.equal(resolvePlayerSent(entry({ domainFrom: 'landing_domain' }), set, state(['guest', [noDomain]]), social, { globals }).skipped, 'no-domain');
    const odd = { ...set, playerSentAuth: { accounts: { guest: { spf: 'fail', dkim: 'none', dmarc: 'fail', replyTo: '{other}@{domain}' } } } };
    const m = resolvePlayerSent(entry(), odd, state(['guest', [sent()]]), social, { globals }).message;
    assert.equal(m.auth.replyTo, '{other}@{domain}');
});

test('attachments take the payload kit label', () => {
    const rec = sent({ attachment: { kitId: 'kit_ledger', kind: 'spreadsheet' }, tells: ['senderTrust'] });
    const m = resolvePlayerSent(entry(), set, state(['guest', [rec]]), social, { globals }).message;
    assert.deepEqual(m.attachments, [{ label: 'Q3-ledger.xlsx', kind: 'spreadsheet' }]);
});

// ── the whole set ─────────────────────────────────────────────────────────────
test('buildTriageMessages keeps authored order, normalises, and lists skipped entries', () => {
    const lordSet = {
        ...set,
        messages: [
            { id: 'a1', from: { name: 'IT', address: 'it@ledgerwell.example' }, to: 'you@ledgerwell.example', subject: 'Laptop', time: '08:00',
              body: 'Hi\n{{link:l}}', links: [{ id: 'l', text: 'ledgerwell.example/it', destination: 'https://ledgerwell.example/it' }],
              auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' }, truth: { isPhish: false, flags: [], whyFine: { default: 'fine' } } },
            entry({ id: 'own_lord' }),
            entry({ id: 'own_pierce', targetId: 'pierce' }),
            { id: 'a2', from: { name: 'X', address: 'x@mailbox.example' }, subject: 'Parcel', truth: { isPhish: true, flags: ['senderTrust'] } }
        ]
    };
    const st = state(['guest', [sent({ id: 'only', tells: ['senderTrust'] })]]);
    const { messages, skipped } = buildTriageMessages(lordSet, { mailState: st, social, globals });
    assert.deepEqual(messages.map((m) => m.id), ['a1', 'own_lord', 'a2']);
    assert.deepEqual(skipped, [{ id: 'own_pierce', reason: 'no-sent-record' }]);
    assert.equal(messages[0].links[0].linkText, 'ledgerwell.example/it');
    assert.equal(messages[0].read, false);
    assert.equal(messages[0].folder, 'inbox');
    assert.equal(messages[1].playerSent, true);
});
