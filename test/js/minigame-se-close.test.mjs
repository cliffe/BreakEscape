// SE / awareness window chrome (critique C): the shared pixel-× close control (C-X1), the
// framed-window opt-in (C-X2) and the shared .se-notice / .se-window-title rules (C-X4, C-X6).
// The real modules run against jsdom; the CSS checks read the stylesheet text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const js = join(root, 'js');
const css = join(root, 'css');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { MinigameScene } = await imp('minigames/framework/base-minigame.js');
const { SocialOverlayScene } = await imp('minigames/framework/social-overlay.js');

function fresh() {
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = undefined;
    return document.getElementById('mg');
}

test('C-X1 buildCloseControl is the shared pixel X, not a text Close button', () => {
    const mg = new SocialOverlayScene(fresh(), { title: 'Tool' });
    let closed = 0;
    mg.requestClose = () => { closed++; };
    const btn = mg.buildCloseControl();
    assert.equal(btn.tagName, 'BUTTON');
    assert.ok(btn.classList.contains('se-overlay-close'), 'carries the shared close class');
    assert.ok(!btn.classList.contains('minigame-button'), 'is not the text skin button');
    assert.equal(btn.getAttribute('aria-label'), 'Close', 'labelled Close for assistive tech');
    assert.equal(btn.textContent.trim(), '×', 'draws the × glyph, no word Close');
    assert.equal(mg.closeButton, btn, 'recorded as the close button');
    btn.click();
    assert.equal(closed, 1, 'clicking it requests close');
});

test('C-X1 mountCloseControl appends the X to the given parent', () => {
    const mg = new SocialOverlayScene(fresh(), { title: 'Tool' });
    mg.requestClose = () => {};
    const bar = document.createElement('div');
    const btn = mg.mountCloseControl(bar, 'Close');
    assert.equal(btn.parentNode, bar, 'added to the header bar it was given');
    assert.ok(btn.classList.contains('se-overlay-close'));
});

test('C-X2 framed opt-in: default off, and a framed scene tags the container', () => {
    assert.equal(MinigameScene.framed, false, 'off by default');
    class Plain extends MinigameScene {}
    const plain = new Plain(fresh(), { title: 'Plain' });
    plain.init();
    assert.ok(!plain.container.classList.contains('minigame-framed'), 'plain scene is not framed');

    class Framed extends MinigameScene { static framed = true; }
    const framed = new Framed(fresh(), { title: 'Framed' });
    framed.init();
    assert.ok(framed.container.classList.contains('minigame-framed'), 'framed scene tags the container');
});

// Every `selector { body }` in a stylesheet, comments stripped (an @media block yields its inner rules).
const rulesOf = (src) => [...src.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ sel: m[1].trim(), body: m[2] }));
const RED = /#e74c3c|#c0392b|#a93226/i;
// Any border radius (incl. per-corner longhands) that is not zero (0 or 0px, one to four values): catches 0.5px, .5em, 50% and var(--r).
const ROUNDED = /(?:^|[\s;{])border(?:-[a-z]+)*-radius\s*:(?!\s*(?:0(?:px)?\s*){1,4}(?:!important\s*)?(?:;|}|$))/i;

test('C-X1/C-X2 shared CSS rules exist', () => {
    const fw = readFileSync(join(css, 'minigames-framework.css'), 'utf8');
    assert.ok(/\.se-overlay-close\s*\{/.test(fw), 'the shared close look is defined');
    const rule = fw.match(/\.se-overlay-close\s*\{[^}]*\}/)?.[0] || '';
    assert.ok(/border:\s*4px solid/.test(rule), 'the X keeps a 2px+ pixel border');
    assert.ok(!ROUNDED.test(rule), 'no rounded X');
    assert.ok(/\.minigame-container\.minigame-framed\s*>\s*\.minigame-game-container/.test(fw), 'the framed window rule exists');
    assert.ok(/width:\s*min\(720px/.test(fw), 'the framed window is capped at 720px');
});

test('D216 no rule that styles .se-overlay-close is red or rounded, in any state, in any sheet', () => {
    let seen = 0;
    for (const f of readdirSync(css).filter((n) => n.endsWith('.css'))) {
        const hits = rulesOf(readFileSync(join(css, f), 'utf8')).filter((r) => /se-overlay-close/.test(r.sel));
        seen += hits.length;
        for (const r of hits) {
            assert.ok(!RED.test(r.body), f + ': red in a rule for ' + r.sel.replace(/\s+/g, ' '));
            assert.ok(!/border-image(-source)?:\s*none/.test(r.body), f + ': the skin is switched off in ' + r.sel.replace(/\s+/g, ' '));
            assert.ok(!ROUNDED.test(r.body), f + ': rounded corners in ' + r.sel.replace(/\s+/g, ' '));
        }
    }
    assert.ok(seen >= 4, 'finds the .se-overlay-close rules across the sheets: ' + seen);
    for (const f of ['minigames-framework.css', 'ui-themes.css']) {
        assert.ok(rulesOf(readFileSync(join(css, f), 'utf8')).some((r) => /se-overlay-close/.test(r.sel)), f + ' holds an SE X rule');
    }
});

test('D216 .se-overlay-close is in the themed close lists for base, hover and focus', () => {
    const rules = rulesOf(readFileSync(join(css, 'ui-themes.css'), 'utf8'));
    for (const suffix of ['', ':hover', ':focus-visible']) {
        const mc = '[data-ui-theme] .minigame-close-button' + suffix;
        const list = rules.find((r) => r.sel.split(',').map((x) => x.trim()).includes(mc));
        assert.ok(list !== undefined, 'a themed list holds ' + mc);
        const items = list.sel.split(',').map((x) => x.trim());
        assert.ok(items.includes('[data-ui-theme] .se-overlay-close' + suffix), 'the list holding ' + mc + ' also holds the SE X');
    }
});

test('C-X4/C-X6 shared notice and title rules exist, pixel and square', () => {
    const util = readFileSync(join(css, 'utilities.css'), 'utf8');
    const notice = util.match(/\.se-notice\s*\{[^}]*\}/)[0];
    assert.match(notice, /border:\s*2px dashed/, '.se-notice is a 2px dashed box');
    assert.match(notice, /border-radius:\s*0/, '.se-notice is square');
    const title = util.match(/\.se-window-title\s*\{[^}]*\}/)[0];
    assert.match(title, /font-size:\s*16px/, '.se-window-title is a whole 16px');
    assert.match(title, /font-weight:\s*normal/, 'no faux bold');
});

