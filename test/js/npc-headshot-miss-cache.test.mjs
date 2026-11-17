// Headshot lookups: no candidate for object sprites (m02 bed patients), and a missed file is
// requested at most once per session. Run with: bin/test-js test/js/npc-headshot-miss-cache.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(join(here, '../../public/break_escape/js/utils/npc-headshot.js')).href);
const { headshotKeys, applyHeadshotBox, resetMissingHeadshots } = mod;

const textures = {
    tex: { bed2: ['0', '1'], bed_ms_chen: ['0', '1', '2'], maya: ['walk_south_frame_000', 'idle_north_frame_000'] },
    exists(k) { return k in this.tex; },
    get(k) { return { getFrameNames: () => this.tex[k] }; },
};

function box() { return { style: {}, dataset: {}, hidden: true }; }
function fakeImage(existing, requests) {
    return class {
        set src(v) {
            requests.push(v);
            queueMicrotask(() => {
                if (existing.has(v)) { this.naturalWidth = 32; this.naturalHeight = 32; this.onload?.(); } else this.onerror?.();
            });
        }
    };
}
const settle = () => new Promise((r) => setTimeout(r, 5));

test('bed patients (object spritesheets) have no headshot candidates at all', () => {
    assert.deepEqual(headshotKeys({ spriteSheet: 'bed2', portrait: 'assets/characters/mrs_hargreaves_talk.png' }, { textures }), []);
    assert.deepEqual(headshotKeys({ spriteSheet: 'bed_ms_chen', portrait: 'assets/characters/ms_chen_talk.png' }, { textures }), []);
});

test('an authored headshot avatar still counts for an object-sprite NPC', () => {
    assert.deepEqual(headshotKeys({ avatar: 'assets/characters/x_headshot.png', spriteSheet: 'bed2' }, { textures }), ['x']);
});

test('a character atlas keeps its talk-stem candidates', () => {
    assert.deepEqual(headshotKeys({ spriteSheet: 'maya', portrait: 'assets/characters/maya_talk.png' }, { textures }), ['maya', 'maya_v2']);
});

test('a character atlas or an unloaded key still gets its spriteSheet candidate', () => {
    assert.deepEqual(headshotKeys({ spriteSheet: 'maya' }, { textures }), ['maya']);
    assert.deepEqual(headshotKeys({ spriteSheet: 'not_loaded_yet' }, { textures }), ['not_loaded_yet']);
});

test('a second lookup of a missed key makes no new Image', async () => {
    resetMissingHeadshots();
    const requests = [];
    let made = 0;
    const Base = fakeImage(new Set(), requests);
    const ImageCtor = class extends Base { constructor() { super(); made++; } };
    const src = { spriteSheet: 'ghost' };
    applyHeadshotBox(box(), src, { ImageCtor, onMissing: () => {} });
    await settle();
    assert.equal(made, 1);
    applyHeadshotBox(box(), src, { ImageCtor, onMissing: () => {} });
    await settle();
    assert.equal(made, 1, 'no new Image for a key that already missed');
    assert.equal(requests.length, 1);
});

test('a normal NPC headshot resolves on the first try', async () => {
    resetMissingHeadshots();
    const requests = [];
    const url = '/break_escape/assets/characters/maya_headshot.png';
    const ImageCtor = fakeImage(new Set([url]), requests);
    const el = box();
    applyHeadshotBox(el, { spriteSheet: 'maya' }, { ImageCtor });
    await settle();
    assert.deepEqual(requests, [url]);
    assert.equal(el.dataset.headshot, 'maya');
    assert.equal(el.hidden, false);
});
