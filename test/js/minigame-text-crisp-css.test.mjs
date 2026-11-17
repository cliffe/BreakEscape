// Pixel-font body text, labels and status lines in minigames must render without colour fringes.
// Second list beside the titles rule (minigame-title-crisp-css.test.mjs): same hint, same scoping,
// own explicit class list of leaf text elements. See the comment above the rule in
// public/break_escape/css/minigames-framework.css.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cssDir = join(root, 'public/break_escape/css');
const css = readFileSync(join(cssDir, 'minigames-framework.css'), 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
const rule = rules.find((r) => /will-change:\s*transform/.test(r.body) && /\.note-md-text\b/.test(r.sel));
const inner = rule && /^\.minigame-container\s+:is\(([\s\S]*)\)$/.exec(rule.sel);
const parts = inner ? inner[1].split(',').map((x) => x.trim()).filter(Boolean) : [];
const listed = (cls) => parts.includes(`.${cls}`);
const listedWithTag = (cls) => parts.some((p) => p.startsWith(`.${cls} `));

test('a body-text rule promotes leaf text to its own layer, scoped to the minigame container', () => {
    assert.ok(rule, 'a will-change: transform rule on body text exists');
    assert.ok(inner, 'scoped to .minigame-container with :is(list)');
    assert.ok(parts.length >= 20, 'the list names the measured text classes');
    assert.match(rule.body, /will-change:\s*transform/);
});

test('it is a separate rule from the titles rule', () => {
    const titles = rules.find((r) => /\.patch-panel-title\b/.test(r.sel));
    assert.ok(titles && titles !== rule);
    assert.ok(!parts.includes('.patch-panel-title'));
});

test('every entry is a plain class, or one class plus a heading tag', () => {
    for (const p of parts) {
        assert.ok(/^\.[\w-]+$/.test(p) || /^\.[\w-]+ (h[1-6]|p|label|span)$/.test(p), `entry ${p} is a plain class, or one class followed by a tag`);
    }
    assert.doesNotMatch(rule.sel, /\[class|\*/);
    assert.equal(new Set(parts).size, parts.length, 'no duplicate entries');
});

test('the measured body text is covered', () => {
    for (const cls of ['note-md-text', 'rogue-ap-note', 'lpb-copy', 'combination-help', 'combination-status-message',
        'tri-brief-score', 'tri-brief-when', 'tri-brief-note', 'tri-brief-restart', 'siem-queue-count', 'ib-progress',
        'pin-minigame-attempt-empty', 'person-chat-dialogue-text', 'rogue-ap-ssid', 'cryptex-subtitle',
        'password-info-name', 'password-info-text', 'password-field-label']) {
        assert.ok(listed(cls), `${cls} is listed`);
    }
});

test('wrappers with controls, skin buttons, sr-only text and repeated rows are not covered', () => {
    for (const cls of ['siem-alert-row', 'combination-header', 'tri-panel', 'device-frame', 'rogue-ap-pane',
        'password-minigame-area', 'minigame-container', 'ob-sr', 'signin-prompt', 'mail-sr-only',
        'siem-time', 'siem-source', 'siem-description', 'siem-btn', 'patch-panel-label', 'pin-minigame-key',
        'cryptex-wheel-arrow', 'combination-dial-arrow', 'mail-compose-btn', 'mail-contacts-btn', 'ob-case',
        'tri-start', 'notes-minigame-nav-button', 'person-chat-continue-button', 'rogue-ap-tab', 'lpb-purpose']) {
        assert.ok(!listed(cls), `${cls} is not listed`);
        assert.ok(!listedWithTag(cls), `${cls} is not listed with a tag`);
    }
});

test('the rule adds no transform, zoom, filter, radius or font to the text', () => {
    assert.doesNotMatch(rule.body, /(^|[;\s])(transform|zoom|filter|border-radius|font-family)\s*:/);
    const container = rules.find((r) => r.sel === '.minigame-container');
    assert.doesNotMatch(container.body, /will-change|transform/);
});

// A listed class that nothing emits is a dead entry that reads as coverage.
const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
});
const sources = [...walk(join(root, 'public/break_escape/js')), ...walk(join(root, 'app/views'))]
    .filter((f) => /\.(js|mjs|erb)$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

test('every listed class is emitted by the engine JS or a view', () => {
    for (const p of parts) {
        const cls = /^\.([\w-]+)/.exec(p)[1];
        assert.ok(new RegExp(`(^|[^\\w-])${cls}([^\\w-]|$)`).test(sources), `${cls} appears in public/break_escape/js or app/views`);
    }
});

test('the classes added in JS for bare tags are set with classList, not innerHTML', () => {
    const pw = readFileSync(join(root, 'public/break_escape/js/minigames/password/password-minigame.js'), 'utf8');
    for (const cls of ['password-info-name', 'password-info-text', 'password-field-label']) {
        assert.match(pw, new RegExp(`tagText\\([^)]*'${cls}'\\)`), `${cls} is added by classList`);
    }
    const cx = readFileSync(join(root, 'public/break_escape/js/minigames/cryptex/cryptex-minigame.js'), 'utf8');
    assert.match(cx, /#cryptex-subtitle'\)\?\.classList\.add\('cryptex-subtitle'\)/);
});

test('the dead font-smooth declarations are gone from main.css and player_preferences.css', () => {
    for (const f of ['main.css', 'player_preferences.css']) {
        const c = strip(readFileSync(join(cssDir, f), 'utf8'));
        assert.doesNotMatch(c, /font-smooth\s*:/, `${f} has no font-smooth`);
        assert.doesNotMatch(c, /-webkit-font-smoothing\s*:\s*none/, `${f} has no -webkit-font-smoothing: none`);
        assert.match(readFileSync(join(cssDir, f), 'utf8'), /minigames-framework\.css/, `${f} points to the framework rules`);
    }
    const ransom = readFileSync(join(cssDir, 'ransomware-display-minigame.css'), 'utf8');
    assert.match(ransom, /-webkit-font-smoothing:\s*antialiased/, 'the ransomware antialiased lines stay');
});
