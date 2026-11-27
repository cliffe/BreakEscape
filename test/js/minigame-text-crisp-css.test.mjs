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
// Exact pin: any removal or addition fails here. A change needs a fringe measurement on Chrome for
// Linux at 1280x720 and 390x844 (leaf text only, never a row of a list or a wrapper with controls).
const EXPECTED = [
    '.note-md-text',
    '.rogue-ap-note',
    '.rogue-ap-scan',
    '.lpb-copy',
    '.lpb-address-text',
    '.lpb-not-secure',
    '.lpb-purpose',
    '.lpb-submit',
    '.lpb-field-label',
    '.combination-help',
    '.combination-status-message',
    '.combination-direction-indicator',
    '.combination-dial-label',
    '.combination-dial-display',
    '.cryptex-subtitle',
    '.cryptex-wheel-label',
    '.password-info-name',
    '.password-info-text',
    '.password-field-label',
    '.attempts-counter',
    '.tri-brief-title',
    '.tri-brief-text',
    '.tri-brief-kind',
    '.tri-brief-score',
    '.tri-brief-when',
    '.tri-brief-restart',
    '.tri-brief-note',
    '.tri-brief-buttons',
    '.tri-steps',
    '.siem-queue-count',
    '.siem-status-bar',
    '.patch-panel-footer',
    '.patch-panel-legend',
    '.mail-subject',
    '.mail-headers',
    '.ib-progress',
    '.ib-empty',
    '.mail-read-pane .ib-infl-label',
    '.pin-minigame-attempt-empty',
    '.person-chat-dialogue-text',
    '.person-chat-speaker-name',
];
const listed = (cls) => parts.includes(`.${cls}`);
// Any class token of any entry, so a parent-class form such as `.rogue-ap-pane .rogue-ap-scan-row` is caught too.
const listedWithTag = (cls) => parts.some((p) => [...p.matchAll(/\.([\w-]+)/g)].some((m) => m[1] === cls));

test('a body-text rule promotes leaf text to its own layer, scoped to the minigame container', () => {
    assert.ok(rule, 'a will-change: transform rule on body text exists');
    assert.ok(inner, 'scoped to .minigame-container with :is(list)');
    assert.deepEqual([...parts].sort(), [...EXPECTED].sort(), 'the list is exactly the pinned list');
    assert.match(rule.body, /will-change:\s*transform/);
});

test('it is a separate rule from the titles rule', () => {
    const titles = rules.find((r) => /\.patch-panel-title\b/.test(r.sel));
    assert.ok(titles && titles !== rule);
    assert.ok(!parts.includes('.patch-panel-title'));
});

