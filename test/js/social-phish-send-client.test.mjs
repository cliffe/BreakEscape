// Phish evidence Route 2 client (systems/se-phish-send-client.js): the send POST, the build-await,
// the one retry on `page_not_built_yet`, and the bounded offline re-send queue (plan sections 10,
// 11, 15). The module has one static import (se-landing-page-client.js), so both files are copied
// into an ESM folder keeping their layout, exactly as the build-client tests do.
//
// Run with: node --test test/js/social-phish-send-client.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-phish-send-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems'), { recursive: true });
for (const name of ['se-landing-page-client.js', 'se-phish-send-client.js']) {
    writeFileSync(join(dir, 'systems', name), readFileSync(join(js, 'systems', name), 'utf8'));
}

const mod = await import(pathToFileURL(join(dir, 'systems/se-phish-send-client.js')));
const { phishSendBody, recordPhishSend, drainPhishSendQueue, _phishSendQueueSize, _resetPhishSendClient } = mod;

// A fake fetch that answers from a queue of canned JSON bodies and logs every call.
function fakeFetch(answers) {
    const calls = [];
    const fetchFn = async (url, opts) => {
        calls.push({ url, body: JSON.parse(opts.body) });
        const next = answers.shift();
        if (next === 'reject') throw new Error('offline');
        return { json: async () => next };
    };
    return { fetchFn, calls };
}

const WINDOW = { breakEscapeConfig: { apiBasePath: '/break_escape/games/1', csrfToken: 't' } };

const MESSAGE = {
    fromAccount: 'guest', to: 's.lord@ledgerwell.example', targetId: 'lord',
    subject: 's', headerFrom: 'portal', templates: { subject: 't_payslip' }, slots: { greeting: 'g' },
    link: 'kit_payroll_page', linkText: 'ledgerwell.example/payroll', linkInfo: { state: 'built' },
    secretDraftField: 'MUST NOT RIDE', password: 'MUST NOT RIDE',
};

test('phishSendBody keeps only the known keys plus target and kit', () => {
    const body = phishSendBody({ message: MESSAGE, targetId: 'lord', kitId: 'kit_payroll_page' });
    assert.equal(body.targetId, 'lord');
    assert.equal(body.kitId, 'kit_payroll_page');
    assert.equal(body.fromAccount, 'guest');
    assert.equal(body.link, 'kit_payroll_page');
    assert.ok(!('secretDraftField' in body), 'an unknown field never rides the body');
    assert.ok(!('password' in body), 'a password never rides the body');
});

test('the send awaits the build POST before posting', async () => {
    _resetPhishSendClient();
    const { fetchFn, calls } = fakeFetch([{ landed: true }]);
    let resolveBuild;
    const buildPost = new Promise((res) => { resolveBuild = res; });
    const deps = { fetch: fetchFn, window: WINDOW, pendingBuildPost: () => buildPost };

    const sendPromise = recordPhishSend(
        { message: MESSAGE, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' }, deps);
    await Promise.resolve();
    assert.equal(calls.length, 0, 'no send POST before the build POST resolves');

    resolveBuild({});
    const res = await sendPromise;
    assert.equal(calls.length, 1, 'the send POSTs once the build has resolved');
    assert.equal(res.landed, true);
});

test('a page_not_built_yet answer re-awaits and re-posts once, then lands', async () => {
    _resetPhishSendClient();
    const { fetchFn, calls } = fakeFetch([
        { landed: false, retryable: true, reason: 'page_not_built_yet' },
        { landed: true },
    ]);
    const deps = { fetch: fetchFn, window: WINDOW, pendingBuildPost: () => Promise.resolve({}) };
    const res = await recordPhishSend(
        { message: MESSAGE, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' }, deps);
    assert.equal(calls.length, 2, 'exactly one re-post after page_not_built_yet');
    assert.equal(res.landed, true);
    assert.equal(_phishSendQueueSize(), 0, 'a landed send is not queued');
});

test('a still-not-built send after the one re-post is queued and drains to a landing', async () => {
    _resetPhishSendClient();
    const { fetchFn, calls } = fakeFetch([
        { landed: false, retryable: true, reason: 'page_not_built_yet' },
        { landed: false, retryable: true, reason: 'page_not_built_yet' },
    ]);
    const deps = { fetch: fetchFn, window: WINDOW, pendingBuildPost: () => Promise.resolve({}) };
    const res = await recordPhishSend(
        { message: MESSAGE, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' }, deps);
    assert.equal(res.retryable, true);
    assert.equal(calls.length, 2, 'the initial post plus one re-post');
    assert.equal(_phishSendQueueSize(), 1, 'a persistently unbuilt send is held for the drain');

    // The build has now committed: the queued send lands on the drain.
    const drainFetch = fakeFetch([{ landed: true }]);
    await drainPhishSendQueue({ fetch: drainFetch.fetchFn, window: WINDOW });
    assert.equal(drainFetch.calls.length, 1, 'the drain re-posts the held send once');
    assert.equal(_phishSendQueueSize(), 0, 'a landed send leaves the queue');
});

test('an offline send (fetch rejects) is queued and the queue holds one entry per target/kit', async () => {
    _resetPhishSendClient();
    const { fetchFn } = fakeFetch(['reject']);
    const deps = { fetch: fetchFn, window: WINDOW, pendingBuildPost: () => Promise.resolve({}) };
    const res = await recordPhishSend(
        { message: MESSAGE, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' }, deps);
    assert.equal(res, null, 'an offline attempt returns null');
    assert.equal(_phishSendQueueSize(), 1);

    // A second offline attempt for the same target/kit does not add a row (bounded queue).
    const again = fakeFetch(['reject']);
    await recordPhishSend(
        { message: MESSAGE, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' },
        { fetch: again.fetchFn, window: WINDOW, pendingBuildPost: () => Promise.resolve({}) });
    assert.equal(_phishSendQueueSize(), 1, 'the queue is keyed by target/kit and cannot grow per attempt');
});

test('a permanent below-threshold miss is not left stuck in the queue on drain', async () => {
    _resetPhishSendClient();
    const { fetchFn } = fakeFetch(['reject']);
    await recordPhishSend(
        { message: MESSAGE, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' },
        { fetch: fetchFn, window: WINDOW, pendingBuildPost: () => Promise.resolve({}) });
    assert.equal(_phishSendQueueSize(), 1);

    // The page is built but weak: the server answers a permanent miss (not retryable), so the drain
    // drops it rather than retrying forever.
    const drain = fakeFetch([{ landed: false, reason: 'page_below_threshold' }]);
    await drainPhishSendQueue({ fetch: drain.fetchFn, window: WINDOW });
    assert.equal(_phishSendQueueSize(), 0, 'a permanent miss leaves the queue');
});
