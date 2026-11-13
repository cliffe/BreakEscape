// Slice 9.1 step 2 (docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md 5.3): systems/postit-marks.js
// draws the notes_postit1 picture at a sign-in PC's bottom-left corner when its screen shows a
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
                setOrigin(ox, oy) { this.originX = ox; this.originY = oy; return this; },
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

test('a sign-in PC with hasPostit gets one picture at the bottom-left and the stated depth; a second syncRoom adds none', () => {
    const { sc, sprites, marks } = world([login('omar_pc', { hasPostit: true })]);
    marks.syncRoom('office');
    assert.equal(sc.images.length, 1);
    const img = sc.images[0];
    assert.equal(img.key, POSTIT_TEXTURE);
    const s = sprites.omar_pc;
    // Drawn from its bottom-left (review R2 n1), so its left edge is a whole pixel, inset
    assert.equal(img.x, Math.round(s.x + POSTIT_INSET));
    assert.ok(Number.isInteger(img.x) && img.x - s.x === POSTIT_INSET, 'the left edge on a whole pixel, inset');
    // UX feedback slice 2a (main-11): the note's bottom edge is level with the sprite's bottom
    // (review R1 n1), so its bottom edge is exactly img.y
    assert.equal(img.originX, 0);
    assert.equal(img.originY, 1);
    assert.equal(img.y, s.y + s.displayHeight, 'the bottom edge is the sprite bottom, to the pixel');
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

test('label: a PC with a note picture says so in its proximity label; others are unchanged (9.2 B review R1)', () => {
    const { marks } = world([login('plain_pc'), login('other_pc')]);
    marks.syncRoom('office');
    assert.equal(marks.label('plain_pc', "Mei's PC"), "Mei's PC");
    marks.mark('plain_pc', true);
    assert.equal(marks.label('plain_pc', "Mei's PC"), "Mei's PC (a sticky note on the monitor)");
    assert.equal(marks.label('plain_pc', "Mei's PC: a sign-in PC."), "Mei's PC: a sign-in PC. A sticky note is stuck to the monitor.");
    assert.equal(marks.label('other_pc', 'Spare PC'), 'Spare PC');
    assert.equal(marks.label('plain_pc', null), null);
    marks.mark('plain_pc', false);
    assert.equal(marks.label('plain_pc', "Mei's PC"), "Mei's PC");
});

// Review 9.2 B R2 n5: an author's non-string observation must not throw in the per-frame label
test('label passes a non-string observation through unchanged, marked or not', () => {
    const { sc, marks } = world([login('plain_pc', { hasPostit: true })]);
    marks.syncRoom('office');
    const obj = { a: 1 };
    assert.equal(marks.label('plain_pc', obj), obj);
    assert.equal(marks.label('plain_pc', 42), 42);
    assert.equal(marks.label('plain_pc', undefined), undefined);
    assert.equal(marks.label('plain_pc', "Mei's PC"), "Mei's PC (a sticky note on the monitor)");
});

test('slice 2a R5 M1: a sign-in PC in the start room gets its mark once the start room is built', async () => {
    // Boot order: installPostitMarks runs before any room exists, so its own pass finds nothing
    for (const k of Object.keys(window)) delete window[k];
    const sc = scene();
    window.rooms = {};
    const marks = new PostitMarks().install(sc);
    assert.equal(marks.marks.size, 0);
    // Then the start room is made directly (game.js), not through the room loader
    window.rooms.omar_room = { objects: { obj_omar_pc: sprite(sc, login('omar_pc', { hasPostit: true })) } };
    window.postitMarks = marks;
    // game.js must make the same per-room syncs for the start room as core/rooms.js does
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../../public/break_escape/js/core/game.js', import.meta.url), 'utf8');
    const at = src.indexOf('createRoom(startRoomId');
    assert.ok(at > 0, 'game.js builds the start room');
    const after = src.slice(at, src.indexOf('revealRoom(startRoomId)', at));
    for (const sync of ['screenStates', 'networkLinks', 'postitMarks', 'npcWorkarounds']) {
        assert.match(after, new RegExp(`window\\.${sync}\\?\\.syncRoom\\?\\.\\(startRoomId\\)`),
            `${sync}.syncRoom(startRoomId) runs after the start room is built`);
    }
    window.postitMarks?.syncRoom?.('omar_room');
    assert.equal(marks.marks.size, 1);
    assert.ok(marks.marks.has('omar_pc'), "Omar's PC has its mark after boot");
});

test('slice 2a (main-11): the mark sits on the sprite bottom for any origin', () => {
    for (const [originX, originY] of [[0, 0], [0.5, 0.5], [0.5, 1]]) {
        const sprite = { x: 100, y: 200, displayWidth: 32, displayHeight: 48, originX, originY };
        const { x, y } = postitPosition(sprite);
        const bottom = sprite.y - sprite.displayHeight * originY + sprite.displayHeight;
        const left = sprite.x - sprite.displayWidth * originX;
        assert.equal(y, bottom, `origin ${originX},${originY}: bottom ${y} against sprite bottom ${bottom}`);
        assert.equal(x, Math.round(left + POSTIT_INSET));
        assert.ok(Number.isInteger(x), `origin ${originX},${originY}: left edge on a whole pixel`);
    }
});
