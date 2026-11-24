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

test('K5: a live token row reads "Use it on {host}\'s sign-in screen, through {link}. About {n} min left."', () => {
    const tok = { id: 'lena_tok', kind: 'token', source: 'registry', label: 'HB-FIN-02 sign-in token', host: 'HB-FIN-02', connectsTo: 'lena_pc',
        routes: [{ foothold: 'jack_comms_port' }], account: { npcId: 'lena', username: 'lena.f', displayName: 'Lena Fox' } };
    let left = 181;
    const keyring = { entries: [tok], captures: {}, tokenSecondsLeft: (id) => (id === 'lena_tok' ? left : null) };
    const linkNames = new Map([['jack_comms_port', 'Drop box: comms room']]);
    const row = () => build({ captures: [], keyring, linkNames }).signins[0];
    assert.equal(row().use, "Use it on HB-FIN-02's sign-in screen, through Drop box: comms room. About 4 min left.", 'minutes rounded up');
    assert.deepEqual(row().kinds, ['token']);
    assert.deepEqual(row().sources, ['Recorded']);
    assert.equal(row().greyed, undefined);
    assert.equal(row().timed, true);
    left = 180;
    assert.match(row().use, /About 3 min left\.$/);
    left = 60;
    assert.match(row().use, /About 1 min left\.$/);
    left = 59;
    assert.equal(row().use, "Use it on HB-FIN-02's sign-in screen, through Drop box: comms room. Under a minute left.");
    left = 0;
    assert.equal(row().use, 'HB-FIN-02 sign-in token has expired.', 'run out by the page clock: greyed without a GET (K5 R1 m2)');
    assert.equal(row().greyed, true);
    assert.ok(!row().timed, 'a greyed row is no longer timed');
    left = 600;
    // An object of names works as well as a Map
    assert.match(build({ captures: [], keyring, linkNames: { jack_comms_port: 'Drop box: comms room' } }).signins[0].use, /through Drop box: comms room\./);
    // No time known (no keyring timer): the line has no minutes and the row is not timed
    const untimed = build({ captures: [], keyring: { entries: [tok], captures: {} }, linkNames }).signins[0];
    assert.equal(untimed.use, "Use it on HB-FIN-02's sign-in screen, through Drop box: comms room.");
    assert.equal(untimed.timed, false);
    // No held link for the proof (or no route): the plain line
    left = 600;
    assert.equal(build({ captures: [], keyring }).signins[0].use, "Use it on HB-FIN-02's sign-in screen. About 10 min left.");
    assert.equal(build({ captures: [], keyring: { ...keyring, entries: [{ ...tok, routes: [] }] }, linkNames }).signins[0].use,
        "Use it on HB-FIN-02's sign-in screen. About 10 min left.");
    // The DOM row carries the timed mark the open log's minute redraw looks for
    global.document = new JSDOM('<!doctype html><body></body>').window.document;
    try {
        assert.equal(buildSignInRow(row()).row.dataset.timed, 'true');
        assert.equal(buildSignInRow(untimed).row.dataset.timed, undefined);
    } finally { delete global.document; }
    // Expired: greyed, the expired line, no minutes
    const gone = build({ captures: [], keyring: { ...keyring, entries: [{ ...tok, routes: [], expired: true }] }, linkNames }).signins[0];
    assert.equal(gone.greyed, true);
    assert.equal(gone.use, 'HB-FIN-02 sign-in token has expired.');
    assert.equal(gone.timed, undefined);
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
    assert.equal(row.querySelectorAll('.signin-row-tag-kind').length, 1);
    assert.equal(row.querySelector('.signin-row-tag-kind').textContent, 'Captured password');
    assert.equal(row.querySelector('.signin-row-tag-source').textContent, 'Phished');
    assert.equal(row.querySelectorAll('b').length, 0);
    assert.ok(secretNode.classList.contains('lpb-captures-secret'));
    assert.equal(secretNode.textContent, 'hunter2');
    const grey = buildSignInRow({ ...signins[0], greyed: true });
    assert.ok(grey.row.classList.contains('signin-row-greyed'));
    delete global.document;
});

test('a capture the keyring answer does not list yet is held back, not guessed (no duplicate row)', () => {
    const fresh = cap('ian_fresh', { address: 'ian.k@corp', secret: 'hunter2', at: 200 });
    const stale = { entries: [fileEntry({ foundIn: 'pw_file' })], captures: {} };
    const held = build({ captures: [fresh], secrets: { ian_fresh: 'hunter2' }, openedFiles: new Set(['pw_file']), keyring: stale });
    assert.equal(held.signins.length, 1, 'the account shows once');
    assert.equal(held.signins[0].key, 'account:ian');
    assert.equal(held.signins[0].captures.length, 0);
    // With the fresh answer it joins the account row
    const fresh2 = { ...stale, captures: { ian_fresh: meta('password', { account: 'ian' }) } };
    const joined = build({ captures: [fresh], secrets: { ian_fresh: 'hunter2' }, openedFiles: new Set(['pw_file']), keyring: fresh2 });
    assert.equal(joined.signins.length, 1);
    assert.equal(joined.signins[0].captures.length, 1);
    // Before any answer (keyring null) a guessed row still shows
    assert.equal(build({ captures: [fresh], keyring: null }).signins.length, 1);
});