test('C-X3 the wide SE windows take the shared 9-slice frame, no ring or line', () => {
    const files = {
        'intel-board-minigame.css': '.intel-board-game-container',
        'engagement-report-minigame.css': '.engagement-report-game-container',
        'landing-page-builder-minigame.css': '.lpb-game-container',
        'osint-browser-minigame.css': '.osint-browser-game-container',
        'pretext-prep-minigame.css': '.pretext-prep'
    };
    for (const [fn, sel] of Object.entries(files)) {
        const src = readFileSync(join(css, fn), 'utf8');
        const rule = src.match(new RegExp(sel.replace(/[.]/g, '\\.') + '\\s*\\{[^}]*\\}'))[0];
        assert.match(rule, /border-image:[^;]*mail-frame\.png/, `${fn}: uses the shared 9-slice frame`);
        assert.doesNotMatch(rule, /box-shadow:\s*0 0 0/, `${fn}: no outer ring`);
        assert.doesNotMatch(rule, /border:\s*[34]px solid/, `${fn}: the plain line is gone`);
    }
});

test('C-ER1 the episode runner draws a kiosk bezel in normal play, full-bleed only when facilitated', () => {
    const src = readFileSync(join(js, 'minigames/episode-runner/episode-runner-minigame.js'), 'utf8');
    // The kiosk flag is "not facilitated" and toggles .epr-kiosk on the container (pick B).
    assert.match(src, /const\s+kiosk\s*=\s*!this\.facilitated/, 'kiosk = not facilitated');
    assert.match(src, /classList[^\n]*toggle[^\n]*epr-kiosk[^\n]*kiosk/, 'toggles .epr-kiosk for kiosk play');
    // In kiosk play it builds the bezel and mounts the close X in the bezel top strip.
    assert.match(src, /epr-kiosk-bezel/, 'builds the kiosk bezel');
    // R2 m2 (a): a kiosk is a device like the PC, so its X is the themed steel close, in the top strip.
    assert.match(src, /mountThemedCloseControl\(top,[^)]*epr-kiosk-close/, 'the themed X sits in the bezel top strip');
    assert.ok(!/minigame-framed/.test(src), 'no longer uses the generic 9-slice frame');
    // K13: the chin (reader slot, LED, READY label) was an empty strip and is gone; the frame wraps the screen.
    assert.ok(!/epr-kiosk-(chin|reader|led|status)/.test(src), 'no kiosk chin strip');
    // The bezel is CSS-drawn in the PC monitor look: 2px borders, stepped corners, no image art.
    const er = readFileSync(join(css, 'episode-runner.css'), 'utf8');
    const bezel = er.match(/\.epr-kiosk-bezel\s*\{[^}]*\}/)[0];
    assert.match(bezel, /border:\s*2px solid/, 'the bezel has a 2px outline');
    assert.match(bezel, /clip-path:\s*polygon/, 'the bezel corners are cut in steps');
    assert.ok(!/url\(/.test(bezel), 'no image art in the bezel');
    assert.ok(!/epr-kiosk-(chin|reader|led|status)/.test(er), 'the chin rules are gone from the CSS');
    // The kiosk close is themed, and (D216) so is the SE X: ui-themes lists .se-overlay-close with
    // the shared themed close buttons and has no red override.
    const kioskClose = er.match(/\.epr-kiosk-top \.epr-kiosk-close\s*\{[^}]*\}/)[0];
    assert.ok(!/se-overlay-close/.test(kioskClose), 'the kiosk close is not the flat SE X');
    const ut = readFileSync(join(css, 'ui-themes.css'), 'utf8');
    assert.ok(/\[data-ui-theme\] \.se-overlay-close,/.test(ut), 'D216: the SE close joins the themed close list');
    assert.ok(!/\.minigame-close-button\.se-overlay-close\s*\{/.test(ut), 'D216: no red SE override remains');
});

