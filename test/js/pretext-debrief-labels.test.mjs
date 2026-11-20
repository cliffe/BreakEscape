// Direct messages (social theme): the pretext debrief and prep wording are selectable by
// theme. The default is the call copy every existing scenario shows; a DM app (theme 'social')
// says chat, not call; a pretext entry's own `labels` block overrides per theme; a 'terminal'
// phone keeps the call copy. renderDebrief builds DOM, so this runs in jsdom.
// Run with: bundle exec node --test test/js/pretext-debrief-labels.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'pretext-labels-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/pretext-judge.js', 'pretext-judge.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/social-intel.js', 'social-intel.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('minigames/person-chat/person-chat-pretext.js', 'person-chat-pretext.mjs', (s) => s
    .replace("'../../systems/global-writer.js'", "'./global-writer.mjs'")
    .replace("'../../systems/social-influence.js'", "'./social-influence.mjs'")
    .replace("'../../systems/social-intel.js'", "'./social-intel.mjs'"));
// pretext-card.js imports mail-composer (a heavy chain) only for the prep board; the wording
// helpers under test need none of it, so the import is neutralised to keep the test light.
copy('minigames/pretext-prep/pretext-card.js', 'pretext-card.mjs', (s) => s
    .replace(/import \{[^}]*\} from '\.\.\/mail-client\/mail-composer\.js';/, 'const heldFactIds = () => [], heldProvides = () => [], optionsForSlot = () => [];'));

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const P = await import(pathToFileURL(join(dir, 'person-chat-pretext.mjs')).href);
const C = await import(pathToFileURL(join(dir, 'pretext-card.mjs')).href);

const session = ({ granted = [], refusals = 0, reported = false } = {}) => ({
    grantedAsks: granted,
    refusals,
    reportedThisCall: reported,
    log: [{ turn: 1, kind: 'ask', id: 'guest_list', entries: [{ delta: 10, reason: 'honest' }], band: 0, result: 1 }]
});

const debrief = (spec, theme) => {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    P.renderDebrief(container, { session: session({ granted: ['guest_list'] }), spec, theme, onDone: () => {} });
    return {
        title: container.querySelector('.pretext-debrief-title').textContent,
        outcome: container.querySelector('.pretext-debrief-outcome').textContent
    };
};

test('debriefLabels: default is the call copy, social is the chat copy', () => {
    const d = P.debriefLabels({}, null);
    assert.equal(d.debriefTitle, 'Call debrief');
    assert.equal(d.reported, 'The call was reported.');
    assert.equal(d.walked_away, 'You rang off.');

    const s = P.debriefLabels({}, 'social');
    assert.equal(s.debriefTitle, 'Chat debrief');
    assert.equal(s.reported, 'The chat was reported.');
    assert.equal(s.walked_away, 'You left the chat.');
});

test('debriefLabels: a terminal phone keeps the default call copy', () => {
    const t = P.debriefLabels({}, 'terminal');
    assert.equal(t.debriefTitle, 'Call debrief');
    assert.equal(t.walked_away, 'You rang off.');
});

test('debriefLabels: a pretext labels block overrides per theme, others untouched', () => {
    const spec = { labels: { social: { debriefTitle: 'DM debrief', reported: 'They blocked you.' } } };
    const s = P.debriefLabels(spec, 'social');
    assert.equal(s.debriefTitle, 'DM debrief');
    assert.equal(s.reported, 'They blocked you.');
    assert.equal(s.walked_away, 'You left the chat.'); // unspecified key keeps the social default
    // The override is scoped to its theme: the default theme is unaffected
    assert.equal(P.debriefLabels(spec, null).debriefTitle, 'Call debrief');
});

test('renderDebrief shows the themed title and outcome line (social = chat)', () => {
    assert.equal(debrief({}, null).title, 'Call debrief');
    const social = debrief({}, 'social');
    assert.equal(social.title, 'Chat debrief');
    assert.equal(social.outcome, 'You got what you came for.');
});

test('callWords/callBeginLabel: a phone call versus a social DM (prepLabels still wins)', () => {
    const phoneNpc = { npcType: 'phone' };
    assert.equal(C.callWords({}, phoneNpc, null).title, 'Prepare the call');
    assert.equal(C.callWords({}, phoneNpc, 'social').title, 'Prepare the chat');
    assert.equal(C.callBeginLabel({}, phoneNpc, null), 'Make the call');
    assert.equal(C.callBeginLabel({}, phoneNpc, 'social'), 'Start the chat');
    // prepLabels overrides whatever the theme would pick
    assert.equal(C.callWords({ prepLabels: { title: 'Line up the message' } }, phoneNpc, 'social').title, 'Line up the message');
    assert.equal(C.callBeginLabel({ prepLabels: { beginLabel: 'Send it' } }, phoneNpc, 'social'), 'Send it');
});
