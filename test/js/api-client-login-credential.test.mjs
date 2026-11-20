// loginWithCredential's request body (K3c): relay: true only when asked, one route at a time.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

globalThis.window = {};
const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'api-client-login-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'config.js'), 'export const getApiBase = () => "/api";\nexport const getCsrfToken = () => "t";\n');
copyFileSync(process.env.API_CLIENT_SRC || join(here, '../../public/break_escape/js/api-client.js'), join(dir, 'api-client.js'));
const { ApiClient } = await import(pathToFileURL(join(dir, 'api-client.js')));

let sent;
globalThis.fetch = async (url, opts) => {
    sent = { url, body: JSON.parse(opts.body) };
    return { ok: true, json: async () => ({ success: true }) };
};
const login = async (opts) => { await ApiClient.loginWithCredential('pc1', 'cred1', opts); return sent; };

test('loginWithCredential: no route asked sends only the pc and credential', async () => {
    const r = await login();
    assert.equal(r.url, '/api/login');
    assert.deepEqual(r.body, { pc_id: 'pc1', credential: 'cred1' });
});

test('loginWithCredential: relay true adds relay: true and no foothold', async () => {
    assert.deepEqual((await login({ relay: true })).body, { pc_id: 'pc1', credential: 'cred1', relay: true });
    assert.deepEqual((await login({ relay: true, foothold: 'jack' })).body, { pc_id: 'pc1', credential: 'cred1', relay: true },
        'one route at a time: relay wins');
});

test('loginWithCredential: a foothold sends the foothold; relay false or a non-boolean sends no relay', async () => {
    assert.deepEqual((await login({ foothold: 'jack' })).body, { pc_id: 'pc1', credential: 'cred1', foothold: 'jack' });
    assert.deepEqual((await login({ relay: false, foothold: 'jack' })).body, { pc_id: 'pc1', credential: 'cred1', foothold: 'jack' });
    assert.ok(!('relay' in (await login({ relay: 'yes' })).body), 'only the boolean true counts');
});
