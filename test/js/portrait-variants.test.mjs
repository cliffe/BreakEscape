// NPC portraitVariants: a second dialogue portrait (m05 Torres knocked out) chosen by a
// globalVars condition, the NPC's KO state or a `# portrait:<name>` ink tag.
// Run with: node test/js/portrait-variants.test.mjs   (no dependencies; exits non-zero on failure)

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'portrait-variants-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('utils/global-condition.js', 'global-condition.mjs');
copy('utils/portrait-variants.js', 'portrait-variants.mjs', s => s.replace("'./global-condition.js'", "'./global-condition.mjs'"));
copy('utils/room-display-name.js', 'room-display-name.mjs');
copy('minigames/helpers/chat-helpers.js', 'chat-helpers.mjs',
    s => s.replace("'../../utils/room-display-name.js'", "'./room-display-name.mjs'")
        .replace("'../../utils/portrait-variants.js'", "'./portrait-variants.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const pv = await import(pathToFileURL(join(dir, 'portrait-variants.mjs')).href);
const { processGameActionTags } = await import(pathToFileURL(join(dir, 'chat-helpers.mjs')).href);

const torres = () => ({
    id: 'david_torres',
    spriteSheet: 'david_torres',
    spriteTalk: 'assets/characters/david_torres_talk.png',
    spriteVisemes: 'assets/characters/david_torres_visemes.png',
    avatar: 'assets/characters/david_torres_headshot.png',
    globalVarOnKO: 'torres_ko',
    portraitVariants: [
        { name: 'ko', ko: true,
          spriteTalk: 'assets/characters/david_torres_ko_talk.png',
          spriteVisemes: 'assets/characters/david_torres_ko_visemes.png',
          avatar: 'assets/characters/david_torres_ko_headshot.png' },
        { name: 'night', condition: 'globalVars.night === true', spriteTalk: 'assets/characters/night_talk.png' },
        { name: 'tag_only', spriteTalk: 'assets/characters/tag_only_talk.png' }
    ]
});

test('no variant holds: the NPC object itself comes back, unchanged', () => {
    const npc = torres();
    assert.equal(pv.applyPortraitVariant(npc, { globalVars: {}, isKO: false }), npc);
    const plain = { id: 'x', spriteTalk: 'a.png' };
    assert.equal(pv.portraitFor(plain, null, { gameState: { globalVariables: {} } }), plain);
});

test('a condition variant lays its fields over the base and keeps the rest', () => {
    const npc = torres();
    const out = pv.applyPortraitVariant(npc, { globalVars: { night: true } });
    assert.notEqual(out, npc);
    assert.equal(out.spriteTalk, 'assets/characters/night_talk.png');
    assert.equal(out.spriteVisemes, npc.spriteVisemes, 'a field the variant leaves out keeps the base value');
    assert.equal(out.avatar, npc.avatar);
    assert.equal(out.portraitVariant, 'night');
    assert.equal(npc.spriteTalk, 'assets/characters/david_torres_talk.png', 'the scenario NPC is not changed');
});

test('first match wins, and ko:true needs the NPC knocked out', () => {
    const npc = torres();
    const both = pv.applyPortraitVariant(npc, { globalVars: { night: true }, isKO: true });
    assert.equal(both.portraitVariant, 'ko');
    assert.equal(both.spriteVisemes, 'assets/characters/david_torres_ko_visemes.png');
    assert.equal(both.avatar, 'assets/characters/david_torres_ko_headshot.png');
    assert.equal(pv.pickPortraitVariant(npc, { isKO: false }), null);
});

test('condition and ko on one variant must both hold; ko:false means not knocked out', () => {
    const npc = { id: 'n', portraitVariants: [
        { name: 'calm_day', ko: false, condition: 'globalVars.day', spriteTalk: 'd.png' }
    ] };
    assert.equal(pv.pickPortraitVariant(npc, { globalVars: { day: true }, isKO: false })?.name, 'calm_day');
    assert.equal(pv.pickPortraitVariant(npc, { globalVars: { day: true }, isKO: true }), null);
    assert.equal(pv.pickPortraitVariant(npc, { globalVars: { day: false }, isKO: false }), null);
});

test('a variant with no gate is reached only by name; base and unknown names', () => {
    const npc = torres();
    assert.equal(pv.pickPortraitVariant(npc, {}), null);
    assert.equal(pv.pickPortraitVariant(npc, { forced: 'tag_only' })?.name, 'tag_only');
    assert.equal(pv.pickPortraitVariant(npc, { forced: 'base', isKO: true }), null, "'base' beats a gate that holds");
    assert.equal(pv.pickPortraitVariant(npc, { forced: 'nope', isKO: true })?.name, 'ko', 'an unknown name falls back to the gates');
});

test('npcIsKO reads the combat state, then the globalVarOnKO global', () => {
    const npc = torres();
    assert.equal(pv.npcIsKO(npc, { npcHostileSystem: { isNPCKO: id => id === 'david_torres' } }), true);
    assert.equal(pv.npcIsKO(npc, { gameState: { globalVariables: { torres_ko: true } } }), true);
    assert.equal(pv.npcIsKO(npc, { gameState: { globalVariables: { torres_ko: false } } }), false);
    assert.equal(pv.npcIsKO({ id: 'y' }, {}), false);
    const w = { gameState: { globalVariables: { torres_ko: true } } };
    assert.equal(pv.portraitFor(npc, null, w).spriteTalk, 'assets/characters/david_torres_ko_talk.png');
    assert.equal(pv.portraitFor(npc, 'base', w).spriteTalk, 'assets/characters/david_torres_talk.png');
});

test('a bad condition counts as false rather than throwing', () => {
    const npc = { id: 'n', portraitVariants: [{ name: 'x', condition: 'nonsense ((', spriteTalk: 'x.png' }] };
    assert.equal(pv.pickPortraitVariant(npc, { globalVars: {} }), null);
});

test('parsePortraitTag: <name> or <npc_id>:<name>', () => {
    assert.deepEqual(pv.parsePortraitTag('ko'), { npcId: null, name: 'ko' });
    assert.deepEqual(pv.parsePortraitTag(' david_torres : ko '), { npcId: 'david_torres', name: 'ko' });
    assert.equal(pv.parsePortraitTag(''), null);
    assert.equal(pv.parsePortraitTag('a:b:c'), null);
});

test('# portrait tag calls the person-chat UI, and is a harmless no-op elsewhere', async () => {
    window.NPCGameBridge = {};
    const calls = [];
    const ui = { setPortraitVariant: (id, name) => calls.push([id, name]), showNotification() {} };
    await processGameActionTags(['portrait:ko', 'portrait:lisa_park:base'], ui);
    assert.deepEqual(calls, [[null, 'ko'], ['lisa_park', 'base']]);
    const [r] = await processGameActionTags(['portrait:ko'], { showNotification() {} });
    assert.equal(r.success, true);
});

test('person-chat and phone-chat route portraits through portraitFor', () => {
    const ui = readFileSync(join(js, 'minigames/person-chat/person-chat-ui.js'), 'utf8');
    assert.match(ui, /this\.portraitRenderer\.npc = this\.resolvePortraitCharacter\(character\)/);
    assert.match(ui, /new PersonChatPortraits\(\s*this\.game,\s*this\.resolvePortraitCharacter\(this\.npc\)/);
    assert.match(ui, /setPortraitVariant\(npcId, name\)/);
    const phone = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
    assert.equal((phone.match(/portraitFor\(/g) || []).length, 2, 'contact list and conversation header');
});
