// Unit 12 of S6: the Scanning bar of the Panels renderer (a pending sweep or scan), and the notice
// for a request that got no reply. The harness mounts the real scene with held answers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mount, loadFixture, settle, FIXTURE_DIR } from './support/network-view-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(here, '../../public/break_escape/css/network-view-minigame.css'), 'utf8');
const BAR = '.network-scan-bar';

const press = async (fixture, selector, opts = {}) => {
    const h = await mount(loadFixture(fixture), { ...opts, hold: true });
    h.view().container.querySelector(selector).click();
    await settle();
    return h;
};
const root = (h) => h.view().container;
const SWEEP = '[data-action="sweep"]';
const SCAN = '[data-host-id="print02"] [data-action="scan"]';

test('a pending sweep: the bar is in the block row, which is busy, and nowhere else', async () => {
    const h = await press('discovery_unswept', SWEEP);
    const bars = root(h).querySelectorAll(BAR);
    assert.equal(bars.length, 1);
    const row = bars[0].closest('.network-block-ops');
    assert.ok(row, 'inside the block row');
    assert.equal(row.getAttribute('aria-busy'), 'true');
    assert.equal(root(h).querySelectorAll('[aria-busy]').length, 1);
    h.end();
});

test('a pending scan: the bar is in that host row, which is busy, and no other', async () => {
    const h = await press('swept_hosts', SCAN);
    const bars = root(h).querySelectorAll(BAR);
    assert.equal(bars.length, 1);
    const row = bars[0].closest('[data-host-id]');
    assert.equal(row.dataset.hostId, 'print02');
    assert.equal(row.getAttribute('aria-busy'), 'true');
    assert.equal(root(h).querySelectorAll('[aria-busy]').length, 1);
    assert.equal(root(h).querySelectorAll('.network-block-ops[aria-busy]').length, 0);
    h.end();
});

test('the bar is a progressbar with no value, labelled Scanning', async () => {
    const h = await press('swept_hosts', SCAN);
    const bar = root(h).querySelector(BAR);
    assert.equal(bar.getAttribute('role'), 'progressbar');
    for (const a of ['aria-valuenow', 'aria-valuemin', 'aria-valuemax']) assert.equal(bar.hasAttribute(a), false, a);
    assert.equal(bar.textContent.trim(), 'Scanning');
    h.end();
});

test('no bar for a pending check', async () => {
    const h = await press('swept_hosts', '[data-service="web"] [data-action="check"]');
    assert.equal(root(h).querySelector('[data-action="check"][disabled]') !== null, true, 'the check is pending');
    assert.equal(root(h).querySelectorAll(BAR).length, 0);
    assert.equal(root(h).querySelectorAll('[aria-busy]').length, 0);
    h.end();
});

test('no bar for a pending unplug', async () => {
    const h = await press('planted_box', '[data-unplug]', { unplug: true });
    assert.equal(root(h).querySelector('[data-unplug]').disabled, true, 'the unplug is pending');
    assert.equal(root(h).querySelectorAll(BAR).length, 0);
    assert.equal(root(h).querySelectorAll('[aria-busy]').length, 0);
    h.end();
});

test('the bar goes when the request ends with an answer', async () => {
    const h = await press('swept_hosts', SCAN);
    await h.release({ success: true });
    assert.equal(root(h).querySelectorAll(BAR).length, 0);
    assert.equal(root(h).querySelectorAll('[aria-busy]').length, 0);
    h.end();
});

test('the bar goes when the request is refused', async () => {
    const h = await press('swept_hosts', SCAN);
    await h.release({ success: false, reason: 'not_found' });
    assert.equal(root(h).querySelectorAll(BAR).length, 0);
    assert.equal(root(h).querySelectorAll('[aria-busy]').length, 0);
    h.end();
});

test('the bar goes when the request fails with no answer', async () => {
    const h = await press('discovery_unswept', SWEEP);
    await h.release(Object.assign(new Error('down'), { status: 500 }));
    assert.equal(root(h).querySelectorAll(BAR).length, 0);
    assert.equal(root(h).querySelectorAll('[aria-busy]').length, 0);
    h.end();
});

test('showResult with a null answer draws the failure text on the control row', async () => {
    const { REQUEST_FAILED_TEXT } = await import('../../public/break_escape/js/minigames/network-view/view-texts.js');
    for (const [fixture, selector, rowSel, offer] of [
        ['swept_hosts', SCAN, '[data-host-id="print02"]', { action: 'scan', target: 'print02' }],
        ['discovery_unswept', SWEEP, '.network-block-ops', { action: 'sweep', target: 'lab_net' }]
    ]) {
        const h = await mount(loadFixture(fixture));
        const scene = h.view();
        scene.renderer.showResult(offer, null, scene.sceneState());
        const note = root(h).querySelector(`${rowSel} .network-row-notice`);
        assert.ok(note, `${offer.action}: a notice on the row`);
        assert.equal(note.textContent, REQUEST_FAILED_TEXT);
        h.end();
    }
});

test('showResult with a null answer for a check draws no row notice here', async () => {
    const h = await mount(loadFixture('swept_hosts'));
    const scene = h.view();
    scene.renderer.showResult({ action: 'check', target: 'print01|web' }, null, scene.sceneState());
    assert.equal(root(h).querySelectorAll('.network-row-notice').length, 0);
    h.end();
});

test('CSS: 2px square border, no radius, pixel font, stepped fill, a static bar for reduced motion', () => {
    const block = (sel) => {
        const i = CSS.indexOf(`${sel} {`);
        assert.ok(i >= 0, sel);
        return CSS.slice(i, CSS.indexOf('}', i));
    };
    const bar = block(BAR);
    assert.match(bar, /border:\s*2px solid/);
    assert.match(bar, /border-radius:\s*0/);
    assert.match(bar, /font-family:\s*'GNF'/);
    assert.ok(!/box-shadow|text-shadow|filter/.test(bar));
    assert.match(block('.network-scan-bar-fill'), /animation:[^;]*steps\(\d+/);
    const m = CSS.match(/@media \(prefers-reduced-motion: reduce\) \{\s*\.network-scan-bar-fill \{([^}]*)\}/);
    assert.ok(m, 'a reduced-motion block for the fill');
    assert.match(m[1], /animation:\s*none/);
    assert.match(m[1], /width:\s*100%/);
});

// The re-recorded held states differ from the old ones by the bar and aria-busy and nothing else.
test('the re-recorded held sweep and scan DOMs equal the old ones once the bar and aria-busy are removed', () => {
    const olds = JSON.parse(readFileSync(join(FIXTURE_DIR, 'panels-before/scan-bar-old-pending.json'), 'utf8'));
    assert.equal(olds.length, 5);
    const stripBar = (s) => s
        .replace(/<span class="network-scan-bar"[^>]*><span class="network-scan-bar-text">Scanning<\/span><span class="network-scan-bar-fill"><\/span><\/span>/g, '')
        .replace(/ aria-busy="true"/g, '');
    for (const o of olds) {
        const saved = JSON.parse(readFileSync(join(FIXTURE_DIR, `panels-before/${o.variant}.json`), 'utf8'));
        const now = saved.controls[o.control].pendingDom;
        assert.ok(now.includes('network-scan-bar'), `${o.variant} #${o.control} holds the bar`);
        assert.equal(stripBar(now), o.old, `${o.variant} #${o.control}`);
    }
});
