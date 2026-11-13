// Shell X check (UI shell review m2, m8): the behaviour the source-text tests could not see.
// For each minigame scene and size it opens the scene, scrolls the shell (and the notes page)
// to the end both ways, and asserts that
//   - the close X's box is wholly inside the viewport (M1, M2),
//   - the X does not sit on the shell's own scrollbar or on the scrollbar of the box under it
//     (M3: the notes page),
// and, for the PIN pad, that showing a wrapped wrong-code message does not move the keys (m2).
//
//   node tools/playtest/shell-x-check.mjs --port 3450 --game 3084 [--scenes a,b] [--sizes 915x412,800x600,390x844]
//
// Exits 1 on any failure, 2 on a setup error. Scenes that do not open with a title-only start are
// reported as "not open" and do not fail the run (the audit's --strict is the gate for those).
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE picks the browser. Runs in a merge batch on a keyless server:
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE=... node tools/playtest/shell-x-check.mjs --port 3001 --game <id>
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const PORT = opt('port', '3001');
const GID = opt('game', null);
const SIZES = opt('sizes', '915x412,800x600,390x844').split(',').map(s => s.split('x').map(Number));
const IS_MAIN = import.meta.url === pathToFileURL(process.argv[1] || '').href;

const LONG = Array.from({ length: 14 }, (_, i) => `${i + 1}. Rules of engagement: stay inside the agreed scope, log every action with a time, and stop and report if you find personal data you were not cleared to see.`).join('\n');
export const PARAMS = {
    pin: { title: 'Keypad', correctPin: '1234', pinLength: 4, maxAttempts: 3 },
    notes: { title: 'Rules of engagement', noteContent: LONG, observationText: 'Pinned by the door.' },
    'text-file': { title: 'notes.txt', fileName: 'notes.txt', fileContent: 'Line one.\nLine two.', content: 'Line one.\nLine two.' },
    combination: { title: 'Padlock', combination: [7, 21, 39], dials: 3 },
    cryptex: { title: 'Cryptex', password: 'CIPHER', wheels: 6 }
};

