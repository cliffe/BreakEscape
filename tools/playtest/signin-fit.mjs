// signin-fit.mjs (credential keyring plan 5.2 "Fit check in a real browser"): loads the remote
// sign-in screen's K0 fixtures with the real CSS and pixel fonts in a headless browser at the
// four sizes and reports overflow/spare px per size. Exits non-zero on any overflow.
//
// jsdom has no layout (pc-monitor-frame.test.mjs stubs scrollHeight/clientHeight), so fit is only
// provable in a real browser. Rather than reinvent the module stubs, the fixtures are built inside
// a real game page served by the keyless server, so the real password-minigame.css, pc-monitor.css
// and the pixel fonts the app loads are already in force. A PasswordMinigame sign-in is constructed
// with fixture data (never by solving the mission) and measured.
//
//   PORT=3062 node tools/playtest/signin-fit.mjs [gameId]
//   (optional: CHROME=<executable> PLAYWRIGHT=<node_modules holding playwright> SHOTS=<dir>)
//
// A failure is .pc-monitor-area scrollHeight > clientHeight, or Password/Sign in outside the
// visible area. Spare = clientHeight - scrollHeight (>=0 is a pass). Targets recorded in the build
// log: >=35px spare at x2 (1400x1000), >=20px at 915x412.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Portable setup. Run from anywhere: the repo root is found from this file. Playwright is taken
// from $PLAYWRIGHT (a node_modules folder that holds it) or the repo's own, then this process's
// resolution; Chrome from $CHROME, else the newest headless shell or chromium in
// $PLAYWRIGHT_BROWSERS_PATH (default ~/.cache/ms-playwright), else playwright's own default.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
process.chdir(ROOT);
async function loadPlaywright() {
    for (const base of [process.env.PLAYWRIGHT, join(ROOT, 'node_modules')].filter(Boolean)) {
        try { return createRequire(join(base, '/'))('playwright'); } catch { /* try the next */ }
    }
    return (await import('playwright')).default || (await import('playwright'));
}
function findChrome() {
    if (process.env.CHROME) return process.env.CHROME;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), '.cache', 'ms-playwright');
    try {
        const dirs = readdirSync(base).filter(d => /^chromium/.test(d)).sort().reverse();
        for (const d of dirs) {
            for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) {
                const exe = join(base, d, rel);
                if (existsSync(exe)) return exe;
            }
        }
    } catch { /* none: use playwright's default */ }
    return undefined;
}
const { chromium } = await loadPlaywright();

const PORT = Number(process.env.PORT || 3062), BASE = `http://127.0.0.1:${PORT}`;
const CHROME = findChrome();
const SHOTS = process.env.SHOTS || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// The four fit sizes of plan 5.2 (x2, x1 landscape, short, portrait), plus the narrow-phone size
// the live proof names, so one run covers both specs.
const SIZES = [[1400, 1000], [800, 600], [915, 412], [390, 844], [320, 640]];

function newGame() {
    const out = execFileSync('bundle', ['exec', 'rails', 'runner', 'tools/playtest/new-game.rb', 'test_access_networks'], {
        env: { ...process.env, PLAYTEST_PORT: String(PORT), BREAK_ESCAPE_STANDALONE: 'true' }, encoding: 'utf8'
    });
    return Number(out.match(/GAME_ID=(\d+)/)[1]);
}

