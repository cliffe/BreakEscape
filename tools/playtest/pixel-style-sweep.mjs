// Pixel-art UI sweep (UX feedback round, slice 7): opens registered minigames one by one
// with MinigameFramework.startMinigame on a keyless headless server and checks the computed
// style of every visible element (and its ::before / ::after) inside the minigame window
// against the pixel-art UI rule:
//   hairline   a drawn border side under 2px wide
//   radius     a rounded corner on an element with no clip-path (stepped clip-path corners
//              are pixel art and pass)
//   shadow     a box-shadow, text-shadow or drop-shadow filter with a blur radius
//   gradient   a CSS gradient in background-image or border-image
//   font       a text element whose first font family is not GNF, Press Start 2P or VT323
// Diegetic pages (an email body, a web page inside a browser) may mark their root with
// data-diegetic; inside one only the font check applies.
//
//   node tools/playtest/pixel-style-sweep.mjs [--port 3340] [--game 2401] [--scenes a,b]
//        [--all] [--params scene-params.json] [--json out.json] [--shots dir --tag before] [--sizes 1400x1000,800x600]
//
// Without --all it sweeps the slice 7 list (SCOPE below) and exits 1 if any of them breaks
// the rule. With --all it sweeps every registered scene and reports, but still fails only
// on SCOPE. --shots writes one webp per scene and size: <dir>/<scene>_<WxH>_<tag>.webp.
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE picks the browser. The game row should be on a test
// scenario (tools/playtest/swap-scenario-game.rb test_seating test_seating).
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, unlinkSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : dflt; };
const flag = (name) => argv.includes(`--${name}`);
const PORT = opt('port', '3340');
const GID = opt('game', '2401');
const JSON_OUT = opt('json', null);
const SHOTS = opt('shots', null);
const TAG = opt('tag', 'shot');
const SIZES = opt('sizes', '1400x1000').split(',').map(s => s.split('x').map(Number));

// Slice 7 scope, worst first (UNLOCK_GAPS_BUILD_LOG.md minigame sweep). The framework shell
// is checked in every scene, so it is not a scene of its own.
export const SCOPE = [
    'drug-library-integrity', 'pin', 'scada-historian', 'biometrics', 'fingerprint-reader',
    'ble-scanner', 'bluetooth-scanner', 'siem-dashboard', 'text-file', 'forensic-data-platform',
    'ncsc-brief', 'network-architecture', 'infusion-pump', 'notes'
];

// Params that make each scene draw its full UI without a scenario object behind it.
const DEVICES = [
    { name: 'Office Printer', mac: 'AA:BB:CC:00:11:22', rssi: -48, type: 'printer' },
    { name: 'Smart Lock', mac: 'AA:BB:CC:00:11:33', rssi: -71, type: 'lock' }
];
const PARAMS = {
    'pin': { title: 'Keypad', correctPin: '1234', pinLength: 4, maxAttempts: 3 },
    'biometrics': { title: 'Fingerprint kit' },
    'fingerprint-reader': { title: 'Fingerprint reader', requires: 'someone', lockable: { name: 'Door' } },
    'ble-scanner': { title: 'BLE scanner', devices: DEVICES },
    'bluetooth-scanner': { title: 'Bluetooth scanner', devices: DEVICES },
    'text-file': {
        title: 'notes.txt', fileName: 'notes.txt',
        fileContent: 'Line one of the file.\nLine two of the file.\n\nA last line.',
        content: 'Line one of the file.\nLine two of the file.\n\nA last line.'
    },
    'notes': { title: 'Note', noteContent: 'A short note to read.', observationText: 'Seen on the desk.' },
    'network-architecture': {
        title: 'Network architecture',
        zones: [{ id: 'corp', label: 'Corporate', x: 20, y: 20, w: 300, h: 200 }],
        nodes: [{ id: 'fw', label: 'Firewall', zone: 'corp', x: 100, y: 100 }, { id: 'srv', label: 'Server', zone: 'corp', x: 220, y: 120 }],
        lines: [{ from: 'fw', to: 'srv' }]
    }
};

// --params file.json: { scene: params } taken from a real scenario object (its minigameData),
// for scenes that draw little without one (forensic data platform, network architecture).
if (opt('params', null)) Object.assign(PARAMS, JSON.parse(readFileSync(opt('params'), 'utf8')));

const ALLOWED_FONTS = ['gnf', 'press start 2p', 'vt323'];

