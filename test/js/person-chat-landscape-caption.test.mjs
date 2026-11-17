// Phone landscape (844x390, 667x375, 915x412): the person-chat caption must stay inside the chat
// box and scroll, so the speaker line and all five choices are reachable. It used to grow upward
// off the screen. In landscape it is a left column (clear of the NPC and the X), shows the
// "More below" cue, and clears the video-call status bar. The cue itself shows at any width whenever
// the caption scrolls (overlaid on the band's foot, in flow on phones). Portrait scale logic stays
// untouched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'public/break_escape/css/person-chat-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const ui = readFileSync(join(root, 'public/break_escape/js/minigames/person-chat/person-chat-ui.js'), 'utf8');

function mediaBlock(query, from = 0) {
    const start = css.indexOf(query, from);
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

const QUERY = '@media (min-width: 600.02px) and (max-height: 520px)';
const land = mediaBlock(QUERY);
const lrules = parse(land.block);
const L = (sel) => bodyOf(lrules, sel);
// base rules: everything before the first @media
const base = parse(css.slice(0, css.indexOf('@media')));
const B = (sel) => bodyOf(base, sel);

test('the query uses min-width 600.02px (fractional widths, older Safari) and is landscape-only', () => {
    assert.ok(land.start > css.indexOf('.person-chat-caption-area'), 'after the base rule');
    assert.doesNotMatch(css, /min-width:\s*601px/);
    assert.doesNotMatch(css, /\(width\s*[<>]/, 'no range-syntax queries');
});
test('base caption is capped to the chat box, scrolls and packs from the start edge (heights 521-700)', () => {
    const b = B('.person-chat-caption-area');
    assert.match(b, /max-height:\s*100%/);
    assert.match(b, /overflow-y:\s*auto/);
    assert.match(b, /align-items:\s*flex-start/);
});
test('scrollbar-gutter is stable in the base caption rule, with scroll padding for the strip', () => {
    assert.match(B('.person-chat-caption-area'), /scrollbar-gutter:\s*stable both-edges/);
    // phone and landscape keep the one-sided gutter: both-edges would cost them 28px
    assert.match(L('.person-chat-caption-area'), /scrollbar-gutter:\s*stable;/);
    const ph = parse(mediaBlock('@media (max-width: 600px)').block);
    assert.match(bodyOf(ph, '.person-chat-caption-area'), /scrollbar-gutter:\s*stable;/);
    assert.match(B('.person-chat-caption-area'), /scroll-padding-bottom:\s*36px/);
    assert.doesNotMatch(css, /@media \(max-height: 700px\)/);
});
test('landscape caption is a left column, 60% wide, clear of the NPC and the X', () => {
    assert.match(L('.person-chat-caption-area'), /right:\s*auto/);
    assert.match(L('.person-chat-caption-area'), /width:\s*var\(--pc-caption-col\)/);
    assert.match(L('.person-chat-root'), /--pc-caption-col:\s*60%/);
    assert.equal((land.block.match(/60%/g) || []).length, 1, 'the column width is written once');
    assert.match(L('.person-chat-caption-content'), /flex-direction:\s*column/);
    assert.match(L('.person-chat-caption-content'), /flex-wrap:\s*nowrap/);
    assert.match(L('.person-chat-controls-area'), /max-width:\s*100%/);
    assert.match(L('.person-chat-controls-area'), /min-width:\s*0/);
});
test('landscape dialogue text is the phone block size (24px, GNF crisp) on a 30px line; name is 16px', () => {
    assert.match(L('.person-chat-dialogue-text'), /font-size:\s*24px/);
    assert.match(L('.person-chat-dialogue-text'), /line-height:\s*30px/);
    assert.match(L('.person-chat-speaker-name'), /font-size:\s*16px/);
    const phone = mediaBlock('@media (max-width: 600px)');
    assert.match(bodyOf(parse(phone.block), '.person-chat-dialogue-text'), /font-size:\s*24px/);
});
test('the More below cue: base rule lies over the foot at any width, ignores taps; landscape narrows it; phone keeps it in flow', () => {
    const b = B('.person-chat-more:not([hidden])');
    assert.match(b, /display:\s*flex/);
    assert.match(b, /position:\s*absolute/);
    assert.match(b, /bottom:\s*0/);
    assert.match(b, /pointer-events:\s*none/);
    // stops short of the caption's 14px scrollbar gutter so the track stays visible
    assert.match(b, /left:\s*14px/);
    assert.match(b, /right:\s*14px/);
    assert.match(b, /width:\s*auto/); // the plain .person-chat-more rule's width:100% would push it past the right edge
    const l = L('.person-chat-more:not([hidden])');
    assert.match(l, /left:\s*0/);
    assert.match(l, /right:\s*auto/);
    assert.match(l, /width:\s*calc\(var\(--pc-caption-col\) - 14px\)/);
    assert.doesNotMatch(l, /display:/);
    const phone = parse(mediaBlock('@media (max-width: 600px)').block);
    assert.match(bodyOf(phone, '.person-chat-more:not([hidden])'), /position:\s*static/);
    // the base rule's width:auto would otherwise shrink the in-flow strip to a box in the centred column
    assert.match(bodyOf(phone, '.person-chat-more:not([hidden])'), /width:\s*100%/);
    assert.match(bodyOf(phone, '.person-chat-caption-area'), /scroll-padding-bottom:\s*4px/);
    assert.match(B('.person-chat-caption-area'), /scroll-padding-top:\s*4px/);
    // overlay scrollbars reserve no gutter: the strip insets go back to 0
    const sup = mediaBlock('@supports not selector(::-webkit-scrollbar)');
    assert.match(bodyOf(parse(sup.block), '.person-chat-more:not([hidden])'), /left:\s*0;\s*right:\s*0/);
    // the landscape column width override is nested inside the @supports block, not after it
    const inner = mediaBlock('@media (min-width: 600.02px) and (max-height: 520px) {', sup.start);
    assert.ok(inner.start > sup.start && inner.start < sup.start + sup.block.length, 'nested in @supports');
    const irules = parse(inner.block);
    assert.match(bodyOf(irules, '.person-chat-more:not([hidden])'), /width:\s*var\(--pc-caption-col\)/);
    assert.match(ui, /updateScrollCue/);
});
test('desktop video call (heights 521-700) keeps the capped caption clear of the status bar and PiP', () => {
    const wide = parse(mediaBlock('@media (min-width: 600.02px) {').block);
    assert.match(bodyOf(wide, '.video-call-mode .person-chat-caption-area'), /max-height:\s*calc\(100% - 180px\)/);
    const mid = parse(mediaBlock('@media (min-width: 600.02px) and (max-width: 768px)').block);
    assert.match(bodyOf(mid, '.video-call-mode .person-chat-caption-area'), /max-height:\s*calc\(100% - 138px\)/);
    assert.ok(css.indexOf('calc(100% - 180px)') < land.start, 'before the landscape block');
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
