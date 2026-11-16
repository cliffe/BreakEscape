// The capture log's Sign-ins rows (credential keyring plan 8.7, slice K3d): buildSignInRows is
// pure, so it is imported from the source tree (it needs no DOM; the DOM builder gets a small
// jsdom check at the end).
// Run with: node --max-old-space-size=2048 test/js/signin-rows.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const { buildSignInRows, buildSignInRow } = await import(pathToFileURL(join(js, 'minigames/capture-log/signin-rows.js')));

const REVEAL = { captures: { revealSecret: true } };
const MASK = '••••••••';

const cap = (targetId, extra = {}) => ({ targetId, kind: 'credential', at: 100, ...extra });
const meta = (tag, extra = {}) => ({ tag, source: 'recorded', ...extra });
const ian = cap('ian_page', { roleLabel: 'Finance', address: 'ian.k@corp', secret: 'hunter2', at: 100 });
const fileEntry = (extra = {}) => ({
    id: 'jake_pw', kind: 'password', source: 'registry', how: 'found', label: 'passwords.txt',
    account: { npcId: 'ian', username: 'ian.k', displayName: 'Ian Kerr' }, ...extra
});
const lenaRdp = {
    id: 'lena_rdp', kind: 'saved_connection', source: 'registry', how: 'found', label: 'HB-FIN-02.rdp',
    heldItem: 'lena_rdp_item', host: 'HB-FIN-02', account: { npcId: 'lena', username: 'lena.f', displayName: 'Lena Fox' }
};

// The text a row can draw: every field except the raw source objects it carries.
const rowText = (rows) => JSON.stringify(rows, (k, v) => (k === 'captures' && Array.isArray(v) && v.length && v[0].targetId) || k === 'password' || k === 'entry' ? undefined : v);
const build = (o) => buildSignInRows({ social: REVEAL, ...o });

test('one row per credential: a captured password is one account row', () => {
    const { signins, captures } = build({
        captures: [ian], secrets: { ian_page: 'hunter2' },
        keyring: { entries: [], captures: { ian_page: meta('password', { account: 'ian' }) } }
    });
    assert.equal(signins.length, 1);
    assert.equal(captures.length, 0);
    assert.equal(signins[0].key, 'account:ian');
    assert.deepEqual(signins[0].kinds, ['captured']);
    assert.equal(signins[0].value, 'hunter2');
});

test('one row per credential: a password with no account is keyed by the capture', () => {
    const { signins } = build({
        captures: [ian], secrets: { ian_page: 'hunter2' },
        keyring: { entries: [], captures: { ian_page: meta('password') } }
    });
    assert.equal(signins.length, 1);
    assert.equal(signins[0].key, 'capture:ian_page');
});

test('merged row: a capture and the in-file password for one account are one row', () => {
    const { signins } = build({
        captures: [ian], secrets: { ian_page: 'hunter2' }, openedFiles: new Set(['pw_file']),
        keyring: { entries: [fileEntry({ foundIn: 'pw_file' })], captures: { ian_page: meta('password', { account: 'ian' }) } }
    });
    assert.equal(signins.length, 1);
    const r = signins[0];
    assert.equal(r.key, 'account:ian');
    assert.deepEqual(r.kinds, ['captured', 'in_file']);
    assert.deepEqual(r.sources, ['Recorded', 'Found']);
    assert.equal(r.value, 'hunter2');
    assert.ok(r.lines.includes('Also in passwords.txt.'));
});

test('a password found in a file first and captured later keeps one key and one New mark', () => {
    const entries = [fileEntry()];
    const before = build({ captures: [], keyring: { entries, captures: {} } });
    assert.equal(before.signins.length, 1);
    assert.equal(before.signins[0].key, 'account:ian');
    assert.equal(before.signins[0].use, 'Type it from passwords.txt.');
    const after = build({
        captures: [ian], secrets: { ian_page: 'hunter2' },
        keyring: { entries, captures: { ian_page: meta('password', { account: 'ian' }) } }
    });
    assert.equal(after.signins.length, 1);
    assert.equal(after.signins[0].key, 'account:ian');
    assert.ok(after.signins[0].seenKeys.includes('account:ian'));
});

