// Sweep fixes B1/A4 (close X hit area), B3 (dusting key radius), A3 (phone header gap),
// A7 (vm-launcher GNF sizes), A9 (vm-launcher max-height). Reads the stylesheet text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, readdirSync } from "node:fs";

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const read = (f) => readFileSync(join(css, f), 'utf8');
const rule = (s, sel) => {
    const i = s.indexOf(sel + ' {');
    assert.ok(i >= 0, `rule ${sel} exists`);
    return s.slice(i, s.indexOf('}', i));
};

test('every minigame close X has a 44px hit area at every size (B1, A4)', () => {
    const s = read('minigames-framework.css');
    const r = rule(s, '.minigame-close-button::after');
    assert.match(r, /position: absolute/);
    assert.match(r, /inset: -14px/);
    // not scoped to person-chat or to a width-only query
    assert.doesNotMatch(s, /\[data-minigame="person-chat"\] \.minigame-close-button::after/);
    // the drawn size is unchanged
    assert.match(rule(s, '.minigame-close-button'), /width: 30px;\s*height: 30px/);
    // the in-flow console X must anchor the pseudo-element
    assert.match(rule(s, '.console-titlebar > .minigame-close-button'), /position: relative/);
});

test('no minigame close rule resizes below the hit area or removes it (B1)', () => {
    for (const f of ['ui-themes.css', 'password-minigame.css', 'pc-monitor.css', 'shredded-document-minigame.css', 'dusting.css']) {
        assert.doesNotMatch(read(f), /minigame-close-button[^{]*::after\s*\{[^}]*(content:\s*none|display:\s*none)/, f);
    }
});

test('dusting key-end marker has no border-radius (B3)', () => {
    // fix/dusting-find-compare draws the key marks as 7x7 pixel canvases (.dusting-key-glyph) instead of CSS boxes
    const s = read('dusting.css');
    const line = s.split('\n').find((l) => l.startsWith('.dusting-key-glyph {'));
    assert.ok(line, 'pixel glyph rule present');
    assert.match(line, /image-rendering: pixelated/);
    assert.doesNotMatch(s, /\.dusting-key-(end|fork|glyph)[^{]*\{[^}]*border-radius/);
});

test('phone status bar keeps the battery clear of the Notepad button (A3)', () => {
    assert.match(rule(read('phone-chat-minigame.css'), '.phone-header'), /gap: 12px/);
});

test('vm-launcher uses 16px GNF and a viewport-relative max-height (A7, A9)', () => {
    const s = read('vm-launcher-minigame.css');
    assert.doesNotMatch(s, /font-size: (12|13|14)px/);
    const r = rule(s, '.vm-launcher');
    assert.match(r, /max-height: min\(400px, calc\(100dvh - \d+px\)\)/);
    assert.doesNotMatch(r, /max-height: 400px/);
});

// ---- review round 1 additions ----

test('no close-button rule sets position: static (the hit area anchors to the X) (B1)', () => {
    const closeSel = /(minigame-close-button|epr-kiosk-close|dli-modal-close|lf-overlay-close|pc-monitor-close|sis-modal-close|se-overlay-close|[a-z-]*-close-btn|[a-z-]*-modal-close|[a-z-]*overlay-close)/;
    const bad = [];
    for (const f of readdirSync(css).filter((n) => n.endsWith('.css'))) {
        const text = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
        for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            const sel = m[1].trim();
            if (!closeSel.test(sel) || /::after|::before/.test(sel)) continue;
            if (!/\.minigame-close-button|epr-kiosk-close|dli-modal-close|lf-overlay-close|pc-monitor-close|sis-modal-close|se-overlay-close/.test(sel)) continue;
            if (/position:\s*static/.test(m[2])) bad.push(`${f}: ${sel}`);
        }
    }
    assert.deepEqual(bad, []);
});

// Union of the X's border box (30px) and its ::after: insets are from the padding box, so each
// side reaches (-inset - border) past the border box (negative = inside it).
const BASE_BORDER = 30;
function unionSize(insetText, border) {
    const body = insetText.replace(/^inset:\s*/, '').replace(/;$/, '');
    const vals = body.match(/calc\([^)]*\([^)]*\)[^)]*\)|calc\([^)]*\)|-?\d+px/g);
    assert.equal(vals.length, 4, `four-value inset in "${insetText}"`);
    const px = vals.map((v) => {
        if (!v.startsWith('calc')) return parseFloat(v);
        // calc(Apx - var(--ui-small-button-px, Bpx)) with the border substituted
        const m = v.match(/calc\((-?\d+)px\s*([-+])\s*var\(--ui-small-button-px,\s*(\d+)px\)\)/);
        assert.ok(m, `understood ${v}`);
        const a = parseFloat(m[1]);
        return m[2] === '-' ? a - border : a + border;
    });
    // `border` of the 4px/6px is taken off every side: padding box = border box - 2 * border.
    // px[] are inset values from the padding box (negative = outward). Reach past the border box:
    const reach = px.map((v) => -v - border);
    const [t, r, b, l] = reach;
    return { w: BASE_BORDER + l + r, h: BASE_BORDER + t + b, reach: { t, r, b, l } };
}
const insetOf = (r) => r.match(/inset:[^;]+;/)[0];

