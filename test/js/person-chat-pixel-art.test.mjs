// The person chat's video-call mode and the phone-width caption follow the pixel-art UI rule
// (UX slice 16 R2 m4, m5): no gradients, blurred shadows or round corners in the video-call
// section, a stepped LIVE dot, and a caption that scrolls with the pixel-art scrollbar and
// shows "More below" while its choices run past the bottom edge.
// Run with: bin/test-js test/js/person-chat-pixel-art.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/person-chat-minigame.css'), 'utf8');
const uiSrc = readFileSync(join(here, '../../public/break_escape/js/minigames/person-chat/person-chat-ui.js'), 'utf8');

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

test('the video-call section has no gradient, blur or round corner (R2 m5)', () => {
    const start = css.indexOf('VIDEO CALL MODE');
    const end = css.indexOf('/* Animations */', start);
    assert.ok(start > 0 && end > start);
    const vc = strip(css.slice(start, end));
    assert.doesNotMatch(vc, /gradient\(/, 'no gradients');
    assert.doesNotMatch(vc, /border-radius/, 'no round corners');
    // every shadow is hard: x y 0 (or an inset ring with no blur)
    for (const m of vc.matchAll(/(?:box|text)-shadow:\s*([^;]+);/g)) {
        for (const part of m[1].split(/,(?![^(]*\))/)) {
            const lengths = part.replace(/rgba?\([^)]*\)|#[0-9a-f]+|inset/gi, '').trim().split(/\s+/).filter(Boolean);
            assert.ok(lengths.length < 3 || /^0(px)?$/.test(lengths[2]), `hard shadow: ${part.trim()}`);
        }
    }
    assert.doesNotMatch(vc, /font-weight:\s*bold/, 'no synthetic bold on the pixel font');
    const dot = vc.slice(vc.indexOf('.person-chat-vc-dot {'));
    assert.match(dot.slice(0, dot.indexOf('}')), /clip-path:\s*polygon\(/, 'the dot is drawn in steps');
});

test('the phone caption scrolls with the pixel-art scrollbar and a More below strip (R2 m4)', () => {
    assert.match(uiSrc, /captionArea\.classList\.add\('pixel-scroll'\)/);
    assert.match(uiSrc, /export const MORE_BELOW_TEXT = 'More below';/);
    assert.match(uiSrc, /moreBelow\.className = 'person-chat-more'/);
    const more = css.slice(css.indexOf('\n.person-chat-more {'));
    assert.match(more.slice(0, more.indexOf('}')), /display:\s*none/, 'hidden above 600 px');
    const phone = css.slice(css.indexOf('@media (max-width: 600px)'));
    assert.match(phone, /\.person-chat-more:not\(\[hidden\]\)\s*\{\s*display:\s*flex/);
});

test('updateScrollCue shows the strip only while the caption runs on', () => {
    const body = uiSrc.match(/updateScrollCue\(\) \{([\s\S]*?)\n    \}/)[1];
    const fn = new Function('self', body.replace(/this\./g, 'self.'));
    const self = { elements: { captionArea: { scrollHeight: 600, clientHeight: 300, scrollTop: 0 }, moreBelow: { hidden: true } } };
    assert.equal(fn(self), true);
    assert.equal(self.elements.moreBelow.hidden, false);
    self.elements.captionArea.scrollTop = 299;
    assert.equal(fn(self), false);
    assert.equal(self.elements.moreBelow.hidden, true, 'hidden at the end');
    self.elements.captionArea.scrollHeight = 300;
    self.elements.captionArea.scrollTop = 0;
    assert.equal(fn(self), false, 'nothing below when it fits');
});
