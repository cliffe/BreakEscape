// C2-M6: the header panel's authentication checks are labelled in plain words under the
// awareness skin, and keep the SPF/DKIM/DMARC names for the lab (analyst). Run with:
//   bundle exec node --test test/js/social-header-panel-labels.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-header-panel-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/inbox-triage/header-panel.js', 'minigames/inbox-triage/triage-flags.js', 'systems/phish-rules.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
const { buildHeaderPanel } = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/header-panel.js')));

const rec = { from: { name: 'Payroll', address: 'payroll@ledgerwell.example' },
    auth: { spf: 'fail', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'bounce.example', replyTo: 'x@elsewhere.example' } };
const view = { glossaryOpen: false, explain: null };

test('plain skin: no SPF/DKIM/DMARC jargon in the panel, plain labels and title instead', () => {
    const panel = buildHeaderPanel(rec, view, {}, { plain: true });
    const names = [...panel.querySelectorAll('.tri-auth-name')].map((n) => n.textContent);
    assert.deepEqual(names, ['Sending server', 'Signature', 'Domain check']);
    assert.equal(panel.querySelector('.tri-auth-title').textContent, 'Did the domain really send this?');
    assert.ok(!/\bSPF\b|\bDKIM\b|\bDMARC\b|Authentication-Results/.test(panel.textContent),
        'no authentication jargon under the awareness skin');
});

test('lab (default): SPF/DKIM/DMARC names and the technical title are kept', () => {
    const panel = buildHeaderPanel(rec, view, {}, { plain: false });
    const names = [...panel.querySelectorAll('.tri-auth-name')].map((n) => n.textContent);
    assert.deepEqual(names, ['SPF', 'DKIM', 'DMARC']);
    assert.equal(panel.querySelector('.tri-auth-title').textContent, 'Authentication-Results');
});
