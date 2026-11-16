// The CyberChef and lab iframes start with no src attribute. An empty src="" makes the
// browser frame the empty URL on load, which the page's CSP (default-src 'self' https:)
// logs as a framing violation, and frame.src then reads back as the game page's own URL,
// so "open in new tab" before the first open would open the game. The open functions set
// the real src the first time (utils/crypto-workstation.js, utils/lab-workstation.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const view = readFileSync(join(root, 'app/views/break_escape/games/show.html.erb'), 'utf8');

for (const id of ['cyberchef-frame', 'lab-frame']) {
    test(`#${id} has no src attribute in the markup`, () => {
        const tag = view.match(new RegExp(`<iframe[^>]*id="${id}"[^>]*>`));
        assert.ok(tag, `#${id} iframe present`);
        assert.doesNotMatch(tag[0], /\ssrc=/, 'no src attribute (not even src="")');
        assert.match(tag[0], /\stitle="[^"]+"/, 'has a title for screen readers');
    });
}
