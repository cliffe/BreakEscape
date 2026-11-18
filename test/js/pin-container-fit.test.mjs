// Sweep B6, B8, B9: the PIN pad keeps its message row clear of the display and its log shows
// whole rows; a safe or cabinet shows every item name in full and the frame wraps the
// contents; the PIN cracker toggle row is a 32px touch target.
// Run with: node test/js/pin-container-fit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = (name) => readFileSync(join(root, 'css', name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const js = (rel) => readFileSync(join(root, 'js', rel), 'utf8');

// Declarations of every rule (at any nesting) whose selector list includes `selector`,
// optionally only inside an @media block whose condition contains `media`
function rules(text, selector, media = null) {
    const out = [];
    const walk = (block, cond) => {
        let i = 0;
        while (i < block.length) {
            const open = block.indexOf('{', i);
            if (open < 0) break;
            const head = block.slice(i, open).trim();
            // find the matching close brace
            let depth = 1, j = open + 1;
            while (j < block.length && depth) { if (block[j] === '{') depth++; else if (block[j] === '}') depth--; j++; }
            const body = block.slice(open + 1, j - 1);
            if (head.startsWith('@')) walk(body, head);
            else {
                const sels = head.split(',').map(s => s.trim().replace(/\s+/g, ' '));
                if (sels.includes(selector) && (media === null ? !cond || !cond.startsWith('@media') : (cond || '').includes(media))) {
                    const decls = {};
                    for (const d of body.split(';')) {
                        const k = d.indexOf(':');
                        if (k > 0) {
                            const name = d.slice(0, k).trim();
                            decls[name] = decls[name] ? [].concat(decls[name], d.slice(k + 1).trim()) : d.slice(k + 1).trim();
                        }
                    }
                    out.push(decls);
                }
            }
            i = j;
        }
    };
    walk(text, null);
    return out;
}
const rule = (text, selector, media = null) => {
    const all = rules(text, selector, media);
    assert.ok(all.length > 0, `no rule for ${selector}${media ? ` in ${media}` : ''}`);
    return Object.assign({}, ...all);
};



const px = (v) => parseFloat(v);
const pin = css('pin.css');
const box = css('container-minigame.css');

test('B6: the message row is not pulled up over the display on short screens', () => {
    const short = rule(pin, '.pin-minigame-message', '(max-height: 840px)');
    assert.ok(short.margin, 'a short-screen rule sets the message margin');
    assert.ok(!/-\d/.test(short.margin), 'no negative margin: it overlapped the display border by 12px');
    const base = rule(pin, '.pin-minigame-message');
    assert.ok(px(base['min-height']) >= 32, 'the row is reserved even when empty');
});

test('B6: the landscape message row reserves one line and fits the left column', () => {
    const land = rule(pin, '.pin-minigame-message', '(max-height: 520px)');
    assert.ok(px(land['min-height']) >= 32);
    assert.ok(px(land['max-width']) >= 380, 'wide enough for "Incorrect PIN. 4 attempts remaining." on one line');
});

test('B6: the attempts log shows whole rows and snaps to the newest', () => {
    const row = rule(pin, '.pin-minigame-attempt');
    assert.equal(row['flex'], '0 0 auto', 'rows never shrink inside the scrolling log');
    assert.equal(row['scroll-snap-align'], 'end');
    const rowH = px(row['line-height']) + 16 + 4;   // 8px padding top and bottom, 2px borders
    for (const [media, rows] of [[null, 3], ['(max-height: 840px)', 2], ['(max-height: 520px)', 2]]) {
        const log = rule(pin, '.pin-minigame-attempts-log', media);
        assert.equal(px(log['max-height']), rows * rowH + (rows - 1) * 8, `${media || 'default'}: ${rows} whole rows`);
    }
    assert.match(rule(pin, '.pin-minigame-attempts-log')['scroll-snap-type'], /^y/);
});

test('B6: the 600px media rows are also 40px tall so no older row shows a sliver', () => {
    const small = rule(pin, '.pin-minigame-attempt', '(max-width: 600px)');
    const base = rule(pin, '.pin-minigame-attempt');
    const pad = (r) => px(r.padding.split(/\s+/)[0]);
    const lh = px(small['line-height'] || base['line-height']);
    assert.equal(lh + 2 * pad(small) + 4, px(base['line-height']) + 16 + 4, 'same row height as the base rule');
    assert.equal(pad(small), 8);
});

