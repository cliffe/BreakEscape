// Slice 9.1 step 2 (docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md 5.3): systems/postit-marks.js
// draws the notes_postit1 picture at a sign-in PC's top-left corner when its screen shows a
// note (hasPostit, or an authored postitNote that is shown), on sign-in PCs only.
// Run with: node test/js/postit-marks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {};
const { PostitMarks, installPostitMarks, wantsPostit, postitPosition, POSTIT_TEXTURE, POSTIT_INSET, POSTIT_SIZE,
    POSTIT_DEPTH_OFFSET } = await import('../../public/break_escape/js/systems/postit-marks.js');

/** A stub scene whose add.image records each picture made. */
function scene() {
    const s = { images: [], listeners: {} };
    s.add = {
        image(x, y, key) {
            const img = {
                x, y, key, depth: 0, visible: true, active: true, interactive: true, destroyed: false,
                setOrigin() { return this; },
                setDepth(d) { this.depth = d; return this; },
                setVisible(v) { this.visible = v; return this; },
                setPosition(nx, ny) { this.x = nx; this.y = ny; return this; },
                disableInteractive() { this.interactive = false; return this; },
                destroy() { this.destroyed = true; this.active = false; }
            };
            s.images.push(img);
            return img;
        }
    };
    s.events = { on(name, fn) { (s.listeners[name] ||= []).push(fn); }, off() {} };
    return s;
}

function sprite(sc, data, { x = 100, y = 200, w = 36, h = 24, depth = 50 } = {}) {
    return { scene: sc, scenarioData: data, x, y, displayWidth: w, displayHeight: h, originX: 0, originY: 0,
        depth, visible: true, active: true };
}

function world(datas) {
    for (const k of Object.keys(window)) delete window[k];
    const sc = scene();
    const sprites = {};
    window.rooms = { office: { objects: {} } };
    datas.forEach((d) => { sprites[d.id] = sprite(sc, d); window.rooms.office.objects[`obj_${d.id}`] = sprites[d.id]; });
    return { sc, sprites, marks: new PostitMarks() };
}

const login = (id, extra = {}) => ({ id, type: 'pc', lockType: 'login', ...extra });

test('wantsPostit: sign-in PCs with hasPostit or a shown authored note only', () => {
    assert.equal(wantsPostit(login('a', { hasPostit: true })), true);
    assert.equal(wantsPostit(login('a', { postitNote: 'x' })), true);
    assert.equal(wantsPostit(login('a', { postitNote: 'x', showPostit: false })), false);
    assert.equal(wantsPostit(login('a', { postitNote: '  ' })), false);
    assert.equal(wantsPostit(login('a')), false);
    assert.equal(wantsPostit({ id: 'safe', lockType: 'password', postitNote: 'x' }), false);
    assert.equal(wantsPostit(null), false);
});

test('a sign-in PC with hasPostit gets one picture at the top-left offset and the stated depth; a second syncRoom adds none', () => {
    const { sc, sprites, marks } = world([login('omar_pc', { hasPostit: true })]);
    marks.syncRoom('office');
    assert.equal(sc.images.length, 1);
    const img = sc.images[0];
    assert.equal(img.key, POSTIT_TEXTURE);
    const s = sprites.omar_pc;
    assert.equal(img.x, Math.round(s.x + POSTIT_INSET + POSTIT_SIZE / 2));
    assert.equal(img.y, Math.round(s.y + POSTIT_INSET + POSTIT_SIZE / 2));
    assert.ok(img.x < s.x + s.displayWidth / 2, 'on the left half, clear of the indicator dot at the top-right');
    assert.equal(img.depth, s.depth + POSTIT_DEPTH_OFFSET);
    assert.ok(img.depth < s.depth + 0.01, 'below an indicator drawn at the object depth + 0.01');
    assert.equal(img.interactive, false, 'it takes no clicks');
    marks.syncRoom('office');
    assert.equal(sc.images.length, 1);
    assert.equal(postitPosition(s).x, img.x);
});

test('an authored, shown note gets one; neither, showPostit false, or a password lock gets none', () => {
    const { sc, marks } = world([
        login('noted_pc', { postitNote: 'Printer code 4410' }),
        login('plain_pc'),
        login('hidden_pc', { postitNote: 'x', showPostit: false }),
        { id: 'safe', type: 'safe', lockType: 'password', postitNote: 'Combination 1234' }
    ]);
    marks.syncRoom('office');
    assert.equal(sc.images.length, 1);
    assert.equal(marks.marks.has('noted_pc'), true);
});

test('mark(pcId, true) adds one to a loaded PC and mark(pcId, false) removes it', () => {
    const { sc, marks } = world([login('plain_pc'), { id: 'safe', type: 'safe', lockType: 'password' }]);
    marks.syncRoom('office');
    assert.equal(sc.images.length, 0);
    assert.equal(marks.mark('plain_pc', true), true);
    assert.equal(sc.images.length, 1);
    marks.syncRoom('office');
    assert.equal(sc.images.length, 1, 'remembered across a sync');
    assert.equal(marks.mark('safe', true), false, 'never on a password lock');
    assert.equal(marks.mark('plain_pc', false), true);
    assert.equal(sc.images[0].destroyed, true);
    assert.equal(marks.marks.size, 0);
});

test('the picture follows the sprite: hidden with it, gone when it goes', () => {
    const { sc, sprites, marks } = world([login('omar_pc', { hasPostit: true })]);
    marks.syncRoom('office');
    sprites.omar_pc.visible = false;
    marks.update();
    assert.equal(sc.images[0].visible, false);
    sprites.omar_pc.visible = true;
    sprites.omar_pc.x += 32;
    marks.update();
    assert.equal(sc.images[0].visible, true);
    assert.equal(sc.images[0].x, postitPosition(sprites.omar_pc).x);
    sprites.omar_pc.active = false;
    marks.update();
    assert.equal(sc.images[0].destroyed, true);
    assert.equal(marks.marks.size, 0);
});

test('installPostitMarks sets window.postitMarks, listens for update and syncs the loaded rooms', () => {
    const { sc } = world([login('omar_pc', { hasPostit: true })]);
    const installed = installPostitMarks(sc);
    assert.equal(window.postitMarks, installed);
    assert.equal(sc.listeners.update.length, 1);
    assert.equal(sc.images.length, 1);
    installPostitMarks(sc);
    assert.equal(sc.listeners.update.length, 1, 'one listener per scene');
});
