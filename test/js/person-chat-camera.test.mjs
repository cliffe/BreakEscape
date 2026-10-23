// Camera shots for multi-NPC person-chats (person-chat-camera.js).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cameraViewFor, backgroundRect, portraitRect, PLAYER_VIEW, FIRST_NPC_VIEW } from '../../public/break_escape/js/minigames/person-chat/person-chat-camera.js';

test('player left, first NPC right, as before', () => {
    assert.deepEqual(cameraViewFor(true, 3), PLAYER_VIEW);
    assert.deepEqual(cameraViewFor(false, 0), FIRST_NPC_VIEW);
    assert.deepEqual(cameraViewFor(false), FIRST_NPC_VIEW);
});

test('the third character gets a close-up', () => {
    assert.ok(cameraViewFor(false, 1).zoom > 1);
});

test('portrait and background share one pixel scale in every shot', () => {
    const views = [PLAYER_VIEW, FIRST_NPC_VIEW, ...[1, 2, 3, 4, 5].map(s => cameraViewFor(false, s))];
    for (const v of views) {
        const p = portraitRect(v, 128, 128, 1280, 720, v.shift);
        const b = backgroundRect(v, 720 / 128, 400, 400, 1280, 720);
        assert.equal(p.scale, b.w / 400);
    }
});

test('a fitted portrait sits where it always did', () => {
    const p = portraitRect(FIRST_NPC_VIEW, 128, 128, 1280, 720, 0.2);
    assert.deepEqual([p.x, p.y, p.w, p.h], [(1280 - 720) / 2 - 256, 0, 720, 720]);
    const pip = portraitRect(null, 128, 128, 200, 150, 0);
    assert.deepEqual([pip.x, pip.y], [25, 0]);
});

test('a close-up keeps the head in frame', () => {
    const p = portraitRect(cameraViewFor(false, 1), 128, 128, 1280, 720, 0);
    assert.ok(p.y <= 0 && p.y > -0.1 * p.h);
    assert.equal(p.x + p.w / 2, 640);
});

test('later NPCs get centred middle shots, each different from the last', () => {
    const views = [1, 2, 3, 4, 5].map(slot => cameraViewFor(false, slot));
    for (const v of views) {
        assert.equal(v.shift, 0);
        assert.ok(v.zoom >= 1);
        assert.ok(v.pan > 0.3 && v.pan < 0.7);
    }
    for (let i = 1; i < views.length; i++) assert.notDeepEqual(views[i], views[i - 1]);
    assert.deepEqual(cameraViewFor(false, 6), cameraViewFor(false, 1)); // cycles
});

test('side views match the old edge alignment', () => {
    // 400px background at 5.625x on a 1280x720 canvas
    const left = backgroundRect(PLAYER_VIEW, 5.625, 400, 400, 1280, 720);
    const right = backgroundRect(FIRST_NPC_VIEW, 5.625, 400, 400, 1280, 720);
    assert.equal(left.x, 0);
    assert.equal(right.x, 1280 - 2250);
    assert.equal(left.y, (720 - 2250) / 2);
});

test('a middle shot always covers the canvas', () => {
    for (let slot = 1; slot <= 5; slot++) {
        const r = backgroundRect(cameraViewFor(false, slot), 5.625, 400, 400, 1280, 720);
        assert.ok(r.x <= 0 && r.x + r.w >= 1280);
        assert.ok(r.y <= 0 && r.y + r.h >= 720);
    }
});
