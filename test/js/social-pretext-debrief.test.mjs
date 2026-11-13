// The pretext call debrief outcome line (lab R5 F3/J5). `got_it` means at least one
// ask was granted, but the call may also have had an ask refused. Saying "You got
// what you came for." over a refused ask misleads; the partial case gets its own line.
// renderDebrief builds DOM, so this runs in jsdom.
// Run with: bundle exec node --test test/js/social-pretext-debrief.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-pretext-debrief-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/pretext-judge.js', 'pretext-judge.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/social-intel.js', 'social-intel.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('minigames/person-chat/person-chat-pretext.js', 'person-chat-pretext.mjs', (s) => s
    .replace("'../../systems/global-writer.js'", "'./global-writer.mjs'")
    .replace("'../../systems/social-influence.js'", "'./social-influence.mjs'")
    .replace("'../../systems/social-intel.js'", "'./social-intel.mjs'"));

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const P = await import(pathToFileURL(join(dir, 'person-chat-pretext.mjs')).href);

// A plain session with only the fields renderDebrief/outcomeFor read.
const session = ({ granted = [], refusals = 0, reported = false } = {}) => ({
    grantedAsks: granted,
    refusals,
    reportedThisCall: reported,
    log: [{ turn: 1, kind: 'ask', id: 'portal_name', entries: [{ delta: 10, reason: 'intern' }], band: 0, result: 1 }]
});
const outcomeLine = (s) => {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    P.renderDebrief(container, { session: s, spec: {}, onDone: () => {} });
    return container.querySelector('.pretext-debrief-outcome').textContent;
};

test('got_it with a refused ask reads as partial, not total success (F3)', () => {
    const s = session({ granted: ['portal_name'], refusals: 1 });
    assert.equal(P.outcomeFor(s), 'got_it');
    assert.equal(outcomeLine(s), 'You got some of what you came for.');
});

test('got_it with no refusal keeps the full-success line', () => {
    const s = session({ granted: ['portal_name', 'payslip_date'], refusals: 0 });
    assert.equal(P.outcomeFor(s), 'got_it');
    assert.equal(outcomeLine(s), 'You got what you came for.');
});

test('walked away (no grant) and reported lines are unchanged', () => {
    assert.equal(outcomeLine(session({ granted: [], refusals: 1 })), 'You rang off.');
    assert.equal(outcomeLine(session({ granted: ['portal_name'], refusals: 2, reported: true })), 'The call was reported.');
});

test('the debrief is a centred modal over a backdrop, with a real Done (F-E12-3)', () => {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    let done = false;
    const panel = P.renderDebrief(container, { session: session({ granted: ['portal_name'] }), spec: {}, onDone: () => { done = true; } });
    const backdrop = container.querySelector('.pretext-debrief-backdrop');
    assert.ok(backdrop, 'a full backdrop wraps the debrief so the chat behind is covered');
    assert.equal(panel.parentNode, backdrop, 'the panel sits inside the backdrop');
    assert.equal(panel.getAttribute('role'), 'dialog');
    const doneBtn = panel.querySelector('.pretext-debrief-done');
    assert.ok(doneBtn, 'a Done button');
    assert.equal(doneBtn.tagName, 'BUTTON');
    // Done removes the whole backdrop (not just the panel) and reports done.
    doneBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(done, true);
    assert.equal(container.querySelector('.pretext-debrief-backdrop'), null, 'the backdrop is cleared on Done');
});

test('got_it with an ask left pending and never granted reads as partial (lab R9 F3)', () => {
    const s = {
        grantedAsks: ['payslip_date'], refusals: 0, reportedThisCall: false,
        log: [
            { turn: 1, kind: 'ask', id: 'portal_name', entries: [], band: 0, result: 2 },
            { turn: 2, kind: 'say', id: 'open_buddy', entries: [{ delta: 10, reason: 'intern' }], band: 0 },
            { turn: 3, kind: 'ask', id: 'payslip_date', entries: [{ delta: -10, reason: 'payslip_date' }], band: 0, result: 1 }
        ]
    };
    assert.equal(P.outcomeFor(s), 'got_it');
    assert.equal(outcomeLine(s), 'You got some of what you came for.');
    // The same ask pending, then granted on a re-ask, is a full success.
    s.grantedAsks = ['payslip_date', 'portal_name'];
    s.log.push({ turn: 4, kind: 'ask', id: 'portal_name', entries: [], band: 0, result: 1 });
    assert.equal(outcomeLine(s), 'You got what you came for.');
});