test('B6: the log scrolls to the newest row again once laid out', () => {
    const s = js('minigames/pin/pin-minigame.js');
    assert.match(s, /requestAnimationFrame\(\(\) => \{ log\.scrollTop = log\.scrollHeight; \}\)/);
});

test('B9: the whole cracker label row is the touch target', () => {
    const r = rule(pin, '.pin-minigame-toggle-label');
    assert.ok(px(r['min-height']) >= 32);
    assert.equal(r['flex'], '1 1 auto');
});

test('B8: item names wrap in full, with no clamp or ellipsis', () => {
    const sel = '.container-contents-grid:not(.share-folder-files) .container-content-label';
    const r = rule(box, sel);
    assert.equal(r['-webkit-line-clamp'], 'unset');
    assert.equal(r.overflow, 'visible');
    assert.equal(r['text-overflow'], 'clip');
    assert.equal(r['white-space'], 'normal');
    assert.equal(r['overflow-wrap'], 'break-word', 'breaks inside a word only when it is wider than the label');
    assert.ok(px(r.width) >= 128, 'wide enough for "(Countersigned)" (123px) and "Reconnaissance" (125px) unbroken');
});

test('B8: the grid wraps its labels and has no fixed height or reserved band', () => {
    const g = rule(box, '.container-contents-grid:not(.share-folder-files)');
    assert.equal(g['max-height'], 'none');
    assert.equal(g['min-height'], '0');
    assert.ok(px(g['padding'].split(' ').pop()) <= 15, 'no 40px padding under the last row');
    assert.ok(px(rule(box, '.container-contents-grid:not(.share-folder-files) .container-content-slot')['margin-bottom']) > 0,
        'room for the hanging label comes from the slot, sized to its label');
});