test('C-X1 hand-rolled text Close buttons are gone from the SE scenes', () => {
    for (const rel of [
        'minigames/assistant-chat/assistant-chat-minigame.js',
        'minigames/intel-board/intel-board-minigame.js',
        'minigames/engagement-report/engagement-report-minigame.js',
        'minigames/landing-page-builder/landing-page-builder-minigame.js',
        'minigames/osint-browser/osint-browser-minigame.js',
        'minigames/pretext-prep/pretext-prep-minigame.js'
    ]) {
        const src = readFileSync(join(js, rel), 'utf8');
        assert.doesNotMatch(src, /se-overlay-close minigame-button/, `${rel}: no text Close skin button`);
    }
});

test('m3 shredded-document closes by the console window X (D218), no text Close', () => {
    const src = readFileSync(join(js, 'minigames/shredded-document/shredded-document-minigame.js'), 'utf8');
    assert.ok(!/cancelText:/.test(src), 'no text Close cancel button left');
    assert.ok(!/showCancel:\s*true/.test(src), 'the text cancel row is not requested');
    assert.ok(/static consoleWindow = true/.test(src), 'the X sits in the console window title bar');
    assert.ok(!/add\('se-overlay-close'\)/.test(src), 'no red SE X variant (D216)');
});

test('C-X8 the address font points at GNF, addresses stay at 16px or larger', () => {
    const fonts = readFileSync(join(css, 'fonts.css'), 'utf8');
    const addr = fonts.match(/--se-font-address:\s*[^;]+;/)[0];
    assert.match(addr, /--se-font-address:\s*'GNF'/, 'address font is GNF first');
    // No address element in these windows is set below 16px (rn/m merge below 14px).
    for (const rel of ['osint-browser-minigame.css', 'mail-client-minigame.css', 'landing-page-builder-minigame.css']) {
        const sheet = readFileSync(join(css, rel), 'utf8');
        const re = /font-size:\s*(\d+)px[^;]*;[^}]*se-font-address|se-font-address[^}]*font-size:\s*(\d+)px/g;
        let m;
        while ((m = re.exec(sheet))) {
            const px = Number(m[1] || m[2]);
            assert.ok(px >= 16, `${rel}: an address at ${px}px is below 16px`);
        }
    }
});

test('C-X8 the plain x replaces the cross glyph in the authored landing-page copy', () => {
    const src = readFileSync(join(js, 'minigames/landing-page-builder/landing-page-model.js'), 'utf8');
    assert.ok(!src.includes('✗'), 'no cross glyph in landing-page-model.js');
});

test('n2 the shared .se-notice is applied to the listed scene notices', () => {
    const cases = [
        ['minigames/episode-runner/episode-runner-minigame.js', /epr-scope se-notice|epr-reload-note se-notice/],
        ['minigames/password-guesser/password-guesser-minigame.js', /epr-gs-note se-notice|epr-gs-reload-note se-notice/],
        ['minigames/assistant-chat/assistant-chat-minigame.js', /ac-reload-note se-notice/],
        ['minigames/sort-drill/sort-drill-minigame.js', /sd-reload-note se-notice/],
        ['minigames/pretext-prep/pretext-prep-minigame.js', /pretext-scope se-notice/],
        ['minigames/engagement-report/engagement-report-minigame.js', /er-note[^']*se-notice/],
        ['minigames/landing-page-builder/landing-page-builder-minigame.js', /lpb-captures-empty se-notice/],
        // R2 part A C-X4: the two notices still missing the class last round.
        ['minigames/inbox-triage/inbox-triage-minigame.js', /tri-brief-restart se-notice/],
        ['minigames/landing-page-builder/landing-page-builder-minigame.js', /lpb-captures-banner se-notice/]
    ];
    for (const [rel, re] of cases) {
        assert.match(readFileSync(join(js, rel), 'utf8'), re, `${rel}: notice carries .se-notice`);
    }
});

test('C-X9 the awareness primary button is square, 2px and not faux-bold, like .epr-button', () => {
    const aw = readFileSync(join(css, 'awareness-skin.css'), 'utf8');
    const btn = aw.match(/\.aw-button\s*\{[^}]*\}/)[0];
    assert.match(btn, /border:\s*2px solid/, 'the awareness button has a 2px border');
    assert.match(btn, /border-radius:\s*0/, 'no rounded corners');
    assert.doesNotMatch(btn, /font-weight:\s*(700|bold)/, 'no faux-bold on the pixel/skin button');
    // The episode runner and password guesser share the same square 2px primary look.
    const epr = readFileSync(join(css, 'episode-runner.css'), 'utf8');
    const eprBtn = epr.match(/\.epr-button\s*\{[^}]*border:\s*2px solid[^}]*\}/)[0];
    assert.match(eprBtn, /border:\s*2px solid/, '.epr-button is a 2px square button');
    assert.match(eprBtn, /border-radius:\s*0/, '.epr-button has no rounded corners');
});
