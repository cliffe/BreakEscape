// Sweep item 11: a withheld terminal caller's own thread/call takes the terminal look from the contact's
// `phoneTheme`, while the device and its contact list keep the device look ("the look belongs to the
// device", phone-app.js). resolvePhoneApp is the one place the look is decided, so it is verified here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePhoneApp } from '../../public/break_escape/js/minigames/phone-chat/phone-app.js';

test('item 11: a contact with phoneTheme "terminal" resolves terminal for its own thread/call', () => {
    const r = resolvePhoneApp({ params: { phoneId: 'player_phone' }, npc: { id: 'architect', phoneTheme: 'terminal' }, scenario: {} });
    assert.equal(r.theme, 'terminal');
    assert.equal(r.app, null, 'no app block: the look comes from the contact');
});

test('item 11: the ringer call path (theme passed as params.theme) resolves terminal', () => {
    // openCall passes `theme: npc.phoneTheme` into the minigame params; resolvePhoneApp honours it.
    const r = resolvePhoneApp({ params: { phoneId: 'player_phone', theme: 'terminal' }, npc: { id: 'architect' }, scenario: {} });
    assert.equal(r.theme, 'terminal');
});

test('item 11: the device/contact list (no single contact) does not take a contact phoneTheme', () => {
    const r = resolvePhoneApp({ params: { phoneId: 'player_phone' }, npc: null, scenario: {} });
    assert.equal(r.theme, undefined, 'the handset keeps its own look for the list');
});

test('item 11: a device `app` theme still wins over a contact phoneTheme (the look belongs to the device)', () => {
    const r = resolvePhoneApp({
        params: { phoneId: 'player_phone', app: { title: 'Friendface', theme: 'social' } },
        npc: { id: 'architect', phoneTheme: 'terminal' }, scenario: {},
    });
    assert.equal(r.theme, 'social');
});
