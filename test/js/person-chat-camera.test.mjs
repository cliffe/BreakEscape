// Camera shots for multi-NPC person-chats (person-chat-camera.js).
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cameraViewFor, backgroundRect, portraitRect, shotScale, containFit, canvasBackingSize, PLAYER_VIEW, FIRST_NPC_VIEW } from '../../public/break_escape/js/minigames/person-chat/person-chat-camera.js';

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
    // 5x (the largest whole number that fits 720 px), standing on the canvas bottom, shifted 20% of the width
    assert.deepEqual([p.x, p.y, p.w, p.h], [(1280 - 640) / 2 - 256, 80, 640, 640]);
    assert.equal(p.y + p.h, 720);
    const pip = portraitRect(null, 128, 128, 200, 150, 0);
    assert.deepEqual([pip.x, pip.y, pip.scale], [36, 22, 1]);
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
    // 400px background at 5x (the portrait's whole-number scale) on a 1280x720 canvas
    const left = backgroundRect(PLAYER_VIEW, 5.625, 400, 400, 1280, 720);
    const right = backgroundRect(FIRST_NPC_VIEW, 5.625, 400, 400, 1280, 720);
    assert.equal(left.x, 0);
    assert.equal(right.x, 1280 - 2000);
    assert.equal(left.y, (720 - 2000) / 2);
});

test('a middle shot always covers the canvas', () => {
    for (let slot = 1; slot <= 5; slot++) {
        const r = backgroundRect(cameraViewFor(false, slot), 5.625, 400, 400, 1280, 720);
        assert.ok(r.x <= 0 && r.x + r.w >= 1280);
        assert.ok(r.y <= 0 && r.y + r.h >= 720);
    }
});

// ---- Pixel-perfect scale (the speaker's pixels flickered between 5 and 6 px wide) ----

const SIZES = [[1280, 720], [1280, 680], [1366, 768], [1920, 1080], [390, 844], [844, 390], [768, 1024]];

test('a source pixel covers a whole number of canvas pixels, in every shot and size', () => {
    const views = [PLAYER_VIEW, FIRST_NPC_VIEW, ...[1, 2, 3, 4, 5].map(s => cameraViewFor(false, s))];
    for (const [cw, ch] of SIZES) {
        for (const v of views) {
            const p = portraitRect(v, 128, 128, cw, ch, v.shift);
            assert.ok(Number.isInteger(p.scale), `${cw}x${ch} scale ${p.scale}`);
            assert.ok(Number.isInteger(p.x) && Number.isInteger(p.y), `${cw}x${ch} position ${p.x},${p.y}`);
            const b = backgroundRect(v, containFit(cw, ch, 128, 128), 400, 400, cw, ch);
            assert.ok(Number.isInteger(b.w / 400), `${cw}x${ch} background scale ${b.w / 400}`);
            assert.ok(Number.isInteger(b.x) && Number.isInteger(b.y), `${cw}x${ch} background position`);
            assert.equal(b.w / 400, p.scale, 'background shares the portrait scale');
        }
    }
});

test('the scale is the largest whole number that fits', () => {
    assert.equal(shotScale(5.625), 5);
    assert.equal(shotScale(5), 5);
    assert.equal(shotScale(3.05), 3);
    assert.equal(shotScale(1.99), 1);
    assert.equal(shotScale(0.7), 0.7); // smaller than the frame: cannot be shown at 1x without cropping
    assert.equal(shotScale(5.625, 1.5), 8); // close-up: 5 x 1.5 rounds to a whole number
});

test('frames of different source sizes get one scale and a shared baseline', () => {
    // a speaker whose idle image is 120 px and whose viseme column is 128 px
    const big = portraitRect(FIRST_NPC_VIEW, 128, 128, 1280, 720, 0.2, 128, 128);
    const small = portraitRect(FIRST_NPC_VIEW, 120, 120, 1280, 720, 0.2, 128, 128);
    assert.equal(small.scale, big.scale);
    assert.ok(Number.isInteger(small.scale));
    assert.equal(small.y + small.h, big.y + big.h, 'same bottom edge');
    assert.equal(small.x + small.w / 2, big.x + big.w / 2, 'same centre');
    // fitted alone, 120 px would pick 6x and 128 px 5x: the old per-frame flicker
    assert.notEqual(portraitRect(FIRST_NPC_VIEW, 120, 120, 1280, 720, 0.2).scale, big.scale);
});

