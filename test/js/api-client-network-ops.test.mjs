// The ops loop's api-client calls (ops core plan 5.5, 6): S1 has networkScan. Path, body, error
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