test('title-bar X hit area is at least 44px both ways, clear of the new-tab button, inside the bar (M1)', () => {
    const r = rule(read('minigames-framework.css'), '.title-bar .minigame-close-button::after');
    for (const border of [4, 6]) {
        const u = unionSize(insetOf(r), border);
        assert.ok(u.w >= 44, `width ${u.w} at border ${border}`);
        assert.ok(u.h >= 44, `height ${u.h} at border ${border}`);
        assert.ok(u.reach.l <= 5 - 1, `left reach ${u.reach.l} stops short of the new-tab button (5px away)`);
        assert.ok(u.reach.r <= 15, `right reach ${u.reach.r} stays inside the 15px to the bar edge`);
        assert.ok(u.h <= 50, `height ${u.h} fits the 46px bar plus rounding`);
    }
});

test('the unthemed and themed border variable fallback is 4px, as the X border is (M1)', () => {
    assert.match(rule(read('minigames-framework.css'), '.minigame-close-button'), /border: 4px solid/);
    assert.match(rule(read('minigames-framework.css'), '.title-bar .minigame-close-button::after'), /var\(--ui-small-button-px, 4px\)/);
    assert.match(read('ui-themes.css'), /--ui-small-button-px: 6px/);
});

test('pc-monitor bezel X hit area is at least 44px tall and 44px wide (m1)', () => {
    const r = rule(read('pc-monitor.css'), '.pc-monitor-bezel > .pc-monitor-close::after');
    for (const border of [4, 6]) {
        const u = unionSize(insetOf(r), border);
        assert.ok(u.h >= 44, `height ${u.h} at border ${border}`);
        assert.ok(u.w >= 44, `width ${u.w} at border ${border}`);
        assert.ok(u.reach.b <= 6, `spill below the X ${u.reach.b}px stays small (the in-screen window X is under the strip)`);
    }
});

test('phone-chat X hit area on a phone stops at the phone header and is 44px tall (m2)', () => {
    const s = read('minigames-framework.css');
    const i = s.indexOf('[data-minigame="phone-chat"] > .minigame-close-button::after');
    assert.ok(i >= 0, 'rule exists');
    const r = s.slice(i, s.indexOf('}', i));
    const mq = s.lastIndexOf('@media', i);
    assert.ok(mq >= 0 && /^@media \(max-width: 500px\)/.test(s.slice(mq)), 'rule sits in @media (max-width: 500px)');
    assert.ok(!s.slice(mq, i).includes('\n}\n'), 'the media block is still open at the rule');
    for (const border of [4, 6]) {
        const u = unionSize(insetOf(r), border);
        assert.ok(u.h >= 44, `height ${u.h} at border ${border}`);
        assert.ok(u.reach.b <= 0, `bottom reach ${u.reach.b} does not pass the X's border box`);
        assert.ok(u.reach.t <= 15, `top reach ${u.reach.t} stays within the 15px to the viewport edge`);
    }
});