// A gradient is pixel art only when every change of colour is a hard stop (CRT scanlines,
// dashed legend lines). Same test as test/js/minigame-pixel-art.test.mjs.
function hardGradient(fn) {
    const splitTop = (v) => {
        const out = []; let depth = 0, cur = '';
        for (const ch of v) {
            if (ch === '(') depth++;
            if (ch === ')') depth--;
            if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    };
    const COLOR_RE = /(rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}\b|\btransparent\b|\b[a-z]+\b)/i;
    let args = splitTop(fn.slice(fn.indexOf('(') + 1, fn.lastIndexOf(')')));
    if (/^(to\s|-?\d*\.?\d+(deg|turn|rad)|circle|ellipse|closest|farthest|at\s)/i.test(args[0])) args = args.slice(1);
    const stops = args.map(a => {
        const color = (a.match(COLOR_RE) || [''])[0];
        const pos = a.replace(color, '').trim().split(/\s+/).filter(Boolean);
        return { color: color.replace(/\s/g, '').toLowerCase(), first: pos[0], last: pos[pos.length - 1] };
    });
    for (let i = 1; i < stops.length; i++) {
        const a = stops[i - 1], b = stops[i];
        if (a.color === b.color) continue;
        if (!a.last || !b.first || parseFloat(a.last) !== parseFloat(b.first)) return false;
    }
    return true;
}

async function startScene(page, scene, params) {
    return page.evaluate(async ({ scene, params }) => {
        const mf = window.MinigameFramework;
        try { mf.forceCloseMinigame?.(); } catch { /* none open */ }
        document.querySelectorAll('.minigame-container').forEach(n => n.remove());
        const errors = [];
        const onErr = (e) => errors.push(String(e.message || e.reason || e));
        window.addEventListener('error', onErr);
        window.addEventListener('unhandledrejection', onErr);
        try { mf.startMinigame(scene, null, params); } catch (e) { errors.push(String(e.message || e)); }
        await new Promise(r => setTimeout(r, 1200));
        window.removeEventListener('error', onErr);
        window.removeEventListener('unhandledrejection', onErr);
        return { errors, open: !!document.querySelector('.minigame-container') };
    }, { scene, params });
}

async function checkScene(page) {
    return page.evaluate(({ ALLOWED, hardSrc }) => {
        // eslint-disable-next-line no-new-func
        const hardGradient = new Function(`return (${hardSrc})`)();
        const root = document.querySelector('.minigame-container');
        if (!root) return { elements: 0, breaches: [] };
        const breaches = [];
        const px = (v) => parseFloat(v) || 0;
        const path = (el) => {
            const parts = [];
            for (let n = el; n && n !== document.body && parts.length < 4; n = n.parentElement) {
                let s = n.tagName.toLowerCase();
                if (n.id) s += `#${n.id}`;
                const cls = [...n.classList].slice(0, 2).join('.');
                if (cls) s += `.${cls}`;
                parts.unshift(s);
            }
            return parts.join(' > ');
        };
        // Blur radius of each shadow in a box-shadow / text-shadow list
        const shadowBlurs = (v) => {
            if (!v || v === 'none') return [];
            return v.split(/,(?![^(]*\))/).map(sh => {
                const lens = sh.replace(/rgba?\([^)]*\)|#[0-9a-f]+|inset/gi, '').trim().split(/\s+/).map(px);
                return lens[2] || 0;
            });
        };
        const textual = (el) => {
            if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName)) return true;
            for (const c of el.childNodes) if (c.nodeType === 3 && c.textContent.trim()) return true;
            return false;
        };
        const check = (el, cs, pseudo) => {
            const where = path(el) + (pseudo || '');
            const diegetic = !!el.closest('[data-diegetic]');
            if (!diegetic) {
                for (const side of ['top', 'right', 'bottom', 'left']) {
                    const st = cs[`border-${side}-style`] || cs.getPropertyValue(`border-${side}-style`);
                    const w = px(cs.getPropertyValue(`border-${side}-width`));
                    if (st !== 'none' && st !== 'hidden' && w > 0 && w < 2) { breaches.push({ kind: 'hairline', where, detail: `${side} ${w}px ${st}` }); break; }
                }
                const r = ['top-left', 'top-right', 'bottom-right', 'bottom-left']
                    .map(c => cs.getPropertyValue(`border-${c}-radius`)).filter(v => px(v) > 0);
                if (r.length && (cs.clipPath === 'none' || !cs.clipPath)) breaches.push({ kind: 'radius', where, detail: r[0] });
                const bs = shadowBlurs(cs.boxShadow).filter(b => b > 0);
                if (bs.length) breaches.push({ kind: 'shadow', where, detail: `box ${cs.boxShadow.slice(0, 60)}` });
                const ts = shadowBlurs(cs.textShadow).filter(b => b > 0);
                if (ts.length) breaches.push({ kind: 'shadow', where, detail: `text ${cs.textShadow.slice(0, 60)}` });
                if (/blur\(|drop-shadow\([^)]*\s[1-9]/.test(cs.filter || '')) breaches.push({ kind: 'shadow', where, detail: `filter ${cs.filter}` });
                const grads = ((cs.backgroundImage || '') + ' ' + (cs.borderImageSource || ''))
                    .match(/(repeating-)?(linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/gi) || [];
                const soft = grads.filter(g => !hardGradient(g));
                if (soft.length) breaches.push({ kind: 'gradient', where, detail: soft[0].slice(0, 60) });
            }
            const isText = pseudo ? (cs.content && cs.content !== 'none' && cs.content !== '""' && cs.content !== 'normal') : textual(el);
            if (isText) {
                const first = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim().toLowerCase();
                if (!ALLOWED.includes(first)) breaches.push({ kind: 'font', where, detail: cs.fontFamily.slice(0, 50) });
            }
        };
        let elements = 0;
        for (const el of [root, ...root.querySelectorAll('*')]) {
            if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg' && !(el instanceof HTMLElement)) {
                // SVG shapes: only text needs a pixel font
                if (el.tagName.toLowerCase() === 'text') {
                    const cs = getComputedStyle(el);
                    const first = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim().toLowerCase();
                    if (!ALLOWED.includes(first)) breaches.push({ kind: 'font', where: path(el), detail: cs.fontFamily.slice(0, 50) });
                }
                continue;
            }
            const cs = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            if (cs.display === 'none' || cs.visibility === 'hidden' || rect.width === 0 || rect.height === 0) continue;
            elements++;
            check(el, cs, '');
            for (const p of ['::before', '::after']) {
                const pcs = getComputedStyle(el, p);
                if (!pcs.content || pcs.content === 'none' || pcs.content === 'normal') continue;
                if (pcs.display === 'none') continue;
                check(el, pcs, p);
            }
        }
        return { elements, breaches };
    }, { ALLOWED: ALLOWED_FONTS, hardSrc: hardGradient.toString() });
}

