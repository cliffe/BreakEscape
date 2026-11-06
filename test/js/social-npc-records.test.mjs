// Headless NPC records (social build item 0.5, data contract 00 S8) and the
// display-name tie rule (item 0.6, 00 S2), client side.
// Run with: bundle exec node --test test/js/social-npc-records.test.mjs
//
// The browser modules use relative .js imports and the repo has no "type": "module"
// package.json, so they are copied to a temp dir as .mjs, with the lazy loader's
// character-textures import replaced by a stub.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'social-npc-records-test-'));
const read = (p) => readFileSync(join(sys, p), 'utf8');

writeFileSync(join(dir, 'scenario-npc-records.mjs'), read('scenario-npc-records.js'));
writeFileSync(join(dir, 'character-textures.mjs'),
    'export const ensureCharacterTextures = async () => {};\nexport const spriteKeysForNPCs = () => [];\n'
    + 'export const collectCharacterSprites = () => [];\n');
writeFileSync(join(dir, 'npc-lookalike.mjs'), read('../utils/npc-lookalike.js'));
writeFileSync(join(dir, 'player-avatar.mjs'), read('../utils/player-avatar.js'));
writeFileSync(join(dir, 'npc-lazy-loader.mjs'), read('npc-lazy-loader.js')
    .replace("'./character-textures.js'", "'./character-textures.mjs'")
    .replace("'../utils/npc-lookalike.js'", "'./npc-lookalike.mjs'")
    .replace("'../utils/player-avatar.js'", "'./player-avatar.mjs'")
    .replace("'./scenario-npc-records.js'", "'./scenario-npc-records.mjs'"));
writeFileSync(join(dir, 'npc-los.mjs'), read('npc-los.js'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), read('../minigames/phone-chat/phone-chat-speaker.js'));
writeFileSync(join(dir, 'npc-manager.mjs'), read('npc-manager.js')
    .replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} }, breakEscapeConfig: { gameId: 1 } };
const records = await import(pathToFileURL(join(dir, 'scenario-npc-records.mjs')).href);
const { default: NPCLazyLoader } = await import(pathToFileURL(join(dir, 'npc-lazy-loader.mjs')).href);
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

const quiet = (fn) => {
    const log = console.log;
    console.log = () => {};
    try { return fn(); } finally { console.log = log; }
};

const roomOnly = () => ({
    startRoom: 'lobby',
    rooms: {
        lobby: { npcs: [{ id: 'guard', displayName: 'Guard', npcType: 'person' },
                        { id: 'handler', displayName: 'Handler', npcType: 'phone', phoneId: 'player_phone' }] },
        office: { npcs: [{ id: 'clerk', displayName: 'Clerk', npcType: 'person' }] },
        empty: {}
    }
});

const social = () => ({
    ...roomOnly(),
    social: { characters: {
        pierce: { displayName: 'Melanie Pierce', channels: { email: 'pierce_mail' },
                  emailRecord: { storyPath: 'ink/pierce_mail.json', avatar: 'pierce', itemsHeld: [{ type: 'notes', id: 'payslip' }] } },
        lord: { displayName: 'Sofia Lord', channels: { email: 'lord_mail' },
                emailRecord: { storyPath: 'ink/lord_mail.json', displayName: 'Sofia Lord (mail)' } },
        dev: { displayName: 'Dev', channels: { person: 'clerk' } },
        nameless: { emailRecord: { storyPath: 'ink/x.json' } },
        clash: { channels: { email: 'guard' }, emailRecord: { storyPath: 'ink/x.json', displayName: 'Not the guard' } }
    } }
});

// ---- scenario-npc-records.js (twin of Game.scenario_npc_records) ------------

test('no social key: the records are the room NPCs, in room order', () => {
    assert.deepEqual(records.scenarioNpcRecords(roomOnly()).map(n => n.id), ['guard', 'handler', 'clerk']);
    assert.deepEqual(records.headlessNpcRecords(roomOnly()), []);
});

test('headless records follow the room NPCs and carry the contract fields', () => {
    const all = records.scenarioNpcRecords(social());
    assert.deepEqual(all.map(n => n.id), ['guard', 'handler', 'clerk', 'pierce_mail', 'lord_mail']);

    const pierce = all.find(n => n.id === 'pierce_mail');
    assert.deepEqual(pierce, {
        storyPath: 'ink/pierce_mail.json', avatar: 'pierce', itemsHeld: [{ type: 'notes', id: 'payslip' }],
        id: 'pierce_mail', displayName: 'Melanie Pierce', npcType: 'phone', phoneId: 'mail_only'
    });
    const lord = all.find(n => n.id === 'lord_mail');
    assert.equal(lord.displayName, 'Sofia Lord (mail)');
    assert.deepEqual(lord.itemsHeld, []);
    assert.equal(records.HEADLESS_PHONE_ID, 'mail_only');
});

