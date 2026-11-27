// UI rules audit (UX_GENERAL_RULES_AUDIT.md): opens UI surfaces on a keyless headless server
// and checks the mechanical rules from the user's screenshot notes, at each viewport size:
//   cancel-beside-x  a visible Cancel/Close button in the same window as the close X (R1)
//   x-on-frame       the close X overlaps the window's border or sits outside it (R2)
//   overflow         a visible element pokes out of the window frame, or the frame out of
//                    the viewport, by more than 2px, and nothing between clips it (R3)
//   font             text whose first font family is not GNF, Press Start 2P or VT323 (R9)
//   font-size        a pixel face at a fractional size, or Press Start 2P off its 8px grid (R10)
//   faux-bold        a pixel face at weight 600 or more: no bold face ships, so the browser
//                    smears a synthetic one (R10)
//   hairline/radius/shadow/gradient  the pixel-art rule, as in pixel-style-sweep.mjs (R8)
//   frame-offscreen  the scene's frame (its closeAnchor(), else the game area) is not wholly
//                    inside the viewport: part of it sits past an edge where the player cannot
//                    see it (UI shell build: the frame wraps its content at every size)
//   clipped          a text, control, image or canvas element cut by more than 2px by an
//                    ancestor that hides overflow (overflow hidden or clip), or sitting before
//                    the start of a scroll box (above or left of it), where no scroll can
//                    reach it. Content past the end of a scroll box is reachable and passes.
//
// Printed per surface and size; --json keeps every breach. A summary at the end counts the
// frame-offscreen and clipped breaches (and overflow of the window itself) over the run.
//
// --strict exits 1 when any window-offscreen, frame-offscreen or clipped breach is found, or a
// scene did not open or threw on open (it was never audited; --skip a,b lists the ones allowed).
//
//   node tools/playtest/ui-rules-audit.mjs --port 3350 --game 2449 [--all | --scenes a,b] [--strict]
//        [--surfaces surfaces.mjs] [--params scene-params.json] [--sizes 1400x1000,800x600,915x412]
//        [--shots dir] [--json out.json] [--ops-view [footholdId] [--plant "js"]]
//
// --all sweeps every registered minigame with a title-only start (or the params given), so
// data-driven scenes open empty: judge their layout only. --surfaces takes a module whose
// default export is a list of { name, root, open: "js run in the page", close?: "js" } for
// dialogs, menus, phone apps and anything that is not a direct minigame start.
// --ops-view adds the network view, once in each look (surfaces network-view-gui and
// network-view-cli, opened with window.startNetworkViewMinigame and switched with
// window.__test.network.setSkin). It needs a live test_ops_skin game (swap-scenario-game.rb
// test_access_signin test_ops_skin) with its box planted: the audit loads the page with
// skip_resume=1, so give --plant "js" (run once in the page before the surfaces, for example a
// call that plugs the drop box into office_port) unless the page already holds the foothold.
// The foothold is the id after --ops-view, else the first one window.__test.access.footholds()
// lists (jack_office_port). With no foothold, or no setSkin in the page, the surface throws on open,
// is reported as not audited, and the run fails even without --strict. Without --ops-view the network view is not audited, as before.
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE picks the browser.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes(`--${n}`);
const PORT = opt('port', '3350');
const GID = opt('game', null);
const SHOTS = opt('shots', null);
const SIZES = opt('sizes', '1400x1000,800x600,915x412,390x844').split(',').map(s => s.split('x').map(Number));
const PARAMS = opt('params', null) ? JSON.parse(readFileSync(opt('params'), 'utf8')) : {};
const IS_MAIN = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (IS_MAIN && !GID) { console.error('--game is required'); process.exit(2); }

// The code run in the page to open the network view in one skin. The held footholds come from
// window.__test.access.footholds() (test-bridge/access.js); the skin is switched with
// window.__test.network.setSkin (test-bridge/network.js).
export function opsViewOpenCode(id, skin) {
    return `const held = window.__test.access?.footholds ? await window.__test.access.footholds() : []; const id = ${JSON.stringify(id)} || held[0]?.id; if (!id) throw new Error('no foothold held: the box is not planted'); if (!window.__test.network?.setSkin) throw new Error('no window.__test.network.setSkin'); window.startNetworkViewMinigame(id); await new Promise(r => setTimeout(r, 800)); await window.__test.network.setSkin(${JSON.stringify(skin)});`;
}