test('the order follows the server gainedAt, so a reload (which resets firstSeen) keeps it', () => {
    const early = { ...lenaRdp, id: 'early', gainedAt: 1000 };
    const late = fileEntry({ id: 'late', gainedAt: 3000, foundIn: 'pw_file' });
    const mid = cap('mid_cap', { address: 'x', at: 2000 });
    const run = (firstSeen) => build({
        captures: [mid], secrets: { mid_cap: 's' }, openedFiles: new Set(['pw_file']),
        keyring: { entries: [late, early], captures: { mid_cap: meta('password') }, firstSeen }
    }).signins.map((r) => r.key);
    const expected = ['cred:early', 'capture:mid_cap', 'account:ian'];
    // page-local first-seen times in the opposite order, and none at all after a reload
    assert.deepEqual(run(new Map([['early', 9e12], ['late', 1]])), expected);
    assert.deepEqual(run(null), expected);
});

test('a captured value still loading reads Loading..., never the bullets; failed says so; ready shows the value', () => {
    const noSecret = { ...ian, secret: undefined };
    const pin = cap('stationery_pin', { roleLabel: 'Stationery', host: 'Cupboard keypad', at: 50 });
    const keyring = { entries: [], captures: { ian_page: meta('password', { account: 'ian' }), stationery_pin: meta('pin') } };
    const run = (secrets, secretsState) => build({ captures: [noSecret, pin], secrets, secretsState, keyring });
    const loading = run(null, 'loading');
    assert.equal(loading.signins[0].value, 'Loading...');
    assert.equal(loading.captures[0].value, 'Loading...');
    assert.match(loading.captures[0].use, /Loading\.\.\.$/);
    assert.doesNotMatch(rowText([...loading.signins, ...loading.captures]), /•/);
    const failed = run(null, 'failed');
    assert.equal(failed.signins[0].value, 'Could not load');
    assert.equal(failed.captures[0].value, 'Could not load');
    // A map that answered for one capture only: the other still reads as loading, not bullets
    const part = run({ ian_page: 'hunter2' }, 'loading');
    assert.equal(part.signins[0].value, 'hunter2');
    assert.equal(part.captures[0].value, 'Loading...');
    const ready = run({ ian_page: 'hunter2', stationery_pin: '4471' }, 'ready');
    assert.equal(ready.signins[0].value, 'hunter2');
    assert.equal(ready.captures[0].value, '4471');
    // An awareness scenario (no reveal) keeps the mask whatever the state
    const aware = buildSignInRows({ captures: [{ ...ian, secret: undefined }], secrets: null, secretsState: 'loading', social: {}, keyring: { entries: [], captures: { ian_page: meta('password', { account: 'ian' }) } } });
    assert.equal(aware.signins[0].value, MASK);
});

test('the DOM row carries the loading state on its secret node', () => {
    const { signins } = build({ captures: [{ ...ian, secret: undefined }], secrets: null, secretsState: 'loading',
        keyring: { entries: [], captures: { ian_page: meta('password', { account: 'ian' }) } } });
    const dom = new JSDOM('<body></body>');
    globalThis.document = dom.window.document;
    const { secretNode } = buildSignInRow(signins[0]);
    assert.equal(secretNode.textContent, 'Loading...');
    assert.equal(secretNode.dataset.secretState, 'loading');
});

// ---- S7: hash rows and cracked passwords ------------------------------------------------------

const hashEntry = (extra = {}) => ({
    id: 'dana_hash', kind: 'hash', source: 'registry', label: 'dana.hash', token: 'N4L9-E9K3-8PBA-TNMH-9EP6-K66Q', salted: true, status: 'ready',
    account: { npcId: 'dana', username: 'dana', displayName: 'Dana Roe' }, ...extra
});
const crackedPw = (extra = {}) => ({
    id: 'dana.cracked', kind: 'password', source: 'cracked', label: 'Cracked', password: 'plum-42-door',
    account: { npcId: 'dana', username: 'dana', displayName: 'Dana Roe' }, ...extra
});
const domOf = (r) => { globalThis.document = new JSDOM('<body></body>').window.document; return buildSignInRow(r).row; };

test('S7: a hash row lists username, token in fours and status, never a password, and sits after other rows', () => {
    const { signins } = build({ captures: [], keyring: { entries: [hashEntry(), fileEntry()], captures: {}, foundVisible: () => true } });
    assert.deepEqual(signins.map((r) => r.key), ['account:ian', 'hash:dana_hash'], 'the hash group is last');
    const h = signins[1];
    assert.equal(h.group, 'hash');
    assert.equal(h.token, 'N4L9-E9K3-8PBA-TNMH-9EP6-K66Q');
    assert.equal(h.salted, true);
    assert.equal(h.use, 'Ready');
    assert.doesNotMatch(rowText([h]), /password/i);
    const row = domOf(h);
    assert.match(row.textContent, /dana/);
    assert.match(row.textContent, /N4L9-E9K3-8PBA-TNMH-9EP6-K66Q/);
    assert.match(row.textContent, /Salted/);
    assert.match(row.textContent, /Ready/);
});

