// A speaker whose first-choice talk portrait does not exist (female_hacker_hood_v2_talk.png, which falls
// back to female_hacker_hood_talk.png) used to cost a 404 on every line or portrait refresh, because each
// new renderer started the fallback chain again. The outcome is now remembered for the session.
// Run with: bin/test-js test/js/person-chat-talk-src-cache.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'talk-src-'));
mkdirSync(join(dir, 'minigames/person-chat'), { recursive: true });
mkdirSync(join(dir, 'ui'), { recursive: true });
copyFileSync(join(js, 'config.js'), join(dir, 'config.js'));
for (const f of ['person-chat-portraits.js', 'lip-sync.js', 'person-chat-camera.js']) {
    copyFileSync(join(js, 'minigames/person-chat', f), join(dir, 'minigames/person-chat', f));
}
writeFileSync(join(dir, 'ui/pretext-chrome.js'), 'export function influenceTintFilter() { return ""; }\n');

const requests = [];
const exists = new Set(['/break_escape/assets/characters/female_hacker_hood_talk.png']);
globalThis.window = globalThis;
globalThis.document = { querySelector: () => null };
globalThis.Image = class {
    set src(v) {
        requests.push(v);
        queueMicrotask(() => (exists.has(v) ? this.onload?.() : this.onerror?.()));
    }
};
console.log = () => {}; console.warn = () => {};

const Portraits = (await import(pathToFileURL(join(dir, 'minigames/person-chat/person-chat-portraits.js')))).default;
const tick = () => new Promise(r => setTimeout(r, 0));

async function render(npc) {
    const p = new Portraits({}, npc, {}, null);
    p.ctx = {}; p.canvas = { width: 400, height: 400 };
    p.render = () => {}; p._setupVisemeSheet = () => {};
    p.setupSpriteInfo();
    p.renderSpriteTalkImage();
    await tick(); await tick(); await tick();
    return p;
}

test('a v2 speaker with only a base talk sheet is requested once per candidate across repeated renders', async () => {
    const npc = { id: 'player', spriteSheet: 'female_hacker_hood_v2' };
    for (let i = 0; i < 6; i++) {
        const p = await render(npc);
        assert.ok(p.spriteTalkImage, `render ${i} shows the base talk portrait`);
    }
    const count = (s) => requests.filter(r => r.endsWith(s)).length;
    assert.equal(count('/female_hacker_hood_v2_talk.png'), 1, 'the missing v2 sheet is asked for once');
    assert.equal(requests.filter(r => r.endsWith('/female_hacker_hood_v2_headshot.png')).length, 0, 'no headshot lookups either');
    assert.equal(count('/female_hacker_hood_talk.png'), 6, 'the sheet that exists is loaded directly each render (a normal cache hit)');
});

test('a speaker with no portrait at all is asked for once and then drawn from the sprite', async () => {
    requests.length = 0;
    const npc = { id: 'bed', spriteSheet: 'hospital_bed_x', spriteTalk: 'assets/characters/none_talk.png' };
    for (let i = 0; i < 4; i++) await render(npc);
    assert.equal(requests.filter(r => r.endsWith('none_talk.png')).length, 1);
    assert.equal(requests.filter(r => r.endsWith('none_headshot.png')).length, 1);
});
