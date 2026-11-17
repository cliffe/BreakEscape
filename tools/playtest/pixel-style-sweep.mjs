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
//   size       pixel-font text at a fractional size, VT323 under 16px (its legible minimum),
//              or Press Start 2P off its 8px grid (8, 16, 24 and so on)
//   faux-bold  a pixel face at weight 600 or more: each ships one weight, so the browser
//              smears a synthetic bold (canvas text: a bold fontStyle)
//   cancel     a Cancel button beside the X (the X closes a minigame; only the password
//              screen keeps its own, owned by slice 2a)
//   canvas     a Phaser canvas scene drawn smoothed, or canvas text in a non-pixel font, at a
//              fractional size, VT323 under 16px or Press Start 2P off its grid
// Every check runs at every --sizes entry (media rules change sizes); each breach lists the
// sizes it was seen at.
// Once per run it also checks that VT323 really loaded from the self-hosted file (a font
// name in the computed style says nothing about the face that was drawn): fontsLoaded.
// Diegetic pages (an email body, a web page inside a browser) may mark their root with
// data-diegetic; inside one only the font check applies.
//
//   node tools/playtest/pixel-style-sweep.mjs [--port 3340] [--game 2401] [--scenes a,b]
//        [--all] [--offline] [--params scene-params.json] [--json out.json] [--shots dir --tag before] [--sizes 1400x1000,800x600]
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
// --names unlock: shots of scenes on the UX review page also get the page's id in the name.
// These are the card ids from the review page (review-page/cards.json), not its image file
// names, which run one ahead of the card ids on every unlock card (card unlock-43, container
// 915x412, shows branch-after-unlock-44-container-915x412-after.webp).
const REVIEW_IDS = {
    'notes 915x412': 'unlock-42', 'container 915x412': 'unlock-43', 'password 915x412': 'unlock-44',
    'combination 915x412': 'unlock-45', 'cryptex 915x412': 'unlock-46', 'pin 915x412': 'unlock-47',
    'text-file 915x412': 'unlock-48', 'siem-dashboard 915x412': 'unlock-49', 'backup-recovery 915x412': 'unlock-50',
    'notes 800x600': 'unlock-51', 'container 800x600': 'unlock-52', 'password 800x600': 'unlock-53',
    'combination 800x600': 'unlock-54', 'cryptex 800x600': 'unlock-55', 'pin 800x600': 'unlock-56',
    'text-file 800x600': 'unlock-57', 'siem-dashboard 800x600': 'unlock-58', 'backup-recovery 800x600': 'unlock-59'
};
// Scenes with one card for every size (the page shows them at 1400x1000)
const REVIEW_SCENE_IDS = {
    'bluetooth-scanner': 'unlock-13', 'esd-pushbutton': 'unlock-28', 'infusion-pump': 'unlock-29',
    'alarm-panel': 'unlock-32', 'cryptex': 'unlock-39', 'combination': 'unlock-40', 'examine': 'unlock-41',
    'network-architecture': 'unlock-31', 'forensic-data-platform': 'unlock-33'
};

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
    'infusion-pump': { title: 'Infusion pump' },
    'container': (() => {
        const contents = [
            { type: 'notes', name: 'Memo', text: 'Back by five.', takeable: true },
            { type: 'key', name: 'Office key', takeable: true },
            { type: 'phone', name: 'Old phone', takeable: true }
        ];
        return { title: 'Filing cabinet', contents, isTakeable: false, desktopMode: false,
            containerItem: { objectId: 'sweep_cabinet', name: 'sweep_cabinet', scenarioData: { id: 'sweep_cabinet', name: 'Filing cabinet', type: 'filing_cabinet', contents } } };
    })(),
    'ncsc-brief': { title: 'NCSC Attribution Brief' },
    'combination': { title: 'Padlock', requiredCombination: '1234' },
    'cryptex': { title: 'Cryptex', requiredWord: 'CODE' },
    'password': { title: 'Workstation', correctPassword: 'secret', showHint: true, hintText: 'A hint', showKeyboard: false },
    'network-architecture': {
        title: 'Network architecture',
        zones: [{ id: 'corp', label: 'Corporate', x: 20, y: 20, w: 300, h: 200 }],
        nodes: [{ id: 'fw', label: 'Firewall', zone: 'corp', x: 100, y: 100 }, { id: 'srv', label: 'Server', zone: 'corp', x: 220, y: 120 }],
        lines: [{ from: 'fw', to: 'srv' }]
    }
};

