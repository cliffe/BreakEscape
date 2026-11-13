// Direct messages (social theme): the `app` block on a phone device, the NPC `handle` and
// `profile`, and the View profile launch target. phone-app.js has no imports, so it is copied
// to a temp .mjs and loaded directly (the repo has no "type": "module").
// Run with: node --test test/js/phone-chat-social-app.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-app-test-'));
writeFileSync(join(dir, 'phone-app.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-app.js'), 'utf8'));
const A = await import(pathToFileURL(join(dir, 'phone-app.mjs')).href);

// A Friendface phone in inventory and a desk laptop with the same phoneId, plus the m02-style
// terminal phone (no app) that must keep resolving to its NPC phoneTheme.
const scenario = {
    startItemsInInventory: [
        { type: 'phone', phoneId: 'friendface_dm', app: { title: 'Friendface', theme: 'social', accent: '#3b5bdb', chrome: 'app' } },
        { type: 'phone', phoneId: 'handler', observations: 'A plain handler phone, no app.' }
    ],
    rooms: {
        flat: { objects: [{ type: 'phone', phoneId: 'friendface_dm', app: { title: 'Friendface', theme: 'social' } }] }
    }
};

test('normaliseAccent expands shorthand and rejects non-hex', () => {
    assert.equal(A.normaliseAccent('#3b5bdb'), '#3b5bdb');
    assert.equal(A.normaliseAccent('#abc'), '#aabbcc');
    assert.equal(A.normaliseAccent('blue'), null);
    assert.equal(A.normaliseAccent('#12'), null);
    assert.equal(A.normaliseAccent(42), null);
});

test('onAccentColour picks readable text for the accent', () => {
    assert.equal(A.onAccentColour('#3b5bdb'), '#ffffff'); // dark blue -> white text
    assert.equal(A.onAccentColour('#ffe066'), '#111111'); // light yellow -> dark text
});

test('normaliseApp keeps valid fields, drops unknown values, returns null for a non-app', () => {
    const app = A.normaliseApp({ title: '  Friendface ', theme: 'social', accent: '#3b5bdb', chrome: 'app', junk: 1 });
    assert.deepEqual(app, { title: 'Friendface', theme: 'social', accent: '#3b5bdb', chrome: 'app' });
    // An out-of-enum theme and a bad accent are simply dropped
    const partial = A.normaliseApp({ theme: 'neon', accent: 'blue', chrome: 'phone' });
    assert.deepEqual(partial, null);
    assert.equal(A.normaliseApp(null), null);
    assert.equal(A.normaliseApp('x'), null);
});

test('findPhoneApp finds the device app from inventory and from a room object', () => {
    assert.deepEqual(A.findPhoneApp(scenario, 'friendface_dm'),
        { title: 'Friendface', theme: 'social', accent: '#3b5bdb', chrome: 'app' });
    assert.equal(A.findPhoneApp(scenario, 'handler'), null); // device exists but has no app
    assert.equal(A.findPhoneApp(scenario, 'nope'), null);
    assert.equal(A.findPhoneApp(scenario, null), null);
});

test('resolvePhoneApp: the app theme wins, and a themeless phone falls back to the NPC phoneTheme', () => {
    // App device: social theme and chrome come from the app block
    const r1 = A.resolvePhoneApp({ params: { phoneId: 'friendface_dm' }, scenario });
    assert.equal(r1.theme, 'social');
    assert.equal(r1.app.chrome, 'app');

    // A terminal phone with no app: the NPC phoneTheme is the fallback (m02/m07 unchanged)
    const r2 = A.resolvePhoneApp({ params: { phoneId: 'handler' }, npc: { phoneTheme: 'terminal', phoneId: 'handler' }, scenario });
    assert.equal(r2.app, null);
    assert.equal(r2.theme, 'terminal');

    // A plain phone with neither app nor phoneTheme resolves to no theme at all
    const r3 = A.resolvePhoneApp({ params: { phoneId: 'handler' }, npc: { phoneId: 'handler' }, scenario });
    assert.equal(r3.theme, undefined);
});

test('resolvePhoneApp: an app passed in params (device in hand) wins over the scenario scan', () => {
    const r = A.resolvePhoneApp({ params: { app: { title: 'Held', theme: 'social' } }, scenario: null });
    assert.equal(r.app.title, 'Held');
    assert.equal(r.theme, 'social');
});

test('npcDmFields reads an optional handle and profile, and nulls what is absent or malformed', () => {
    assert.deepEqual(A.npcDmFields({ handle: ' @mara ', profile: { siteId: 'friendface', person: 'mara' } }),
        { handle: '@mara', profile: { siteId: 'friendface', person: 'mara' } });
    assert.deepEqual(A.npcDmFields({}), { handle: null, profile: null });
    assert.deepEqual(A.npcDmFields({ handle: '   ', profile: { siteId: 'friendface' } }),
        { handle: null, profile: null }); // profile needs both siteId and person
});

test('profileLaunch targets the OSINT browser at that person on that site (View profile)', () => {
    // locate() reads "siteId.person" as a page on a social site (page id = person)
    assert.deepEqual(A.profileLaunch({ siteId: 'friendface', person: 'mara' }), { start: 'friendface.mara' });
});