test('S7: the Salted marker only shows on a salted record', () => {
    const { signins } = build({ captures: [], keyring: { entries: [hashEntry({ salted: false })], captures: {} } });
    assert.equal(signins[0].salted, false);
    assert.doesNotMatch(domOf(signins[0]).textContent, /Salted/);
});

test('S7: the Crack button shows for ready and running only, and starts the cracker with the hash id', () => {
    const run = (extra) => domOf(build({ captures: [], keyring: { entries: [hashEntry(extra)], captures: {} } }).signins[0]);
    assert.ok(run({ status: 'ready' }).querySelector('button.signin-crack'));
    assert.ok(run({ status: 'running', readyInSeconds: 5 }).querySelector('button.signin-crack'));
    assert.equal(run({ status: 'ready' }).querySelector('button.signin-crack').textContent, 'Crack');
    assert.equal(run({ status: 'running', readyInSeconds: 5 }).querySelector('button.signin-crack').textContent, 'Open', 'a running row does not say Crack again');
    assert.equal(run({ status: 'running', readyInSeconds: 0 }).querySelector('button.signin-crack').textContent, 'Finish');
    assert.equal(run({ status: 'infeasible' }).querySelector('button'), null);
    assert.equal(run({ status: 'cracked' }).querySelector('button'), null);
    const started = [];
    globalThis.window = { MinigameFramework: { startMinigame: (...a) => started.push(a) } };
    try {
        run({ status: 'ready' }).querySelector('button').click();
    } finally { delete globalThis.window; }
    assert.deepEqual(started, [['ops-cracker', null, { hashId: 'dana_hash' }]]);
});

test('S7: a running row at 0 seconds reads "Ready to finish" and keeps its button; with time left it counts down', () => {
    const at0 = build({ captures: [], keyring: { entries: [hashEntry({ status: 'running', readyInSeconds: 0 })], captures: {} } }).signins[0];
    assert.equal(at0.use, 'Ready to finish');
    assert.ok(domOf(at0).querySelector('button.signin-crack'));
    const some = build({ captures: [], keyring: { entries: [hashEntry({ status: 'running', readyInSeconds: 30 })], captures: {} } }).signins[0];
    assert.equal(some.use, 'Cracking, 30 s left');
    // The keyring's own clock wins over the served figure
    const live = build({ captures: [], keyring: { entries: [hashEntry({ status: 'running', readyInSeconds: 30 })], captures: {}, crackSecondsLeft: () => 0 } }).signins[0];
    assert.equal(live.use, 'Ready to finish');
});

test('S7: a cracked hash row has no button, and the cracked password shows in full beside it', () => {
    const { signins } = build({ captures: [], social: {}, keyring: { entries: [hashEntry({ status: 'cracked' }), crackedPw()], captures: {} } });
    assert.deepEqual(signins.map((r) => r.key), ['account:dana', 'hash:dana_hash']);
    const [pw, h] = signins;
    assert.equal(h.use, 'Cracked');
    assert.equal(domOf(h).querySelector('button'), null);
    assert.deepEqual(pw.kinds, ['cracked']);
    assert.equal(pw.value, 'plum-42-door', 'shown in full even where captures are masked');
    assert.equal(pw.use, 'plum-42-door');
    assert.doesNotMatch(rowText([h]), /plum-42-door/);
});

test('S7: hostile strings in a hash row are drawn as text, never as markup', () => {
    const evil = '<img src=x onerror="window.pwned=1"><b>x</b>';
    const { signins } = build({ captures: [], keyring: { entries: [hashEntry({
        token: evil, label: evil, account: { npcId: 'dana', username: evil, displayName: evil } })], captures: {} } });
    const row = domOf(signins[0]);
    assert.equal(row.querySelector('img'), null);
    assert.equal(row.querySelector('b'), null);
    assert.match(row.textContent, /<img src=x/);
});

test('S7 R2-6: when a running row counts down to 0 its button changes from Open to Finish with the status', () => {
    const realSet = globalThis.setInterval, realClear = globalThis.clearInterval, realNow = Date.now;
    let tick = null, now = 1_000_000;
    globalThis.setInterval = (fn) => { tick = fn; return { unref() {} }; };
    globalThis.clearInterval = () => {};
    Date.now = () => now;
    try {
        const r = build({ captures: [], keyring: { entries: [hashEntry({ status: 'running', readyInSeconds: 3 })], captures: {} } }).signins[0];
        const row = domOf(r);
        const button = row.querySelector('button.signin-crack');
        assert.equal(button.textContent, 'Open');
        now += 3000; tick();
        assert.equal(row.querySelector('.signin-hash-status').textContent, 'Ready to finish');
        assert.equal(button.textContent, 'Finish');
    } finally { globalThis.setInterval = realSet; globalThis.clearInterval = realClear; Date.now = realNow; }
});
