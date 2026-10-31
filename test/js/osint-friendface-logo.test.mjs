// Any FriendFace site in the OSINT browser shows the shared logo unless the scenario sets its own.
// Run with: node --test test/js/osint-friendface-logo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const src = readFileSync(join(root, 'js/minigames/osint-browser/osint-browser-minigame.js'), 'utf8');
const fnSrc = src.slice(src.indexOf('export function brandLogo'), src.indexOf('\n}\n', src.indexOf('export function brandLogo')) + 3).replace('export ', '');
const brandLogo = new Function(`${fnSrc}; return brandLogo;`)();

test('FriendFace sites by name, url or id get the shared logo', () => {
    for (const site of [{ name: 'Friendface' }, { url: 'friendface.example' }, { id: 'x_friendface' }, { name: 'FriendFace' }]) {
        assert.equal(brandLogo(site).logo, 'friendface.png');
        assert.ok(brandLogo(site).logoAlt);
    }
    assert.ok(existsSync(join(root, 'assets/logos/friendface.png')));
});
test('an explicit logo wins and other sites get none', () => {
    assert.equal(brandLogo({ name: 'Friendface', logo: 'other.png', logoAlt: 'O' }).logo, 'other.png');
    assert.equal(brandLogo({ name: 'Tarrowby careers', url: 'careers.example' }).logo, null);
});
test('logo: false means no logo, even for a FriendFace-named site', () => {
    for (const site of [{ name: 'Friendface', logo: false }, { id: 'x_friendface', url: 'friendface.example', logo: false, logoAlt: 'Friendface' }]) {
        assert.deepEqual(brandLogo(site), { logo: null, logoAlt: null });
    }
    // an empty string is still "not set", so the brand default applies as before
    assert.equal(brandLogo({ name: 'Friendface', logo: '' }).logo, 'friendface.png');
});
