// Sweep 7 (CA-2 to CA-7): triage and episode-runner on phones and short windows.
// Comment-stripped CSS checks plus unit cases for feedbackScrollTop. Assertions compare
// strings and numbers only (a failing object comparison can exhaust memory).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
// dynamic, so a build without the export fails only the CA-4 test
const kinds = await import('../../public/break_escape/js/minigames/inbox-triage/triage-kinds.js');
const feedbackScrollTop = (a) => kinds.feedbackScrollTop(a);

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const readCss = (f) => readFileSync(join(root, 'public/break_escape/css', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// Flat rule list: { media, sel, body }. Handles one level of @media (and @keyframes are skipped).
function parse(src) {
    const out = [];
    const walk = (s, media) => {
        let i = 0;
        while (i < s.length) {
            const open = s.indexOf('{', i);
            if (open < 0) break;
            const head = s.slice(i, open).trim();
            let depth = 1, j = open + 1;
            while (j < s.length && depth > 0) {
                if (s[j] === '{') depth++;
                else if (s[j] === '}') depth--;
                j++;
            }
            const body = s.slice(open + 1, j - 1);
            if (head.startsWith('@media')) walk(body, head.slice(6).trim());
            else if (!head.startsWith('@')) {
                for (const sel of head.split(',')) out.push({ media, sel: sel.trim().replace(/\s+/g, ' '), body });
            }
            i = j;
        }
    };
    walk(src, '');
    return out;
}
const decl = (body, prop) => {
    let val = null;
    for (const d of body.split(';')) {
        const k = d.indexOf(':');
        if (k < 0) continue;
        if (d.slice(0, k).trim() === prop) val = d.slice(k + 1).trim();
    }
    return val;
};
// Last declaration of prop across rules whose selector (and optionally media) match exactly.
const find = (rules, sel, prop, media) => {
    let val = null;
    for (const r of rules) {
        if (r.sel !== sel) continue;
        if (media !== undefined && r.media !== media) continue;
        const v = decl(r.body, prop);
        if (v !== null) val = v;
    }
    return val;
};
const eq = (a, b, msg) => assert.ok(a === b, `${msg} (got ${a}, want ${b})`);

const triage = parse(readCss('inbox-triage-minigame.css'));
const runner = parse(readCss('episode-runner.css'));
const skin = parse(readCss('awareness-skin.css'));

const SHORT = '(max-height: 500px)';
const SHORT_NARROW = '(max-height: 500px) and (max-width: 640px)';
const PHONE_OR_SHORT = '(max-width: 767px), (max-height: 500px)';

test('CA-2: debrief kiosk fills the window and the payoff band comes first under 500px high', () => {
    eq(find(runner, '.minigame-container.epr-kiosk > .minigame-game-container', 'height', SHORT), '100%', 'kiosk game container fills');
    eq(find(runner, '.minigame-container.epr-kiosk > .minigame-game-container', 'margin', SHORT), '0 auto', 'kiosk margin');
    // m1/m6: the band is first in the DOM, so no flex column or order trick (a flex column would
    // also stretch Finish to full width)
    for (const r of runner) {
        if (r.sel === '.aw-debrief' || r.sel === '.aw-debrief > .aw-band') {
            assert.ok(decl(r.body, 'order') === null, `${r.sel} sets no order`);
            assert.ok(decl(r.body, 'display') === null, `${r.sel} sets no display`);
            assert.ok(decl(r.body, 'flex-direction') === null, `${r.sel} sets no flex-direction`);
        }
    }
    // m2: the wordmark stays on the strip row (one row, shrinking with an ellipsis), never hidden
    for (const r of runner) {
        if (/aw-wordmark/.test(r.sel)) assert.ok(decl(r.body, 'display') !== 'none', `${r.sel} is not hidden`);
    }
    eq(find(runner, '.epr-root .aw-strip', 'flex-wrap', SHORT), 'nowrap', 'strip one row');
    // CSL R2 M1: the step list wraps (six and seven stage episodes do not fit one row at 568 or 844)
    // any sheet, any media, any selector ending in .aw-steps (base, .epr-root, .epr-root .aw-strip)
    for (const r of [...runner, ...skin]) {
        if (/\.aw-steps$/.test(r.sel)) assert.ok(decl(r.body, 'flex-wrap') !== 'nowrap', `${r.sel} (${r.media || 'base'}) lets the step list wrap`);
    }
    eq(find(runner, '.epr-root .aw-step-num', 'flex', SHORT), '0 0 auto', 'the badge keeps its size so the done tick shows');
    // CSL R3 m1: the wordmark never shrinks below its text (the step list wraps instead); the 30%
    // cap with an ellipsis still holds a long name
    eq(find(runner, '.epr-root .aw-wordmark', 'flex', SHORT), '0 0 auto', 'wordmark shows whole when it fits under the cap');
    eq(find(runner, '.epr-root .aw-wordmark', 'max-width', SHORT), '30%', 'wordmark cap');
    eq(find(runner, '.epr-root .aw-wordmark', 'min-width', SHORT), '0', 'wordmark can shrink');
    eq(find(runner, '.epr-root .aw-wordmark', 'text-overflow', SHORT), 'ellipsis', 'wordmark ellipsis');
    eq(find(runner, '.epr-root .aw-wordmark', 'overflow', SHORT), 'hidden', 'wordmark clips');
});

test('CA-3 / CA-5: triage frame fills the window and the reader is the only scroller', () => {
    eq(find(triage, '.mail-client.triage-client', 'height', PHONE_OR_SHORT), '100%', 'frame height');
    eq(find(triage, '.mail-client.triage-client', 'max-height', PHONE_OR_SHORT), 'none', 'frame max-height');
    eq(find(triage, '.mail-client.triage-client', 'overflow', PHONE_OR_SHORT), 'hidden', 'frame clips');
    eq(find(triage, '.minigame-game-container:has(> .mail-client.triage-client)', 'margin', PHONE_OR_SHORT), '8px auto', 'container margin');
    eq(find(triage, '.minigame-game-container:has(> .mail-client.triage-client)', 'height', PHONE_OR_SHORT), 'calc(100% - 16px)', 'container height');
    eq(find(triage, '.triage-client .mail-reader', 'grid-template-rows', PHONE_OR_SHORT), 'minmax(0, 1fr)', 'reader row can shrink');
    eq(find(triage, '.mail-client.triage-client', 'border-image-width', SHORT), '8px', 'thin frame art');
    eq(find(triage, '.triage-client .tri-sort > .mail-reader', 'align-self', SHORT), 'stretch', 'reader stretches');
    eq(find(triage, '.triage-client .tri-sort > .mail-reader', 'min-height', SHORT), '0', 'reader min-height 0');
    eq(find(triage, '.triage-client .tri-sort > .mail-reader', 'grid-column', SHORT), '1 / -1', 'reader spans');
    eq(find(triage, '.triage-client .tri-toolbar', 'flex-wrap', SHORT), 'nowrap', 'toolbar one row');
});

test('CA-5 / m3: the triage title shrinks with an ellipsis at every short size, steps stay one row', () => {
    for (const r of triage) {
        if (r.sel === '.triage-client .tri-title') assert.ok(decl(r.body, 'display') !== 'none', 'title is never hidden');
    }
    eq(find(triage, '.triage-client .tri-title', 'min-width', SHORT), '0', 'title can shrink');
    eq(find(triage, '.triage-client .tri-title', 'flex', SHORT), '1 1 auto', 'title takes the spare room');
    eq(find(triage, '.triage-client .tri-title', 'text-overflow'), 'ellipsis', 'base ellipsis kept');
    assert.ok(find(triage, '.triage-client .tri-steps', 'flex-wrap', SHORT) === null, 'the triage steps may wrap (shared pin: no nowrap)');
    eq(find(triage, '.triage-client .tri-steps', 'flex', SHORT), '0 0 auto', 'steps keep their width beside the title');
    assert.ok(!triage.some((r) => r.media === SHORT_NARROW), 'no 640px special case');
});

test('B1: no short-landscape display rule on a .tri-stage child can beat [hidden]', () => {
    // .tri-stage > [hidden] { display: none } is (0,2,0); a later rule of equal weight that sets
    // display on a stage view without :not([hidden]) would show the hidden view.
    const hide = triage.find((r) => r.sel === '.tri-stage > [hidden]');
    assert.ok(hide && decl(hide.body, 'display') === 'none', 'the hidden rule exists');
    const views = ['.tri-sort', '.tri-panel', '.tri-brief', '.tri-review', '.tri-result'];
    // Every sheet that can style a stage child, at any size (base rules too: the R1 bug was a
    // specificity bug, not a media bug). A bare single-class rule is (0,1,0) and loses to the hide.
    const sheets = ['inbox-triage-minigame.css', 'awareness-skin.css', 'minigames-framework.css', 'episode-runner.css'];
    let scanned = 0;
    for (const f of sheets) {
        for (const r of parse(readCss(f))) {
            const d = decl(r.body, 'display');
            if (d === null || d === 'none') continue;
            const base = r.sel.replace(/:not\(\[hidden\]\)$/, '');
            // any other :not(...) adds weight but is no guard, so it is stripped only to find the view
            const bare = base.replace(/:not\([^)]*\)/g, '');
            if (!views.some((v) => bare.endsWith(v))) continue;
            scanned += 1;
            const single = !/[\s>+~]/.test(base) && (base.match(/[.:#\[]/g) || []).length <= 1;
            if (single) continue;
            assert.ok(r.sel.endsWith(':not([hidden])'), `${f}: ${r.sel} (${r.media || 'base'}) sets display without :not([hidden])`);
        }
    }
    assert.ok(scanned >= 3, 'the scan saw the stage view display rules');
    assert.ok(triage.some((r) => r.sel === '.triage-client .tri-sort:not([hidden])' && r.media === SHORT && decl(r.body, 'display') === 'grid'), 'the grid is scoped to the visible sort view');
});

test('CA-6: the X is 44x44 with no hidden hit area on triage and episode runner', () => {
    const cases = [
        [triage, '.triage-client .se-overlay-close', ''],
        [runner, '.epr-kiosk-top .epr-kiosk-close', ''],
        [runner, '.epr-bar .se-overlay-close', '']
    ];
    for (const [rules, sel, media] of cases) {
        for (const p of ['width', 'height', 'min-width', 'min-height']) eq(find(rules, sel, p, media), '44px', `${sel} ${p}`);
        eq(find(rules, `${sel}::after`, 'content', media), 'none', `${sel}::after hit area gone`);
    }
});

test('CA-7: awareness cards are square with 2px borders (scanning every rule)', () => {
    const listed = [
        '.aw-card', '.aw-genuine', '.aw-panel', '.aw-rule', '.aw-monday', '.aw-report-route',
        '.aw-concern-recap', '.aw-aftermath-item', '.triage-client.aw-skin .aw-team-tally',
        '.triage-client.aw-skin .tri-locked.aw-report-win', '.aw-flip-reader', '.aw-montage-beat'
    ];
    for (const sel of listed.filter((l) => !/flip-reader|montage-beat/.test(l))) {
        const rs = skin.filter((r) => r.sel === sel);
        assert.ok(rs.length > 0, `${sel} exists`);
        for (const r of rs) {
            const rad = decl(r.body, 'border-radius');
            if (rad !== null) eq(rad, '0', `${sel} radius`);
        }
        eq(find(skin, sel, 'border-radius'), '0', `${sel} sets radius 0`);
    }
    for (const sel of ['.aw-card', '.aw-genuine', '.aw-concern-recap', '.aw-aftermath-item', '.aw-panel', '.aw-rule', '.triage-client.aw-skin .aw-team-tally']) {
        const b = find(skin, sel, 'border');
        assert.ok(b !== null && b.startsWith('2px '), `${sel} border is 2px (got ${b})`);
    }
    eq(find(skin, '.aw-report-route', 'border').startsWith('2px dashed'), true, 'report route 2px dashed');
    // m4: the flip screen's cards match
    for (const sel of ['.aw-flip-reader', '.aw-montage-beat']) eq(find(skin, sel, 'border').startsWith('2px '), true, `${sel} 2px`);
    eq(find(skin, '.aw-flip-aftermath', 'border-top').startsWith('2px '), true, 'aftermath rule 2px');
    // the flip and debrief chips
    eq(find(skin, '.aw-flip .mail-chip', 'border-radius'), '0', 'flip chip radius');
    eq(find(skin, '.aw-flip .mail-chip', 'border').startsWith('2px '), true, 'flip chip 2px');
    // m5: no rounded corners on any aw-* rule at all (50%, 999px, var() included). Only the
    // D217 paper surface and the D220 boot/credits CRT are exempt (matched by substring).
    for (const r of skin) {
        if (!r.sel.includes('.aw-')) continue;
        if (/boot|credits|crt/.test(r.sel)) continue;
        for (const d of r.body.split(';')) {
            const k = d.indexOf(':');
            if (k < 0 || !/^border(-\w+)*-radius$/.test(d.slice(0, k).trim())) continue;
            const v = d.slice(k + 1).trim();
            assert.ok(/^0(px)?( 0(px)?)*$/.test(v), `${r.sel} has radius ${v}`);
        }
    }
});

test('CA-4: feedbackScrollTop shows the card and Next with the least scroll', () => {
    // pane top 100, height 300, scrolled 0. Card 350..480 viewport, Next ends at 520 (offset 420 > 300).
    const base = { scrollTop: 0, paneTop: 100, paneHeight: 300 };
    // card (offset 250) to Next bottom (offset 420) is 170 high and fits: scroll to show end at pane bottom
    eq(feedbackScrollTop({ ...base, startTop: 350, endBottom: 520, verdictTop: 360 }), 120, 'least scroll to show both');
    // already visible: no scroll
    eq(feedbackScrollTop({ ...base, startTop: 150, endBottom: 300, verdictTop: 160 }), 0, 'visible stays put');
    eq(feedbackScrollTop({ scrollTop: 40, paneTop: 100, paneHeight: 300, startTop: 150, endBottom: 300, verdictTop: 160 }), 40, 'visible stays put when scrolled');
    // does not fit (400 high in a 300 pane): verdict line at the top
    eq(feedbackScrollTop({ ...base, startTop: 150, endBottom: 550, verdictTop: 230 }), 130, 'verdict at top when it does not fit');
    // card above the view scrolls up, never negative
    eq(feedbackScrollTop({ scrollTop: 200, paneTop: 100, paneHeight: 300, startTop: 40, endBottom: 160, verdictTop: 50 }), 140, 'scrolls up to the card');
    eq(feedbackScrollTop({ scrollTop: 10, paneTop: 100, paneHeight: 300, startTop: 40, endBottom: 160, verdictTop: 20 }), 0, 'never negative');
    eq(feedbackScrollTop({ ...base, startTop: 150, endBottom: 600, verdictTop: 20 }), 0, 'verdict above start clamps to 0');
});

test('CSL R2: result summary rows are 44px targets, the short Result chrome is tighter, montage is full width', () => {
    eq(find(triage, '.tri-item-why summary', 'min-height', ''), '44px', 'It was real row');
    // CSL R3 m2: a floor, not a fixed height, with no vertical padding, so the label sits centred
    eq(find(triage, '.tri-result .tri-finish', 'min-height', SHORT), '44px', 'Finish');
    // CSL R5 m1: the skinned tally's margin is cleared at a weight that beats awareness-skin.css
    eq(find(triage, '.triage-client.aw-skin .tri-sort > .aw-team-tally', 'margin', SHORT), '0', 'short skinned tally margin');
    assert.ok(find(triage, '.tri-result .tri-finish', 'height', SHORT) === null, 'Finish has no fixed height');
    eq(find(triage, '.tri-result .tri-finish', 'padding-top', SHORT), '0', 'Finish top padding');
    eq(find(triage, '.tri-result .tri-finish', 'padding-bottom', SHORT), '0', 'Finish bottom padding');
    eq(find(triage, '.tri-result > .tri-result-bar', 'padding', SHORT), '0 10px 6px', 'short result bar padding');
    eq(find(triage, '.tri-result .tri-score', 'margin', SHORT), '0 0 4px', 'short score margin');
    const body = find(triage, '.tri-result > .tri-result-body', 'padding', SHORT);
    assert.ok(body === '8px 10px 4px', 'short result body padding');
    assert.ok(find(skin, '.aw-montage', 'max-width', '') === null, 'the montage is not capped narrower than the flip cards');
    eq(find(skin, '.aw-montage-headline', 'border-left-width', ''), '6px', 'the beat marker stays');
});

test('CSL R3 m3 and twin: the script-focused band shows no focus ring; the folded "It was real" row is a 44px target', () => {
    eq(find(runner, '.aw-debrief > .aw-band:focus', 'outline'), 'none', 'band focus outline');
    eq(find(skin, '.aw-genuine-fold summary', 'min-height'), '44px', 'folded It was real row');
    eq(find(skin, '.aw-genuine-fold summary', 'box-sizing'), 'border-box', 'folded row box');
    eq(find(skin, '.aw-genuine-fold summary', 'padding'), '12px 0', 'folded row label centred');
});
