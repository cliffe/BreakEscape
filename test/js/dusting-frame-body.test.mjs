// Post-release fixes: (1) the capped frame never scrolls as a whole, only a named inner region (.dusting-body) does;
// (2) every reference card draws its name and match state as text (a touch screen has no title tooltip), every card
// after the match is labelled, and the aria-label and title stay in step with the visible words.
// Run with: node --test test/js/dusting-frame-body.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/dusting.css'), 'utf8');
const game = readFileSync(join(here, '../../public/break_escape/js/minigames/dusting/dusting-game.js'), 'utf8');
const rule = sel => { const i = css.indexOf(sel + ' {'); assert.ok(i >= 0, `rule ${sel}`); return css.slice(i, css.indexOf('}', i)); };

test('the root is a flex column that does not scroll; the body is the scroll region', () => {
    const root = rule('.dusting-root');
    assert.match(root, /display: flex; flex-direction: column/);
    assert.doesNotMatch(root, /overflow-y: auto/, 'root must not scroll as a whole');
    assert.match(root, /overflow: hidden/);
    const body = rule('.dusting-body');
    assert.match(body, /overflow-y: auto/);
    assert.match(body, /min-height: 0/);
    assert.match(body, /flex: 1 1 auto/);
    assert.match(css, /\.dusting-short \.dusting-body \{ display: contents; \}/);
});

test('the body wraps the main row, forensic line, status and options, and the title and steps stay outside it', () => {
    const t = game.slice(game.indexOf('<div class="dusting-root'), game.indexOf("this.root = this.gameContainer.querySelector('.dusting-root')"));
    const bodyAt = t.indexOf('class="dusting-body"');
    assert.ok(bodyAt > t.indexOf('class="dusting-steps"'), 'steps come before the body');
    assert.ok(bodyAt > t.indexOf('class="dusting-title"'));
    for (const c of ['dusting-main', 'dusting-forensic', 'dusting-status', 'dusting-options']) assert.ok(t.indexOf(`class="${c}`) > bodyAt, c);
    assert.match(t, /data-region="dusting-body"/);
});

test('the zoom budget measures the body, not the (now capped) root', () => {
    assert.match(game, /querySelector\('\.dusting-body'\)/);
    assert.match(game, /this\.root\.clientHeight - body\.clientHeight \+ body\.scrollHeight/);
});

test('every card shows its state as text; after the match the others read "not a match" too', () => {
    assert.match(game, /const state = done && c\.correct \? 'match' : \(c\.rejected \|\| \(done && this\.identified\)\) \? 'not a match' : ''/);
    assert.match(game, /dusting-ref-tag" data-state="\$\{state === 'match' \? 'match' : 'no'\}">\(\$\{state\}\)/);
    assert.match(game, /aria-label="Reference card \$\{c\.index \+ 1\}: \$\{escapeHtml\(c\.label\)\}\$\{state \? ', ' \+ state : ''\}"/);
});

test('no card name is clipped: no clamp or ellipsis on the name or tag', () => {
    assert.doesNotMatch(css, /\.dusting-ref-name[^{]*\{[^}]*(line-clamp|ellipsis)/);
    assert.doesNotMatch(css, /\.dusting-ref-tag[^{]*\{[^}]*(ellipsis|nowrap)/);
});