// Fixtures: the longest-host refusal form, the held-session Switch-user screen, the typed NLA
// screen, the headless line, and a tagged tile row (one tile with three tags). Each is a function
// body run in the page; it returns the measurement.
const FIXTURES = [
    { name: 'other-refusal-longest', desc: 'Other user form with the longest refusal line',
      build: { host: 'WS-BENCH-01', pcName: 'Bench PC (WS-BENCH-01)', picker: false, linkName: 'Drop box: Workshop bench',
               remote: { footholdId: 'bench', linkName: 'Drop box: Workshop bench' }, set: { picker: false, host: 'WS-BENCH-01', tiles: [], captured: [] },
               action: 'other', refusal: 'unreachable' } },
    { name: 'switch-held-refusal', desc: 'Switch user, held session, Other user chosen, one-line refusal',
      build: { host: 'HB-FIN-02', pcName: 'Lena Fox PC (HB-FIN-02)', picker: false, linkName: 'Drop box: Comms room',
               current: { username: 'lfox', displayName: 'Lena Fox', via: 'password' },
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' }, set: { picker: false, host: 'HB-FIN-02', tiles: [], captured: [] },
               action: 'other', refusal: 'not_permitted' } },
    { name: 'headless-line', desc: 'Switch user on a headless host, the headless line',
      build: { host: 'HB-DOOR-01', pcName: 'Door controller (HB-DOOR-01)', picker: false, linkName: 'Drop box: Comms room',
               current: { username: 'lfox', displayName: 'Lena Fox', via: 'password' },
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' }, set: { headless: true, host: 'HB-DOOR-01', tiles: [], captured: [{ targetId: 'iharper', username: 'iharper', label: 'Ian Harper', password: 'x' }] },
               action: 'other' } },
    { name: 'typed-nla', desc: 'A typed (NLA) screen with its line',
      build: { host: 'HB-OPS-02', pcName: 'Ops desk PC (HB-OPS-02)', picker: false, linkName: 'Drop box: Comms room',
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' }, set: { remoteScreen: 'typed', host: 'HB-OPS-02', tiles: [], captured: [{ targetId: 'lfox', username: 'lfox', label: 'Lena Fox', password: 'x' }] },
               action: 'other' } },
    { name: 'tagged-tiles', desc: 'A row of tagged tiles, one with three tags (short window shows the badge)',
      build: { host: 'HB-KIOSK-01', pcName: 'Reception kiosk (HB-KIOSK-01)', picker: 'known', linkName: 'Drop box: Comms room',
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' },
               set: { picker: 'known', host: 'HB-KIOSK-01',
                      tiles: [{ username: 'sokafor', displayName: 'Sam Okafor' }, { username: 'lfox', displayName: 'Lena Fox' }],
                      captured: [{ targetId: 'lfox', username: 'lfox', label: 'Lena Fox', password: 'x' }] },
               // The merge gives a capture the one kind `captured`; the three-tag tile is that merged
               // tile with two more kinds, drawn by the real tag renderer (K3a adds the kinds for real)
               extraKinds: { username: 'lfox', kinds: ['captured', 'saved', 'granted'] },
               action: 'tiles', expectTags: { username: 'lfox', shown: 2, plusText: '+2' } } },
    { name: 'seven-tiles', desc: 'Six PC accounts, one captured, plus Other user: the row scrolls or fits',
      build: { host: 'HB-FIN-02', pcName: 'Finance PC (HB-FIN-02)', picker: 'accounts', linkName: 'Drop box: Comms room',
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' },
               set: { picker: 'accounts', host: 'HB-FIN-02',
                      tiles: ['a', 'b', 'c', 'd', 'e', 'f'].map((u, i) => ({ username: u, displayName: `User ${i}` })),
                      captured: [{ targetId: 'a', username: 'a', label: 'User 0', password: 'x' }] },
               action: 'tiles', expectSevenTiles: true } },
    { name: 'checking', desc: 'The Checking... state before either fetch answers (no form, no focus)',
      build: { host: 'HB-FIN-02', pcName: 'Lena Fox PC (HB-FIN-02)', picker: false, linkName: 'Drop box: Comms room',
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' }, checking: true, action: 'none' } },
];

async function measure(page, fx) {
    return await page.evaluate(async (fx) => {
        const out = { ok: true, notes: [] };
        try {
            const mod = await import('/break_escape/js/minigames/password/password-minigame.js');
            const { PasswordMinigame } = mod;
            // A clean container; keep the game's own framework object but point currentMinigame at ours
            // Tear the last fixture down properly (document listeners and all), then clear its markup
            try { window.__probeMg?.cleanup?.(); } catch { /* already gone */ }
            window.__probeMg = null;
            document.querySelectorAll('#fit-host, .pc-monitor').forEach(e => e.remove());
            const host = document.createElement('div');
            host.id = 'fit-host';
            document.body.appendChild(host);
            window.MinigameFramework = window.MinigameFramework || { currentMinigame: null, endMinigame: () => {} };
            const b = fx.build;
            const mg = new PasswordMinigame(host, {
                title: 'Sign in',
                signIn: {
                    pcId: 'fit_pc', pcName: b.pcName, picker: b.picker, tiles: [],
                    current: b.current || null,
                    remote: b.remote, host: b.host, captured: [], capturedLoading: true
                }
            });
            window.__probeMg = mg;
            window.MinigameFramework.currentMinigame = mg;
            mg.init();
            mg.start?.();
            // The Checking... state is before either fetch answers: no setRemoteAccounts yet
            if (!b.checking) mg.setRemoteAccounts?.(b.set || {});
            if (b.extraKinds) {
                const t = mg.signInState.tiles.find(x => x.username === b.extraKinds.username);
                if (t) {
                    t.kinds = b.extraKinds.kinds;
                    const row = document.querySelector('#signin-tiles');
                    row.innerHTML = mg.signInTilesInnerHtml();
                    mg.bindSignInTiles();
                    mg.renderSignInForm({ quiet: true });
                }
            }
            // Drive to the fixture's end state
            if (fx.build.action === 'other') {
                const other = document.querySelector('#fit-host .signin-other, .pc-monitor .signin-other');
                if (other) other.click();
                else { mg.signInState.other = true; mg.renderSignInForm?.({}); }
            } else if (fx.build.action === 'chosen') {
                const tile = document.querySelector('.pc-monitor .signin-tile[data-tile-index="0"]');
                if (tile) tile.click();
            }
            // A one-line refusal built from the real shared strings (never guessed)
            if (b.refusal) {
                const opts = { remote: true, host: b.host };
                // Every refusal the screen can show; the fixture takes the longest of them
                const all = [
                    mod.signInErrorMessage({ status: 403 }, opts), mod.signInErrorMessage({ status: 404 }, opts),
                    mod.signInErrorMessage({ error: true }, opts),
                    mod.signInRefusalMessage({ reason: 'not_permitted' }, opts),
                    mod.signInRefusalMessage({ reason: 'locked_out' }, opts),
                    mod.signInRefusalMessage({ reason: 'remote_blocked' }, opts),
                    mod.signInRefusalMessage({ reason: 'wrong', message: 'Incorrect username or password', attemptsLeft: 2 }, opts),
                    mod.signInRefusalMessage({ reason: 'wrong', message: 'Incorrect username or password', attemptsLeft: 1 }, opts)
                ].filter(m => typeof m === 'string');
                const msg = all.reduce((a, m) => (m.length > a.length ? m : a), '');
                out.longestRefusal = msg;
                mg.setSignInMessage?.(msg, 'error');
            }
            await (document.fonts?.ready || Promise.resolve());
            mg.fitSignInTiles?.();   // the fonts are in: the same re-fit the real screen gets on a resize
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const area = document.querySelector('.pc-monitor .pc-monitor-area') || document.querySelector('.pc-monitor-area');
            if (!area) { out.ok = false; out.notes.push('no .pc-monitor-area'); return out; }
            const scrollH = area.scrollHeight, clientH = area.clientHeight;
            // scrollHeight clamps up to clientHeight, so measure true content height from the
            // first element child's bottom relative to the area top (what actually fills the box).
            // The true content height (not clamped): the sign-in screen element lays out content
            // size (no fixed height), so its rendered height is what fills the area.
            const screen = document.querySelector('.pc-monitor .signin-screen');
            const usedH = screen ? screen.offsetHeight : scrollH;
            out.scrollHeight = scrollH; out.clientHeight = clientH; out.usedHeight = usedH;
            out.spare = clientH - usedH;
            if (scrollH > clientH) { out.ok = false; out.notes.push(`overflow ${scrollH - clientH}px`); }
            {
                const root = document.querySelector('.pc-monitor');
                const lbl = document.querySelector('.pc-monitor .signin-field-row label');
                out.dbg = {
                    uiScale: root?.dataset?.uiScale, short: root?.dataset?.short,
                    remoteScreen: !!document.querySelector('.signin-remote-screen'),
                    labelDisplay: lbl ? getComputedStyle(lbl).display : 'none-el',
                    slab: (document.querySelector('.pc-monitor .signin-current-remote')?.textContent || document.querySelector('.pc-monitor .signin-current')?.textContent || '').slice(0, 50),
                    usedH,
                    kids: [...(document.querySelector('.pc-monitor .signin-screen')?.children || [])].map(c => `${c.className.split(' ')[0]||c.id}:${Math.round(c.getBoundingClientRect().height)}${c.style.display==='none'?'(h)':''}`),
                    formKids: [...(document.querySelector('.pc-monitor #signin-form')?.children || [])].map(c => `${c.className.split(' ')[0]||c.id}:${Math.round(c.getBoundingClientRect().height)}`)
                };
            }
            // Text checks (plan 5.2): no fixed-word line wider than its box, no message over two
            // lines (the merged slab over one at x2), and a host label never split over two lines
            const lines = (el) => {
                const r = document.createRange(); r.selectNodeContents(el);
                return new Set([...r.getClientRects()].filter(x => x.width > 0).map(x => Math.round(x.top / 2))).size;
            };
            const shown = (el) => !!el && el.offsetParent !== null && getComputedStyle(el).display !== 'none';
            const x2 = document.querySelector('.pc-monitor')?.dataset?.uiScale === '2';
            for (const [sel, limit] of [['.pc-monitor #signin-message', 2], ['.pc-monitor .signin-current-remote', x2 ? 1 : 2]]) {
                const el = document.querySelector(sel);
                if (!shown(el) || !el.textContent) continue;
                const n = lines(el);
                if (n > limit) { out.ok = false; out.notes.push(`${sel.replace('.pc-monitor ', '')} runs ${n} lines (limit ${limit})`); }
            }
            for (const sel of ['.pc-monitor .signin-current', '.pc-monitor .signin-remote', '.pc-monitor .signin-tile .signin-name',
                '.pc-monitor .signin-tile .signin-username', '.pc-monitor #signin-message']) {
                for (const el of document.querySelectorAll(sel)) {
                    if (shown(el) && el.scrollWidth > el.clientWidth + 1) { out.ok = false; out.notes.push(`${sel.replace('.pc-monitor ', '')} is wider than its box (${el.scrollWidth} > ${el.clientWidth})`); }
                }
            }
            for (const el of document.querySelectorAll('.pc-monitor .signin-nowrap')) {
                if (shown(el) && el.getClientRects().length > 1) { out.ok = false; out.notes.push(`host label "${el.textContent}" is split over lines`); }
            }
            if (fx.build.expectTags) {
                const tile = document.querySelector(`.pc-monitor .signin-tile[data-username="${fx.build.expectTags.username}"]`);
                const tags = tile ? [...tile.querySelectorAll('.signin-tag')].map(t => t.textContent) : [];
                out.tags = tags;
                if (tags.length !== fx.build.expectTags.shown || tags[tags.length - 1] !== fx.build.expectTags.plusText) {
                    out.ok = false; out.notes.push(`expected ${fx.build.expectTags.shown} tags ending "${fx.build.expectTags.plusText}", got ${JSON.stringify(tags)}`);
                }
                // Tag text should fit its pill unless the ellipsis is meant to cut it (noted, not a failure)
                const cut = [...(tile?.querySelectorAll('.signin-tag') || [])].filter(t => shown(t) && t.scrollWidth > t.clientWidth + 1).map(t => t.textContent);
                if (cut.length) out.notes.push(`info: tag cut by ellipsis ${JSON.stringify(cut)}`);
            }
            if (fx.build.expectSevenTiles) {
                const row = document.querySelector('.pc-monitor #signin-tiles');
                out.rowScroll = row ? { scrolls: row.classList.contains('signin-tiles-scroll'), more: !document.querySelector('.pc-monitor #signin-tiles-more')?.hidden } : null;
                // "Choose an account." must be inside the visible area, and a capped row shows the cue
                const prompt = document.querySelector('.pc-monitor #signin-prompt, .pc-monitor #signin-message');
                const ar = area.getBoundingClientRect();
                const pr = prompt?.getBoundingClientRect();
                if (!pr || pr.bottom > ar.bottom + 1) { out.ok = false; out.notes.push('the prompt line is outside the visible area'); }
                if (out.rowScroll?.scrolls && !out.rowScroll.more) { out.ok = false; out.notes.push('a scrolling row shows no More below cue'); }
            }
            // Password and Sign in inside the visible area
            const areaRect = area.getBoundingClientRect();
            for (const sel of ['#password-field', '#submit-password']) {
                const el = document.querySelector('.pc-monitor ' + sel);
                // Only when the field is actually shown: the form is hidden before an account is
                // chosen (the tile row, or the Checking... state), where Password/Sign in do not apply.
                if (el && el.offsetParent !== null) {
                    const r = el.getBoundingClientRect();
                    const vis = r.top >= areaRect.top - 1 && r.bottom <= areaRect.bottom + 1;
                    if (!vis) { out.ok = false; out.notes.push(`${sel} outside visible area (top ${Math.round(r.top)}, bottom ${Math.round(r.bottom)} vs ${Math.round(areaRect.top)}..${Math.round(areaRect.bottom)})`); }
                }
            }
            out.stateLine = (document.querySelector('.pc-monitor #signin-message')?.textContent || '').slice(0, 80);
            // The overlay is left up for a screenshot; the next measure() clears it first.
        } catch (e) { out.ok = false; out.notes.push('throw: ' + String(e).slice(0, 160)); }
        return out;
    }, fx);
}

(async () => {
    const id = Number(process.argv[2]) || newGame();
    const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    page.on('pageerror', e => { /* game-side errors are not ours */ });
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} });
    await page.goto(`${BASE}/break_escape/games/${id}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
    // Clear any opening UI so the overlay is the only monitor on screen
    for (let i = 0; i < 12; i++) {
        const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame, bl: s.blockingUi }; });
        if (st.mg) { await page.evaluate(() => window.__test.minigame.close()); await sleep(300); continue; }
        if (st.bl) { await page.evaluate(() => window.__test.dismissBlockingUi?.()); await sleep(300); continue; }
        break;
    }
    let failed = 0;
    const rows = [];
    for (const fx of FIXTURES) {
        for (const [w, h] of SIZES) {
            await page.setViewportSize({ width: w, height: h });
            await sleep(80);
            const m = await measure(page, fx);
            const tag = `${fx.name} @ ${w}x${h}`;
            const verdict = m.ok ? 'PASS' : 'FAIL';
            if (!m.ok) failed++;
            if (process.env.FITDEBUG) console.log("    dbg", JSON.stringify(m.dbg));
            rows.push({ tag, verdict, spare: m.spare, scrollHeight: m.scrollHeight, clientHeight: m.clientHeight, notes: m.notes, stateLine: m.stateLine, longestRefusal: m.longestRefusal });
            console.log(`${verdict}  ${tag.padEnd(34)} spare=${String(m.spare ?? '?').padStart(5)}  (scroll ${m.scrollHeight ?? '?'} / client ${m.clientHeight ?? '?'})${m.notes?.length ? '  ' + m.notes.join('; ') : ''}`);
            if (SHOTS) {
                try {
                    // Hide the game canvas and any other overlay (the Mission Brief popup) so the
                    // screenshot shows only the sign-in overlay; it does not affect the measurement.
                    await page.evaluate(() => {
                        const mon = document.querySelector('.pc-monitor');
                        document.querySelectorAll('body > *').forEach(e => { if (e !== mon && !e.contains(mon)) e.style.visibility = 'hidden'; });
                        document.querySelectorAll('canvas').forEach(c => { c.style.visibility = 'hidden'; });
                    });
                    const el = await page.$('.pc-monitor');
                    if (el) await el.screenshot({ path: `${SHOTS}/${fx.name}-${w}x${h}.png` });
                    await page.evaluate(() => { document.querySelectorAll('body > *, canvas').forEach(e => { e.style.visibility = ''; }); });
                } catch {}
            }
        }
    }
    console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILURE(S)'} over ${rows.length} checks (game ${id})`);
    await browser.close();
    process.exit(failed === 0 ? 0 : 1);
})();
