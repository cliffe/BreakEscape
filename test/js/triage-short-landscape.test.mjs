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
    eq(find(runner, '.aw-debrief', 'display', SHORT), 'flex', 'debrief is a flex column');
    eq(find(runner, '.aw-debrief', 'flex-direction', SHORT), 'column', 'debrief column');
    eq(find(runner, '.aw-debrief > .aw-band', 'order', SHORT), '-1', 'band first');
    eq(find(runner, '.epr-root .aw-wordmark', 'display', SHORT), 'none', 'wordmark hidden');
    // not applied at full size
    eq(String(find(runner, '.aw-debrief > .aw-band', 'order', '')), 'null', 'band order is not global');
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

test('CA-5: the triage title gives way at max-height 500 and max-width 640', () => {
    eq(find(triage, '.triage-client .tri-title', 'display', SHORT_NARROW), 'none', 'title hidden');
    const t = triage.filter((r) => r.sel === '.triage-client .tri-title' && decl(r.body, 'display') === 'none');
    assert.ok(t.length === 1, 'title is hidden in exactly one rule');
    eq(t[0].media, SHORT_NARROW, 'only under both limits');
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
        '.triage-client.aw-skin .tri-locked.aw-report-win'
    ];
    for (const sel of listed) {
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
    // the flip and debrief chips
    eq(find(skin, '.aw-flip .mail-chip', 'border-radius'), '0', 'flip chip radius');
    eq(find(skin, '.aw-flip .mail-chip', 'border').startsWith('2px '), true, 'flip chip 2px');
    // no rounded corners on any aw-* rule at all (D217 paper surface and D220 boot/credits CRT exempt)
    for (const r of skin) {
        if (!r.sel.includes('.aw-')) continue;
        if (/boot|credits|crt|paper/.test(r.sel)) continue;
        const rad = decl(r.body, 'border-radius');
        if (rad === null) continue;
        assert.ok(/^0(px)?$/.test(rad) || rad === '50%' || rad === '999px' || rad === '0', `${r.sel} has radius ${rad}`);
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