test('two captures of one account give one row: oldest gives role, later notes listed, "and {n} more"', () => {
    const a = cap('a', { roleLabel: 'Old role', address: 'ian.k@corp', note: 'note A', at: 50 });
    const b = cap('b', { roleLabel: 'New role', address: 'ian.k@corp', note: 'note B', at: 200 });
    const c = cap('c', { roleLabel: 'Newest', note: 'note C', at: 300 });
    const km = { a: meta('password', { account: 'ian', source: 'phished' }), b: meta('password', { account: 'ian' }), c: meta('password', { account: 'ian' }) };
    const { signins } = build({ captures: [c, b, a], secrets: { b: 'second' }, keyring: { entries: [], captures: km } });
    assert.equal(signins.length, 1);
    const r = signins[0];
    assert.equal(r.title, 'Old role');
    assert.deepEqual(r.sources, ['Phished', 'Recorded']);
    assert.deepEqual(r.lines, ['note A', 'note B', 'and 1 more.']);
    // the value is the one served for the oldest capture that has one
    assert.equal(r.value, 'second');
    assert.equal(r.valueTargetId, 'b');
    for (const k of ['capture:a', 'capture:b', 'capture:c', 'account:ian']) assert.ok(r.seenKeys.includes(k), k);
});

test('implicit capture entries add no row', () => {
    const implicit = { id: 'ian_page', kind: 'password', source: 'capture', how: 'recorded', account: { npcId: 'ian', username: 'ian.k' } };
    const { signins, captures } = build({ captures: [], keyring: { entries: [implicit], captures: {} } });
    assert.equal(signins.length, 0);
    assert.equal(captures.length, 0);
});

test('a pin and a finding give capture rows, never credential rows', () => {
    const pin = cap('cupboard', { roleLabel: 'Stationery cupboard', host: 'Stationery cupboard keypad', secret: '4471', at: 10 });
    const fnd = { targetId: 'wedge', kind: 'foothold', roleLabel: 'Door', host: 'Side door', note: 'wedged open', at: 20 };
    const fh = { targetId: 'implant', kind: 'foothold', host: 'PC-1', note: 'payload ran', at: 30 };
    const { signins, captures } = build({
        captures: [pin, fnd, fh], secrets: { cupboard: '4471' },
        keyring: { entries: [], captures: { cupboard: meta('pin'), wedge: meta('finding'), implant: meta('foothold') } }
    });
    assert.equal(signins.length, 0);
    assert.deepEqual(captures.map((r) => r.kinds[0]), ['pin', 'finding', 'foothold']);
    assert.equal(captures[0].use, 'Stationery cupboard keypad: 4471');
    assert.equal(captures[1].use, 'Side door: wedged open');
    assert.ok(!captures[1].use.startsWith('Foothold on'));
    assert.equal(captures[2].use, 'Foothold on PC-1: payload ran');
    assert.deepEqual(captures.map((r) => r.sources), [[], [], []]);
});

test('a pin with no host shows the value or mask alone', () => {
    const pin = cap('p', { secret: '1234' });
    const { captures } = build({ captures: [pin], secrets: { p: '1234' }, keyring: { entries: [], captures: { p: meta('pin') } } });
    assert.equal(captures[0].use, '1234');
});

test('mask: revealSecret false masks every value', () => {
    const { signins, captures } = buildSignInRows({
        social: { captures: { revealSecret: false } }, captures: [ian, cap('pin1', { host: 'Keypad' })],
        secrets: { ian_page: 'hunter2', pin1: '4471' },
        keyring: { entries: [], captures: { ian_page: meta('password', { account: 'ian' }), pin1: meta('pin') } }
    });
    assert.equal(signins[0].value, MASK);
    assert.equal(signins[0].use, MASK);
    assert.equal(captures[0].use, `Keypad: ${MASK}`);
    assert.ok(!rowText({ signins, captures }).includes('hunter2'));
});

test('mask: an unproven capture (no served secret) shows the mask, even under revealSecret', () => {
    const bare = cap('ian_page', { roleLabel: 'Finance', address: 'ian.k@corp' });
    const { signins } = build({
        captures: [bare], secrets: {}, keyring: { entries: [], captures: { ian_page: meta('password', { account: 'ian' }) } }
    });
    assert.equal(signins[0].value, MASK);
    const none = build({ captures: [bare], secrets: null, keyring: { entries: [], captures: { ian_page: meta('password', { account: 'ian' }) } } });
    assert.equal(none.signins[0].value, MASK);
});

test('a password in a file never shows a value', () => {
    const { signins } = build({ captures: [], secrets: { ian_page: 'hunter2' }, keyring: { entries: [fileEntry({ password: 'leaked' })], captures: {} } });
    assert.equal(signins[0].value, undefined);
    assert.ok(!rowText(signins).includes('leaked'));
    assert.ok(!rowText(signins).includes('hunter2'));
});

