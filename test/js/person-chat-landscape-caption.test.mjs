// Phone landscape (844x390, 667x375, 915x412): the person-chat caption must stay inside the chat
// box and scroll, so the speaker line and all five choices are reachable. It used to grow upward
// off the screen. In landscape it is a left column (clear of the NPC and the X), shows the
// "More below" cue, and clears the video-call status bar. Portrait scale logic stays untouched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'public/break_escape/css/person-chat-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const ui = readFileSync(join(root, 'public/break_escape/js/minigames/person-chat/person-chat-ui.js'), 'utf8');

function mediaBlock(query) {
    const start = css.indexOf(query);
    assert.ok(start >= 0, `media query exists: ${query}`);
    let depth = 0, end = start;
    for (let i = css.indexOf('{', start); i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}' && --depth === 0) { end = i; break; }
    }
    return { start, block: css.slice(css.indexOf('{', start) + 1, end) };
}
const parse = (text) => [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
const bodyOf = (rules, sel) => rules.filter((r) => r.sel === sel).map((r) => r.body).join(';');

const QUERY = '@media (width > 600px) and (height <= 520px)';
const land = mediaBlock(QUERY);
const lrules = parse(land.block);
const L = (sel) => bodyOf(lrules, sel);
// base rules: everything before the first @media
const base = parse(css.slice(0, css.indexOf('@media')));
const B = (sel) => bodyOf(base, sel);

test('the query uses range syntax (covers fractional widths) and is landscape-only', () => {
    assert.ok(land.start > css.indexOf('.person-chat-caption-area'), 'after the base rule');
    assert.doesNotMatch(css, /min-width:\s*601px/);
});
test('base caption is capped to the chat box, scrolls and packs from the start edge (heights 521-700)', () => {
    const b = B('.person-chat-caption-area');
    assert.match(b, /max-height:\s*100%/);
    assert.match(b, /overflow-y:\s*auto/);
    assert.match(b, /align-items:\s*flex-start/);
});
test('scrollbar-gutter is stable where the band can scroll', () => {
    assert.match(css, /@media \(max-height: 700px\)\s*\{\s*\.person-chat-caption-area\s*\{\s*scrollbar-gutter:\s*stable/);
});
test('landscape caption is a left column, 60% wide, clear of the NPC and the X', () => {
    assert.match(L('.person-chat-caption-area'), /right:\s*auto/);
    assert.match(L('.person-chat-caption-area'), /width:\s*60%/);
    assert.match(L('.person-chat-caption-content'), /flex-direction:\s*column/);
    assert.match(L('.person-chat-caption-content'), /flex-wrap:\s*nowrap/);
    assert.match(L('.person-chat-controls-area'), /max-width:\s*100%/);
    assert.match(L('.person-chat-controls-area'), /min-width:\s*0/);
});
test('landscape dialogue text is the phone block size (24px)', () => {
    assert.match(L('.person-chat-dialogue-text'), /font-size:\s*24px/);
    const phone = mediaBlock('@media (max-width: 600px)');
    assert.match(bodyOf(parse(phone.block), '.person-chat-dialogue-text'), /font-size:\s*24px/);
});
test('the More below cue shows in landscape at the foot of the caption column', () => {
    const b = L('.person-chat-more:not([hidden])');
    assert.match(b, /display:\s*flex/);
    assert.match(b, /position:\s*absolute/);
    assert.match(b, /bottom:\s*0/);
    assert.match(b, /width:\s*60%/);
    assert.doesNotMatch(ui, /Hidden above 600/);
});
test('video call: the band starts below the status bar and the PiP is dropped', () => {
    assert.match(L('.video-call-mode .person-chat-caption-area'), /max-height:\s*calc\(100% - 40px\)/);
    assert.match(L('.video-call-mode .person-chat-pip'), /display:\s*none/);
});
test('choice padding is 6px 10px', () => {
    assert.match(L('.person-chat-choice-button'), /padding:\s*6px 10px/);
});
test('landscape rules leave the portrait sprite scale alone; the <=600 block still owns --pc-portrait-h', () => {
    assert.doesNotMatch(land.block, /pc-portrait-h|portrait-section|canvas|transform|scale/);
    const phone = mediaBlock('@media (max-width: 600px)');
    assert.match(phone.block, /--pc-portrait-h/);
});
test('no radius in the landscape block', () => {
    assert.doesNotMatch(land.block, /border-radius/);
});
