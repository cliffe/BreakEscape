// Engine fixes, round 4 (2026-10-17): the phone's "typing" indicator after a tag closed
// the phone, the 422 from removing a container item's stand-in id from the room, and the
// text viewer's white copy icons on light panels. The phone hit notice is covered in
// player-damage-interrupt.test.mjs.
// Run with: node --test test/js/engine-fixes-round4.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const js = join(pub, 'js');
const dir = mkdtempSync(join(tmpdir(), 'engine-round4-'));
const load = async (rel, name) => {
    writeFileSync(join(dir, name), readFileSync(join(js, rel), 'utf8'));
    return import(pathToFileURL(join(dir, name)).href);
};

// Pull one method out of a class body as a plain function, so it can be run on a stub
function method(src, name) {
    const m = src.match(new RegExp(`\\n    ${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    return new Function(...m[1].split(',').map(s => s.split('=')[0].trim()).filter(Boolean), m[2]);
}

test('m06 N-6-1: the typing indicator does nothing once the phone UI is torn down', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
    const show = method(src, 'showTypingIndicator');
    const hide = method(src, 'hideTypingIndicator');
    const scroll = method(src, 'scrollToBottom');
    // destroy() leaves elements = {}: this used to throw "reading 'style'"
    const torn = { elements: {}, scrollToBottom() { scroll.call(this); } };
    assert.doesNotThrow(() => show.call(torn));
    assert.doesNotThrow(() => hide.call(torn));
    const el = { style: {} };
    const live = { elements: { typingIndicator: el }, scrollToBottom() {} };
    show.call(live);
    assert.equal(el.style.display, 'flex');
    hide.call(live);
    assert.equal(el.style.display, 'none');
});

test('m06 N-6-1: lines waiting to be typed are set before the tags, which can close the phone', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    // Both typeouts (after continue and after a choice): pending lines are recorded
    // before processGameActionTags, so a close inside the tags flushes them to the thread
    const tagCalls = [...src.matchAll(/processGameActionTags\(accumulatedTags, this\.ui\)/g)].map(m => m.index);
    assert.equal(tagCalls.length, 2);
    for (const at of tagCalls) {
        const before = src.slice(Math.max(0, at - 1200), at);
        assert.match(before, /this\._pendingNpcMessages = accumulatedMessages\.filter/);
    }
    // _showStoryLine stops before the typing indicator if the thread is no longer open
    const body = src.slice(src.indexOf('async _showStoryLine('), src.indexOf('async handleChoice('));
    assert.ok(body.indexOf('if (!stillOurs()) return false;') < body.indexOf('showTypingIndicator()'));
});

test('m06 N-6-1: a container item\'s stand-in id is never sent as a room removal (was a 422)', async () => {
    globalThis.window = { breakEscapeConfig: { gameId: 1 } };
    let fetched = 0;
    globalThis.fetch = async () => { fetched++; return { json: async () => ({ success: true }) }; };
    globalThis.document = { querySelector: () => null };
    try {
        const { isStandInObjectId, removeItemFromRoom } = await load('systems/room-state-sync.js', 'room-state-sync.mjs');
        assert.equal(isStandInObjectId('temp_1792268439561'), true);
        assert.equal(isStandInObjectId('architects_fund_doc'), false);
        assert.equal(isStandInObjectId('temp_desk'), false, 'only the generated temp_<time> form');
        assert.equal(isStandInObjectId(undefined), false);
        assert.equal(await removeItemFromRoom('data_center', 'temp_1792268439561'), false);
        assert.equal(fetched, 0, 'no request');
        assert.equal(await removeItemFromRoom('data_center', 'architects_fund_doc'), true);
        assert.equal(fetched, 1);
    } finally {
        delete globalThis.window; delete globalThis.fetch; delete globalThis.document;
    }
});

test('m08 N-8-2: the text viewer darkens its white copy icons on light panels, not in the dark scheme', () => {
    const css = readFileSync(join(pub, 'css/text-file-minigame.css'), 'utf8');
    const dark = css.indexOf('@media (prefers-color-scheme: dark)');
    const base = css.slice(0, dark);
    assert.match(base, /\.action-btn \.icon-small,\s*\.file-observations h4 \.icon-small \{\s*filter: brightness\(0\)/);
    assert.match(css.slice(dark), /\.action-btn \.icon-small,\s*\.file-observations h4 \.icon-small \{\s*filter: none;/);
    // The icon really is white, which is why it vanished
    const markup = readFileSync(join(js, 'minigames/text-file/text-file-minigame.js'), 'utf8');
    assert.match(markup, /copy-sm\.png" alt="Clipboard" class="icon-small"> Copy/);
});