test('B8: each slot is sized from its label once laid out', () => {
    const s = js('minigames/container/container-minigame.js');
    assert.match(s, /export function fitContentLabels\(grid\)/);
    assert.match(s, /else fitContentLabels\(contentsGrid\)/);
    assert.match(s, /slot\.style\.marginBottom = h > 0 \? `\$\{h \+ 6\}px` : '0px'/);
    assert.match(s, /document\.fonts\.load\('16px GNF'\)\.then\(fit/);
    assert.ok(!/label\.textContent = displayDashes\(shareParts \? shareParts\.name : item\.name\);/.test(s), 'an item without a name prints nothing, not "undefined"');
    assert.match(s, /\(shareParts \? shareParts\.name : item\.name\) \?\? ''/);
});

test('B8: the grid column minimum is as wide as the label so two columns fit at 390', () => {
    const cols = (media) => rule(box, '.container-contents-grid:not(.share-folder-files)', media)['grid-template-columns'];
    assert.match(cols(null), /minmax\(128px/);
    assert.match(cols('(max-width: 768px)'), /minmax\(128px/);
    // At 390 the content box is 390 - 2*frame - container padding/margin - grid padding/border.
    // The widest theme frame is 28px (cyberpunk); two columns need 2*128 + 10px gap.
    const c = rule(box, '.container-minigame', '(max-width: 480px)');
    const pad = parseInt(c.padding, 10), margin = parseInt(c.margin, 10) || 0;
    const content = 390 - 2 * 28 - 2 * pad - 2 * margin - (2 * 15 + 2 * 2);
    assert.ok(content >= 2 * 128 + 10, `grid content ${content}px holds two 128px columns`);
    assert.match(c.height, /calc\(100% - 20px\)/, 'height reserve matches the slimmer padding');
});

test('B8: fitContentLabels sizes each slot margin from its label height', () => {
    const s = js('minigames/container/container-minigame.js');
    const m = s.match(/export function fitContentLabels\(grid\) \{[\s\S]*?\n\}\n/);
    assert.ok(m, 'function found');
    const fit = new Function(m[0].replace('export function', 'function') + '\nreturn fitContentLabels;')();
    const slot = (h) => ({ style: {}, querySelector: () => (h === null ? null : { offsetHeight: h }) });
    const slots = [slot(36), slot(0), slot(54), slot(null)];
    const saved = { rAF: globalThis.requestAnimationFrame, doc: globalThis.document };
    delete globalThis.requestAnimationFrame;   // not present in node: only the synchronous pass runs
    let loaded = 0, fonts;
    globalThis.document = { fonts: { load: (spec) => { loaded++; fonts = spec; return Promise.resolve(); } } };
    try {
        fit({ querySelectorAll: () => slots });
        assert.deepEqual(slots.map(x => x.style.marginBottom), ['42px', '0px', '60px', '0px']);
        assert.equal(loaded, 1);
        assert.equal(fonts, '16px GNF');
        delete globalThis.document;           // no document.fonts at all: no throw
        fit({ querySelectorAll: () => slots });
        globalThis.document = {};
        fit({ querySelectorAll: () => slots });
        fit(null);
    } finally {
        if (saved.rAF) globalThis.requestAnimationFrame = saved.rAF;
        if (saved.doc) globalThis.document = saved.doc; else delete globalThis.document;
    }
});

test('B8: an empty actions row is neither drawn nor styled as a band', () => {
    const s = js('minigames/container/container-minigame.js');
    const ui = s.slice(s.indexOf('createStandardUI() {'), s.indexOf('createShareFolderUI() {'));
    assert.ok(!/<div class="container-actions">\s*\$\{/.test(ui), 'the row is only emitted with a Take button (whitespace made it non-empty)');
    assert.match(ui, /\$\{this\.isTakeable \? '<div class="container-actions">/);
    assert.ok(Object.keys(rules(box, '.container-actions:not(:has(*))')[0] || {}).includes('display'));
});

test('PIN pad: no border-radius in pin.css (UI rule); corners are stepped clip-paths', () => {
    for (const m of pin.matchAll(/border-radius\s*:\s*([^;}]+)/g)) {
        assert.match(m[1].trim(), /^0(px)?$/, `border-radius must be 0, found ${m[1]}`);
    }
    assert.match(pin, /clip-path: polygon/, 'the keypad and log plates keep their stepped pixel corners');
});

test('PIN pad: windows up to 840px high get the compact layout, so 720 and 768 fit', () => {
    const c = rule(pin, '.pin-minigame-game-container', '(max-height: 840px)');
    assert.equal(c.padding, '12px 20px');
    assert.ok(px(rule(pin, '.pin-minigame-key', '(max-height: 840px)')['min-height']) <= 40);
});

test('B6: a short narrow phone keeps the 400px display size (digits never grow on a shorter screen)', () => {
    const narrow = rule(pin, '.pin-minigame-display', '(max-width: 400px)');
    const both = rule(pin, '.pin-minigame-display', '(max-height: 840px) and (max-width: 400px)');
    assert.equal(both['font-size'], narrow['font-size']);
    assert.ok(px(both['font-size']) <= px(rule(pin, '.pin-minigame-display', '(max-height: 840px)')['font-size']));
    // the combined block must come after the plain 840 block to win
    assert.ok(pin.indexOf('(max-height: 840px) and (max-width: 400px)') > pin.indexOf('@media (max-height: 840px) {'));
});

test('B6 r2: 720-high pad with the cracker row wins about 56px back and keeps 32px keys', () => {
    const media = '(max-height: 760px)';
    const sel = '.pin-minigame-interface:has(.pin-minigame-toggle-container)';
    const kp = rule(pin, sel + ' .pin-minigame-keypad', media);
    const key = rule(pin, sel + ' .pin-minigame-key', media);
    const gap = rule(pin, sel, media);
    const baseKp = rule(pin, '.pin-minigame-keypad', '(max-height: 840px)');
    const baseKey = rule(pin, '.pin-minigame-key', '(max-height: 840px)');
    const baseGap = rule(pin, '.pin-minigame-interface', '(max-height: 840px)');
    assert.equal(px(baseKp.padding), 14);
    assert.equal(px(baseKey['min-height']), 40);
    assert.equal(px(baseGap.gap), 10);
    // key height is its min-height or glyph line (24px) + padding + borders, whichever is larger
    const keyH = Math.max(px(key['min-height']), 24 + 2 * px(key.padding) + 4);
    assert.ok(keyH >= 32, `key ${keyH}px stays a 32px touch target`);
    const saved = 2 * (px(baseKp.padding) - px(kp.padding)) + 4 * (40 - keyH) + 4 * (px(baseGap.gap) - px(gap.gap));
    assert.ok(saved >= 50, `saves ${saved}px (needs 25px plus margin)`);
    assert.ok(pin.includes('@media (max-height: 760px) and (min-height: 521px) and (min-width: 700px)'));
});

test('B6 r2: the cracker help text is 16px GNF on a 24px line', () => {
    const h = rule(pin, '.pin-minigame-cracker-help');
    assert.equal(h['font-size'], '16px');
    assert.equal(h['line-height'], '24px');
});
