// Phone call mode: a voiced call draws a call screen with subtitles, not a thread.
// Run with: node --test test/js/phone-call-mode.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-call-mode-test-'));
writeFileSync(join(dir, 'phone-call-ui.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-call-ui.js'), 'utf8'));
const { isPhoneCallMode, callLabelFor, formatCallDuration, callSubtitle, CALL_CONTROLS_HTML } =
    await import(pathToFileURL(join(dir, 'phone-call-ui.mjs')).href);

test('only a voiced, non-terminal phone is a call screen', () => {
    assert.equal(isPhoneCallMode({ voiced: true }), true);
    assert.equal(isPhoneCallMode({ voiced: true, theme: 'social' }), true);
    assert.equal(isPhoneCallMode({ voiced: true, theme: 'terminal' }), false);
    assert.equal(isPhoneCallMode({ voiced: 'yes' }), false);
    assert.equal(isPhoneCallMode({}), false);
    assert.equal(isPhoneCallMode(null), false);
});

test('call duration reads as m:ss, then h:mm:ss', () => {
    assert.equal(formatCallDuration(0), '0:00');
    assert.equal(formatCallDuration(7_400), '0:07');
    assert.equal(formatCallDuration(84_000), '1:24');
    assert.equal(formatCallDuration(3_725_000), '1:02:05');
    assert.equal(formatCallDuration(-5), '0:00');
});

test('subtitles name who is speaking', () => {
    const hax = { id: 'hax', displayName: 'Agent HaX' };
    assert.deepEqual(callSubtitle('npc', 'Bag it anyway.', hax), { speaker: 'Agent HaX', text: 'Bag it anyway.' });
    assert.deepEqual(callSubtitle('player', 'On it.', hax), { speaker: 'You', text: 'On it.' });
    assert.deepEqual(callSubtitle('narrator', 'The line crackles.', hax), { speaker: null, text: 'The line crackles.' });
    assert.deepEqual(callSubtitle('npc', 'voice: Call me back.', hax), { speaker: 'Agent HaX', text: 'Call me back.' });
    assert.deepEqual(callSubtitle('npc', 'Director Netherton: Proceed.', hax, { name: 'Director Netherton', text: 'Proceed.' }),
        { speaker: 'Director Netherton', text: 'Proceed.' });
    assert.deepEqual(callSubtitle('npc', 'Hi', { id: 'x' }), { speaker: 'x', text: 'Hi' });
});

test('the end-call button is a labelled button', () => {
    assert.match(CALL_CONTROLS_HTML, /<button type="button" class="call-end-button"[^>]*aria-label="End call"/);
});

test("the caption under the name is the scenario's, else Voice call", () => {
    assert.equal(callLabelFor({ callLabel: 'SAFETYNET secure line' }, { callLabel: 'Mobile' }), 'SAFETYNET secure line');
    assert.equal(callLabelFor({}, { callLabel: 'Unknown number' }), 'Unknown number');
    assert.equal(callLabelFor({ callLabel: '  ' }, {}), 'Voice call');
    assert.equal(callLabelFor(null, null), 'Voice call');
});