test('the backing store is the CSS box times devicePixelRatio', () => {
    assert.deepEqual(canvasBackingSize(1280, 680, 1), { width: 1280, height: 680 });
    assert.deepEqual(canvasBackingSize(390, 844, 3), { width: 1170, height: 2532 });
    assert.deepEqual(canvasBackingSize(1280, 720, 1.5), { width: 1920, height: 1080 });
    assert.deepEqual(canvasBackingSize(0, 0, 1), { width: 1, height: 1 });
});

test('at zoom 1 the portrait stands on the canvas bottom, never centred', () => {
    const sizes = [[1280, 720], [1280, 680], [1366, 768], [1920, 1080], [844, 390], [390, 474], [390, 513], [390, 549], [390, 585], [390, 844], [768, 1024]];
    for (const [cw, ch] of sizes) {
        for (const v of [PLAYER_VIEW, FIRST_NPC_VIEW, { pan: 0.4, zoom: 1, shift: 0 }]) {
            const p = portraitRect(v, 128, 128, cw, ch, v.shift);
            assert.equal(p.y + p.h, ch, `${cw}x${ch} bottom edge`);
            // a smaller frame of the same speaker shares the bottom edge
            const q = portraitRect(v, 120, 120, cw, ch, v.shift, 128, 128);
            assert.equal(q.y + q.h, ch, `${cw}x${ch} small frame bottom edge`);
        }
    }
});

test('on a canvas taller than wide the scale comes from the height and the sides are cropped', () => {
    for (const [cw, ch] of [[390, 474], [390, 513], [390, 549], [390, 585], [390, 844], [768, 1024]]) {
        const p = portraitRect(FIRST_NPC_VIEW, 128, 128, cw, ch, 0.2);
        assert.equal(p.scale, Math.max(1, Math.floor(ch / 128)), `${cw}x${ch}`);
    }
    assert.equal(portraitRect(FIRST_NPC_VIEW, 128, 128, 390, 549, 0.2).scale, 4);
    assert.equal(containFit(390, 549, 128, 128), 549 / 128);
    assert.equal(containFit(1280, 720, 128, 128), 5.625);
});

test('a close-up stays on whole pixels and its bottom reaches the canvas bottom', () => {
    for (const [cw, ch] of [[1280, 720], [1280, 680], [390, 549], [390, 844], [1920, 1080]]) {
        for (const slot of [1, 3, 5]) {
            const v = cameraViewFor(false, slot);
            assert.equal(v.zoom, 1.5);
            const p = portraitRect(v, 128, 128, cw, ch, 0);
            assert.ok(Number.isInteger(p.x) && Number.isInteger(p.y) && Number.isInteger(p.scale), `${cw}x${ch}`);
            assert.ok(p.y + p.h >= ch, `${cw}x${ch} bottom ${p.y + p.h}`);
            assert.ok(p.y <= 0, `${cw}x${ch} top ${p.y}`);
        }
    }
});

test('a scene shot may use the exact cover scale', () => {
    const r = backgroundRect({ pan: 1, zoom: 1 }, 1, 400, 400, 1304, 680, true);
    assert.equal(r.w, 1304);
    const whole = backgroundRect({ pan: 1, zoom: 1 }, 1, 400, 400, 1304, 680);
    assert.equal(whole.w, 1600);
});

// Phone portrait sizing: the section height comes from the box and a whole scale, never from the caption.
import { phonePortraitSize, PHONE_FRAME_PX, PHONE_MIN_CAPTION_PX } from '../../public/break_escape/js/minigames/person-chat/person-chat-camera.js';