// The two --ops-view surfaces. `required` surfaces that were not audited fail the run even
// without --strict: the flag was asked for.
export function opsViewSurfaces(id) {
    return ['gui', 'cli'].map(skin => ({
        name: `network-view-${skin}`, root: '.minigame-container', required: true,
        open: opsViewOpenCode(id, skin),
        close: 'window.MinigameFramework.forceCloseMinigame?.()'
    }));
}

export function audit({ rootSel }) {
    const ALLOWED = ['gnf', 'press start 2p', 'vt323'];
    const PIXEL = ALLOWED;
    const out = [];
    const px = (v) => parseFloat(v) || 0;
    const roots = [...document.querySelectorAll(rootSel)].filter(r => {
        const cs = getComputedStyle(r); const b = r.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0;
    });
    if (!roots.length) return { open: false, breaches: [] };
    const path = (el) => {
        const parts = [];
        for (let n = el; n && n !== document.body && parts.length < 3; n = n.parentElement) {
            let s = n.tagName.toLowerCase();
            const cls = [...(n.classList || [])].slice(0, 2).join('.');
            if (n.id) s += `#${n.id}`; else if (cls) s += `.${cls}`;
            parts.unshift(s);
        }
        return parts.join(' > ');
    };
    const visible = (el) => {
        const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && b.width > 0 && b.height > 0;
    };
    const vw = innerWidth, vh = innerHeight;
    for (const root of roots) {
        const rb = root.getBoundingClientRect();
        const rcs = getComputedStyle(root);
        const inner = {
            l: rb.left + px(rcs.borderLeftWidth), r: rb.right - px(rcs.borderRightWidth),
            t: rb.top + px(rcs.borderTopWidth), b: rb.bottom - px(rcs.borderBottomWidth)
        };
        const fullScreen = rb.width >= vw - 4 && rb.height >= vh - 4;
        if (rb.left < -2 || rb.top < -2 || rb.right > vw + 2 || rb.bottom > vh + 2)
            out.push({ kind: 'overflow', where: path(root), detail: `frame ${Math.round(rb.left)},${Math.round(rb.top)} ${Math.round(rb.width)}x${Math.round(rb.height)} outside viewport ${vw}x${vh}` });
        // The scene's frame must sit inside the viewport (the shell scrolls, but the frame
        // should be capped to the window and scroll inside itself)
        let frame = null;
        try { frame = window.MinigameFramework?.currentMinigame?.closeAnchor?.() || null; } catch { frame = null; }
        if (!frame || !root.contains(frame)) frame = root.querySelector('.minigame-game-container');
        if (frame && frame !== root && visible(frame)) {
            const fb = frame.getBoundingClientRect();
            if (fb.left < -2 || fb.top < -2 || fb.right > vw + 2 || fb.bottom > vh + 2)
                out.push({ kind: 'frame-offscreen', where: path(frame), detail: `frame ${Math.round(fb.left)},${Math.round(fb.top)}-${Math.round(fb.right)},${Math.round(fb.bottom)} viewport ${vw}x${vh}` });
        }
        // Clipped children: cut by an ancestor that hides overflow, or before a scroll box's start
        let clippedCount = 0;
        const leafy = (el) => ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'IMG', 'CANVAS'].includes(el.tagName)
            || el.tagName.toLowerCase() === 'svg'
            || [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
        for (const el of root.querySelectorAll('*')) {
            if (!(el instanceof HTMLElement) && el.tagName.toLowerCase() !== 'svg') continue;
            if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
            if (!leafy(el) || !visible(el) || el.closest('.minigame-close-button')) continue;
            let b = el.getBoundingClientRect();
            for (let a = el.parentElement; a; a = a.parentElement) {
                const acs = getComputedStyle(a);
                const ab = a.getBoundingClientRect();
                const ox = acs.overflowX, oy = acs.overflowY;
                const t = ab.top + px(acs.borderTopWidth), l = ab.left + px(acs.borderLeftWidth);
                // `zoom` scales the rect but not clientWidth/clientHeight: bring them to the same scale
                const zx = a.offsetWidth ? ab.width / a.offsetWidth : 1, zy = a.offsetHeight ? ab.height / a.offsetHeight : 1;
                const bt = t + a.clientHeight * zy, rt = l + a.clientWidth * zx;
                const hide = (o) => o === 'hidden' || o === 'clip';
                const scroll = (o) => o === 'auto' || o === 'scroll';
                let cut = null;
                if (hide(oy) && (b.top < t - 2 || b.bottom > bt + 2)) cut = 'y';
                else if (hide(ox) && (b.left < l - 2 || b.right > rt + 2)) cut = 'x';
                else if (scroll(oy) && b.top < t - a.scrollTop - 2) cut = 'before-top';
                else if (scroll(ox) && b.left < l - a.scrollLeft - 2) cut = 'before-left';
                // A box collapsed to nothing (a panel closed by a toggle: max-height 0, opacity 0) is
                // not cutting anything, it is hidden; its contents are not on show (review m3)
                if (cut && (a.clientHeight === 0 || a.clientWidth === 0 || +acs.opacity === 0)) break;
                // Past the end of a scroll box is reachable by scrolling it, so the box itself
                // stands in for the element from here: an outer box that hides overflow can
                // still cut the scroll box (review m4)
                if (!cut && (scroll(oy) || scroll(ox))) { b = ab; continue; }
                if (cut) {
                    // A box that is itself wholly cut away is reported once, at its own level
                    if (clippedCount++ < 5) out.push({ kind: 'clipped', where: path(el), detail: `${Math.round(b.left)},${Math.round(b.top)}-${Math.round(b.right)},${Math.round(b.bottom)} cut (${cut}) by ${path(a)} ${Math.round(l)},${Math.round(t)}-${Math.round(rt)},${Math.round(bt)}` });
                    break;
                }
                if (a === root || a === document.body) break;
            }
        }
        // R1 and R2: the close X
        const xs = [...root.querySelectorAll('.minigame-close-button, [class*="close-x"], .modal-close, [aria-label="Close"]')].filter(visible);
        const buttons = [...root.querySelectorAll('button, .minigame-button, [role="button"]')].filter(visible);
        for (const x of xs) {
            const cancel = buttons.find(b => b !== x && !xs.includes(b) && /^\s*(cancel|close|close terminal|back|dismiss)\s*$/i.test(b.textContent || ''));
            if (cancel) out.push({ kind: 'cancel-beside-x', where: path(cancel), detail: `"${cancel.textContent.trim()}" beside the X` });
            const xb = x.getBoundingClientRect();
            if (!fullScreen && (xb.left < inner.l - 0.5 || xb.right > inner.r + 0.5 || xb.top < inner.t - 0.5 || xb.bottom > inner.b + 0.5))
                out.push({ kind: 'x-on-frame', where: path(x), detail: `X ${Math.round(xb.left)},${Math.round(xb.top)}-${Math.round(xb.right)},${Math.round(xb.bottom)}; inner frame ${Math.round(inner.l)},${Math.round(inner.t)}-${Math.round(inner.r)},${Math.round(inner.b)}` });
        }
        let overflowCount = 0; const fontSizes = {};
        for (const el of root.querySelectorAll('*')) {
            if (!(el instanceof HTMLElement) && el.tagName.toLowerCase() !== 'text') continue;
            if (!visible(el)) continue;
            const cs = getComputedStyle(el);
            // R3: content outside the frame, unless an ancestor inside the root clips it
            const b = el.getBoundingClientRect();
            const out2 = b.left < inner.l - 2 || b.right > inner.r + 2 || b.top < inner.t - 2 || b.bottom > inner.b + 2;
            if (out2 && !xs.includes(el) && !el.closest('.minigame-close-button') && cs.position !== 'fixed') {
                let clipped = false;
                for (let a = el.parentElement; a && a !== root; a = a.parentElement) {
                    const acs = getComputedStyle(a);
                    if (acs.overflow !== 'visible' || acs.overflowX !== 'visible' || acs.overflowY !== 'visible') {
                        const ab = a.getBoundingClientRect();
                        if (ab.left >= inner.l - 2 && ab.right <= inner.r + 2 && ab.top >= inner.t - 2 && ab.bottom <= inner.b + 2) { clipped = true; break; }
                    }
                }
                if (!clipped && overflowCount++ < 3) out.push({ kind: 'overflow', where: path(el), detail: `${Math.round(b.left)},${Math.round(b.top)}-${Math.round(b.right)},${Math.round(b.bottom)} beyond frame ${Math.round(inner.l)},${Math.round(inner.t)}-${Math.round(inner.r)},${Math.round(inner.b)}` });
            }
            // Pixel-art rule (R8)
            const diegetic = !!el.closest('[data-diegetic]');
            if (!diegetic) {
                for (const s of ['Top', 'Right', 'Bottom', 'Left']) {
                    const st = cs[`border${s}Style`], w = px(cs[`border${s}Width`]);
                    if (st !== 'none' && st !== 'hidden' && w > 0 && w < 2) { out.push({ kind: 'hairline', where: path(el), detail: `${s} ${w}px` }); break; }
                }
                if (['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].some(c => px(cs[`border${c}Radius`]) > 0) && (!cs.clipPath || cs.clipPath === 'none'))
                    out.push({ kind: 'radius', where: path(el), detail: cs.borderTopLeftRadius });
                const blur = (v) => (v && v !== 'none') ? v.split(/,(?![^(]*\))/).some(sh => (px(sh.replace(/rgba?\([^)]*\)|#[0-9a-f]+|inset/gi, '').trim().split(/\s+/)[2]) > 0)) : false;
                if (blur(cs.boxShadow)) out.push({ kind: 'shadow', where: path(el), detail: `box ${cs.boxShadow.slice(0, 50)}` });
                if (blur(cs.textShadow)) out.push({ kind: 'shadow', where: path(el), detail: `text ${cs.textShadow.slice(0, 50)}` });
                const g = (cs.backgroundImage || '').match(/(linear|radial|conic)-gradient/);
                if (g && !/\b0(px|%)?\s*,|(\d+px)\s*,\s*[^,]*\s\2/.test(cs.backgroundImage)) out.push({ kind: 'gradient', where: path(el), detail: cs.backgroundImage.slice(0, 50) });
            }
            // Fonts (R9, R10)
            const isText = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName) || [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
            if (!isText) continue;
            const first = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim().toLowerCase();
            if (!ALLOWED.includes(first)) { out.push({ kind: 'font', where: path(el), detail: cs.fontFamily.slice(0, 40) }); continue; }
            // SVG text is sized in viewBox units: the size on screen is that times the SVG's
            // own scale (the network architecture diagram draws at 2x, NAD1)
            let size = px(cs.fontSize);
            const svg = el.ownerSVGElement;
            if (svg?.viewBox?.baseVal?.width) {
                const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
                if (k > 0) size = Math.round(size * k * 100) / 100;
            }
            fontSizes[`${first} ${size}`] = (fontSizes[`${first} ${size}`] || 0) + 1;
            if (PIXEL.includes(first)) {
                if (Math.abs(size - Math.round(size)) > 0.01) out.push({ kind: 'font-size', where: path(el), detail: `${first} ${size}px fractional` });
                else if (first === 'press start 2p' && size % 8 !== 0) out.push({ kind: 'font-size', where: path(el), detail: `press start 2p ${size}px (grid is 8px)` });
                if (+cs.fontWeight >= 600) out.push({ kind: 'faux-bold', where: path(el), detail: `${first} weight ${cs.fontWeight}` });
            }
        }
        out.push({ kind: '_fonts', where: rootSel, detail: JSON.stringify(fontSizes) });
    }
    return { open: true, breaches: out };
}

const BUILTIN_PARAMS = {
    'pin': { title: 'Keypad', correctPin: '1234', pinLength: 4, maxAttempts: 3 },
    'text-file': { title: 'notes.txt', fileName: 'notes.txt', fileContent: 'Line one.\nLine two.', content: 'Line one.\nLine two.' },
    'notes': { title: 'Note', noteContent: 'A short note to read.', observationText: 'Seen on the desk.' },
    'combination': { title: 'Padlock', combination: [7, 21, 39], dials: 3 },
    'cryptex': { title: 'Cryptex', password: 'CIPHER', wheels: 6 },
    'password': { title: 'Password', correctPassword: 'secret', showHint: true, hint: 'A hint' },
    // Review m4: a bare title-only start
    // throws or finds no NPC. person-chat and network-view need the game's own NPCs and network, so they
    // are reported as not audited (give --skip person-chat,network-view to allow it, a --surfaces entry, or
    // --ops-view against a planted test_ops_skin game)
    'container': { title: 'Container', containerItem: { name: 'Locker', scenarioData: { name: 'Locker', contents: [] } }, contents: [] },
    'phone-chat': { title: 'Phone', npcId: 'test_npc' },
    // four lamp rows, so the panel has its real width and height (R2 M2)
    'alarm-panel': { lockable: { scenarioData: { minigameData: { lamps: [{ label: 'FRONT DOOR', offStatus: 'CLOSED' }, { label: 'FIRE ZONE 2', offStatus: 'CLEAR' }, { label: 'MAINS POWER', offStatus: 'NORMAL' }, { label: 'SERVER ROOM NETWORK', offStatus: 'LINK UP' }] } } } },
    'ble-scanner': { title: 'BLE scanner', devices: [{ name: 'Printer', mac: 'AA:BB:CC:00:11:22', rssi: -48 }] },
    'bluetooth-scanner': { title: 'Bluetooth scanner', devices: [{ name: 'Printer', mac: 'AA:BB:CC:00:11:22', rssi: -48 }] }
};

async function main() {
    // Scrollbars shown, as a desktop player sees them: drop the default --hide-scrollbars and add
    // no hide-scrollbars switch at all (Chrome reads its presence, so =false still hides them)
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
    const page = await browser.newPage({ viewport: { width: SIZES[0][0], height: SIZES[0][1] } });
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* blocked */ } });
    await page.goto(`http://127.0.0.1:${PORT}/break_escape/games/${GID}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 240000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    // setFPS(20), fixed steps ON (never fixedStep=false)
    await page.evaluate(() => { try { window.game?.physics?.world?.setFPS?.(20); } catch { /* none */ } });
    await page.waitForTimeout(2500);
    await page.evaluate(() => { try { window.MinigameFramework.forceCloseMinigame?.(); } catch { /* none */ } });

    let surfaces = [];
    if (flag('all') || opt('scenes', null)) {
        const registered = await page.evaluate(() => Object.keys(window.MinigameFramework.registeredScenes || {}));
        const scenes = opt('scenes', null)?.split(',') || registered;
        for (const s of scenes) {
            const p = PARAMS[s] || BUILTIN_PARAMS[s] || { title: s };
            surfaces.push({ name: `mg-${s}`, root: '.minigame-container', open: `window.MinigameFramework.startMinigame(${JSON.stringify(s)}, null, ${JSON.stringify(p)})`, close: 'window.MinigameFramework.forceCloseMinigame?.()' });
        }
    }
    if (flag('ops-view')) {
        const given = opt('ops-view', null);
        const id = given && !given.startsWith('--') ? given : null;
        if (opt('plant', null)) {
            try { await page.evaluate(async (js) => (0, eval)(`(async () => { ${js} })()`), opt('plant')); } catch (e) { console.log(`plant failed: ${String(e.message || e).slice(0, 100)}`); }
            await page.waitForTimeout(1500);
        }
        surfaces.push(...opsViewSurfaces(id));
    }
    if (opt('surfaces', null)) surfaces = surfaces.concat((await import(pathToFileURL(resolve(opt('surfaces'))).href)).default);

    if (SHOTS) mkdirSync(SHOTS, { recursive: true });
    const report = {};
    for (const s of surfaces) {
        report[s.name] = {};
        for (const [w, h] of SIZES) {
            await page.setViewportSize({ width: w, height: h });
            const errs = await page.evaluate(async ({ open, close }) => {
                const errors = [];
                const onErr = (e) => errors.push(String(e.message || e.reason || e));
                window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
                try { if (close) await (0, eval)(close); } catch { /* nothing open */ }
                document.querySelectorAll('.minigame-container').forEach(n => n.remove());
                await new Promise(r => setTimeout(r, 300));
                try { await (0, eval)(`(async () => { ${open} })()`); } catch (e) { errors.push(String(e.message || e)); }
                await new Promise(r => setTimeout(r, 1500));
                window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
                return errors;
            }, { open: s.open, close: s.close || null });
            const res = await page.evaluate(audit, { rootSel: s.root });
            report[s.name][`${w}x${h}`] = { ...res, errors: errs };
            if (SHOTS) await page.screenshot({ path: join(SHOTS, `${s.name}_${w}x${h}.png`) });
            const kinds = {};
            for (const b of res.breaches) if (!b.kind.startsWith('_')) kinds[b.kind] = (kinds[b.kind] || 0) + 1;
            console.log(`${s.name.padEnd(34)} ${`${w}x${h}`.padEnd(9)} ${res.open ? '' : '(not open) '}${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ') || 'clean'}${errs.length ? `  ERR ${errs[0].slice(0, 70)}` : ''}`);
        }
        try { await page.evaluate((c) => (0, eval)(c), s.close || 'window.MinigameFramework.forceCloseMinigame?.()'); } catch { /* ignore */ }
    }
    await browser.close();
    // Summary: the shell and frame checks, counted over every surface and size
    const counts = { 'window-offscreen': 0, 'frame-offscreen': 0, clipped: 0, 'x-on-frame': 0, overflow: 0 };
    const where = { 'window-offscreen': new Set(), 'frame-offscreen': new Set(), clipped: new Set(), 'x-on-frame': new Set(), overflow: new Set() };
    for (const [name, bySize] of Object.entries(report)) {
        for (const [size, r] of Object.entries(bySize)) {
            for (const b of r.breaches) {
                const k = b.kind === 'overflow' && /outside viewport/.test(b.detail) ? 'window-offscreen' : b.kind;
                if (!(k in counts)) continue;
                counts[k]++; where[k].add(`${name} ${size}`);
            }
        }
    }
    console.log(`SUMMARY window-offscreen ${counts['window-offscreen']} (${where['window-offscreen'].size} surface-sizes), frame-offscreen ${counts['frame-offscreen']} (${where['frame-offscreen'].size}), clipped ${counts.clipped} (${where.clipped.size}), x-on-frame ${counts['x-on-frame']} (${where['x-on-frame'].size}), overflow ${counts.overflow} (${where.overflow.size})`);
    if (opt('json', null)) writeFileSync(opt('json'), JSON.stringify(report, null, 2));
    const fits = counts['window-offscreen'] + counts['frame-offscreen'] + counts.clipped + counts['x-on-frame'] + counts.overflow;
    // A scene that did not open (or threw on open) was never audited, so "clean" means nothing for
    // it: --strict counts it as a failure unless it is on --skip (review m4)
    const skip = new Set((opt('skip', '') || '').split(',').filter(Boolean));
    const unaudited = [];
    for (const [name, bySize] of Object.entries(report)) {
        if (skip.has(name.replace(/^mg-/, '')) || skip.has(name)) continue;
        for (const [size, r] of Object.entries(bySize)) {
            if (!r.open || (r.errors || []).length) unaudited.push(`${name} ${size}${r.open ? ' (error)' : ' (not open)'}`);
        }
    }
    const requiredMissing = surfaces.filter(x => x.required && unaudited.some(u => u.split(' ')[0] === x.name));
    if (unaudited.length) console.log(`NOT AUDITED ${unaudited.length}: ${[...new Set(unaudited.map(u => u.split(' ')[0]))].join(', ')}`);
    if (requiredMissing.length && !flag('strict')) { console.log(`FAIL: --ops-view was asked for and ${requiredMissing.map(x => x.name).join(', ')} not audited`); process.exit(1); }
    if (flag('strict') && (fits || unaudited.length)) { console.log(`FAIL: ${fits} fit breach(es), ${unaudited.length} surface-size(s) not audited`); process.exit(1); }
}

if (IS_MAIN) main().catch(e => { console.error(e); process.exit(2); });
