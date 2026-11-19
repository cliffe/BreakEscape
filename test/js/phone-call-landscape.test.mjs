// Voiced call mode in phone landscape (max-height 500px, the 844x390 budget): the status bar,
// header, thread, replies and the end-call button all fit the 253px phone screen, the end-call
// button stays visible, and portrait/desktop call rules are untouched. Reads the CSS, no browser.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(here, '../../public/break_escape/css/phone-chat-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

let pass = 0;
function check(name, fn) {
    try { fn(); pass++; console.log('ok   ' + name); }
    catch (e) { console.error('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; }
}
function rules(src, media = '') {
    const out = [];
    let i = 0;
    while (i < src.length) {
        const open = src.indexOf('{', i);
        if (open < 0) break;
        const head = src.slice(i, open).trim();
        let depth = 1, j = open + 1;
        while (j < src.length && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
        const inner = src.slice(open + 1, j - 1);
        if (head.startsWith('@media')) out.push(...rules(inner, head));
        else if (!head.startsWith('@')) out.push({ selector: head.replace(/\s+/g, ' '), body: inner, media });
        i = j;
    }
    return out;
}
const all = rules(css);
const land = all.filter(r => /max-height:\s*500px/.test(r.media));
const V = '.phone-call-mode #conversation-view';
const L = sel => { const r = land.find(x => x.selector.split(', ').includes(V + ' ' + sel)); assert.ok(r, 'landscape rule ' + sel); return r; };
const px = (body, prop) => parseFloat(body.match(new RegExp('(?:^|[\\s;])' + prop + ':\\s*([\\d.]+)px'))[1]);

// Selector specificity as [ids, classes, elements]. :has()/:not()/:is() count their most specific argument.
function spec(sel) {
    const t = [0, 0, 0];
    let i = 0;
    while (i < sel.length) {
        const c = sel[i];
        if (c === '#') { t[0]++; i++; while (/[\w-]/.test(sel[i] || '')) i++; }
        else if (c === '.') { t[1]++; i++; while (/[\w-]/.test(sel[i] || '')) i++; }
        else if (c === '[') { t[1]++; i = sel.indexOf(']', i) + 1; }
        else if (c === ':') {
            const m = sel.slice(i).match(/^::?[\w-]+/);
            const name = m[0];
            i += name.length;
            let arg = null;
            if (sel[i] === '(') {
                let d = 1, j = i + 1;
                while (j < sel.length && d) { if (sel[j] === '(') d++; else if (sel[j] === ')') d--; j++; }
                arg = sel.slice(i + 1, j - 1);
                i = j;
            }
            if (name.startsWith('::')) t[2]++;
            else if (/^:(has|not|is)$/.test(name)) {
                const best = arg.split(',').map(spec).sort(cmpSpec).pop();
                best.forEach((v, k) => { t[k] += v; });
            } else if (name !== ':where') t[1]++;
        }
        else if (/[a-z]/i.test(c)) { t[2]++; while (/[\w-]/.test(sel[i] || '')) i++; }
        else i++;
    }
    return t;
}
const cmpSpec = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const phoneHeader = 4 * 2 + 2 + 28;                       // 38
// The shell is min(700, max(70vh, 100vh - 125)) less 20px of screen margin
const screenAt = vh => Math.round((Math.min(700, Math.max(0.7 * vh, vh - 125)) - 20) * 100) / 100;
const SCREENS = [[390, 253], [375, 242.5], [360, 232]];
const status = L('.call-status-bar');
const statusH = px(status.body, 'height');
const avatarRule = L('.conversation-avatar');
const hdr = L('.conversation-header');
const pads = hdr.body.match(/padding:\s*(\d+)px/);
const headerH = 2 * Number(pads[1]) + px(avatarRule.body, 'height') + 2 * px(avatarRule.body, 'border-width');
const thread = L('.messages-container');
const threadH = px(thread.body, 'height');
const replies = L('.choices-container');
const repliesMin = px(replies.body, 'min-height');
const cueH = 2 + 2 + 2 + 19;                              // landscape cue
const LH = (has, rest) => { const r = land.find(x => x.selector.split(', ').includes(V + has + ' ' + rest)); assert.ok(r, 'landscape rule ' + has + ' ' + rest); return r; };
const CUE = ':has(.choices-more-cue.visible)', SE = ':has(.se-chat-header)', SPEAK = ':has(.choices-container:empty)';
const threadCue = px(LH(CUE, '.messages-container').body, 'height');
const SEH = ':has(.se-chat-header)';
const threadSE = px(LH(SE, '.messages-container').body, 'height');
const threadSECue = px(LH(SE + CUE, '.messages-container').body, 'height');
const seCueMin = px(LH(SE + CUE, '.choices-container').body, 'min-height');
check('landscape call: stack fits every phone screen height (253, 242.5, 232), normal and influence calls, with and without the cue', () => {
    assert.deepEqual(SCREENS.map(([vh]) => screenAt(vh)), [253, 242.5, 232]);
    assert.equal(statusH, 36);
    assert.equal(headerH, 40);
    assert.equal(threadH, 44);
    assert.equal(threadSE, 44, 'influence thread holds a subtitle line and a tell line');
    assert.equal(threadSECue, 44, 'the cue does not shrink the influence thread');
    assert.ok(threadCue >= 24, 'one subtitle line (2 border + 20.8)');
    const stacks = {
        'normal, no cue': [threadH, repliesMin, 0],
        'normal, cue': [threadCue, repliesMin, cueH],
        'influence, no cue': [threadSE, repliesMin, 0],     // the bar is on the header row: header stays 40
        'influence, cue': [threadSECue, seCueMin, cueH]
    };
    for (const [vh, screen] of SCREENS) {
        for (const [name, [t, r, c]] of Object.entries(stacks)) {
            const total = phoneHeader + statusH + headerH + t + r + c;
            assert.ok(total <= screen, `${vh} ${name}: ${total} > ${screen}`);
        }
    }
    assert.ok(seCueMin >= 35, 'at least one one-line reply (35.2) at the smallest screen');
    assert.ok(repliesMin >= 2 * 29.2 + 2 + 4 + 2, 'normal replies hold two one-line replies');
});
check('landscape call: speaking state (no replies) gives the thread the free height', () => {
    const r = LH(SPEAK, '.messages-container');
    assert.match(r.body, /flex:\s*1 1 auto/);
    assert.match(r.body, /height:\s*auto/);
    assert.match(r.body, /max-height:\s*none/);
    const order = land.map(x => x.selector);
    assert.ok(order.indexOf(V + SPEAK + ' .messages-container') > order.indexOf(V + SE + ' .messages-container'));
    assert.ok(order.indexOf(V + SPEAK + ' .messages-container') > order.indexOf(V + CUE + ' .messages-container'));
});
check('landscape call: influence bar sits on the header row (no wrap), name ellipsises first, bar fits the 36px row', () => {
    const bar = L('.se-chat-header');
    assert.match(bar.body, /flex:\s*1 1 150px/);
    assert.match(bar.body, /min-width:\s*0/);
    assert.match(LH(SEH, '.conversation-info').body, /flex:\s*0 1 auto/);
    assert.ok(!land.some(x => x.selector.includes(SE) && x.selector.includes('.conversation-header') && /flex-wrap:\s*wrap/.test(x.body)), 'header never wraps');
    assert.match(hdr.body, /flex-wrap:\s*nowrap/);
    // bar: 26px row + 2 x 2 border = 30, inside the 36px headshot row
    assert.ok(26 + 4 <= headerH - 2 * Number(pads[1]));
});
const T = V + ' .messages-container > ';
const bySel = sel => land.find(x => x.selector.split(', ').includes(sel));
const baseHide = all.find(r => r.media === '' && /nth-last-child/.test(r.selector) && /display:\s*none/.test(r.body));
check('landscape call: the latest call-subtitle is display:block and outranks the base nth-last-child hide rule (M1)', () => {
    assert.ok(baseHide, 'base rule found');
    const shown = bySel(T + '.call-subtitle');
    assert.ok(shown && /display:\s*block/.test(shown.body));
    assert.ok(cmpSpec(spec(shown.selector), spec(baseHide.selector)) > 0, `${spec(shown.selector)} vs ${spec(baseHide.selector)}`);
    // the older-subtitle rule beats the block rule, so only the latest shows
    const older = bySel(T + '.call-subtitle:has(~ .call-subtitle)');
    assert.ok(older && /display:\s*none/.test(older.body));
    assert.ok(cmpSpec(spec(older.selector), spec(shown.selector)) > 0);
});
check('landscape call: tells are hidden by a plain rule and :has() rules are split out (n1)', () => {
    const hide = bySel(T + ':not(.call-subtitle)');
    assert.ok(hide && /display:\s*none/.test(hide.body), 'tell hiding has no :has() in it');
    assert.ok(!/:has/.test(hide.selector));
    for (const r of land) {
        if (/display:\s*none/.test(r.body) && /:not\(\.call-subtitle\)/.test(r.selector)) {
            assert.ok(r.selector.split(', ').length === 1 && !/:has/.test(r.selector), r.selector);
        }
    }
    assert.ok(!land.some(x => x.selector.includes(V) && /:last-child|:nth-last-child/.test(x.selector) && /display:\s*none/.test(x.body)), 'no :last-child hiding');
    assert.match(L('.messages-container > .call-subtitle.narrator').body, /opacity:\s*0\.75/);
});
check('landscape call: only the newest trailing tell shows in influence calls; older tells stay hidden', () => {
    const tell = land.find(x => x.selector.includes(SEH) && x.selector.includes(':last-child:not(.call-subtitle)'));
    assert.ok(tell && /display:\s*block/.test(tell.body));
    const hide = bySel(T + ':not(.call-subtitle)');
    assert.ok(cmpSpec(spec(tell.selector), spec(hide.selector)) > 0, 'beats the tell hiding rule');
    assert.ok(cmpSpec(spec(tell.selector), spec(baseHide.selector)) > 0);
    // only the last child: an older tell never matches :last-child
    assert.ok(!/nth-last-child|:nth-child/.test(tell.selector));
    assert.doesNotMatch(tell.body, /border-radius|blur\(|gradient/);
    // an empty thread (CALLING, NO ANSWER, CALL ENDED) collapses
    const empty = bySel(L('.messages-container').selector.replace('.messages-container', '.messages-container:empty'));
    assert.ok(empty && /display:\s*none/.test(empty.body));
});
check('landscape call: caption and DM handle stay in the accessibility tree; name ellipsises', () => {
    const r = land.find(x => x.selector.includes(V + ' .call-caption'));
    assert.ok(r && r.selector.includes(V + ' .npc-handle'));
    assert.match(r.body, /clip:\s*rect\(0 0 0 0\)/);
    assert.match(r.body, /position:\s*absolute/);
    assert.match(r.body, /display:\s*block/, 'beats the base .call-has-choices .call-caption display:none');
    const baseCap = all.find(x => x.media === '' && /call-has-choices \.call-caption/.test(x.selector) && /display:\s*none/.test(x.body));
    assert.ok(baseCap && cmpSpec(spec(r.selector.split(', ')[0]), spec(baseCap.selector.split(', ')[0])) > 0);
    assert.doesNotMatch(r.body, /display:\s*none/);
    assert.ok(!land.some(x => x.selector.includes(V) && /call-caption/.test(x.selector) && /display:\s*none/.test(x.body)));
    const n = L('.npc-name');
    assert.match(n.body, /text-overflow:\s*ellipsis/);
    assert.match(n.body, /white-space:\s*nowrap/);
    assert.match(n.body, /overflow:\s*hidden/);
    assert.match(n.body, /font-size:\s*16px/);
});
check('landscape call: replies hold two one-line replies and scroll', () => {
    const oneLine = 2 * 2 + 2 * 3 + 16 * 1.2;             // border + padding + one 16px line = 29.2
    const need = 2 * oneLine + px(replies.body, 'gap') + 2 * px(replies.body, 'padding') + 2; // + border-top 2
    assert.ok(repliesMin >= need, `${repliesMin} < ${need}`);
    assert.match(replies.body, /overflow-y:\s*auto/);
    assert.match(replies.body, /box-sizing:\s*border-box/);
    assert.match(replies.body, /flex:\s*1 1 auto/);
});
check('landscape call: thread is fixed, border-box and scrolls', () => {
    assert.equal(px(thread.body, 'min-height'), threadH);
    assert.equal(px(thread.body, 'max-height'), threadH);
    assert.match(thread.body, /overflow-y:\s*auto/);
});
check('landscape call: end-call is out of the flow, on screen and never hidden', () => {
    const c = L('.call-controls');
    assert.match(c.body, /position:\s*absolute/);
    assert.match(c.body, /top:\s*0/);
    assert.ok(px(c.body, 'height') <= statusH, 'controls fit the status row');
    const b = L('.call-end-button');
    assert.ok(px(b.body, 'width') >= 32 && px(b.body, 'height') >= 32, 'tap target at least 32px');
    assert.ok(px(b.body, 'height') <= statusH);
    assert.match(b.body, /border:\s*2px solid/);
    for (const r of land) {
        if (/call-end|call-controls/.test(r.selector)) assert.doesNotMatch(r.body, /display:\s*none|visibility:\s*hidden|opacity:\s*0\b/, r.selector);
    }
    assert.match(status.body, /padding:\s*0 52px 0 10px/, 'status bar leaves room for the button');
    const f = L('.call-end-button:focus-visible').body;
    assert.match(f, /outline:\s*2px solid #000/);
    assert.match(f, /border-color:\s*#fff/);
    assert.doesNotMatch(f, /blur|box-shadow/);
    assert.ok(px(c.body, 'margin-top') >= 2, 'button sits 2px down so the outer ring is not clipped at the top');
    assert.match(status.body, /white-space:\s*nowrap/);
});
check('landscape call: header is one row; caption folded, speaking bars and avatar kept', () => {
    assert.match(hdr.body, /flex-direction:\s*row/);
    assert.match(hdr.body, /flex-wrap:\s*nowrap/);
    assert.match(L('.call-caption').body, /clip:\s*rect/);
    assert.ok(!/display:\s*none/.test(L('.call-speaking').body));
    assert.ok(!/display:\s*none/.test(avatarRule.body));
    assert.match(avatarRule.body, /width:\s*32px/);
});
check('landscape call: pixel UI rules (no radius, blur or gradient) in the new rules', () => {
    for (const r of land.filter(x => x.selector.includes(V))) {
        assert.doesNotMatch(r.body, /border-radius|blur\(|gradient/, r.selector);
    }
});
check('landscape call rules are all scoped to call mode', () => {
    for (const r of land.filter(x => /call-/.test(x.selector))) {
        assert.ok(r.selector.split(', ').every(s => s.includes('phone-call-mode')), r.selector);
    }
});
check('portrait and desktop call rules are unchanged', () => {
    const base = all.filter(r => r.media === '');
    const B = sel => base.find(r => r.selector === sel).body;
    assert.match(B('.phone-call-mode .conversation-avatar, .phone-call-mode .conversation-avatar-placeholder'), /width:\s*128px/);
    assert.match(B('.phone-call-mode .messages-container'), /min-height:\s*110px/);
    assert.match(B('.phone-call-mode .call-end-button'), /width:\s*60px/);
    assert.match(B('.phone-call-mode .call-end-button'), /height:\s*60px/);
    assert.match(B('.phone-call-mode .call-controls'), /padding:\s*10px 0 14px/);
    assert.match(B('.phone-call-mode .conversation-header'), /padding:\s*16px/);
    assert.match(B('.phone-call-mode .call-status-bar'), /padding:\s*8px 14px/);
    // nothing for call mode lives in the 820px (tablet) block
    assert.ok(!all.some(r => /max-height:\s*820px/.test(r.media) && r.selector.includes('phone-call-mode')));
});

console.log(`\n${pass} checks passed`);
