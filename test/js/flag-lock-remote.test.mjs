// A flag lock with no 'requires' (opened by a flag-station reward) says where it
// unlocks instead of opening a flag prompt that rejects every flag
// (pass 5, approved item 7.4a; m07 E1, m02's staging cache).
// Run with: node --test test/js/flag-lock-remote.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const { isRemoteFlagLock, remoteFlagLockMessage } =
    await import(dataUrl(readFileSync(join(js, 'utils/flag-lock.js'), 'utf8')));

test('only a locked flag lock the server marked as remote skips the prompt', () => {
    assert.equal(isRemoteFlagLock({ locked: true, lockType: 'flag', flagUnlockedRemotely: true }), true);
    assert.equal(isRemoteFlagLock({ locked: true, lockType: 'flag' }), false, 'flag lock with its own flag');
    assert.equal(isRemoteFlagLock({ locked: false, lockType: 'flag', flagUnlockedRemotely: true }), false, 'already open');
    assert.equal(isRemoteFlagLock({ locked: true, lockType: 'pin', flagUnlockedRemotely: true }), false);
    assert.equal(isRemoteFlagLock(null), false);
});

test('the message names the station when the server found one', () => {
    assert.equal(
        remoteFlagLockMessage({ flagUnlockedAt: 'Drop-Site Terminal' }),
        "It doesn't take a flag here. It unlocks when the right flag is submitted at the Drop-Site Terminal."
    );
    assert.match(remoteFlagLockMessage({ flagUnlockedAt: 'The Relay' }), /submitted at The Relay\.$/);
    assert.match(remoteFlagLockMessage({}), /submitted at a flag station\.$/);
    assert.match(remoteFlagLockMessage({ flagUnlockedAt: '  ' }), /a flag station/);
});

test('interactions.js checks for a remote flag lock before opening the flag prompt', () => {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const remote = src.indexOf('if (isRemoteFlagLock(data))');
    const prompt = src.indexOf("startMinigame('flag-station', null, {\n            mode: 'lock'");
    assert.ok(remote > 0 && prompt > 0 && remote < prompt);
});
