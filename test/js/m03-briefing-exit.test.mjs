// The m03 opening briefing must close the chat itself (#exit_conversation) on every
// path to its end, as the m01/m02/m06 briefings do. #start_gameplay has no engine
// handler, so without the exit tag the player is left on "(Conversation ended ...)".
// Run with: node test/js/m03-briefing-exit.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);
const json = readFileSync(join(root, 'scenarios/m03_ghost_in_the_machine/ink/m03_opening_briefing.json'), 'utf8').replace(/^﻿/, '');

// Plays to the end choosing with pick(choices, step); returns the tags seen after the
// last choice was made (the closing stretch of the conversation).
function playToEnd(pick) {
    const s = new Story(json);
    let tail = [];
    for (let step = 0; step < 200; step++) {
        while (s.canContinue) { s.Continue(); tail.push(...(s.currentTags || [])); }
        if (!s.currentChoices.length) return tail;
        tail = [];
        s.ChooseChoiceIndex(pick(s.currentChoices, step));
    }
    throw new Error('briefing did not end within 200 steps');
}

const strategies = {
    'first choice': () => 0,
    'last choice': (c) => c.length - 1,
    'alternating': (c, i) => i % c.length,
    'second choice': (c) => Math.min(1, c.length - 1),
};

for (const [name, pick] of Object.entries(strategies)) {
    test(`m03 briefing ends with exit_conversation (${name})`, () => {
        const tail = playToEnd(pick);
        assert.ok(tail.includes('exit_conversation'), `closing tags were: ${JSON.stringify(tail)}`);
    });
}
