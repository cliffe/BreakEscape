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
const {
    phishSendBody, recordPhishSend, drainPhishSendQueue, redrivePhishEvidence,
    _phishSendQueueSize, _resetPhishSendClient,
} = mod;

const landing = await import(pathToFileURL(join(dir, 'systems/se-landing-page-client.js')));
const {
    recordLandingPageBuild, drainBuildQueue, drainPhishQueues, pendingBuildPost,
    registerAfterBuildDrain, _buildQueueSize, _resetLandingPageClient,
} = landing;

// A fake fetch for the BUILD route: answers from a queue of booleans (the HTTP resp.ok) or
// 'reject' (a thrown fetch, i.e. offline / network error). Logs the posted body per call.
function fakeBuildFetch(answers) {
    const calls = [];
    const fetchFn = async (url, opts) => {
        calls.push({ url, body: JSON.parse(opts.body) });
        const next = answers.shift();
        if (next === 'reject') throw new Error('offline');
        return { ok: next === true };
    };
    return { fetchFn, calls };
}

function resetAll() {
    _resetPhishSendClient();
    _resetLandingPageClient();
    // _resetLandingPageClient clears the registered send drain; the send client registers it once
    // at module load, so re-register it for the combined-drain tests.
    registerAfterBuildDrain((deps) => drainPhishSendQueue(deps));
}

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

// ── build re-post queue (chunk A review major 1) ──────────────────────────────

test('a build POST that 5xxs is queued and re-posts on the drain', async () => {
    resetAll();
    const { fetchFn, calls } = fakeBuildFetch([false, true]); // first a 5xx, then a 2xx on the drain
    const deps = { fetch: fetchFn, window: WINDOW };
    const res = await recordLandingPageBuild({ pageId: 'payroll_login', targetId: 'lord', choices: { a: 1 } }, deps);
    assert.equal(res.ok, false, 'a 5xx build settles not-ok');
    assert.equal(_buildQueueSize(), 1, 'a failed build is queued');

    await drainBuildQueue(deps);
    assert.equal(calls.length, 2, 'the drain re-posts the build once');
    assert.equal(_buildQueueSize(), 0, 'a landed build leaves the queue');
    const after = await pendingBuildPost('payroll_login');
    assert.equal(after.ok, true, 'the pending build record is refreshed to a landed one');
});

test('an offline build (fetch rejects) is queued, one entry per page', async () => {
    resetAll();
    const { fetchFn } = fakeBuildFetch(['reject']);
    const deps = { fetch: fetchFn, window: WINDOW };
    await recordLandingPageBuild({ pageId: 'payroll_login', targetId: 'lord', choices: { a: 1 } }, deps);
    assert.equal(_buildQueueSize(), 1);
    const again = fakeBuildFetch(['reject']);
    await recordLandingPageBuild({ pageId: 'payroll_login', targetId: 'lord', choices: { a: 2 } },
        { fetch: again.fetchFn, window: WINDOW });
    assert.equal(_buildQueueSize(), 1, 'the build queue is keyed by page and cannot grow per attempt');
});

test('no config means no queue (headless): a build with no server is not held', async () => {
    resetAll();
    const res = recordLandingPageBuild({ pageId: 'payroll_login', targetId: 'lord', choices: { a: 1 } }, {});
    assert.equal(res, null, 'no server to reach returns null');
    assert.equal(_buildQueueSize(), 0, 'nothing is queued when there is no server');
});

// ── recordPhishSend triggers a build re-post when the build failed (major 1 headline) ──

