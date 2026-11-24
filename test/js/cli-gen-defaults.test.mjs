// cli-gen/defaults.js (Ops S6 unit 06)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '../../public/break_escape/js/minigames/network-view/cli-gen/defaults.js');
const D = await import(pathToFileURL(file));
const OM = await import(pathToFileURL(join(here, '../../public/break_escape/js/minigames/network-view/ops-model.js')));

const svc = { name: 'file-share', label: 'files', port: 445 };
const finding = { id: 'a.file-share.x', alias: 'f1', service: 'file-share', class: 'default_creds', severity: 'high' };

test('service defaults', () => {
    assert.deepEqual(D.serviceCli(svc), { protocol: 'tcp', service: 'file-share' });
    assert.deepEqual(D.serviceCli({ name: 'dns', cli: { protocol: 'udp', service: 'domain', banner: 'B' } }), { protocol: 'udp', service: 'domain', banner: 'B' });
    assert.deepEqual(D.serviceCli({ name: 'dns', cli: { protocol: 'udp' } }), { protocol: 'udp', service: 'dns' });
});

test('finding defaults', () => {
    assert.deepEqual(D.findingCli(finding, svc), {
        title: `${OM.findingLabel(finding)} on files`,
        module: 'auxiliary/scanner/file_share/default_creds_f1',
        script: 'file-share-default-creds'
    });
});

test('a served field wins field by field', () => {
    const f = { ...finding, cli: { module: 'm/x', advisories: ['A-0000-1'], output: ['line'] } };
    const out = D.findingCli(f, svc);
    assert.equal(out.module, 'm/x');
    assert.equal(out.script, 'file-share-default-creds');
    assert.equal(out.title, `${OM.findingLabel(f)} on files`);
    assert.deepEqual(out.advisories, ['A-0000-1']);
    assert.deepEqual(out.output, ['line']);
});

test('a decoy and a weakness with no cli get defaults of the same form', () => {
    const decoy = { id: 'd', alias: 'f2', service: 'web', class: 'misconfig', severity: 'low', status: 'false' };
    const weak = { id: 'w', alias: 'f3', service: 'web', class: 'weak_auth', severity: 'medium' };
    const web = { name: 'web', label: 'web' };
    const a = D.findingCli(decoy, web), b = D.findingCli(weak, web);
    assert.deepEqual(Object.keys(a), Object.keys(b));
    assert.deepEqual(Object.keys(a), ['title', 'module', 'script']);
});

test('hostTarget and rangeSize', () => {
    assert.equal(D.hostTarget({ id: 'h1', address: '10.0.0.5' }), '10.0.0.5');
    assert.equal(D.hostTarget({ id: 'h1' }), 'h1');
    assert.equal(D.rangeSize('10.0.0.0/24'), 256);
    assert.equal(D.rangeSize('10.0.0.0/30'), 4);
    assert.equal(D.rangeSize('lan'), 0);
});

test('pure: equal output twice, no global read', () => {
    assert.deepEqual(D.findingCli(finding, svc), D.findingCli(finding, svc));
    assert.deepEqual(D.serviceCli(svc), D.serviceCli(svc));
    assert.doesNotMatch(readFileSync(file, 'utf8'), /\b(window|document|localStorage|Date|Math\.random)\b/);
});

// R2-10: `sessionShown` mirrors `hostAction` (a generator may not import view-controls.js), so the two must agree
test('sessionShown is open or locked exactly when hostAction is, over the session fixtures and every row shape', async () => {
    const VC = await import(pathToFileURL(join(here, '../../public/break_escape/js/minigames/network-view/view-controls.js')));
    const rows = [];
    const dir = join(here, 'fixtures/network-view');
    for (const name of ['locked_session', 'admin_session', 'technique_session', 'host_states', 'swept_hosts', 'pivot_open', 'pivot_locked', 'planted_box']) {
        const d = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));
        for (const f of d.footholds || []) rows.push(...(f.hosts || []), ...(f.networks || []).flatMap(b => b.hosts || []));
    }
    // every combination of the fields the two functions read
    for (const responding of [undefined, false]) for (const remote of [undefined, true, false]) {
        for (const session of [undefined, { via: 'claim' }, { via: 'technique' }, { via: 'technique', locked: true }, { via: 'technique', openHere: true }, { via: 'technique', locked: true, openHere: true }]) {
            rows.push({ id: 'x', kind: 'pc', responding, remoteSignIn: remote, session });
        }
    }
    assert.ok(rows.length > 40);
    for (const row of rows) {
        const action = VC.hostAction(row);
        const shown = D.sessionShown(row);
        if (row.kind !== 'pc') { assert.equal(shown, null); continue; }
        assert.equal(shown, action === 'open' || action === 'locked' ? action : null, JSON.stringify(row));
    }
});
