// UI SE fix round 2 part D: the phone/authenticator styling items (C-AU1, C-PH1, C-PH2, C-PH4).
// Source-level checks that the shared in-game phone look and the on-device placements are in place.
// Run with: node --test test/js/social-phone-ui-partd.test.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const be = join(here, '../../public/break_escape');
const read = (p) => readFileSync(join(be, p), 'utf8');

test('C-AU1: the authenticator phone reuses the shared stepped shell with a status bar', () => {
    const css = read('css/authenticator-minigame.css');
    assert.match(css, /\.auth-phone\s*\{[^}]*clip-path:\s*polygon/, 'the shell has the stepped pixel clip-path');
    assert.match(css, /\.auth-phone-screen\b/, 'an inner screen holds the status bar and feed');
    assert.match(css, /\.auth-phone-status\b/, 'a status bar replaces the lone speaker slot');
    assert.match(css, /\.auth-signal-bar\b/, 'signal bars, as phone-chat draws');
    assert.doesNotMatch(css, /\.auth-phone-speaker\b/, 'the old rounded speaker slot is gone');
    const js = read('js/minigames/authenticator/authenticator-minigame.js');
    assert.match(js, /auth-phone-status/);
    assert.match(js, /auth-signal-bar/);
    assert.match(js, /auth-battery/);
    assert.doesNotMatch(js, /auth-phone-speaker/);
});

test('C-PH1: the phone notification shows inside the phone screen, styled', () => {
    const ui = read('js/minigames/phone-chat/phone-chat-ui.js');
    assert.match(ui, /querySelector\('\.phone-screen'\)\s*\|\|\s*this\.container/,
        'the toast is hosted in the phone screen, not dropped on the backdrop');
    const css = read('css/phone-chat-minigame.css');
    assert.match(css, /\.phone-notification\s*\{/, 'the toast has its own styles');
    assert.match(css, /\.phone-notification[\s\S]*?font-family:\s*'GNF'/, 'GNF, a pixel font');
    assert.match(css, /\.phone-notification[\s\S]*?border:\s*2px/, 'a 2px pixel border');
});

test('C-PH2: Add to Notepad is anchored on the phone, not the framework controls row', () => {
    const js = read('js/minigames/phone-chat/phone-chat-minigame.js');
    assert.match(js, /if \(!this\.params\.ringerCall\) \{/, 'still skipped on a ringer call');
    assert.match(js, /querySelector\('\.phone-header'\)/, 'anchored on the phone status bar first');
    assert.doesNotMatch(js, /this\.ensureControlsRow\(\)/, 'no longer uses the framework controls row');
    const css = read('css/phone-chat-minigame.css');
    assert.match(css, /\.phone-notepad-btn\s*\{/, 'the on-device button has its own pixel styles');
});
