// The two refusal lines of an #unlock_door tag read as they did on main (S8c R1-CLIENT4): a space after
// the colon. Run with: bin/test-js test/js/chat-helpers-unlock-wording.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/minigames/helpers/chat-helpers.js'), 'utf8');

test('the failed-unlock and unlock-error lines keep the space after the colon', () => {
    assert.ok(src.includes('`⚠️ Failed to unlock: ${getRoomDisplayName(param)} - ${unlockResult.error || \'Unknown error\'}`'));
    assert.ok(src.includes('`⚠️ Door unlock error: ${error.message}`'));
    assert.doesNotMatch(src, /Failed to unlock:\$\{/);
    assert.doesNotMatch(src, /Door unlock error:\$\{/);
});