test('a page_not_built_yet send re-posts the failed build, then lands', async () => {
    resetAll();
    // The build failed offline and sits in the build queue with its own fetch.
    const buildFetch = fakeBuildFetch(['reject', true]); // offline first, then lands on the re-post
    await recordLandingPageBuild({ pageId: 'payroll_login', targetId: 'lord', choices: { a: 1 } },
        { fetch: buildFetch.fetchFn, window: WINDOW });
    assert.equal(_buildQueueSize(), 1, 'the build is queued after the offline failure');

    // The send arrives: the server has no build yet (page_not_built_yet), so the send client must
    // re-post the queued build (through its own fetch) and then re-post the send, which now lands.
    const sendFetch = fakeFetch([
        { landed: false, retryable: true, reason: 'page_not_built_yet' },
        { landed: true },
    ]);
    const res = await recordPhishSend(
        { message: {}, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' },
        { fetch: sendFetch.fetchFn, window: WINDOW });
    assert.equal(res.landed, true, 'the send lands after its build was re-posted');
    assert.equal(buildFetch.calls.length, 2, 'the build was re-posted through its own fetch, not the send fetch');
    assert.equal(_buildQueueSize(), 0, 'the re-posted build left the queue');
    assert.equal(_phishSendQueueSize(), 0, 'a landed send is not queued');
});

// ── combined drain: builds before sends (chunk A review major 2, plan section 11) ──

test('drainPhishQueues drains the build queue before the send queue', async () => {
    resetAll();
    const order = [];
    // Queue one build and one send, both offline.
    await recordLandingPageBuild({ pageId: 'payroll_login', targetId: 'lord', choices: { a: 1 } },
        { fetch: async () => { throw new Error('offline'); }, window: WINDOW });
    await recordPhishSend({ message: {}, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' },
        { fetch: async () => { throw new Error('offline'); }, window: WINDOW, pendingBuildPost: () => null });
    assert.equal(_buildQueueSize(), 1);
    assert.equal(_phishSendQueueSize(), 1);

    // One fetch for the combined drain, routing by URL and logging the order the two queues drain in.
    const routingFetch = async (url) => {
        if (url.endsWith('/se/landing_page')) { order.push('build'); return { ok: true }; }
        order.push('send');
        return { json: async () => ({ landed: true }) };
    };
    await drainPhishQueues({ fetch: routingFetch, window: WINDOW });
    assert.deepEqual(order, ['build', 'send'], 'the build drains before the send');
    assert.equal(_buildQueueSize(), 0);
    assert.equal(_phishSendQueueSize(), 0);
});

// ── reload re-drive (chunk A review minor 3, plan section 11) ──────────────────

const REDRIVE_SCENARIO = {
    social: { mailClient: { payloadKit: [
        { id: 'kit_payroll_page', kind: 'link', landingPageId: 'payroll_login' },
    ] } },
};

test('a reload re-drives a built, submitted page: build then send both post', async () => {
    resetAll();
    const buildFetch = fakeBuildFetch([true]);
    const sendFetch = fakeFetch([{ landed: true }]);
    const globals = { se_landing_pages: { payroll_login: {
        pageId: 'payroll_login', targetId: 'lord', built: true,
        choices: { brand: 'ledgerwell' }, victim: { submitted: true },
    } } };
    await redrivePhishEvidence(REDRIVE_SCENARIO, globals,
        { fetch: (url, opts) => (url.endsWith('/se/landing_page') ? buildFetch.fetchFn(url, opts) : sendFetch.fetchFn(url, opts)), window: WINDOW });
    assert.equal(buildFetch.calls.length, 1, 'the build is re-posted');
    assert.equal(sendFetch.calls.length, 1, 'the send is re-posted');
    assert.equal(sendFetch.calls[0].body.targetId, 'lord');
    assert.equal(sendFetch.calls[0].body.kitId, 'kit_payroll_page');
});

test('a reload sends nothing for a page with no stored choices', async () => {
    resetAll();
    const build = fakeBuildFetch([true, true]);
    const send = fakeFetch([{ landed: true }]);
    const globals = { se_landing_pages: {
        no_choices: { pageId: 'no_choices', targetId: 'lord', built: true, victim: { submitted: true } },
    } };
    await redrivePhishEvidence(REDRIVE_SCENARIO, globals,
        { fetch: (url, opts) => (url.endsWith('/se/landing_page') ? build.fetchFn(url, opts) : send.fetchFn(url, opts)), window: WINDOW });
    assert.equal(build.calls.length, 0, 'no build is posted for a page with no choices');
    assert.equal(send.calls.length, 0, 'no send is posted for a page with no choices');
});

test('a reload re-drives the build but not the send when the victim did not submit', async () => {
    resetAll();
    const build = fakeBuildFetch([true]);
    const send = fakeFetch([{ landed: true }]);
    const globals = { se_landing_pages: { payroll_login: {
        pageId: 'payroll_login', targetId: 'lord', built: true,
        choices: { brand: 'ledgerwell' }, victim: { noticed: true },
    } } };
    await redrivePhishEvidence(REDRIVE_SCENARIO, globals,
        { fetch: (url, opts) => (url.endsWith('/se/landing_page') ? build.fetchFn(url, opts) : send.fetchFn(url, opts)), window: WINDOW });
    assert.equal(build.calls.length, 1, 'the build is re-posted');
    assert.equal(send.calls.length, 0, 'no send without a submitted victim');
});

// A+B R2 minor 1: the reload re-drive marks its build body redrive:true, so the server refuses to
// replace a recorded meetsThreshold build with a weaker one if the client global ever drifts.
test('the reload re-drive marks the build body redrive:true', async () => {
    resetAll();
    const buildFetch = fakeBuildFetch([true]);
    const sendFetch = fakeFetch([{ landed: true }]);
    const globals = { se_landing_pages: { payroll_login: {
        pageId: 'payroll_login', targetId: 'lord', built: true,
        choices: { brand: 'ledgerwell' }, victim: { submitted: true },
    } } };
    await redrivePhishEvidence(REDRIVE_SCENARIO, globals,
        { fetch: (url, opts) => (url.endsWith('/se/landing_page') ? buildFetch.fetchFn(url, opts) : sendFetch.fetchFn(url, opts)), window: WINDOW });
    assert.equal(buildFetch.calls[0].body.redrive, true, 'the re-drive build body is marked for the downgrade-refusing gate');
});

// A+B R2 minor 4: an `online` drain and a `sync-ok` drain that overlap must not both post the same
// queued build and send. The in-flight guard makes the second overlapping drain return at once.
test('overlapping drains do not double-post', async () => {
    resetAll();
    await recordLandingPageBuild({ pageId: 'payroll_login', targetId: 'lord', choices: { a: 1 } },
        { fetch: async () => { throw new Error('offline'); }, window: WINDOW });
    await recordPhishSend({ message: {}, targetId: 'lord', kitId: 'kit_payroll_page', pageId: 'payroll_login' },
        { fetch: async () => { throw new Error('offline'); }, window: WINDOW, pendingBuildPost: () => null });

    let buildCalls = 0;
    let sendCalls = 0;
    const slowFetch = async (url) => {
        await new Promise((r) => setTimeout(r, 5));
        if (url.endsWith('/se/landing_page')) { buildCalls += 1; return { ok: true }; }
        sendCalls += 1;
        return { json: async () => ({ landed: true }) };
    };
    // Fire two drains without awaiting the first, so the second overlaps the first in flight.
    const a = drainPhishQueues({ fetch: slowFetch, window: WINDOW });
    const b = drainPhishQueues({ fetch: slowFetch, window: WINDOW });
    await Promise.all([a, b]);
    assert.equal(buildCalls, 1, 'the build posts once despite two overlapping drains');
    assert.equal(sendCalls, 1, 'the send posts once despite two overlapping drains');
});