// Scenes that draw only a gate or an empty list until the game holds something: seed the
// working state before the start (pre) or drive the scene into it after (post), so the sweep
// and the shots cover the screen players use (review R1 M2).
const BLE = [['Smart Lock', 'AA:BB:CC:00:11:33', ['180f', 'fff0'], true], ['Office Printer', 'AA:BB:CC:00:11:22', ['1800'], false]];
const SETUP = {
    'infusion-pump': { pre: () => { window.gameState.globalVariables.paper_charts_collected = true; } },
    'ncsc-brief': {
        pre: (p) => { window.gameState.globalVariables[p?.lockable?.scenarioData?.gateVar || 'warranty_checklist_complete'] = true; },
        post: () => { document.querySelector('#ncsc-open-btn')?.click(); return !!document.querySelector('.ncsc-content, .ncsc-brief-content, .ncsc-section'); }
    },
    'ble-scanner': {
        post: (devs) => {
            const m = window.MinigameFramework.currentMinigame;
            for (const [n, mac, u, near] of devs) m.addBleDevice(n, mac, u, near, null);
            m.updatePanel?.(); m.updateBlePanel?.(); m.renderDevices?.();
            return m.bleDevices.length;
        },
        arg: BLE
    },
    'bluetooth-scanner': {
        post: () => {
            const m = window.MinigameFramework.currentMinigame;
            m.addBluetoothDevice('Phone', 'AA:BB:CC:00:11:44', 'Smartphone', true);
            m.addBluetoothDevice('Headset', 'AA:BB:CC:00:11:55', 'Audio', false);
            m.updateBluetoothPanel?.();
            // the device list is in the expanded panel
            document.querySelector('.bluetooth-scanner-expand-toggle')?.click();
            return m.bluetoothDevices.length;
        }
    },
    'biometrics': {
        // the sample cards are in the expanded panel
        post: () => { const t = document.querySelector('.biometrics-expand-toggle, [class*="expand-toggle"]'); t?.click(); return !!t; },
        pre: () => { window.gameState.biometricSamples = [{ owner: 'Alice Chen', quality: 0.92, sourceName: 'Coffee mug' }, { owner: 'Bob Okafor', quality: 0.55, sourceName: 'Door handle' }]; }
    },
    'fingerprint-reader': { pre: () => { window.gameState.biometricSamples = [{ owner: 'Alice Chen', quality: 0.92, sourceName: 'Coffee mug' }, { owner: 'Bob Okafor', quality: 0.55, sourceName: 'Door handle' }]; } }
};
// password (slice 2a) and the notes reader (Continue) keep their bottom button
const KEEPS_CANCEL = ['password', 'notes'];

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
    const setup = SETUP[scene] || {};
    if (setup.pre) await page.evaluate(setup.pre, params);
    const res = await page.evaluate(async ({ scene, params }) => {
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
    if (setup.post) {
        try { res.setup = await page.evaluate(setup.post, setup.arg); } catch (e) { res.errors.push(`setup: ${e.message}`); }
        await page.waitForTimeout(800);
    }
    return res;
}

// VT323 must be the self-hosted face, loaded: the computed font-family only names it.
async function checkFonts(page) {
    return page.evaluate(async () => {
        try { await document.fonts.load('16px VT323'); } catch { /* reported below */ }
        await document.fonts.ready;
        const faces = [...document.fonts].filter(f => f.family.replace(/["']/g, '') === 'VT323');
        // Glyph widths: VT323 is much narrower than the fallback monospace
        const c = document.createElement('canvas').getContext('2d');
        c.font = '32px VT323, monospace'; const vt = c.measureText('MMMMWWWW0000').width;
        c.font = '32px monospace'; const mono = c.measureText('MMMMWWWW0000').width;
        const remote = performance.getEntriesByType('resource').map(e => e.name).filter(n => /fonts\.(googleapis|gstatic)\.com/.test(n));
        return {
            loaded: faces.some(f => f.status === 'loaded') && document.fonts.check('16px VT323'),
            faces: faces.map(f => f.status),
            glyphWidth: { vt323: Math.round(vt), monospace: Math.round(mono) },
            remote
        };
    });
}

// Phaser canvas scenes: the DOM sweep cannot see inside the canvas, so read the game config
// and the scene's Text objects instead.
async function checkCanvas(page) {
    return page.evaluate((ALLOWED) => {
        const m = window.MinigameFramework.currentMinigame;
        const pg = m?.phaserGame || m?.game || null;
        if (!pg || !pg.config) return null;
        const breaches = [];
        const cfg = pg.config;
        if (!cfg.pixelArt && cfg.antialias !== false) breaches.push({ kind: 'canvas', where: 'phaser config', detail: 'smoothed (no pixelArt / antialias false)' });
        if (!cfg.roundPixels && !cfg.pixelArt) breaches.push({ kind: 'canvas', where: 'phaser config', detail: 'roundPixels off' });
        let texts = 0;
        for (const sc of pg.scene.getScenes(true)) {
            const walk = (list) => {
                for (const o of list) {
                    if (o.list) walk(o.list);
                    if (o.type !== 'Text' || !o.visible) continue;
                    texts++;
                    const fam = (o.style.fontFamily || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
                    const size = parseFloat(o.style.fontSize);
                    const where = `text "${String(o.text).slice(0, 24)}"`;
                    if (!ALLOWED.includes(fam)) breaches.push({ kind: 'canvas', where, detail: `font ${o.style.fontFamily}` });
                    else if (!Number.isInteger(size) || (fam === 'vt323' && size < 16) || (fam === 'press start 2p' && size % 8 !== 0)) breaches.push({ kind: 'canvas', where, detail: `${fam} ${o.style.fontSize}` });
                    // Phaser takes bold from fontStyle (a fontWeight key is ignored); a canvas has
                    // no font-synthesis switch, so a bold pixel face is always smeared
                    if (/bold|[6-9]00/.test(o.style.fontStyle || '')) breaches.push({ kind: 'faux-bold', where, detail: `${fam} fontStyle ${o.style.fontStyle}` });
                }
            };
            walk(sc.children.list);
        }
        return { texts, breaches };
    }, ALLOWED_FONTS);
}

async function checkScene(page, scene) {
    const KEEP = KEEPS_CANCEL.includes(scene);
    return page.evaluate(({ ALLOWED, hardSrc, KEEP }) => {
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
                // drop-shadow(colour x y blur): strip the colour first, then take the third length
                // (review R1 m1: the old test read the colour's digits)
                const filter = cs.filter || '';
                const drops = filter.match(/drop-shadow\((?:[^()]|\([^()]*\))*\)/g) || [];
                const blurredDrop = drops.some(d => shadowBlurs(d.slice(12, -1)).some(b => b > 0));
                if (/blur\(/.test(filter) || blurredDrop) breaches.push({ kind: 'shadow', where, detail: `filter ${filter}` });
                const grads = ((cs.backgroundImage || '') + ' ' + (cs.borderImageSource || ''))
                    .match(/(repeating-)?(linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/gi) || [];
                const soft = grads.filter(g => !hardGradient(g));
                if (soft.length) breaches.push({ kind: 'gradient', where, detail: soft[0].slice(0, 60) });
            }
            const isText = pseudo ? (cs.content && cs.content !== 'none' && cs.content !== '""' && cs.content !== 'normal') : textual(el);
            if (isText) {
                const first = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim().toLowerCase();
                if (!ALLOWED.includes(first)) breaches.push({ kind: 'font', where, detail: cs.fontFamily.slice(0, 50) });
                else {
                    const size = parseFloat(cs.fontSize);
                    if (!Number.isInteger(size)) breaches.push({ kind: 'size', where, detail: `${first} ${cs.fontSize}` });
                    else if (first === 'vt323' && size < 16) breaches.push({ kind: 'size', where, detail: `vt323 ${cs.fontSize}` });
                    // Press Start 2P draws one font pixel per eighth of its size: off the 8px
                    // grid a font pixel smears over two screen pixels (slice 7 R5 M2)
                    else if (first === 'press start 2p' && size % 8 !== 0) breaches.push({ kind: 'size', where, detail: `press start 2p ${cs.fontSize} (grid is 8px)` });
                    // Each pixel face ships one weight: 600 or more is a synthetic bold (R5 M1)
                    if (+cs.fontWeight >= 600) breaches.push({ kind: 'faux-bold', where, detail: `${first} weight ${cs.fontWeight}${cs.fontSynthesisWeight === 'none' ? ' (synthesis off)' : ''}` });
                }
            }
        };
        let elements = 0;
        const cancel = root.querySelector('#minigame-cancel');
        if (cancel && cancel.getBoundingClientRect().width > 0 && !KEEP) breaches.push({ kind: 'cancel', where: path(cancel), detail: cancel.textContent.trim() });
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
    }, { ALLOWED: ALLOWED_FONTS, hardSrc: hardGradient.toString(), KEEP });
}

async function main() {
    // Scrollbars shown, as a desktop player sees them (the headless shell hides them by default)
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
    const page = await browser.newPage({ viewport: { width: SIZES[0][0], height: SIZES[0][1] } });
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* blocked */ } });
    // --offline: block the Google font hosts, to prove nothing depends on them
    if (flag('offline')) await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
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
    const fonts = await checkFonts(page);
    console.log(`VT323 ${fonts.loaded ? 'loaded' : 'NOT LOADED'} (faces ${fonts.faces.join(',') || 'none'}; 12 glyphs ${fonts.glyphWidth.vt323}px vs monospace ${fonts.glyphWidth.monospace}px)${fonts.remote.length ? `; remote font requests: ${fonts.remote.length}` : ''}`);
    if (SHOTS) mkdirSync(SHOTS, { recursive: true });
    for (const scene of scenes) {
        const params = PARAMS[scene] || { title: scene };
        let res = null;
        for (const [w, h] of SIZES) {
            await page.setViewportSize({ width: w, height: h });
            const st = await startScene(page, scene, params);
            // Checked at every size: short-screen media rules change sizes and weights
            // (R5 M2: the notes title is 13px only under 560px high). A breach found at more
            // than one size is listed once, with the sizes it was seen at.
            const chk = await checkScene(page, scene);
            const cv = await checkCanvas(page);
            const found = [...chk.breaches, ...(cv?.breaches || [])];
            if (!res) res = { ...st, errors: [...(st.errors || [])], elements: chk.elements, canvasTexts: cv?.texts ?? null, breaches: [], seen: new Map() };
            else for (const e of st.errors || []) if (!res.errors.includes(e)) res.errors.push(e);
            if (!st.open) res.open = false;
            for (const b of found) {
                const key = `${b.kind}|${b.where}|${b.detail}`;
                const had = res.seen.get(key);
                if (had) had.sizes.push(`${w}x${h}`);
                else { const nb = { ...b, sizes: [`${w}x${h}`] }; res.seen.set(key, nb); res.breaches.push(nb); }
            }
            if (SHOTS) {
                const id = REVIEW_IDS[`${scene} ${w}x${h}`] || REVIEW_SCENE_IDS[scene];
                const png = join(SHOTS, `${id ? `${id}_` : ''}${scene}_${w}x${h}_${TAG}.png`);
                await page.screenshot({ path: png, type: 'png' });
                // webp via ImageMagick (lossless, so the pixels stay sharp)
                execFileSync('convert', [png, '-define', 'webp:lossless=true', png.replace(/\.png$/, '.webp')]);
                unlinkSync(png);
            }
        }
        const byKind = {};
        for (const b of res.breaches) byKind[b.kind] = (byKind[b.kind] || 0) + 1;
        report[scene] = { inScope: SCOPE.includes(scene), open: res.open, setup: res.setup ?? null, errors: res.errors, elements: res.elements, canvasTexts: res.canvasTexts, byKind, breaches: res.breaches };
        const sum = Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(', ') || 'clean';
        console.log(`${SCOPE.includes(scene) ? '*' : ' '} ${scene.padEnd(28)} ${String(res.elements).padStart(4)} el  ${sum}${res.errors.length ? `  ERR ${res.errors[0].slice(0, 80)}` : ''}${res.open ? '' : '  (did not open)'}`);
    }
    await page.evaluate(() => { try { window.MinigameFramework.forceCloseMinigame?.(); } catch { /* none */ } });
    await browser.close();
    if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ fonts, scenes: report }, null, 2));
    const failing = Object.entries(report).filter(([, r]) => r.inScope && r.breaches.length);
    if (!fonts.loaded) console.log('FAIL: VT323 did not load from the self-hosted file');
    console.log(failing.length ? `FAIL: ${failing.length} in-scope scene(s) break the pixel-art rule` : 'PASS: every in-scope scene meets the pixel-art rule');
    process.exit(failing.length || !fonts.loaded ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