// Pure check, run in the page: where is the X, and is it clear of the scrollbars?
export function xReport() {
    const mg = document.querySelector('.minigame-container');
    const x = mg && mg.querySelector('.minigame-close-button');
    if (!mg) return { open: false };
    if (!x || getComputedStyle(x).display === 'none') return { open: true, noX: true };
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const scrollAll = () => {
        // shell to the far corner, and every scroll box under the X to its end
        mg.scrollTop = mg.scrollHeight; mg.scrollLeft = mg.scrollWidth;
        for (const el of mg.querySelectorAll('*')) {
            const cs = getComputedStyle(el);
            if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
        }
    };
    const measure = (label) => {
        const b = x.getBoundingClientRect();
        const issues = [];
        if (b.left < 0 || b.top < 0 || b.right > vw + 0.5 || b.bottom > vh + 0.5) issues.push(`X outside the viewport (${Math.round(b.left)},${Math.round(b.top)}-${Math.round(b.right)},${Math.round(b.bottom)} in ${vw}x${vh})`);
        const barW = Math.max(0, mg.offsetWidth - mg.clientWidth);
        if (barW && b.right > vw - barW + 0.5) issues.push(`X over the shell scrollbar (right ${Math.round(b.right)}, bar from ${vw - barW})`);
        // any scroll box under the X whose own scrollbar the X covers
        for (const el of mg.querySelectorAll('*')) {
            if (el === x || el.contains(x)) continue;
            const cs = getComputedStyle(el);
            if (!/(auto|scroll)/.test(cs.overflowY) || !(el.offsetWidth - el.clientWidth - parseFloat(cs.borderLeftWidth || 0) - parseFloat(cs.borderRightWidth || 0) > 0)) continue;
            const eb = el.getBoundingClientRect();
            const bw = el.offsetWidth - el.clientWidth - (parseFloat(cs.borderLeftWidth) || 0) - (parseFloat(cs.borderRightWidth) || 0);
            const bar = { l: eb.right - (parseFloat(cs.borderRightWidth) || 0) - bw, r: eb.right - (parseFloat(cs.borderRightWidth) || 0), t: eb.top, b: eb.bottom };
            if (b.left < bar.r && b.right > bar.l && b.top < bar.b && b.bottom > bar.t) issues.push(`X over the scrollbar of ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
        }
        return { label, issues, scrollsX: mg.scrollWidth > mg.clientWidth, scrollsY: mg.scrollHeight > mg.clientHeight };
    };
    const top = measure('top');
    scrollAll();
    return new Promise(res => setTimeout(() => {
        const end = measure('scrolled to the end');
        res({ open: true, results: [top, end] });
    }, 250));
}

async function main() {
    if (!GID) { console.error('--game is required'); process.exit(2); }
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
    const page = await browser.newPage({ viewport: { width: SIZES[0][0], height: SIZES[0][1] } });
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* blocked */ } });
    await page.goto(`http://127.0.0.1:${PORT}/break_escape/games/${GID}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 240000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await page.evaluate(() => { try { window.game?.physics?.world?.setFPS?.(20); } catch { /* none */ } });
    // --legacy puts the X back to absolute inside the shell: the check must then fail (proof it bites)
    if (argv.includes('--legacy')) await page.addStyleTag({ content: '.minigame-container > .minigame-close-button { position: absolute !important; } .notes-minigame-content-area { top: 0 !important; height: 90% !important; }' });
    await page.waitForTimeout(2000);
    const registered = await page.evaluate(() => Object.keys(window.MinigameFramework.registeredScenes || {}));
    const scenes = opt('scenes', null)?.split(',') || registered;
    const skipped = new Set((opt('skip', 'person-chat,network-view,phone-chat') || '').split(','));
    let fails = 0, checked = 0;
    const openScene = async (s) => {
        await page.evaluate(async ({ s, p }) => {
            try { window.MinigameFramework.forceCloseMinigame?.(); } catch { /* none */ }
            document.querySelectorAll('.minigame-container').forEach(n => n.remove());
            await new Promise(r => setTimeout(r, 250));
            try { await window.MinigameFramework.startMinigame(s, null, p); } catch (e) { window.__openError = String(e.message || e); }
            await new Promise(r => setTimeout(r, 1200));
        }, { s, p: PARAMS[s] || { title: s } });
    };
    for (const s of scenes) {
        if (skipped.has(s)) continue;
        for (const [w, h] of SIZES) {
            await page.setViewportSize({ width: w, height: h });
            await openScene(s);
            const r = await page.evaluate(xReport);
            const tag = `${s} ${w}x${h}`;
            if (!r.open) { console.log(`${tag.padEnd(40)} (not open)`); continue; }
            if (r.noX) { console.log(`${tag.padEnd(40)} no X (disableClose scene)`); continue; }
            checked++;
            const issues = r.results.flatMap(x => x.issues.map(i => `${x.label}: ${i}`));
            if (issues.length) { fails++; console.log(`${tag.padEnd(40)} FAIL ${issues.join('; ')}`); }
            else console.log(`${tag.padEnd(40)} ok${r.results[1].scrollsX || r.results[1].scrollsY ? ` (shell scrolls ${r.results[1].scrollsX ? 'x' : ''}${r.results[1].scrollsY ? 'y' : ''})` : ''}`);
        }
        try { await page.evaluate(() => window.MinigameFramework.forceCloseMinigame?.()); } catch { /* ignore */ }
    }
    // PIN pad: a wrapped wrong-code message must not move the keys (m2)
    if (scenes.includes('pin')) {
        for (const [w, h] of SIZES) {
            await page.setViewportSize({ width: w, height: h });
            await openScene('pin');
            const m = await page.evaluate(async () => {
                const mg = window.MinigameFramework.currentMinigame;
                const pad = document.querySelector('.pin-minigame-keypad');
                if (!mg || !pad) return null;
                const before = pad.getBoundingClientRect().top;
                mg.showPinMessage('Incorrect PIN. 2 attempts remaining.', 'wrong');
                await new Promise(r => setTimeout(r, 200));
                const long = pad.getBoundingClientRect().top;
                mg.showPinMessage('Locked out. Your guesses are kept.', 'wrong');
                await new Promise(r => setTimeout(r, 200));
                const longer = pad.getBoundingClientRect().top;
                return { before, long, longer };
            });
            checked++;
            const tag = `pin message ${w}x${h}`;
            if (!m) { console.log(`${tag.padEnd(40)} (not open)`); continue; }
            if (Math.abs(m.before - m.long) > 0.5 || Math.abs(m.before - m.longer) > 0.5) { fails++; console.log(`${tag.padEnd(40)} FAIL keys moved ${m.before} -> ${m.long} -> ${m.longer}`); }
            else console.log(`${tag.padEnd(40)} ok keys stay at ${Math.round(m.before)}`);
        }
    }
    await browser.close();
    console.log(`SHELL-X-CHECK ${checked} checked, ${fails} failed`);
    if (fails) process.exit(1);
}

if (IS_MAIN) main().catch(e => { console.error(e); process.exit(2); });
