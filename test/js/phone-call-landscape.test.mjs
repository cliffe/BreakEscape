// Voiced call mode in phone landscape (max-height 500px, the 844x390 budget): the status bar,
// header, thread, replies and the end-call button all fit the 253px phone screen, the end-call
// button stays visible, and call rules for screens taller than 820px are untouched. The end-call
// button rules are shared with every screen up to 820px tall (@media screen and (max-height: 820px)),
// and calls with replies showing on 501 to 820px screens (1280x720, 800x600, portrait phones) get a
// scrolling thread of the latest line plus the newest tell (@media (500px < height <= 820px)).
// Reads the CSS, no browser.
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
const SHARED_MEDIA = '@media screen and (max-height: 820px)';
const DESK_MEDIA = '@media (500px < height <= 820px)';
// The end-call button rules serve every call screen up to 820px tall, so they live in one shared block
const shared = all.filter(r => r.media === SHARED_MEDIA);
const L = sel => { const r = land.concat(shared).find(x => x.selector.split(', ').includes(V + ' ' + sel)); assert.ok(r, 'landscape or shared rule ' + sel); return r; };
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
const TELL = ':has(.messages-container > .pretext-tell:last-child)';
const threadSECue = px(LH(SE + CUE + TELL, '.messages-container').body, 'height');
const seCueMin = px(LH(SE + CUE + TELL, '.choices-container').body, 'min-height');
check('landscape call: stack fits every phone screen height (253, 242.5, 232), normal and influence calls, with and without the cue', () => {
    assert.deepEqual(SCREENS.map(([vh]) => screenAt(vh)), [253, 242.5, 232]);
    assert.equal(statusH, 36);
    assert.equal(headerH, 40);
    assert.equal(threadH, 44);
    assert.equal(threadSE, 44, 'influence thread holds a subtitle line and a tell line');
    assert.equal(threadSECue, 44, 'a trailing tell keeps the influence thread at two lines with the cue');
    assert.ok(threadCue >= 24, 'one subtitle line (2 border + 20.8)');
    const stacks = {
        'normal, no cue': [threadH, repliesMin, 0],
        'normal, cue': [threadCue, repliesMin, cueH],
        'influence, no cue': [threadSE, repliesMin, 0],     // the bar is on the header row: header stays 40
        'influence, cue, no tell': [threadCue, repliesMin, cueH],   // the plain cue rule (24px thread) applies
        'influence, cue, tell': [threadSECue, seCueMin, cueH]
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
    // the bar keeps its width (never squeezed by a long name); the name's info block gives way
    assert.match(bar.body, /flex:\s*0 0 auto/);
    assert.match(bar.body, /(?:^|[\s;])width:\s*130px/);
    const info = LH(SEH, '.conversation-info').body;
    assert.match(info, /flex:\s*1 1 0/);
    assert.match(info, /min-width:\s*0/);
    assert.match(L('.npc-name').body, /display:\s*block/, 'the name is a block so it can ellipsise inside .npc-id-block');
    assert.ok(!land.some(x => x.selector.includes(SE) && x.selector.includes('.conversation-header') && /flex-wrap:\s*wrap/.test(x.body)), 'header never wraps');
    assert.match(hdr.body, /flex-wrap:\s*nowrap/);
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
    const tell = land.find(x => x.selector.includes(SEH) && x.selector.includes('.pretext-tell:last-child'));
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
    for (const r of land.concat(shared)) {
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
check('portrait and tall-desktop (over 820px) call rules are unchanged', () => {
    const base = all.filter(r => r.media === '');
    const B = sel => base.find(r => r.selector === sel).body;
    assert.match(B('.phone-call-mode .conversation-avatar, .phone-call-mode .conversation-avatar-placeholder'), /width:\s*128px/);
    assert.match(B('.phone-call-mode .messages-container'), /min-height:\s*110px/);
    assert.match(B('.phone-call-mode .call-end-button'), /width:\s*60px/);
    assert.match(B('.phone-call-mode .call-end-button'), /height:\s*60px/);
    assert.match(B('.phone-call-mode .call-controls'), /padding:\s*10px 0 14px/);
    assert.match(B('.phone-call-mode .conversation-header'), /padding:\s*16px/);
    assert.match(B('.phone-call-mode .call-status-bar'), /padding:\s*8px 14px/);
    // call mode rules live only in the two exact blocks below the 820px line (nothing in the tablet block)
    assert.ok(!all.some(r => /820px/.test(r.media) && r.media !== SHARED_MEDIA && r.media !== DESK_MEDIA && r.selector.includes('phone-call-mode')));
});

check('landscape call: the influence bar stacks (head over a full-width track) inside the 40px header row', () => {
    const bar = L('.se-chat-header .influence-bar').body;
    assert.match(bar, /grid-template-columns:\s*minmax\(0, 1fr\)/, 'one column: head above track');
    const pad = bar.match(/padding:\s*(\d+)px/); const gap = px(bar, 'row-gap');
    const track = L('.se-chat-header .ib-infl-track').body;
    assert.match(track, /box-sizing:\s*content-box/);
    assert.match(track, /margin:\s*0;/);
    const trackBox = px(track, 'height') + 2 * 2;            // 2px borders kept
    const head = 14;                                          // label and number line-height
    const total = 4 + 2 * Number(pad[1]) + head + gap + trackBox;
    assert.ok(total <= headerH - 2 * Number(pads[1]), 'bar ' + total + ' fits the header row');
    assert.match(L('.se-chat-header .ib-infl-label').body, /line-height:\s*14px/);
    // the 16px mark icons are replaced by 2px ticks across the track; the legend is not brought back
    assert.match(L('.se-chat-header .ib-infl-mark').body, /width:\s*2px/);
    assert.match(L('.se-chat-header .ib-infl-mark::after').body, /display:\s*none/);
    assert.ok(!land.some(x => /ib-infl-legend/.test(x.selector) && /display:\s*(block|flex|grid)/.test(x.body)));
    assert.match(L('.se-chat-header .ib-infl-number').body, /line-height:\s*14px/);
    assert.match(L('.se-chat-header .ib-infl-number').body, /font-weight:\s*400/, 'VT323 has one weight: no synthetic bold');
    assert.match(L('.se-chat-header .ib-infl-mark-icon').body, /display:\s*none/);
    // reached ticks differ in shape, not only colour
    assert.match(L('.se-chat-header .ib-infl-mark.is-reached').body, /width:\s*4px/);
    assert.match(L('.se-chat-header .ib-infl-mark.is-reached').body, /margin-left:\s*-2px/);
    // the legend (threshold state in words) is visually hidden but stays readable to screen readers
    const legend = land.find(x => /\.ib-infl-legend\b/.test(x.selector));
    assert.ok(legend, 'a landscape legend rule exists');
    assert.doesNotMatch(legend.body, /display:\s*none/);
    assert.match(legend.body, /clip-path:\s*inset\(50%\)/);
});
// appendTellBubbles scrolls the thread to the newest tell, and leaves it alone when nothing was added
globalThis.document = {
    createElement: () => {
        const el = { children: [], dataset: {}, className: '', style: {}, appendChild(c) { el.children.push(c); return c; }, setAttribute() {} };
        return el;
    }
};
const { appendTellBubbles } = await import('../../public/break_escape/js/ui/pretext-chrome.js');
const fakeThread = () => {
    const c = { tells: 0, scrollTop: 0, scrollHeight: 500, querySelectorAll: () => ({ length: c.tells }), appendChild() { c.tells++; } };
    return c;
};
check('appendTellBubbles: scrollTop goes to scrollHeight after a new tell', () => {
    const c = fakeThread();
    appendTellBubbles(c, ['one']);
    assert.equal(c.tells, 1);
    assert.equal(c.scrollTop, c.scrollHeight);
    c.scrollHeight = 900;
    appendTellBubbles(c, ['one', 'two']);
    assert.equal(c.tells, 2);
    assert.equal(c.scrollTop, 900);
});
check('appendTellBubbles: scrollTop is unchanged when no tell was added', () => {
    const c = fakeThread();
    c.tells = 2; c.scrollTop = 17;
    appendTellBubbles(c, ['one', 'two']);
    appendTellBubbles(c, []);
    appendTellBubbles(c, undefined);
    assert.equal(c.tells, 2);
    assert.equal(c.scrollTop, 17);
});

// Calls on 501 to 820px screens (1280x720, 1366x657, 800x600, portrait phones). The 575px screen at
// 1280x720 clipped the end-call button, so the button leaves the flow (shared with landscape) and the
// thread, while replies show, is a scrolling box of the latest line plus the newest tell.
const desk = all.filter(r => r.media === DESK_MEDIA);
const D = sel => { const r = desk.find(x => x.selector === sel); assert.ok(r, 'desktop-height call rule ' + sel); return r; };
const baseCall = sel => { const r = all.find(x => x.media === '' && x.selector === sel); assert.ok(r, 'base rule ' + sel); return r; };
const CH = V + '.call-has-choices';
const beats = (sel, base) => assert.ok(cmpSpec(spec(sel), spec(base)) > 0, sel + ' ' + spec(sel) + ' must beat ' + base + ' ' + spec(base));
check('desktop-height call: the range starts exactly where the landscape block ends (no gap, no overlap)', () => {
    assert.ok(DESK_MEDIA.includes('500px < height'), 'strict lower bound');
    assert.ok(land.length > 0 && land.every(r => r.media === '@media (max-height: 500px)'), 'landscape block is max-height 500px');
    assert.ok(desk.length >= 5);
    assert.ok(!desk.some(r => /max-height:\s*500px/.test(r.media)));
    // the end-call rules are single-source: the landscape block no longer repeats them
    assert.ok(!land.some(r => /call-end-button|call-controls|call-status-bar/.test(r.selector)));
});
check('desktop-height call: the end-call button is out of the flow, same size and style as landscape, and wins the cascade', () => {
    assert.equal(shared.length, 5, 'view, status bar, controls, end button and its focus ring share one block');
    const c = L('.call-controls'), b = L('.call-end-button');
    assert.match(c.body, /position:\s*absolute/);
    assert.match(c.body, /top:\s*0/);
    assert.equal(px(b.body, 'width'), 36);
    assert.equal(px(b.body, 'height'), 36);
    assert.match(b.body, /border:\s*2px solid #000/);
    assert.match(L('.call-end-button:focus-visible').body, /outline:\s*2px solid #000/);
    assert.equal(px(L('.call-status-bar').body, 'height'), 36);
    beats(V + ' .call-controls', '.phone-call-mode .call-controls');
    beats(V + ' .call-end-button', '.phone-call-mode .call-end-button');
    beats(V + ' .call-status-bar', '.phone-call-mode .call-status-bar');
    assert.ok(px(baseCall('.phone-call-mode .call-end-button').body, 'width') > 36, 'the 60px desktop button is what this replaces');
});
check('desktop-height call: replies showing, the thread scrolls (never clips) and holds three lines of Dev text', () => {
    const b = D(CH + ' .messages-container').body;
    assert.match(b, /overflow-y:\s*auto/);
    assert.match(b, /justify-content:\s*flex-start/);
    assert.match(b, /box-sizing:\s*border-box/);
    const lineH = 16 * 1.3;                                  // .call-subtitle: 16px at 1.3
    const pad = b.match(/padding:\s*(\d+)px/);
    assert.ok(px(b, 'min-height') >= 3 * lineH + 2 * Number(pad[1]), 'room for 3 lines, min-height ' + px(b, 'min-height'));
    assert.ok(px(b, 'max-height') >= px(b, 'min-height'));
    assert.ok(px(b, 'max-height') < 190, 'below the old 190px cap');
    beats(CH + ' .messages-container', '.phone-call-mode .messages-container');
    beats(CH + ' .messages-container', '.conversation-view .messages-container');
});
check('desktop-height call: only while replies show; the speaking phase keeps the old thread size', () => {
    assert.ok(desk.some(r => /\.messages-container/.test(r.selector)), 'the desktop-height thread rules exist');
    assert.ok(desk.every(r => !/\.messages-container/.test(r.selector) || r.selector.includes('.call-has-choices')));
    assert.ok(!desk.some(r => /\.choices-container/.test(r.selector)), 'no cap on the replies box');
    assert.match(baseCall('.phone-call-mode .messages-container').body, /min-height:\s*110px/);
    assert.match(baseCall('.phone-call-mode .messages-container').body, /max-height:\s*190px/);
});
check('desktop-height call: the thread shows the latest subtitle plus the newest trailing tell, and beats the base hide rule', () => {
    const base = '.phone-call-mode .messages-container > :not(:nth-last-child(-n + 2))';
    const hideOthers = D(CH + ' .messages-container > :not(.call-subtitle)');
    assert.match(hideOthers.body, /display:\s*none/);
    const latest = D(CH + ' .messages-container > .call-subtitle');
    assert.match(latest.body, /display:\s*block/);
    beats(CH + ' .messages-container > .call-subtitle', base);
    const older = D(CH + ' .messages-container > .call-subtitle:has(~ .call-subtitle)');
    assert.match(older.body, /display:\s*none/);
    assert.ok(cmpSpec(spec(older.selector), spec(latest.selector)) > 0, 'older-subtitle hide beats the latest-subtitle show');
    const tell = D(CH + ':has(.se-chat-header) .messages-container > .pretext-tell:last-child');
    assert.match(tell.body, /display:\s*block/);
    beats(tell.selector, hideOthers.selector);
    beats(tell.selector, base);
});
check('desktop-height call: height budget at 1280x720, 1366x657 and 800x600 (end button on screen, stack fits)', () => {
    // Measured live (header with the three-line influence legend and a change line): status 36, header 236.
    const statusPx = px(L('.call-status-bar').body, 'height');
    const header = 236;
    const thread = px(D(CH + ' .messages-container').body, 'min-height');
    const repliesMin = px(baseCall('.conversation-view .choices-container').body, 'min-height');
    const cue = 25;
    const need = statusPx + header + thread + repliesMin + cue;
    for (const [vw, vh] of [[1280, 720], [1366, 657], [800, 600]]) {
        const screen = screenAt(vh);
        assert.ok(need <= screen, vw + 'x' + vh + ' screen ' + screen + ' needs ' + need);
    }
    // the button is out of the flow, so it is on screen even where the stack no longer fits
    assert.match(L('.call-controls').body, /position:\s*absolute/);
});
check('desktop-height call: no radius, blur or gradient', () => {
    assert.ok(desk.length > 0 && shared.length > 0);
    for (const r of desk.concat(shared)) assert.doesNotMatch(r.body, /border-radius|blur|gradient/, r.selector);
});

console.log(`\n${pass} checks passed`);