test('a room NPC keeps its id over a headless record that reuses it', () => {
    const all = records.scenarioNpcRecords(social());
    assert.equal(all.filter(n => n.id === 'guard').length, 1);
    assert.equal(all.find(n => n.id === 'guard').displayName, 'Guard');
});

test('records are fresh objects; the scenario is not changed', () => {
    const scenario = social();
    const before = JSON.stringify(scenario);
    records.headlessNpcRecords(scenario)[0].displayName = 'changed';
    assert.equal(JSON.stringify(scenario), before);
});

test('malformed social data gives no records', () => {
    for (const s of [null, [], 'x', { characters: [] }, { characters: { a: 'b' } },
                     { characters: { a: { channels: { email: 5 }, emailRecord: {} } } },
                     { characters: { a: { channels: { email: 'a_mail' }, emailRecord: 'ink/a.json' } } }]) {
        assert.deepEqual(records.headlessNpcRecords({ ...roomOnly(), social: s }), [], JSON.stringify(s));
    }
    assert.deepEqual(records.scenarioNpcRecords(null), []);
});

// ---- NPCLazyLoader.registerHeadlessRecords -----------------------------------

function fakeManager(existing = []) {
    const npcs = new Map(existing.map(n => [n.id, n]));
    return { npcs, getNPC: id => npcs.get(id), registerNPC: rec => npcs.set(rec.id, rec) };
}

test('registerHeadlessRecords registers nothing without a social key', () => {
    const manager = fakeManager();
    const loader = quiet(() => new NPCLazyLoader(manager));
    assert.deepEqual(quiet(() => loader.registerHeadlessRecords(roomOnly())), []);
    assert.deepEqual(quiet(() => loader.registerHeadlessRecords(undefined)), []);
    assert.equal(manager.npcs.size, 0);
});

test('registerHeadlessRecords registers each record with no room, and leaves an existing id alone', () => {
    const guard = { id: 'guard', displayName: 'Guard', npcType: 'person', roomId: 'lobby' };
    const manager = fakeManager([guard]);
    const loader = quiet(() => new NPCLazyLoader(manager));

    assert.deepEqual(quiet(() => loader.registerHeadlessRecords(social())), ['pierce_mail', 'lord_mail']);
    assert.equal(manager.getNPC('guard'), guard);
    const pierce = manager.getNPC('pierce_mail');
    assert.equal(pierce.phoneId, 'mail_only');
    assert.equal(pierce.roomId, undefined);
});

test('a headless record registered on the real NPCManager is a mail_only phone NPC', () => {
    const manager = new NPCManager(null, null);
    const loader = quiet(() => new NPCLazyLoader(manager));
    quiet(() => loader.registerHeadlessRecords(social()));

    const pierce = manager.getNPC('pierce_mail');
    assert.equal(pierce.npcType, 'phone');
    assert.equal(pierce.phoneId, 'mail_only', 'registerNPC must not default it to player_phone');
    assert.equal(pierce.displayName, 'Melanie Pierce');
    assert.deepEqual(pierce.itemsHeld, [{ type: 'notes', id: 'payslip' }]);
});

// ---- NPCManager.resolveSpeakerId (display-name ties) -------------------------

const chars = () => ({
    player: { id: 'player', displayName: 'Agent 0x00' },
    robert_vance_phone: { displayName: 'Robert Vance' },   // registered first (phone NPCs load at start)
    robert_vance: { displayName: 'Robert Vance' },
    gary: { displayName: 'Gary Finch' }
});

test('a social character wins a display-name tie in its own conversation (preferOwn)', () => {
    const social = { preferOwn: true };
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Robert Vance', 'robert_vance', social), 'robert_vance');
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'robert vance ', 'robert_vance', social), 'robert_vance');
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Robert Vance', 'robert_vance_phone', social), 'robert_vance_phone');
});

test('a non-social tie keeps the first match, exactly as before (R-01)', () => {
    // No options, or preferOwn false: the first registered record takes the name,
    // even in the other record's own conversation (m01 to m08 HaX, Netherton, ...)
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Robert Vance', 'robert_vance'), 'robert_vance_phone');
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Robert Vance', 'robert_vance', { preferOwn: false }), 'robert_vance_phone');
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'robert vance ', 'robert_vance', {}), 'robert_vance_phone');
});