async function main() {
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, headless: true });
    const page = await browser.newPage({ viewport: { width: SIZES[0][0], height: SIZES[0][1] } });
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* blocked */ } });
    await page.goto(`http://127.0.0.1:${PORT}/break_escape/games/${GID}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 240000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    // setFPS(20), fixed steps ON (never fixedStep=false, which tunnels wall boxes).
    await page.evaluate(() => {
        try {
            const g = window.game?.sys?.game;
            if (g) { g.loop.smoothStep = false; g.loop.minFps = 1; }
            window.game?.physics?.world?.setFPS?.(20);
        } catch { /* ignore */ }
    });
    await page.waitForTimeout(2000);
    // Close the mission brief or any popup the game opened at boot
    await page.evaluate(() => { try { window.MinigameFramework.forceCloseMinigame?.(); } catch { /* none */ } });

    const registered = await page.evaluate(() => Object.keys(window.MinigameFramework.registeredScenes || {}));
    let scenes = opt('scenes', null)?.split(',') || (flag('all') ? registered : SCOPE);
    scenes = scenes.filter(s => registered.includes(s) || (console.log(`not registered: ${s}`), false));

    const report = {};
    if (SHOTS) mkdirSync(SHOTS, { recursive: true });
    for (const scene of scenes) {
        const params = PARAMS[scene] || { title: scene };
        let res = null;
        for (const [w, h] of SIZES) {
            await page.setViewportSize({ width: w, height: h });
            const st = await startScene(page, scene, params);
            if (!res) {
                const chk = await checkScene(page);
                res = { ...st, ...chk };
            }
            if (SHOTS) {
                const png = join(SHOTS, `${scene}_${w}x${h}_${TAG}.png`);
                await page.screenshot({ path: png, type: 'png' });
                // webp via ImageMagick (lossless, so the pixels stay sharp)
                execFileSync('convert', [png, '-define', 'webp:lossless=true', png.replace(/\.png$/, '.webp')]);
                unlinkSync(png);
            }
        }
        const byKind = {};
        for (const b of res.breaches) byKind[b.kind] = (byKind[b.kind] || 0) + 1;
        report[scene] = { inScope: SCOPE.includes(scene), open: res.open, errors: res.errors, elements: res.elements, byKind, breaches: res.breaches };
        const sum = Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(', ') || 'clean';
        console.log(`${SCOPE.includes(scene) ? '*' : ' '} ${scene.padEnd(28)} ${String(res.elements).padStart(4)} el  ${sum}${res.errors.length ? `  ERR ${res.errors[0].slice(0, 80)}` : ''}${res.open ? '' : '  (did not open)'}`);
    }
    await page.evaluate(() => { try { window.MinigameFramework.forceCloseMinigame?.(); } catch { /* none */ } });
    await browser.close();
    if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));
    const failing = Object.entries(report).filter(([, r]) => r.inScope && r.breaches.length);
    console.log(failing.length ? `FAIL: ${failing.length} in-scope scene(s) break the pixel-art rule` : 'PASS: every in-scope scene meets the pixel-art rule');
    process.exit(failing.length ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
