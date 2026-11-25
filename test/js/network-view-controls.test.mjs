// The control list (Ops S6 unit 03): `offers`, `CONTROLS`, `LOCAL_ACTIONS` and the pure row
// helpers of view-controls.js, checked against every fixture view and against the scene.
// Run with: node test/js/network-view-controls.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { VARIANTS, mount, loadFixture, scene, model } from './support/network-view-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const nv = join(here, '../../public/break_escape/js/minigames/network-view');
const dir = mkdtempSync(join(tmpdir(), 'view-controls-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'nv'));
for (const f of ['ops-model.js', 'view-texts.js', 'view-controls.js']) writeFileSync(join(dir, 'nv', f), readFileSync(join(nv, f), 'utf8'));
const vc = await import(pathToFileURL(join(dir, 'nv/view-controls.js')));
const { CONTROLS, LOCAL_ACTIONS, offers } = vc;

const sourceOf = (f) => readFileSync(join(nv, f), 'utf8');

/** The key a control has in the saved DOM (the harness's `controlKeys` form), from an offer. */
function keyOf(o, view) {
    const found = (id) => model.findFinding(view, id);
    switch (o.action) {
        case 'unplug': return 'unplug';
        case 'sweep': return `sweep|${o.target}`;
        case 'scan': return `scan|${o.target}`;
        case 'check': return `check|${o.ids.hostId}|${o.ids.service}`;
        case 'confirm': { const h = found(o.target); return `confirm|${h.row.id}|${h.finding.service}|${h.finding.alias}`; }
        case 'use': return 'use';
        default: return `${o.action}|${o.target}`;
    }
}

const views = [];
for (const variant of VARIANTS) {
    const h = await mount(loadFixture(variant.fixture), { unplug: variant.unplug });
    views.push({ name: variant.name, view: h.view().view, jack: h.view().unplugJack, domKeys: h.controlKeys() });
    h.end();
}

test('CONTROLS is well formed', () => {
    assert.deepEqual(Object.keys(CONTROLS), ['sweep', 'scan', 'check', 'confirm', 'use', 'sign-in', 'open', 'observe', 'unplug']);
    const verbs = new Map();
    for (const [action, c] of Object.entries(CONTROLS)) {
        assert.equal(typeof c.label, 'string', action);
        assert.ok(c.label, action);
        assert.equal(typeof c.verb, 'string', action);
        assert.ok(c.verb, action);
        assert.ok(c.title && typeof c.title === 'string', action);
        assert.ok(Array.isArray(c.targets) && c.targets.length, action);
        for (const kind of c.targets) {
            const k = `${c.verb}:${kind}`;
            assert.ok(!verbs.has(k), `${k} names more than one entry`);
            verbs.set(k, action);
        }
        assert.ok(Object.isFrozen(c), action);
    }
    assert.equal(new Set(Object.values(CONTROLS).map(c => c.label)).size, 9, 'one label each');
    assert.equal(CONTROLS.confirm.label, 'Confirm');
    assert.deepEqual([...LOCAL_ACTIONS], ['select-finding', 'select-technique']);
    for (const a of LOCAL_ACTIONS) assert.ok(!(a in CONTROLS));
    assert.ok(Object.isFrozen(CONTROLS) && Object.isFrozen(LOCAL_ACTIONS));
});

test('the module imports only ops-model.js and view-texts.js and is pure', () => {
    const src = sourceOf('view-controls.js');
    const from = [...src.matchAll(/from '([^']+)'/g)].map(m => m[1]).sort();
    assert.deepEqual(from, ['./ops-model.js', './view-texts.js']);
    assert.ok(!/\b(document|window|localStorage|fetch|innerHTML)\b/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')));
});

for (const { name, view, jack, domKeys } of views) {
    test(`offers, ${name}: the order, targets and ids match the saved controls`, () => {
        const list = offers(view, { unplugJack: jack });
        const mine = list.map(o => keyOf(o, view)).filter(k => k !== 'use');
        const dom = domKeys.filter(k => !/^select-(finding|technique)\b/.test(k) && k !== 'use');
        assert.deepEqual(mine, dom);
        for (const o of list) {
            assert.ok(CONTROLS[o.action], o.action);
            assert.equal(o.label, CONTROLS[o.action].label);
            assert.equal(o.title, CONTROLS[o.action].title);
            assert.equal(o.command, null);
            assert.equal(o.pending, undefined);
            assert.equal(typeof o.ids, 'object');
        }
        assert.equal(list.filter(o => o.action === 'unplug').length, jack ? 1 : 0);
        if (jack) assert.equal(list[0].action, 'unplug');
    });

    test(`offers, ${name}: one offer per control, no more`, () => {
        const list = offers(view, { unplugJack: jack });
        const buttons = domKeys.filter(k => !/^select-(finding|technique)\b/.test(k) && k !== 'use');
        assert.equal(list.filter(o => o.action !== 'use').length, buttons.length);
        // every use pair: each held technique with each listed finding
        const cards = model.techniqueList(view);
        const findings = new Set();
        const rows = [...(view.hosts || []), ...(view.networks || []).flatMap(b => b.hosts || [])];
        for (const r of rows) for (const f of r.findings || []) findings.add(f.id);
        const uses = list.filter(o => o.action === 'use');
        assert.equal(uses.length, cards.length * findings.size);
        for (const u of uses) {
            assert.ok(cards.some(c => c.id === u.ids.techniqueId));
            assert.ok(findings.has(u.ids.findingId));
            assert.deepEqual(u.target, { card: u.ids.techniqueId, finding: u.ids.findingId });
            assert.equal(u.ids.itemId, model.techniqueItemId(view, u.ids.techniqueId));
        }
        assert.equal(new Set(uses.map(u => model.pendingKey('use', u.target))).size, uses.length, 'each use pair has its own key');
    });
}

test('a use offer exists whatever the finding status, and one per technique for the server item id', () => {
    const synthetic = {
        techniques: { phish: { name: 'Phish', itemId: 'item_7' } },
        hosts: [{ id: 'h', kind: 'pc', host: 'h', scanned: true, responding: true, services: [{ name: 'web', port: 80 }],
            findings: ['unconfirmed', 'confirmed', 'false'].map((status, i) => ({ id: `f${i}`, alias: `f${i}`, service: 'web', status, class: 'x', severity: 'low' }))
                .concat([{ id: 'f9', alias: 'f9', service: 'web', status: 'confirmed', fixed: true, class: 'x', severity: 'low' }]) }]
    };
    const uses = offers(synthetic).filter(o => o.action === 'use');
    assert.equal(uses.length, 4);
    assert.ok(uses.every(u => u.ids.itemId === 'item_7' && u.ids.techniqueId === 'phish'));
    // two held techniques are two cards; the map is keyed by id so one technique is one card
    const two = offers({ ...synthetic, techniques: { ...synthetic.techniques, phish_sms: { name: 'SMS', itemId: 'item_8' } } });
    assert.equal(two.filter(o => o.action === 'use').length, 8);
});

test('an unconfirmed finding offers Confirm and a settled one does not', () => {
    const view = {
        hosts: [{ id: 'h', kind: 'pc', host: 'h', scanned: true, responding: true, services: [{ name: 'web', port: 80 }],
            findings: [
                { id: 'a', alias: 'f1', service: 'web', status: 'unconfirmed' },
                { id: 'b', alias: 'f2', service: 'web', status: 'confirmed' },
                { id: 'c', alias: 'f3', service: 'web', status: 'false' },
                { id: 'd', alias: 'f4', service: 'web', status: 'confirmed', fixed: true }] }]
    };
    const c = offers(view).filter(o => o.action === 'confirm');
    assert.equal(c.length, 1);
    assert.equal(c[0].label, 'Confirm');
    assert.deepEqual(c[0].ids, { findingId: 'a' });
    assert.equal(c[0].target, 'a');
});

test('a locked remote session yields sign-in', () => {
    const v = views.find(x => x.name === 'locked_session').view;
    const rows = [...(v.hosts || []), ...(v.networks || []).flatMap(b => b.hosts || [])];
    const locked = rows.filter(r => scene.hostAction(r) === 'locked');
    assert.ok(locked.length);
    const list = offers(v);
    for (const r of locked) {
        assert.ok(list.some(o => o.action === 'sign-in' && o.target === r.id), r.id);
        assert.ok(!list.some(o => o.action === 'open' && o.target === r.id), r.id);
    }
});

test('only the offer under a pending key carries pending: true', () => {
    const v = views.find(x => x.name === 'techniques').view;
    const base = offers(v);
    assert.ok(base.length > 3);
    for (const target of base) {
        const key = model.pendingKey(target.action, target.target);
        const list = offers(v, { pending: new Set([key]) });
        const flagged = list.filter(o => o.pending === true);
        assert.deepEqual(flagged.map(o => model.pendingKey(o.action, o.target)), [key]);
        assert.equal(list.length, base.length);
        const asArray = offers(v, { pending: [key] });
        assert.equal(asArray.filter(o => o.pending === true).length, 1);
    }
    const j = offers(views.find(x => x.name === 'planted_box.at_jack').view, { unplugJack: 'jack', pending: new Set(['unplug:jack']) });
    assert.equal(j[0].pending, true);
});

test('the helpers answer as the scene exports do, for every fixture row', () => {
    let n = 0;
    for (const { view } of views) {
        const rows = [...(view.hosts || []), ...(view.networks || []).flatMap(b => b.hosts || [])];
        for (const r of rows) {
            n++;
            assert.equal(vc.hostAction(r), scene.hostAction(r), r.id);
            assert.equal(vc.resourceAction(r), scene.resourceAction(r), r.id);
            assert.deepEqual(vc.downState(r), scene.downState(r), r.id);
            assert.deepEqual(vc.downState(r, { inDownBlock: true }), scene.downState(r, { inDownBlock: true }), r.id);
            assert.deepEqual(vc.shareLockable(r, 'fh'), scene.shareLockable(r, 'fh'), r.id);
        }
        assert.deepEqual(vc.downState(view), scene.downState(view));
        assert.deepEqual(vc.displayOrder(rows), scene.displayOrder(rows));
        for (const b of view.networks || []) {
            assert.deepEqual(vc.downState(b), scene.downState(b));
            assert.deepEqual(vc.displayOrder(b.hosts), scene.displayOrder(b.hosts));
        }
    }
    assert.ok(n > 20);
    assert.deepEqual(vc.downState(null), scene.downState(null));
});

test('offers is pure and tolerates a missing view', () => {
    assert.deepEqual(offers(null), []);
    assert.deepEqual(offers({}), []);
    const v = views.find(x => x.name === 'techniques').view;
    const before = JSON.stringify(v);
    offers(v, { pending: new Set(['scan:x']) });
    assert.equal(JSON.stringify(v), before);
});
