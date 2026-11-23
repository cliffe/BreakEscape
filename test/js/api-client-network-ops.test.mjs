// The ops loop's api-client calls (ops core plan 5.5, 6): S1 has networkScan, S2 networkCheck and networkConfirm. Path, body, error
// mapping, and no retry of a refused or failed request. S2 and S3 add their calls here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

globalThis.window = {};
const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'api-client-ops-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'config.js'), 'export const getApiBase = () => "/api";\nexport const getCsrfToken = () => "t";\n');
copyFileSync(join(here, '../../public/break_escape/js/api-client.js'), join(dir, 'api-client.js'));
const { ApiClient } = await import(pathToFileURL(join(dir, 'api-client.js')));

let calls;
const answer = (status, body) => { globalThis.fetch = async (url, opts) => {
    calls.push({ url, method: opts.method, body: JSON.parse(opts.body) });
    return { ok: status < 400, status, json: async () => body };
}; };

test('networkScan: a sweep posts the foothold and the network id to /network/scan, nothing else', async () => {
    calls = []; answer(200, { success: true, network: { id: 'lab', swept: true, hosts: [] } });
    const out = await ApiClient.networkScan('jack_a', { networkId: 'lab' });
    assert.deepEqual(calls, [{ url: '/api/network/scan', method: 'POST', body: { foothold: 'jack_a', network_id: 'lab' } }]);
    assert.equal(out.network.swept, true);
});

test('networkScan: a host scan posts the foothold and the host id', async () => {
    calls = []; answer(200, { success: true, host: { id: 'print01' } });
    await ApiClient.networkScan('jack_a', { hostId: 'print01' });
    assert.deepEqual(calls[0].body, { foothold: 'jack_a', host_id: 'print01' });
});

test('networkScan: a refusal throws with the status and the body, and is not retried', async () => {
    for (const [status, reason] of [[400, 'bad_request'], [403, 'not_responding'], [404, 'not_found'], [422, 'not_needed']]) {
        calls = []; answer(status, { success: false, reason });
        await assert.rejects(ApiClient.networkScan('jack_a', { hostId: 'h' }), (e) => e.status === status && e.body.reason === reason);
        assert.equal(calls.length, 1, `${status}: one request only`);
    }
});

test('networkScan: a dropped connection throws once and is not retried', async () => {
    calls = [];
    globalThis.fetch = async (url, opts) => { calls.push(url); throw new TypeError('network down'); };
    await assert.rejects(ApiClient.networkScan('jack_a', { networkId: 'lab' }), /network down/);
    assert.equal(calls.length, 1);
});

test('networkCheck: posts the foothold, host id and service to /network/check', async () => {
    calls = []; answer(200, { success: true, hostId: 'print01', service: 'web', findings: [] });
    const out = await ApiClient.networkCheck('jack_a', { hostId: 'print01', service: 'web' });
    assert.deepEqual(calls, [{ url: '/api/network/check', method: 'POST', body: { foothold: 'jack_a', host_id: 'print01', service: 'web' } }]);
    assert.deepEqual(out.findings, []);
});

test('networkConfirm: posts the foothold and the finding id to /network/confirm', async () => {
    calls = []; answer(200, { success: true, finding: { id: 'a.b.c', status: 'confirmed' } });
    const out = await ApiClient.networkConfirm('jack_a', { findingId: 'a.b.c' });
    assert.deepEqual(calls, [{ url: '/api/network/confirm', method: 'POST', body: { foothold: 'jack_a', finding_id: 'a.b.c' } }]);
    assert.equal(out.finding.status, 'confirmed');
});

test('networkCheck and networkConfirm: a refusal throws with status and body, one request each, no retry', async () => {
    for (const [fn, args] of [['networkCheck', { hostId: 'h', service: 's' }], ['networkConfirm', { findingId: 'a.b.c' }]]) {
        for (const [status, reason] of [[400, 'bad_request'], [403, 'not_responding'], [404, 'not_found']]) {
            calls = []; answer(status, { success: false, reason });
            await assert.rejects(ApiClient[fn]('jack_a', args), (e) => e.status === status && e.body.reason === reason);
            assert.equal(calls.length, 1, `${fn} ${status}`);
        }
        calls = [];
        globalThis.fetch = async (url) => { calls.push(url); throw new TypeError('network down'); };
        await assert.rejects(ApiClient[fn]('jack_a', args), /network down/);
        assert.equal(calls.length, 1, `${fn} dropped`);
    }
});

test('networkTechnique: posts foothold, finding id and item id to /network/technique, nothing else', async () => {
    calls = []; answer(200, { success: true, grant: 'credential', keyringChanged: true });
    const out = await ApiClient.networkTechnique('jack_a', { findingId: 'a.b.c', itemId: 'card_1' });
    assert.deepEqual(calls, [{ url: '/api/network/technique', method: 'POST', body: { foothold: 'jack_a', finding_id: 'a.b.c', item_id: 'card_1' } }]);
    assert.equal(out.grant, 'credential');
});

test('networkTechnique: every refusal status throws with status and body (need kept), one request, no retry', async () => {
    for (const [status, body] of [[400, { success: false, reason: 'bad_request' }], [403, { success: false, reason: 'not_responding' }],
        [404, { success: false, reason: 'not_found' }], [422, { success: false, reason: 'need_unmet', need: { kind: 'credential', label: 'x' } }]]) {
        calls = []; answer(status, body);
        await assert.rejects(ApiClient.networkTechnique('jack_a', { findingId: 'a.b.c', itemId: 'c' }),
            (e) => e.status === status && e.body.reason === body.reason && (status !== 422 || e.body.need.kind === 'credential'));
        assert.equal(calls.length, 1, `status ${status}`);
    }
    calls = [];
    globalThis.fetch = async (url) => { calls.push(url); throw new TypeError('network down'); };
    await assert.rejects(ApiClient.networkTechnique('jack_a', { findingId: 'a.b.c', itemId: 'c' }), /network down/);
    assert.equal(calls.length, 1);
});