test('no row for an entry GET /keyring does not list', () => {
    // a capture the server did not list: no row for it from the registry; an unlisted registry entry is absent
    const none = build({ captures: [], keyring: { entries: [], captures: {} } });
    assert.deepEqual(none, { signins: [], captures: [] });
    const one = build({ captures: [], keyring: { entries: [lenaRdp], captures: {} } });
    assert.deepEqual(one.signins.map((r) => r.key), ['cred:lena_rdp']);
    assert.ok(!one.signins.some((r) => r.key === 'cred:ops_cookie'));
});

test('the foundIn wait: a file password shows only once the file is opened', () => {
    const e = fileEntry({ foundIn: 'pw_file' });
    const waiting = build({ captures: [], openedFiles: new Set(), keyring: { entries: [e], captures: {} } });
    assert.equal(waiting.signins.length, 0);
    const opened = build({ captures: [], openedFiles: new Set(['pw_file']), keyring: { entries: [e], captures: {} } });
    assert.equal(opened.signins.length, 1);
    // the Keyring's own predicate wins when given
    const viaKeyring = build({ captures: [], openedFiles: new Set(), keyring: { entries: [e], captures: {}, foundVisible: () => true } });
    assert.equal(viaKeyring.signins.length, 1);
    const closed = build({ captures: [], openedFiles: new Set(['pw_file']), keyring: { entries: [e], captures: {}, foundVisible: () => false } });
    assert.equal(closed.signins.length, 0);
});

test('a wait on a file does not hide a captured password for the same account', () => {
    const { signins } = build({
        captures: [ian], secrets: { ian_page: 'hunter2' }, openedFiles: new Set(),
        keyring: { entries: [fileEntry({ foundIn: 'pw_file' })], captures: { ian_page: meta('password', { account: 'ian' }) } }
    });
    assert.equal(signins.length, 1);
    assert.deepEqual(signins[0].kinds, ['captured']);
});

test('ended remote assist is greyed with the ended line', () => {
    const assist = { id: 'jake_assist', kind: 'assist_invite', source: 'registry', how: 'given', label: 'Assist code', heldItem: 'assist_item',
        account: { npcId: 'jake', username: 'jake.p', displayName: 'Jake Pryce' } };
    const live = build({ captures: [], keyring: { entries: [assist], captures: {} } });
    assert.equal(live.signins[0].greyed, undefined);
    assert.equal(live.signins[0].use, 'Connect Assist code from your inventory.');
    const ended = build({ captures: [], keyring: { entries: [{ ...assist, ended: true }], captures: {} } });
    assert.equal(ended.signins[0].greyed, true);
    assert.match(ended.signins[0].use, /Jake Pryce ended the remote assist/);
});

test('an expired token row is greyed (K5 hook)', () => {
    const tok = { id: 'lena_tok', kind: 'token', source: 'registry', how: 'recorded', label: 'Lena token', host: 'HB-FIN-02', expired: true,
        account: { npcId: 'lena', username: 'lena.f', displayName: 'Lena Fox' } };
    const { signins } = build({ captures: [], keyring: { entries: [tok], captures: {} } });
    assert.equal(signins[0].greyed, true);
    assert.equal(signins[0].use, 'Lena token has expired.');
});

test.skip('K5: a live token row reads "Use it on {host}\'s sign-in screen, through {link}. About {n} min left."', () => {
    // K5 fills the link and minutes; until then the token branch of signin-rows.js is a marked hook.
});

test('source tags: Phished, Recorded, Found, Given on credential rows; none on capture rows', () => {
    const phish = cap('p1', { roleLabel: 'P', address: 'a@x' });
    const rec = cap('r1', { roleLabel: 'R', address: 'b@x' });
    const found = { ...lenaRdp, id: 'f1', how: 'found' };
    const given = { ...lenaRdp, id: 'g1', how: 'given' };
    const { signins, captures } = build({
        captures: [phish, rec, cap('pin1', { at: 5 })],
        keyring: {
            entries: [found, given],
            captures: { p1: meta('password', { source: 'phished' }), r1: meta('password'), pin1: meta('pin', { source: 'phished' }) }
        }
    });
    const bySrc = Object.fromEntries(signins.map((r) => [r.key, r.sources]));
    assert.deepEqual(bySrc['capture:p1'], ['Phished']);
    assert.deepEqual(bySrc['capture:r1'], ['Recorded']);
    assert.deepEqual(bySrc['cred:f1'], ['Found']);
    assert.deepEqual(bySrc['cred:g1'], ['Given']);
    assert.deepEqual(captures[0].sources, []);
});