test('terminal-theme phone header fits Notepad plus the status line in 350px (m1)', () => {
    const s = read('phone-chat-minigame.css');
    const r = rule(s, '.phone-terminal-theme .phone-header');
    assert.match(r, /gap: 4px/);
    assert.match(r, /padding-left: 12px/);
    assert.match(r, /padding-right: 12px/);
    // GNF stays at 16px multiples
    assert.match(rule(s, '.phone-notepad-btn'), /font-size: 16px/);
    const after = rule(s, '.phone-terminal-theme .phone-header::after');
    assert.match(after, /SECURE CHANNEL ESTABLISHED/);
    // off-grid GNF 14px moved to VT323 18px (A7)
    assert.match(after, /font-family: 'VT323'/);
    assert.match(after, /font-size: 18px/);
});

// D216 (R1 B1): the SE X wears the themed 6px border, and a ::after inset is measured from the
// padding box, so the border width counts against it. Read every width from the CSS, not a constant.
test('se-overlay-close touch hit area is at least 44px with the border it really draws (m2, B1)', () => {
    const fw = read('minigames-framework.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const themes = read('ui-themes.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const base = fw.match(/\.se-overlay-close \{[^}]*\}/)?.[0] || '';
    const box = Number((base.match(/(?:^|[\s;{])width:\s*(\d+)px/) || [])[1]);
    const fallback = Number((base.match(/border:\s*(\d+)px solid/) || [])[1]);
    assert.ok(box === 30, 'the X is drawn 30px square, got ' + box);
    assert.ok(fallback >= 2, 'the unthemed border width is read from the CSS: ' + fallback);
    const themed = [...themes.matchAll(/--ui-small-button-px:\s*(\d+)px/g)].map((m) => Number(m[1]));
    assert.ok(themed.length >= 7, 'every theme sets --ui-small-button-px, found ' + themed.length);
    const ruleBlock = fw.match(/\.se-overlay-close::after \{[^}]*\}/)?.[0] || '';
    const insetText = ruleBlock.match(/inset:\s*([^;]+);/)?.[1] || '';
    assert.ok(insetText !== '', 'the ::after rule sets an inset');
    // The shared themed close list sets the SE X's drawn border: find the rule that holds it.
    const themedRule = [...themes.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .find((m) => m[1].split(',').map((x) => x.trim()).includes('[data-ui-theme] .se-overlay-close'));
    assert.ok(themedRule !== undefined, 'a themed list holds the SE X');
    const themedBorder = themedRule[2].match(/(?:^|[\s;])border-width:\s*([^;]+);/)?.[1].trim() || '';
    assert.ok(themedBorder === 'var(--ui-small-button-px)', 'the themed SE X border is --ui-small-button-px, got ' + themedBorder);
    // Inset for the calc form: -Apx - var(--ui-small-button-px, Fpx). The var resolves to the
    // theme's px when a theme sets it, else to its own fallback F.
    const c = insetText.match(/^calc\(\s*-(\d+)px\s*-\s*var\(--ui-small-button-px,\s*(\d+)px\)\s*\)$/);
    const plain = insetText.match(/^-(\d+)px$/);
    assert.ok(c !== null || plain !== null, 'the inset is a plain px value or the calc form: ' + insetText);
    const insetFor = (varValue) => (c ? Number(c[1]) + varValue : Number(plain[1]));
    const check = (border, varValue, label) => {
        const inset = insetFor(varValue);
        const side = (box - 2 * border) + 2 * inset; // the inset starts at the padding box
        const past = inset - border; // reach beyond the drawn edge
        assert.ok(side >= 44, label + ': hit area ' + side + 'px is under 44px (border ' + border + 'px)');
        assert.ok(past <= 8, label + ': reach past the X is ' + past + 'px, over the 8px title-bar gap');
    };
    // Unthemed: the var is undefined, so the calc's own fallback is used and must equal the drawn border.
    if (c) assert.ok(Number(c[2]) === fallback, 'calc fallback ' + c[2] + 'px must equal the unthemed border ' + fallback + 'px');
    check(fallback, c ? Number(c[2]) : 0, 'unthemed');
    // Themed: the drawn border is the var, so both are the theme's px.
    for (const px of new Set(themed)) check(px, px, 'themed ' + px + 'px');
    // The touch target only exists under a coarse pointer or a narrow width: 844x390 phones need coarse.
    const at = fw.indexOf('.se-overlay-close::after');
    const mq = fw.lastIndexOf('@media', at);
    assert.ok(mq >= 0 && !fw.slice(mq, at).includes('\n}\n'), 'the SE X ::after sits inside an @media block');
    assert.ok(/pointer:\s*coarse/.test(fw.slice(mq, fw.indexOf('{', mq))), 'the @media query includes (pointer: coarse), so 844x390 phones keep the 44px target');
});

test('dusting key marks are shown at a whole-number 2x (m3)', () => {
    const line = read('dusting.css').split('\n').find((l) => l.startsWith('.dusting-key-glyph {'));
    assert.match(line, /width: 14px; height: 14px/, '7x7 glyph at 2x');
});

test('vm-launcher max-height is dvh with a vh fallback line before it (m4, n3)', () => {
    const r = rule(read('vm-launcher-minigame.css'), '.vm-launcher');
    assert.match(r, /min\(400px, calc\(100dvh - \d+px\)\)/);
    assert.ok(r.indexOf('100vh') >= 0 && r.indexOf('100vh') < r.indexOf('100dvh'), 'vh fallback before dvh');
    assert.match(r, /max-height: min\(400px, calc\(100vh - 110px\)\)/, 'vh fallback is capped like the dvh line');
});

test('vm-launcher wraps long VM titles and has no faux bold or dead rules (m3, n1, n2)', () => {
    const s = read('vm-launcher-minigame.css');
    assert.match(rule(s, '.vm-header'), /flex-wrap: wrap/);
    assert.match(rule(s, '.vm-header'), /gap: 8px/);
    assert.match(rule(s, '.vm-title'), /overflow-wrap: anywhere/);
    assert.match(rule(s, '.vm-action-btn'), /overflow-wrap: anywhere/);
    assert.doesNotMatch(rule(s, '.vm-title'), /font-weight/);
    assert.doesNotMatch(rule(s, '.vm-ip-value'), /font-weight/);
    for (const dead of ['.vm-names {', '.vm-name-badge {', '.standalone-instructions h3 {', '.vm-ip {']) assert.ok(!s.includes(dead), `${dead} removed`);
});

test('vm-launcher JS injects no stylesheet and the moved rules live in the css (M2)', () => {
    const js = readFileSync(join(css, '../js/minigames/vm-launcher/vm-launcher-minigame.js'), 'utf8');
    assert.doesNotMatch(js, /createElement\('style'\)/);
    assert.doesNotMatch(js, /\.vm-launcher \{/);
    const s = read('vm-launcher-minigame.css');
    for (const sel of ['.vm-ip-display', '.vm-ip-display .vm-detail-label', '.vm-ip-value']) rule(s, sel);
    assert.doesNotMatch(s, /font-size: (12|13|14|20)px/);
});

test('vm-launcher comment no longer cites the Open VM Console link (n3)', () => {
    assert.doesNotMatch(rule(read('vm-launcher-minigame.css'), '.vm-launcher'), /Open VM Console/);
});