test('every entry is a plain class, or one class plus a heading tag', () => {
    for (const p of parts) {
        assert.ok(/^\.[\w-]+$/.test(p) || /^\.[\w-]+ (h[1-6]|p|label|span)$/.test(p) || /^\.[\w-]+ \.[\w-]+$/.test(p), `entry ${p} is a plain class, one class plus a tag, or a parent class plus a child class`);
    }
    assert.doesNotMatch(rule.sel, /\[class|\*/);
    assert.equal(new Set(parts).size, parts.length, 'no duplicate entries');
});

test('the measured body text is covered', () => {
    for (const cls of ['note-md-text', 'rogue-ap-note', 'lpb-copy', 'combination-help', 'combination-status-message',
        'tri-brief-score', 'tri-brief-when', 'tri-brief-note', 'tri-brief-restart', 'siem-queue-count', 'ib-progress',
        'pin-minigame-attempt-empty', 'person-chat-dialogue-text', 'cryptex-subtitle',
        'password-info-name', 'password-info-text', 'password-field-label']) {
        assert.ok(listed(cls), `${cls} is listed`);
    }
});

test('wrappers with controls, skin buttons, sr-only text and repeated rows are not covered', () => {
    for (const cls of ['siem-alert-row', 'combination-header', 'tri-panel', 'device-frame', 'rogue-ap-pane',
        'password-minigame-area', 'minigame-container', 'ob-sr', 'signin-prompt', 'mail-sr-only',
        'siem-time', 'siem-source', 'siem-description', 'siem-btn', 'patch-panel-label', 'pin-minigame-key',
        'cryptex-wheel-arrow', 'rogue-ap-scan-row', 'rogue-ap-scan-line', 'rogue-ap-ssid', 'ib-name', 'ib-card', 'combination-dial-arrow', 'mail-compose-btn', 'mail-contacts-btn', 'ob-case',
        'tri-start', 'notes-minigame-nav-button', 'person-chat-continue-button', 'rogue-ap-tab', 'patch-panel-row', 'ib-slot', 'ib-people', 'mail-body']) {
        assert.ok(!listed(cls), `${cls} is not listed`);
        assert.ok(!listedWithTag(cls), `${cls} is not listed with a tag`);
    }
});

// The list containers hold text only. Each one is checked against the JS that builds it: a button,
// link, input or details inside would make it a wrapper with controls.
test('the hinted list containers hold no controls', () => {
    const js = (f) => readFileSync(join(root, 'public/break_escape/js/minigames', f), 'utf8');
    const between = (src, from, to) => { const a = src.indexOf(from); const b = src.indexOf(to, a); assert.ok(a >= 0 && b > a, `${from} .. ${to} found`); return src.slice(a, b); };
    // Quoted tags (el/make/h/createElement calls) and tags inside template or HTML strings.
    const controls = /['"`](?:button|input|select|textarea|a|details|summary)['"`]|<\s*(?:button|input|select|textarea|a|details|summary)\b/i;
    // Focusable or clickable markup with no control tag.
    const focusable = /tabindex|role\s*[=:]\s*['"`]?button|contenteditable|onclick|addEventListener\(\s*['"`](?:click|pointer|mouse|key)/i;
    const plain = (src) => { assert.doesNotMatch(src, controls); assert.doesNotMatch(src, focusable); };
    const mail = js('mail-client/mail-reader.js');
    plain(between(mail, "el('dl', 'mail-headers')", 'pane.appendChild(head)'));
    const tri = js('inbox-triage/inbox-triage-minigame.js');
    plain(between(tri, "el('dl', 'tri-brief-buttons')", 'p.appendChild(dl)'));
    // .tri-steps is an ol of li items from buildStepItems; the close control is a sibling elsewhere.
    assert.match(tri, /this\.stepsEl = el\('ol', 'tri-steps'\)/);
    const stepper = js('helpers/step-stepper.js');
    plain(between(stepper, 'export function buildStepItems', 'return items;'));
    // Later step updates only toggle classes and add screen-reader spans.
    plain(between(stepper, 'export function applyStepStates', '\n}'));
    const pp = js('patch-panel/patch-panel-minigame.js');
    plain(between(pp, "el('div', 'patch-panel-legend')", 'this.frame.appendChild(this.legend)'));
    plain(between(pp, 'setFooter(text)', '\n    }'));
    assert.match(pp, /el\('div', 'patch-panel-footer'/);
    // The SIEM status bar: three text spans in a template; the counts are updated by textContent.
    const siem = js('siem/siem-dashboard-minigame.js');
    const bar = between(siem, '<div class="siem-status-bar">', '</div>');
    plain(bar);
    // The spans are reached by id afterwards and only ever get textContent.
    for (const ref of ['pendingCountEl', 'timerEl', 'systemClockEl']) {
        const uses = siem.split('\n').filter((l) => l.includes(`this.${ref}.`));
        assert.ok(uses.length > 0, `${ref} is used`);
        for (const l of uses) assert.match(l, new RegExp(`this\\.${ref}\\.textContent\\s*=`), l.trim());
    }
    assert.equal((bar.match(/<span\b/g) || []).length, 3);
    assert.equal((siem.match(/siem-status-bar/g) || []).length, 1, 'nothing else adds to the bar');
    // The checker catches both forms.
    assert.match("h('button', 1)", controls);
    assert.match('<button class="x">', controls);
    assert.match('<a href="#">', controls);
    assert.match('<details>', controls);
    assert.doesNotMatch('<span class="x">y</span> <div>', controls);
    assert.match('<BUTTON>', controls);
    assert.match("li.tabIndex = 0", focusable);
    assert.match("x.addEventListener('click', f)", focusable);
    assert.match('<div role="button">', focusable);
    // The person cards stay out: their checklist can hold a details element.
    assert.match(js('intel-board/intel-board-minigame.js'), /h\('details', \{ class: 'ib-slot-stuck' \}/);
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
    // Comments do not count: block, whole-line and trailing JS comments (a trailing one needs a
    // space before the //, so URLs keep theirs), HTML comments and ERB <%# %> comments.
    .map((f) => readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<%#[\s\S]*?%>/g, '')
        .replace(/^[ \t]*\/\/.*$/gm, '')
        .replace(/[ \t]\/\/ .*$/gm, ''))
    .join('\n');


// Class tokens only: the contents of class="...", className = '...', classList.add('...') and
// el('tag', 'cls ...') style string arguments. Ids, plain prose, block comments, whole-line // comments and classList.remove do not count.
const classTokens = new Set();
{
    const add = (str) => str.split(/\s+/).forEach((t) => t && classTokens.add(t));
    for (const m of sources.matchAll(/class(?:Name)?\s*[=:]\s*(["'`])([^"'`]*)\1/g)) add(m[2]);
    for (const m of sources.matchAll(/classList\.(?:add|toggle)\(([^)]*)\)/g)) for (const q of m[1].matchAll(/(["'`])([^"'`]*)\1/g)) add(q[2]);
    for (const m of sources.matchAll(/\b(?:el|h|mk|make|div|span)\(\s*(["'`])[\w-]+\1\s*,\s*(["'`])([^"'`]*)\2/g)) add(m[3]);
    for (const m of sources.matchAll(/\btagText\(\s*(?:"[^"]*"|'[^']*')\s*,\s*("|')([^"']*)\1/g)) add(m[2]);
}

test('every listed class is emitted by the engine JS or a view', () => {
    for (const p of parts) {
        for (const cls of [...p.matchAll(/\.([\w-]+)/g)].map((m) => m[1])) {
            assert.ok(classTokens.has(cls), `${cls} is used as a class token in public/break_escape/js or app/views`);
        }
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

test('font-smooth is gone; -webkit-font-smoothing: none is kept for macOS in player_preferences.css', () => {
    for (const f of ['main.css', 'player_preferences.css']) {
        const c = strip(readFileSync(join(cssDir, f), 'utf8'));
        assert.doesNotMatch(c, /(^|[^-\w])font-smooth\s*:/, `${f} has no font-smooth`);
    }
    const pref = readFileSync(join(cssDir, 'player_preferences.css'), 'utf8');
    assert.match(strip(pref), /-webkit-font-smoothing\s*:\s*none/, 'player_preferences.css keeps -webkit-font-smoothing: none');
    assert.match(pref, /macOS only/, 'the line says it applies on macOS only');
    const ransom = readFileSync(join(cssDir, 'ransomware-display-minigame.css'), 'utf8');
    assert.match(ransom, /-webkit-font-smoothing:\s*antialiased/, 'the ransomware antialiased lines stay');
});
