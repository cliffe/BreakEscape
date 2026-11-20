// D144 m6: the Resume overlay on a game whose VM set was released hides New Session and
// Start over, says why, and offers Back to missions (same-origin shell URL only).
// Run with: bin/test-js test/js/session-released-overlay.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'session-released-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['ui/session-restart-confirm.js', 'utils/desktop-app.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const { applyReleasedState, RELEASED_NOTE, BACK_TO_MISSIONS_LABEL } =
    await import(pathToFileURL(join(dir, 'ui/session-restart-confirm.js')));

const BASE = 'https://be.example/break_escape/games/1';
function overlay() {
    const dom = new JSDOM(`<!doctype html><body><div id="session-main-row">
      <button id="session-resume-btn">Resume</button><button id="session-restart-btn">Start over</button>
      <button id="session-new-btn">New Session</button></div></body>`);
    return dom.window.document;
}
const shown = (doc, id) => doc.getElementById(id).style.display !== 'none';

test('not released: nothing changes', () => {
    const doc = overlay();
    assert.equal(applyReleasedState({ doc, released: false, cfg: { shellMenuUrl: '/m' }, base: BASE }), false);
    assert.ok(shown(doc, 'session-restart-btn') && shown(doc, 'session-new-btn'));
    assert.ok(doc.getElementById('session-back-link') === null);
    assert.ok(doc.getElementById('session-released-note') === null);
});

test('released: both buttons hidden, note shown, Resume kept, link to the menu', () => {
    const doc = overlay();
    assert.equal(applyReleasedState({ doc, released: true, cfg: { shellMenuUrl: '/hacktivity/events/1' }, base: BASE }), true);
    assert.ok(!shown(doc, 'session-restart-btn'));
    assert.ok(!shown(doc, 'session-new-btn'));
    assert.ok(shown(doc, 'session-resume-btn'));
    const a = doc.getElementById('session-back-link');
    assert.equal(a.textContent, BACK_TO_MISSIONS_LABEL);
    assert.equal(a.getAttribute('href'), 'https://be.example/hacktivity/events/1');
    assert.equal(doc.getElementById('session-released-note').textContent, RELEASED_NOTE);
});

test('released: falls back to shellReturnUrl; a foreign or unsafe URL gives no link but the note stays', () => {
    const doc = overlay();
    applyReleasedState({ doc, released: true, cfg: { shellReturnUrl: '/back' }, base: BASE });
    assert.equal(doc.getElementById('session-back-link').getAttribute('href'), 'https://be.example/back');
    for (const bad of ['javascript:alert(1)', 'https://evil.example/x', '//evil.example/x']) {
        const d = overlay();
        applyReleasedState({ doc: d, released: true, cfg: { shellMenuUrl: bad }, base: BASE });
        assert.ok(d.getElementById('session-back-link') === null, bad);
        assert.ok(d.getElementById('session-released-note'));
        assert.ok(!shown(d, 'session-new-btn'));
    }
});
