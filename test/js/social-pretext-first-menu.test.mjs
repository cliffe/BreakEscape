// The fresh pretext call's opening menu (M2 / lab playtest R1 F1).
//
// The lab's Dev service-desk call opens phone-chat on a contact whose opening was
// already PRELOADED into the thread. The preload runs the opening as a dry run, with
// the pretext card VARs (pretext_intern_name, pretext_team_name) still empty, so it
// bakes a blank choice — "I'm helping , your new starter in ." — into the saved story
// state. On the fresh call the loader restores that state and must re-bake the opening
// choices once the card VARs are filled, or the first menu (and the first sent line)
// show the blanks. The card VARs are story-LOCAL, so the ordinary reopen re-run (gated
// on a GLOBAL change) never fires for them: the loader forces it for a fresh call.
//
// This drives PhoneChatConversation.reopenWithCurrentGlobals with the real
// fillPretextVars in the sync callback, exactly as phone-chat-minigame.js does.
// Run with: bundle exec node --test test/js/social-pretext-first-menu.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-pretext-first-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));

copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/social-intel.js', 'social-intel.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('minigames/person-chat/person-chat-pretext.js', 'person-chat-pretext.mjs', s => s
    .replace("'../../systems/global-writer.js'", "'./global-writer.mjs'")
    .replace("'../../systems/social-influence.js'", "'./social-influence.mjs'")
    .replace("'../../systems/social-intel.js'", "'./social-intel.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const { fillPretextVars } = await import(pathToFileURL(join(dir, 'person-chat-pretext.mjs')).href);

const storyJson = JSON.parse(readFileSync(join(here, 'fixtures/social_pretext_first_menu.json'), 'utf8').replace(/^﻿/, ''));

// The card the student prepared: fact id -> { value, label } (fillPretextVars).
const blanks = { intern: { value: 'sofia_lord', label: 'Sofia Lord' }, team: { value: 'finance', label: 'Finance' } };

const quiet = (fn) => {
    const { log } = console;
    console.log = () => {};
    try { return fn(); } finally { console.log = log; }
};

// The preload: run the opening to its choices with the card VARs still empty, as
// PhoneChatConversation._preloadOpeningOnce does, and keep the saved state.
async function preload() {
    const conv = new PhoneChatConversation('dev', { getNPC: () => null }, new InkEngine('dev'));
    await conv.loadStory(storyJson);
    conv.goToKnot('start');
    const lines = [];
    let r;
    do { r = conv.continue(); if (r.text) lines.push(r.text.trim()); } while (!r.choices?.length && !r.hasEnded);
    return { lines, saved: conv.saveState() };
}

// A fresh call: restore the preloaded state, then reopen with the card VARs filled.
async function freshCall({ force }) {
    const conv = new PhoneChatConversation('dev', { getNPC: () => null }, new InkEngine('dev'));
    await conv.loadStory(storyJson);
    assert.equal(conv.restoreState((await preload()).saved), true);
    const out = conv.reopenWithCurrentGlobals(
        story => fillPretextVars(story, blanks),
        { force }
    );
    return { conv, out };
}

test('the preload bakes the blank opening choice (the bug it must fix)', async () => {
    const { lines, saved } = await quiet(() => preload());
    assert.deepEqual(lines, ['Dev: Service desk, Dev speaking. What can I do for you?']);
    const conv = new PhoneChatConversation('dev', { getNPC: () => null }, new InkEngine('dev'));
    await conv.loadStory(storyJson);
    conv.restoreState(saved);
    assert.equal(conv.engine.currentChoices[0].text, 'I\'m helping , your new starter in .',
        'preload baked the choice with the card VARs empty');
});

test('a fresh call re-bakes the opening choices with the card VARs filled', async () => {
    const { conv, out } = await quiet(() => freshCall({ force: true }));
    assert.equal(out.renavigated, true);
    assert.deepEqual(out.messages, [], 'the greeting is already in the thread and is not replayed');
    assert.equal(out.result.choices[0].text, 'I\'m helping Sofia Lord, your new starter in Finance.');
    assert.equal(conv.engine.currentChoices[0].text, 'I\'m helping Sofia Lord, your new starter in Finance.',
        'the live choices the UI reads are filled too');
});

test('without the force the card VARs never reach the choices (reproduces F1)', async () => {
    const { conv, out } = await quiet(() => freshCall({ force: false }));
    assert.equal(out.renavigated, false, 'a story-local VAR change alone does not trigger a re-run');
    assert.equal(conv.engine.currentChoices[0].text, 'I\'m helping , your new starter in .',
        'the baked blank choice is still what the UI would show');
});
