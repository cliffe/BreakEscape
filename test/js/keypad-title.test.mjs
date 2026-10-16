// PIN and password keypads are titled with the lockable's name ("Enter PIN:
// Director's Safe"), not its engine type ("Enter PIN for item")
// (pass 5, approved item 7.4d; m08 E2).
// Run with: node --test test/js/keypad-title.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const { keypadTitle, lockableName } =
    await import(dataUrl(readFileSync(join(js, 'utils/lock-titles.js'), 'utf8')));

test('objects use their name', () => {
    assert.equal(keypadTitle('Enter PIN', { scenarioData: { name: "Director's Safe" } }, 'item'),
        "Enter PIN: Director's Safe");
    assert.equal(keypadTitle('Enter password', { scenarioData: { name: ' Admin PC ' } }, 'item'),
        'Enter password: Admin PC');
});

test('doors use their sign, or say Door', () => {
    assert.equal(keypadTitle('Enter PIN', { doorProperties: { door_sign: 'Cable Vault' } }, 'door'),
        'Enter PIN: Cable Vault');
    assert.equal(keypadTitle('Enter PIN', { doorProperties: {} }, 'door'), 'Enter PIN: Door');
});

test('nothing named: the plain prompt, never the engine type', () => {
    assert.equal(keypadTitle('Enter PIN', { scenarioData: {} }, 'item'), 'Enter PIN');
    assert.equal(keypadTitle('Enter PIN', null, 'item'), 'Enter PIN');
    assert.equal(lockableName({ scenarioData: { name: '   ' } }), null);
});

test('the starters no longer build "for ${type}" titles', () => {
    const src = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
    assert.doesNotMatch(src, /Enter PIN for \$\{type\}/);
    assert.doesNotMatch(src, /Enter password for \$\{type\}/);
    assert.match(src, /keypadTitle\('Enter PIN', lockable, type\)/);
});

test('the PIN pad shows the title on screen (its header is cleared)', () => {
    const pin = readFileSync(join(js, 'minigames/pin/pin-minigame.js'), 'utf8');
    assert.match(pin, /titleElement\.className = 'pin-minigame-title'/);
    assert.match(pin, /this\.params\.title !== 'PIN Entry'/);
});

// m07 #5 (engine regression 2026-10-16): the password dialog read just "Password:"
// while the PIN keypad named its lock. The field label now carries the title.
test('the password field is labelled with the lock it opens', () => {
    const src = readFileSync(join(js, 'minigames/password/password-minigame.js'), 'utf8');
    const start = src.indexOf('export function passwordFieldLabel');
    const fnSrc = src.slice(start, src.indexOf('\n}\n', start) + 3);
    const { passwordFieldLabel } = { passwordFieldLabel: new Function(`${fnSrc.replace('export ', '')}; return passwordFieldLabel;`)() };
    assert.equal(passwordFieldLabel(keypadTitle('Enter password', { doorProperties: { door_sign: 'SCADA Control' } }, 'door')),
        'Enter password: SCADA Control');
    assert.equal(passwordFieldLabel('Enter password'), 'Password:');
    assert.equal(passwordFieldLabel(undefined), 'Password:');
    assert.match(src, /<label for="password-field">\$\{displayDashes\(fieldLabel\)\}<\/label>/);
});