test('ops_cookie: a foothold-recorded saved connection with no held item', () => {
    const ops = { id: 'ops_cookie', kind: 'saved_connection', source: 'registry', how: 'recorded', label: 'SV-OPS-01.rdp', host: 'SV-OPS-01',
        account: { npcId: 'ops', username: 'ops.admin', displayName: 'Ops Admin' } };
    const { signins } = build({ captures: [], keyring: { entries: [ops], captures: {} } });
    assert.equal(signins.length, 1);
    const r = signins[0];
    assert.equal(r.key, 'cred:ops_cookie');
    assert.deepEqual(r.kinds, ['saved_connection']);
    assert.deepEqual(r.sources, ['Recorded']);
    assert.equal(r.use, "Use it on SV-OPS-01's sign-in screen.");
    assert.ok(!/Connect .* from your inventory/.test(r.use));
});

test('a saved connection with a held item says Connect from your inventory', () => {
    const { signins } = build({ captures: [], keyring: { entries: [lenaRdp], captures: {} } });
    assert.equal(signins[0].use, 'Connect HB-FIN-02.rdp from your inventory.');
    assert.deepEqual(signins[0].kinds, ['saved_connection']);
});

test('an .rdp and a token for one account are two rows', () => {
    const tok = { id: 'lena_tok', kind: 'token', source: 'registry', how: 'recorded', label: 'Lena token', host: 'H', account: lenaRdp.account };
    const { signins } = build({ captures: [], keyring: { entries: [lenaRdp, tok], captures: {} } });
    assert.deepEqual(signins.map((r) => r.key).sort(), ['cred:lena_rdp', 'cred:lena_tok']);
});

test('old-key New marks: every row lists its capture:<targetId> keys as seenKeys', () => {
    const { signins } = build({
        captures: [ian], secrets: {}, keyring: { entries: [], captures: { ian_page: meta('password', { account: 'ian' }) } }
    });
    assert.deepEqual(signins[0].seenKeys, ['account:ian', 'capture:ian_page']);
    const reg = build({ captures: [], keyring: { entries: [lenaRdp], captures: {} } });
    assert.deepEqual(reg.signins[0].seenKeys, ['cred:lena_rdp']);
});

test('before the first answer: tags are guessed from the entry kind', () => {
    const fh = { targetId: 'fh', kind: 'foothold', host: 'PC', at: 1 };
    const { signins, captures } = build({ captures: [ian, fh], secrets: { ian_page: 'hunter2' }, keyring: null });
    assert.equal(signins[0].key, 'capture:ian_page');
    assert.equal(captures[0].kinds[0], 'foothold');
});

test('order: captures by at, registry entries by first-seen, then key; across kinds oldest first', () => {
    const c1 = cap('c1', { at: 300, address: 'x@y' });
    const c2 = cap('c2', { at: 100, address: 'z@y' });
    const e1 = { ...lenaRdp, id: 'e1' };
    const e2 = { ...lenaRdp, id: 'e2' };
    const firstSeen = new Map([['e1', 200], ['e2', 50]]);
    const { signins } = build({
        captures: [c1, c2],
        keyring: { entries: [e1, e2], captures: { c1: meta('password'), c2: meta('password') }, firstSeen }
    });
    assert.deepEqual(signins.map((r) => r.key), ['cred:e2', 'capture:c2', 'cred:e1', 'capture:c1']);
});

test('order: ties break by key', () => {
    const a = cap('b_one', { at: 5, address: 'a' });
    const b = cap('a_one', { at: 5, address: 'b' });
    const { signins } = build({ captures: [a, b], keyring: { entries: [], captures: { b_one: meta('password'), a_one: meta('password') } } });
    assert.deepEqual(signins.map((r) => r.key), ['capture:a_one', 'capture:b_one']);
});

test('buildSignInRow draws tags and text as textContent, and marks the secret node', () => {
    const dom = new JSDOM('<!doctype html><body></body>');
    global.document = dom.window.document;
    const { signins } = build({
        captures: [cap('ian_page', { roleLabel: '<b>Finance</b>', address: 'ian.k@corp', secret: 'hunter2' })],
        secrets: { ian_page: 'hunter2' },
        keyring: { entries: [], captures: { ian_page: meta('password', { account: 'ian', source: 'phished' }) } }
    });
    const { row, secretNode } = buildSignInRow(signins[0]);
    assert.equal(row.querySelectorAll('.signin-tag-kind').length, 1);
    assert.equal(row.querySelector('.signin-tag-kind').textContent, 'Captured password');
    assert.equal(row.querySelector('.signin-tag-source').textContent, 'Phished');
    assert.equal(row.querySelectorAll('b').length, 0);
    assert.ok(secretNode.classList.contains('lpb-captures-secret'));
    assert.equal(secretNode.textContent, 'hunter2');
    const grey = buildSignInRow({ ...signins[0], greyed: true });
    assert.ok(grey.row.classList.contains('signin-row-greyed'));
    delete global.document;
});