test('with no tie, or no own NPC, the first match wins as before', () => {
    const social = { preferOwn: true };
    // Another NPC's conversation: the first registered still takes the name
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Robert Vance', 'gary', social), 'robert_vance_phone');
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Robert Vance', null, social), 'robert_vance_phone');
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Robert Vance', 'nobody', social), 'robert_vance_phone');
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Gary Finch', 'robert_vance', social), 'gary');
});

test('an id match is never overridden by the own NPC', () => {
    const c = { gary: { displayName: 'Gary Finch' }, finch: { displayName: 'Gary' } };
    assert.equal(NPCManager.resolveSpeakerId(c, 'gary', 'finch', { preferOwn: true }), 'gary');
    assert.equal(NPCManager.resolveSpeakerId(c, 'GARY', 'finch', { preferOwn: true }), 'gary', 'returns the id in its own casing');
});

test('unknown, empty and non-string names resolve to null', () => {
    assert.equal(NPCManager.resolveSpeakerId(chars(), 'Nobody', 'gary'), null);
    assert.equal(NPCManager.resolveSpeakerId(chars(), '  ', 'gary'), null);
    assert.equal(NPCManager.resolveSpeakerId(chars(), undefined, 'gary'), null);
    assert.equal(NPCManager.resolveSpeakerId(null, 'Gary Finch', 'gary'), null);
});

// ---- person-chat normalizeSpeakerId uses resolveSpeakerId ------------------------
// The method is lifted from person-chat-minigame.js source (the class pulls in the
// whole chat stack) and run against a fake minigame with the real NPCManager.

const personChatSrc = readFileSync(join(sys, '../minigames/person-chat/person-chat-minigame.js'), 'utf8');
function liftMethod(src, signature) {
    const start = src.indexOf(signature);
    assert.ok(start >= 0, `${signature} not found`);
    let i = src.indexOf('{', start), depth = 0, end = -1;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) { end = i; break; }
    }
    const body = src.slice(src.indexOf('{', start) + 1, end);
    return new Function('speakerId', body);
}
const normalizeSpeakerId = liftMethod(personChatSrc, 'normalizeSpeakerId(speakerId) {');

const fakeChat = (ownNpcId, npcManager = new NPCManager(null, null)) => ({
    npcManager,
    npc: { id: ownNpcId },
    characters: { player: { id: 'player', displayName: 'Agent 0x00' }, ...chars() }
});

// window.socialInfluence exists only when the scenario has social.characters.
function withSocial(socialIds, fn) {
    const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
    const prev = globalThis.window;
    globalThis.window = { socialInfluence: { isSocialCharacter: (id) => socialIds.includes(id) } };
    try { return fn(); } finally { if (had) globalThis.window = prev; else delete globalThis.window; }
}

test('person-chat: a social NPC wins a display-name tie in its own conversation', () => {
    withSocial(['robert_vance'], () => {
        assert.equal(normalizeSpeakerId.call(fakeChat('robert_vance'), 'Robert Vance'), 'robert_vance');
        assert.equal(normalizeSpeakerId.call(fakeChat('gary'), 'Robert Vance'), 'robert_vance_phone', 'no tie with the own NPC: first match, as before');
    });
});

test('person-chat: a non-social NPC keeps the first match on a tie (R-01)', () => {
    // No social scenario at all (m01 to m08): no window.socialInfluence
    assert.equal(normalizeSpeakerId.call(fakeChat('robert_vance'), 'Robert Vance'), 'robert_vance_phone');
    // A social scenario, but this conversation's NPC is not a social character
    withSocial(['gary'], () => {
        assert.equal(normalizeSpeakerId.call(fakeChat('robert_vance'), 'Robert Vance'), 'robert_vance_phone');
    });
});

test('person-chat: an exact id match still wins, and the special cases are kept', () => {
    const chat = fakeChat('robert_vance');
    assert.equal(normalizeSpeakerId.call(chat, 'robert_vance_phone'), 'robert_vance_phone');
    assert.equal(normalizeSpeakerId.call(chat, 'Gary Finch'), 'gary');
    assert.equal(normalizeSpeakerId.call(chat, 'npc'), 'robert_vance');
    assert.equal(normalizeSpeakerId.call(chat, 'Player'), 'player');
    assert.equal(normalizeSpeakerId.call(chat, 'You'), 'player');
    assert.equal(normalizeSpeakerId.call(chat, 'Nobody'), null);
    assert.equal(normalizeSpeakerId.call(chat, ''), null);
});

test('person-chat: without NPCManager.resolveSpeakerId the old first-match scan runs', () => {
    const chat = fakeChat('robert_vance', { getNPC() {} });
    assert.equal(normalizeSpeakerId.call(chat, 'Robert Vance'), 'robert_vance_phone');
    assert.equal(normalizeSpeakerId.call(chat, 'gary'), 'gary');
});