test('phone portrait height is a whole scale of the frame and leaves the caption its minimum', () => {
    for (const dpr of [1, 1.25, 1.27, 1.35, 1.4, 1.5, 2, 2.625, 3]) {
        for (const boxH of [474, 620, 647, 824, 895, 1000]) {
            const { scale, cssHeight } = phonePortraitSize(boxH, dpr);
            assert.ok(Number.isInteger(scale) && scale >= 1);
            // the backing store (css x dpr) lands on exactly scale x frame, with no spare band
            assert.equal(Math.floor(cssHeight * dpr), scale * PHONE_FRAME_PX);
            assert.equal(Math.round(cssHeight * dpr), scale * PHONE_FRAME_PX);
            assert.equal(canvasBackingSize(390, cssHeight, dpr).height, scale * PHONE_FRAME_PX);
            // and it is the largest scale that keeps the caption minimum (unless 1x already cannot)
            if (scale > 1) assert.ok(boxH - cssHeight >= PHONE_MIN_CAPTION_PX - 1e-6);
            assert.ok(boxH - (scale + 1) * PHONE_FRAME_PX / dpr < PHONE_MIN_CAPTION_PX);
        }
    }
});

test('the drawn scale equals the section scale and ignores caption content', () => {
    // the sprite scale is a function of the section box alone; the caption only gets what is left
    for (const boxH of [474, 647, 824, 895]) {
        const { scale, cssHeight } = phonePortraitSize(boxH, 1);
        const p = portraitRect(FIRST_NPC_VIEW, 128, 128, 390, Math.round(cssHeight), 0);
        assert.equal(p.scale, scale);
        assert.equal(p.y + p.h, Math.round(cssHeight));
        // the caption is not an input: phonePortraitSize takes the box height and dpr only
        assert.ok(phonePortraitSize.length <= 4);
    }
    // and the live updater reads only the chat box height and devicePixelRatio
    const src = readFileSync(new URL('../../public/break_escape/js/minigames/person-chat/person-chat-ui.js', import.meta.url), 'utf8');
    const body = src.slice(src.indexOf('updatePortraitHeight() {'), src.indexOf('updateScrollCue() {'));
    assert.match(body, /main\.getBoundingClientRect\(\)\.height/);
    assert.match(body, /phonePortraitSize\(h, dpr\)/);
    assert.match(body, /const dpr = window\.devicePixelRatio/);
    assert.doesNotMatch(body, /captionArea|captionContent|scrollHeight|dialogueBox|textContent/);
});

test('the portrait scale changes only when the viewport does', () => {
    assert.equal(phonePortraitSize(647).scale, 2);
    assert.equal(phonePortraitSize(824).scale, 3);
    assert.equal(phonePortraitSize(895).scale, 4);
    assert.equal(phonePortraitSize(474).scale, 1);
});

test('phone sprite scale and position hold while the canvas height changes (fixed viewport fit)', () => {
    // The canvas grows and shrinks with the dialogue band; the viewport decides the scale.
    for (const [boxH, dpr] of [[647, 1], [824, 1], [620, 1], [895, 2], [647, 2.625]]) {
        const { scale } = phonePortraitSize(boxH, dpr);
        const fit = (scale * PHONE_FRAME_PX) / 128;
        const seen = new Set();
        for (const canvasH of [scale * PHONE_FRAME_PX, scale * PHONE_FRAME_PX + 37, scale * PHONE_FRAME_PX + 180, scale * PHONE_FRAME_PX + 400]) {
            const p = portraitRect(FIRST_NPC_VIEW, 128, 128, 390 * dpr, canvasH, 0.2, 128, 128, fit);
            seen.add(p.scale);
            assert.equal(p.w, scale * 128, 'sprite width is the viewport scale');
            assert.equal(p.y + p.h, canvasH, 'still bottom-anchored');
            assert.ok(p.y >= 0, 'head never cropped while the canvas is at least the portrait height');
            // the old behaviour (no fit) would have stepped with the canvas height
        }
        assert.deepEqual([...seen], [scale]);
    }
    // without a fixed fit the same canvases do step, which is what this guards against
    const stepped = new Set([128, 128 * 2, 128 * 3].map(h => portraitRect(FIRST_NPC_VIEW, 128, 128, 390, h, 0).scale));
    assert.ok(stepped.size > 1);
});

test('a bust smaller than the frame still gets a constant whole scale from the viewport', () => {
    const fit = (3 * PHONE_FRAME_PX) / 64;
    for (const canvasH of [384, 450, 600]) {
        assert.equal(portraitRect(FIRST_NPC_VIEW, 64, 64, 390, canvasH, 0, 64, 64, fit).scale, 6);
    }
});
