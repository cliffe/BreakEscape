// Pass-4 engine fixes (second batch): static-NPC reach measured to the NPC's
// collision body, the one-click door repeat guard, and " -- " shown as an en dash.
// Run with: node --test test/js/engine-fixes-pass4b.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'engine-fixes-pass4b-'));
const load = async (src, out) => {
    writeFileSync(join(dir, out), readFileSync(join(js, src), 'utf8'));
    return import(pathToFileURL(join(dir, out)).href);
};
const { npcReachDistSq, staticNpcBodyDistSq, pointToRectDistSq } = await load('systems/npc-reach.js', 'npc-reach.mjs');
const { isRepeatInteraction } = await load('systems/interaction-repeat.js', 'interaction-repeat.mjs');
const { displayDashes } = await load('utils/display-dashes.js', 'display-dashes.mjs');

const RANGE_SQ = 32 * 32;

// m02 Bed 4: a 64x64 static sprite with a bottom-half body. Body top = sprite.y.
// The player's body (18x10 at offset 31,66 of an 80px sprite) has its centre 31px
// below the sprite centre, and its bottom edge 36px below.
function bed(x = 0, y = 0) {
    return { _isNPC: true, _staticNpc: true, x, y, body: { x: x - 32, y, width: 64, height: 32 } };
}
function playerAt(x, y) {
    return { x, y, body: { center: { x, y: y + 31 } } };
}

test('static NPC approached from the north: blocked 36px out on centres, reachable on the body edge', () => {
    const npc = bed();
    const p = playerAt(0, -36); // player body bottom resting on the bed body's top edge
    const centreSq = 36 * 36;
    assert.ok(centreSq > RANGE_SQ, 'the old measure refuses');
    assert.ok(npcReachDistSq(p, npc, centreSq) <= RANGE_SQ, 'the body-edge measure accepts');
    assert.equal(staticNpcBodyDistSq(p, npc), 25); // body centre 5px above the edge
});

test('static NPC: still out of reach a tile and a half away, and across a one-tile counter', () => {
    const npc = bed();
    const far = playerAt(0, -36 - 48);
    assert.ok(npcReachDistSq(far, npc, 84 * 84) > RANGE_SQ);
    // Counter 32px deep between the player's body and the bed's body
    const across = playerAt(0, -36 - 32);
    assert.ok(npcReachDistSq(across, npc, 68 * 68) > RANGE_SQ);
});

test('walking NPCs keep the centre measure', () => {
    const walker = { _isNPC: true, x: 0, y: 0, body: { x: -10, y: 26, width: 20, height: 10 } };
    const p = playerAt(0, -40);
    assert.equal(staticNpcBodyDistSq(p, walker), null);
    assert.equal(npcReachDistSq(p, walker, 1600), 1600);
});

test('pointToRectDistSq: inside is zero, outside is to the nearest edge or corner', () => {
    assert.equal(pointToRectDistSq(5, 5, 0, 0, 10, 10), 0);
    assert.equal(pointToRectDistSq(15, 5, 0, 0, 10, 10), 25);
    assert.equal(pointToRectDistSq(13, 14, 0, 0, 10, 10), 25);
});

test('door repeat guard: a second call within the window is ignored, later ones are not', () => {
    const door = {};
    assert.equal(isRepeatInteraction(door, 1000), false);
    assert.equal(isRepeatInteraction(door, 1002), true, 'same click, 2 ms later (m02 game 1417)');
    assert.equal(isRepeatInteraction(door, 1400), false, 'a real second press');
    assert.equal(isRepeatInteraction({}, 1401), false, 'other doors are separate');
});

test('door interaction goes through the repeat guard before reaching handleUnlock', () => {
    const src = readFileSync(join(js, 'systems/doors.js'), 'utf8');
    const fn = src.slice(src.indexOf('async function handleDoorInteraction('), src.indexOf('function unlockDoor('));
    assert.ok(fn.indexOf('isRepeatInteraction(doorSprite)') > 0);
    assert.ok(fn.indexOf('isRepeatInteraction(doorSprite)') < fn.indexOf("handleUnlock(doorSprite, 'door')"));
});

test('" -- " shows as a spaced en dash; hyphens, flags and "---" are left alone', () => {
    assert.equal(displayDashes('own controller -- isolated, no network'), 'own controller – isolated, no network');
    assert.equal(displayDashes('isolated--no network'), 'isolated – no network');
    assert.equal(displayDashes('I was--'), 'I was –');
    assert.equal(displayDashes('"I was--" he said'), '"I was –" he said');
    assert.equal(displayDashes('x -- y -- z'), 'x – y – z');
    assert.equal(displayDashes('a --- b'), 'a --- b');
    assert.equal(displayDashes('run it with --no-preserve-root'), 'run it with --no-preserve-root');
    assert.equal(displayDashes('well-known'), 'well-known');
    assert.equal(displayDashes(''), '');
    assert.equal(displayDashes(null), null);
});

test('the dash change is display-only: TTS and history keep the typed text', () => {
    const minigame = readFileSync(join(js, 'minigames/person-chat/person-chat-minigame.js'), 'utf8');
    assert.ok(!minigame.includes('displayDashes'), 'person-chat TTS input is untouched');
    const ui = readFileSync(join(js, 'minigames/person-chat/person-chat-ui.js'), 'utf8');
    assert.match(ui, /dialogueText\.textContent = displayDashes\(text\)/);
    const phone = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
    assert.match(phone, /this\.playVoiceMessage\(transcript, playButton\)/);
});
