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
//   (optional: CHROME=<executable> PLAYWRIGHT=<node_modules holding playwright> SHOTS=<dir> STRIP_SHOTS=<dir>)
//
// K3a fixtures (ways-longest, ways-refused-short, keyring-both-failed) need no VM and no keyring
// route: the entries are passed to setRemoteAccounts directly. This script needs a running keyless
// server and a browser, so it was not run in the run that added them (no servers allowed there):
// start the server on a free port (see AGENTS.md) and run  PORT=<port> node tools/playtest/signin-fit.mjs
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

function newGame(scenario = 'test_access_networks') {
    const out = execFileSync('bundle', ['exec', 'rails', 'runner', 'tools/playtest/new-game.rb', scenario], {
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
    // Keyring K3a (plan 8.1) worst cases: the chosen account's ways box. Entries are the GET /keyring shape.
    { name: 'ways-longest', desc: 'K3a: chosen account with three long-label saved connections, a refused one, and two found passwords',
      build: { host: 'HB-FIN-03', pcName: 'Finance server (HB-FIN-03)', picker: 'known', linkName: 'Drop box: Comms room',
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' },
               set: { picker: 'known', host: 'HB-FIN-03', tiles: [{ username: 'sokafor', displayName: 'Sam Okafor' }], captured: [],
                      keyring: [
                          { id: 'c1', kind: 'saved_connection', accepted: true, forThisPc: true, label: 'Finance remote desktop (long label for the cut)', host: 'HB-FIN-03', account: { username: 'sokafor', displayName: 'Sam Okafor' } },
                          { id: 'c2', kind: 'saved_connection', accepted: true, forThisPc: true, label: 'Backup operator connection from the comms room', host: 'HB-FIN-03', account: { username: 'sokafor', displayName: 'Sam Okafor' } },
                          { id: 'c3', kind: 'saved_connection', accepted: false, forThisPc: true, label: 'Old audit connection', host: 'HB-FIN-03', account: { username: 'sokafor', displayName: 'Sam Okafor' } },
                          { id: 'p1', kind: 'password', source: 'registry', foundIn: 'f1', label: 'passwords.txt in the finance share', account: { username: 'sokafor', displayName: 'Sam Okafor' } },
                          { id: 'p2', kind: 'password', source: 'registry', foundIn: 'f2', label: 'a sticky note under the second keyboard on the left desk', account: { username: 'sokafor', displayName: 'Sam Okafor' } }
                      ] },
               action: 'chosen', expectWays: true } },
    { name: 'locked-credential-ways', desc: 'K-lock R1 M1: a locked credential session on a remote screen: the longer slab, no tile row, the .rdp button and a refused one',
      build: { host: 'HB-FIN-02', pcName: 'Lena Fox PC (HB-FIN-02)', picker: 'known', linkName: 'Drop box: Comms room', preselect: 'lfox',
               current: { username: 'lfox', displayName: 'Lena Fox', via: 'credential', kind: 'saved_connection', remote: true, locked: true },
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' },
               set: { picker: 'known', host: 'HB-FIN-02', tiles: [{ username: 'lfox', displayName: 'Lena Fox' }], captured: [],
                      keyring: [
                          { id: 'c1', kind: 'saved_connection', accepted: true, forThisPc: true, label: 'Finance remote desktop (long label for the cut)', host: 'HB-FIN-02', account: { username: 'lfox', displayName: 'Lena Fox' } },
                          { id: 'c3', kind: 'saved_connection', accepted: false, forThisPc: true, label: 'Old audit connection', host: 'HB-FIN-02', account: { username: 'lfox', displayName: 'Lena Fox' } }
                      ] },
               action: 'locked', expectWays: true } },
    { name: 'ways-token-expired', desc: 'K5 R3: the account\'s expired session token: the greyed Connect button and its expired line wrap, nothing cut',
      build: { host: 'HB-FIN-02', pcName: 'Lena Fox PC (HB-FIN-02)', picker: 'known', linkName: 'Drop box: Comms room',
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' },
               set: { picker: 'known', host: 'HB-FIN-02', tiles: [{ username: 'lfox', displayName: 'Lena Fox' }], captured: [],
                      keyring: [{ id: 'tok', kind: 'token', source: 'registry', label: 'HB-FIN-02 sign-in token', host: 'HB-FIN-02', connectsTo: 'lena_pc', expired: true, accepted: true, forThisPc: true, account: { username: 'lfox', displayName: 'Lena Fox' } }] },
               action: 'chosen', expectWays: true, expectExpired: true } },
    { name: 'ways-refused-short', desc: 'K3a: one greyed saved connection with its short reason under it, in the short window',
      build: { host: 'HB-FIN-03', pcName: 'Finance server (HB-FIN-03)', picker: 'known', linkName: 'Drop box: Comms room',
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' },
               set: { picker: 'known', host: 'HB-FIN-03', tiles: [{ username: 'sokafor', displayName: 'Sam Okafor' }], captured: [],
                      keyring: [{ id: 'c3', kind: 'saved_connection', accepted: false, forThisPc: true, label: 'Old audit connection', host: 'HB-FIN-03', account: { username: 'sokafor', displayName: 'Sam Okafor' } }] },
               action: 'chosen', expectWays: true } },
    { name: 'keyring-both-failed', desc: 'K3a: the combined failed line when the keyring and another answer both fail',
      build: { host: 'HB-FIN-03', pcName: 'Finance server (HB-FIN-03)', picker: false, linkName: 'Drop box: Comms room',
               remote: { footholdId: 'jack', linkName: 'Drop box: Comms room' },
               set: { picker: false, host: 'HB-FIN-03', tiles: [], captured: [], keyringFailed: true, capturedFailed: true },
               action: 'other' } },
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
                    ...(b.preselect ? { preselect: b.preselect } : {}),
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
            if (fx.build.expectWays) {
                // The ways box: every button inside the visible area or inside the box's own scroller,
                // the fixed words "Connect with" whole, the first button in view, Password present
                const box = document.querySelector('.pc-monitor #signin-ways');
                const first = box?.querySelector('.signin-cred');
                const ar = area.getBoundingClientRect();
                out.ways = { shown: !!box && !box.hidden, scrolls: !!box?.classList.contains('signin-ways-scroll'), buttons: box ? box.querySelectorAll('.signin-cred').length : 0 };
                if (!box || box.hidden) { out.ok = false; out.notes.push('the ways box is not shown'); }
                else {
                    const fr = first?.getBoundingClientRect();
                    if (!fr || fr.top < ar.top - 1 || fr.bottom > ar.bottom + 1) { out.ok = false; out.notes.push('the first ways button is outside the visible area'); }
                    for (const fixed of box.querySelectorAll('.signin-cred-fixed')) {
                        if (fixed.scrollWidth > fixed.clientWidth + 1) { out.ok = false; out.notes.push('"Connect with" is cut'); break; }
                    }
                    // K5 R3: no token text is cut (no ellipsis, nothing hidden by overflow): the button, its label,
                    // and a refusal or expired line show whole, wrapping when they are long
                    for (const el of box.querySelectorAll('.signin-cred-token, .signin-cred-token .signin-cred-label, .signin-cred-expired')) {
                        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
                            out.ok = false; out.notes.push(`ways text cut: "${el.textContent.slice(0, 40)}" (${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight})`);
                        }
                        if (getComputedStyle(el).textOverflow === 'ellipsis') { out.ok = false; out.notes.push(`ways text can be cut by an ellipsis: ${el.className}`); }
                    }
                    if (fx.build.expectExpired) {
                        const why = box.querySelector('.signin-cred-refused')?.textContent;
                        if (why !== 'HB-FIN-02 sign-in token has expired.') { out.ok = false; out.notes.push(`expired line reads ${JSON.stringify(why)}`); }
                        if (box.querySelector('.signin-cred')?.getAttribute('aria-disabled') !== 'true') { out.ok = false; out.notes.push('the expired token button is not greyed'); }
                    }
                    if (out.ways.scrolls && document.querySelector('.pc-monitor #signin-ways-more')?.hidden) { out.ok = false; out.notes.push('a scrolling ways box shows no More below cue'); }
                }
                if (!document.querySelector('.pc-monitor #password-field')) { out.ok = false; out.notes.push('no Password field under the ways box'); }
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

// ---- K3d (credential keyring plan 8.7): the capture log's Sign-ins list ----------------------
// The capture log's console window at the four fit sizes, with a 32-character label, a row with
// four tags (two kind, two source), a three-tag row, a greyed row, a New mark, and the Captures
// section. The rows come from the real buildSignInRows and buildSignInRow (signin-rows.js) and
// the real capture-log CSS; the device is opened with no holder (so it reads and writes no
// game globals: nothing reaches the throwaway game's record) and the fixture sections are drawn
// into its root with the device's own section markup. Checks: the console window inside the
// viewport, no row or tag wider than its row, no sideways scroll in the list, and both banners
// within two lines at 390x844.
const K3D_SIZES = [[1400, 1000], [390, 844], [915, 412], [800, 600]];
const LABEL_32 = 'FINANCE-REMOTE-DESKTOP-OPS-3.rdp';   // 32 characters, the longest label case

async function measureCaptureLog(page, size) {
    return page.evaluate(async ({ label, size }) => {
        const out = { ok: true, notes: [] };
        try {
            const MF = window.MinigameFramework;
            while (MF.currentMinigame) MF.endMinigame(false, null);
            const sr = await import('/break_escape/js/minigames/capture-log/signin-rows.js');
            const txt = await import('/break_escape/js/utils/remote-host-text.js');
            const acct = (npcId, displayName, username) => ({ npcId, displayName, username });
            const captures = {
                lord_qr: { targetId: 'lord_qr', kind: 'credential', roleLabel: 'Facilities manager', address: 's.lord@harbour-logistics.example', host: 'HB-FAC-01', note: 'QR look-alike page left in the lobby', at: 1 },
                harp_qr: { targetId: 'harp_qr', kind: 'credential', roleLabel: 'Recruitment', address: 'i.harper', host: 'HB-RECEP-01', note: 'Phished from the careers page', at: 2 },
                harp_keys: { targetId: 'harp_keys', kind: 'credential', roleLabel: 'Recruitment', address: 'i.harper', host: 'HB-RECEP-01', note: 'Keylogger on the reception PC', at: 3 },
                harp_box: { targetId: 'harp_box', kind: 'credential', roleLabel: 'Recruitment', address: 'i.harper', host: 'HB-RECEP-01', note: 'Drop box on the comms port', at: 4 },
                pin: { targetId: 'pin', kind: 'credential', roleLabel: 'Lobby card', host: 'Stationery cupboard keypad', at: 5 },
                fh: { targetId: 'fh', kind: 'foothold', roleLabel: 'Operations', host: 'HB-OPS-02', note: 'Payload ran from the USB lure', at: 6 },
                post: { targetId: 'post', kind: 'foothold', roleLabel: 'Post room', host: 'Post room door', note: 'Wedged open with a folded card', at: 7 }
            };
            const keyring = {
                entries: [
                    { id: 'pw_lord', kind: 'password', source: 'registry', label, foundIn: 'f1', how: 'found', account: acct('lord', 'Samantha Lord-Whitfield', 's.lord') },
                    { id: 'rdp', kind: 'saved_connection', source: 'registry', label, heldItem: 'rdp_item', how: 'given', host: 'HB-FIN-03', account: acct('okafor', 'Sam Okafor', 'sokafor') },
                    { id: 'assist', kind: 'assist_invite', source: 'registry', label: 'Remote assist from Lena', how: 'given', ended: true, account: acct('lena', 'Lena Fox', 'lfox') },
                    // K5: a live token (minutes left, the link that recorded it) and an expired one
                    { id: 'tok', kind: 'token', source: 'registry', label: 'HB-FIN-02 sign-in token', host: 'HB-FIN-02', connectsTo: 'lena_pc', routes: [{ foothold: 'drop_box' }], account: acct('lena', 'Lena Fox', 'lfox') },
                    { id: 'tok_old', kind: 'token', source: 'registry', label, host: 'HB-FIN-02', connectsTo: 'lena_pc', expired: true, account: acct('okafor', 'Sam Okafor', 'sokafor') }
                ],
                captures: {
                    lord_qr: { tag: 'password', source: 'phished', account: 'lord' },
                    harp_qr: { tag: 'password', source: 'phished', account: 'harper' },
                    harp_keys: { tag: 'password', source: 'recorded', account: 'harper' },
                    harp_box: { tag: 'password', source: 'recorded', account: 'harper' },
                    pin: { tag: 'pin', source: 'recorded' }, fh: { tag: 'foothold', source: 'recorded' }, post: { tag: 'finding', source: 'recorded' }
                },
                firstSeen: new Map([['pw_lord', 0], ['rdp', 10], ['assist', 11], ['tok', 12], ['tok_old', 13]]),
                tokenSecondsLeft: (id) => (id === 'tok' ? 187 : null),
                foundVisible: () => true
            };
            const sections = sr.buildSignInRows({ captures, keyring, secrets: { lord_qr: 'Facilities!2026', harp_qr: 'Recruit-2026', pin: '4471' },
                social: { captures: { revealSecret: true } } });
            const four = sections.signins.find(r => r.key === 'account:lord');
            if (!four || (four.kinds.length + four.sources.length) !== 4) { out.ok = false; out.notes.push('fixture: no four-tag row'); }
            for (const id of ['tok', 'tok_old']) {
                if (!sections.signins.some(r => r.key === `cred:${id}`)) { out.ok = false; out.notes.push(`fixture: no ${id} row`); }
            }
            MF.startMinigame('capture-log', null, { title: 'Capture log', holderId: '__signin_fit_none__' });
            const scene = MF.currentMinigame;
            // The device's background GET /keyring and secrets answers redraw it from the game's
            // own (empty) state: hold the fixture in place while it is measured and shot
            scene.redraw = () => {};
            const root = scene.root;
            root.textContent = '';
            const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
            const section = (id, title, banner, rows) => {
                const s = el('section', `capture-log-section capture-log-${id}`);
                s.dataset.section = id;
                s.appendChild(el('h4', 'capture-log-heading', title));
                s.appendChild(el('p', 'lpb-captures-banner capture-log-banner', banner));
                const list = el('ul', 'capture-log-list');
                rows.forEach((r, i) => {
                    const { row } = sr.buildSignInRow(r);
                    row.dataset.key = r.key;
                    if (i === 0) { row.classList.add('capture-log-new'); row.appendChild(el('span', 'capture-log-new-mark', 'New')); }
                    list.appendChild(row);
                });
                s.appendChild(list);
                root.appendChild(s);
            };
            section('signins', txt.SIGNINS_HEADING, txt.SIGNINS_BANNER_TEXT, sections.signins);
            section('captures', txt.CAPTURES_HEADING, txt.CAPTURES_ROWS_BANNER_TEXT, sections.captures);
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const vw = window.innerWidth, vh = window.innerHeight;
            const win = scene.consoleWindowEl || scene.container;
            const wr = win.getBoundingClientRect();
            if (wr.left < -1 || wr.top < -1 || wr.right > vw + 1 || wr.bottom > vh + 1) {
                out.ok = false; out.notes.push(`console window outside the viewport (${Math.round(wr.left)},${Math.round(wr.top)} to ${Math.round(wr.right)},${Math.round(wr.bottom)})`);
            }
            if (root.scrollWidth > root.clientWidth + 1) { out.ok = false; out.notes.push(`list scrolls sideways by ${root.scrollWidth - root.clientWidth}px`); }
            for (const row of root.querySelectorAll('.signin-row')) {
                const rr = row.getBoundingClientRect();
                if (row.scrollWidth > row.clientWidth + 1) { out.ok = false; out.notes.push(`${row.dataset.key} overflows by ${row.scrollWidth - row.clientWidth}px`); }
                for (const t of row.querySelectorAll('.signin-row-tag, .capture-log-new-mark')) {
                    const tr = t.getBoundingClientRect();
                    if (tr.left < rr.left - 1 || tr.right > rr.right + 1) { out.ok = false; out.notes.push(`${row.dataset.key}: "${t.textContent}" outside its row`); }
                }
            }
            out.banners = [...root.querySelectorAll('.capture-log-banner')].map(b => {
                const lh = parseFloat(getComputedStyle(b).lineHeight) || (parseFloat(getComputedStyle(b).fontSize) * 1.2);
                return Math.round(b.getBoundingClientRect().height / lh);
            });
            if (size[0] === 390 && out.banners.some(n => n > 2)) { out.ok = false; out.notes.push(`a banner takes ${Math.max(...out.banners)} lines at 390x844`); }
            out.window = `${Math.round(wr.width)}x${Math.round(wr.height)}`;
            out.scrolls = root.scrollHeight > root.clientHeight + 1;
            out.tags = four ? [...root.querySelectorAll('[data-key="account:lord"] .signin-row-tag')].map(t => t.textContent) : [];
        } catch (e) { out.ok = false; out.notes.push('throw: ' + String(e).slice(0, 160)); }
        return out;
    }, { label: LABEL_32, size });
}

// ---- K5: the token line on a real opened token desktop ---------------------------------------
// A second game of test_access_keyring is set up through the game's own routes from the page (take
// the drop box, plant it in the comms port, sign in to Lena's PC with the token: all server-side),
// then the real remote desktop is opened with window.openRemoteDesktop. At each size the checks run
// on that live DOM: the monitor's bezel inside the viewport, the top bar (the compact rule at
// 390x844 applies there), the token line in that top strip (sessionNoticesHtml; the first row of
// desktop icons must stay in view under it), and the start panel's credential line after Start. Each line must stay
// inside its box and take at most two lines, for the live figure, the sub-minute line and a 240-hour
// figure (the widest a token line can get; a token line carries no label).
async function setupTokenGame(page, gameId) {
    await page.goto(`${BASE}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
    return page.evaluate(async () => {
        const gid = window.breakEscapeConfig.gameId;
        const csrf = document.querySelector('meta[name=csrf-token]')?.content;
        const post = async (path, body) => {
            const r = await fetch(`/break_escape/games/${gid}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: JSON.stringify(body) });
            return r.status;
        };
        const steps = [
            await post('inventory', { action_type: 'add', item: { type: 'pc', id: 'kit_dropbox', name: 'Network drop box' } }),
            await post('network/plant', { jack_id: 'comms_port' }),
            await post('login', { pc_id: 'lena_pc', credential: 'lena_token', foothold: 'jack_comms_port' })
        ];
        return steps;
    }).then(async steps => {
        if (steps.some(c => c !== 200)) return { ok: false, why: `token setup answered ${steps.join('/')}` };
        // reload so the session comes from the bootstrap, as a player's reload would
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
        await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
        await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
        const held = await page.evaluate(() => window.pcSessions?.get?.('lena_pc')?.kind);
        return held === 'token' ? { ok: true } : { ok: false, why: `session after reload is ${held}` };
    });
}

async function measureTokenDesktop(page, size) {
    await page.evaluate(() => { const MF = window.MinigameFramework; while (MF?.currentMinigame) MF.endMinigame(false, null); });
    await page.evaluate(() => window.openRemoteDesktop('lena_pc', 'jack_comms_port'));
    try { await page.waitForSelector('.pc-monitor .pc-desktop-topbar', { timeout: 20000 }); } catch { /* reported below */ }
    await sleep(300);
    // STRIP_SHOTS=<dir>: the real token desktop as opened, before Start is touched
    if (process.env.STRIP_SHOTS) {
        try {
            // hide the canvas and any other overlay (the resume menu) so only the monitor shows
            await page.evaluate(() => {
                const mon = document.querySelector('.pc-monitor');
                document.querySelectorAll('body > *').forEach(e => { if (e !== mon && !e.contains(mon)) e.style.visibility = 'hidden'; });
                document.querySelectorAll('canvas').forEach(c => { c.style.visibility = 'hidden'; });
            });
            await (await page.$('.pc-monitor'))?.screenshot({ path: `${process.env.STRIP_SHOTS}/token-strip-${size[0]}x${size[1]}.png` });
            await page.evaluate(() => { document.querySelectorAll('body > *, canvas').forEach(e => { e.style.visibility = ''; }); });
        } catch { /* the check still runs */ }
    }
    return page.evaluate(async ({ size }) => {
        const out = { ok: true, notes: [], lines: [] };
        try {
            const tb = await import('/break_escape/js/utils/pc-taskbar.js');
            const mon = document.querySelector('.pc-monitor');
            const top = mon?.querySelector('.pc-desktop-topbar');
            if (!mon || !top) { out.ok = false; out.notes.push('the token desktop did not open'); return out; }
            const [vw, vh] = [window.innerWidth, window.innerHeight];
            const mr = mon.getBoundingClientRect();
            out.bezel = Math.round(mr.width);
            out.compact = mon.hasAttribute('data-compact');
            if (mr.left < -1 || mr.right > vw + 1 || mr.bottom > vh + 1) { out.ok = false; out.notes.push(`bezel outside the viewport (${Math.round(mr.left)},${Math.round(mr.top)} to ${Math.round(mr.right)},${Math.round(mr.bottom)} in ${vw}x${vh})`); }
            if (size[0] === 390 && !out.compact) { out.ok = false; out.notes.push('the compact rule is not in force at 390x844'); }
            const mg = window.MinigameFramework.currentMinigame;
            const base = window.pcSessions.get('lena_pc');
            const linesOf = (el) => {
                const cs = getComputedStyle(el);
                const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.2);
                // offsetHeight is in layout px; the monitor is drawn at x2 by a transform, so a
                // bounding rect would read twice the line count at 1400x1000
                // minus padding and borders, so a boxed line (the strip's amber box) counts text lines
                const box = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((n, k) => n + (parseFloat(cs[k]) || 0), 0);
                return Math.max(1, Math.round((el.offsetHeight - box) / lh));
            };
            const within = (name, el, box) => {
                const a = el.getBoundingClientRect(), b = box.getBoundingClientRect();
                const n = linesOf(el);
                out.lines.push(`${name}:${n}`);
                if (a.right > b.right + 1 || a.left < b.left - 1) { out.ok = false; out.notes.push(`${name}: runs past its box`); }
                if (n > 2) { out.ok = false; out.notes.push(`${name}: takes ${n} lines`); }
            };
            // the top strip's own token line (the line a player sees without opening Start), drawn
            // by sessionNoticesHtml(): its lines, that it fits the strip, and that the first row of
            // desktop icons stays in view under it
            const cases = [['live', base.tokenSecondsLeft ?? 187], ['sub-minute', 41], ['240h', 240 * 60 * 60]];
            const strip = top.querySelector('.desktop-token-line');
            if (!strip) { out.ok = false; out.notes.push('the top strip has no token line'); }
            else {
                const icon = mon.querySelector('.desktop-icon');
                for (const [name, secs] of cases) {
                    tb.refreshTokenLines(top, { ...base, tokenSecondsLeft: secs });
                    within(`strip-${name}`, strip, top);
                    const sr = strip.getBoundingClientRect(), tr = top.getBoundingClientRect();
                    if (sr.bottom > tr.bottom + 1 || sr.top < tr.top - 1) { out.ok = false; out.notes.push(`strip-${name}: line outside the strip`); }
                    if (tr.right > mr.right + 1) { out.ok = false; out.notes.push(`strip-${name}: strip outside the monitor`); }
                    if (top.scrollWidth > top.clientWidth + 1) { out.ok = false; out.notes.push(`strip-${name}: strip scrolls sideways`); }
                    if (!icon) { out.ok = false; out.notes.push('no desktop icons to check'); break; }
                    // the first icon sits below the strip and wholly inside the viewport and the monitor
                    const ir = icon.getBoundingClientRect(), mrr = mon.getBoundingClientRect();
                    const floor = Math.min(vh, mrr.bottom);
                    if (ir.top < tr.bottom - 1) { out.ok = false; out.notes.push(`strip-${name}: first icon row under the strip`); }
                    if (ir.bottom > floor + 1 || ir.top < 0) { out.ok = false; out.notes.push(`strip-${name}: first icon row out of view (${Math.round(ir.top)} to ${Math.round(ir.bottom)} of ${Math.round(floor)})`); }
                }
                tb.refreshTokenLines(top, { ...base, tokenSecondsLeft: base.tokenSecondsLeft ?? 187 });
            }
            // the start panel's own line
            mon.querySelector('.pc-start-btn')?.click();
            await new Promise(r => setTimeout(r, 250));
            const panel = mon.querySelector('.pc-start-panel');
            const pc = mon.querySelector('.pc-start-credential');
            if (!panel || panel.hidden || !pc) { out.ok = false; out.notes.push('the start panel did not open with a token line'); }
            else {
                for (const [name, secs] of cases) {
                    tb.refreshTokenLines(panel, { ...base, tokenSecondsLeft: secs });
                    within(`start-${name}`, pc, panel);
                    const pr = panel.getBoundingClientRect(), r = pc.getBoundingClientRect();
                    if (r.bottom > pr.bottom + 1 || pr.right > mr.right + 1) { out.ok = false; out.notes.push(`start-${name}: panel or line outside the monitor`); }
                }
                if (panel.scrollWidth > panel.clientWidth + 1) { out.ok = false; out.notes.push('start panel scrolls sideways'); }
            }
        } catch (e) { out.ok = false; out.notes.push('throw: ' + String(e).slice(0, 160)); }
        return out;
    }, { size });
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
    for (const fx of (process.env.K3D_ONLY ? [] : FIXTURES)) {
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
    // K3d: the capture log's Sign-ins list (run alone with K3D_ONLY=1)
    for (const [w, h] of K3D_SIZES) {
        await page.setViewportSize({ width: w, height: h });
        await sleep(80);
        const m = await measureCaptureLog(page, [w, h]);
        const tag = `capture-log-signins @ ${w}x${h}`;
        if (!m.ok) failed++;
        rows.push({ tag, verdict: m.ok ? 'PASS' : 'FAIL', notes: m.notes });
        console.log(`${m.ok ? 'PASS' : 'FAIL'}  ${tag.padEnd(34)} window=${m.window}  banners=${(m.banners || []).join('/')} lines  ${m.scrolls ? 'list scrolls' : 'fits'}${m.notes?.length ? '  ' + m.notes.join('; ') : ''}`);
        if (SHOTS) {
            try {
                const el = await page.$('.minigame-container .console-window') || await page.$('.minigame-container');
                if (el) await el.screenshot({ path: `${SHOTS}/capture-log-signins-${w}x${h}.png` });
            } catch {}
        }
        await page.evaluate(() => { const MF = window.MinigameFramework; while (MF?.currentMinigame) MF.endMinigame(false, null); });
    }
    // K5: the token line on a real opened token desktop (a second game, test_access_keyring)
    const tokenId = Number(process.env.TOKEN_GAME) || newGame('test_access_keyring');
    const tpage = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    await tpage.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} });
    const setup = await setupTokenGame(tpage, tokenId);
    for (const [w, h] of K3D_SIZES) {
        const tag = `token-desktop @ ${w}x${h}`;
        let m;
        if (!setup.ok) m = { ok: false, notes: [setup.why], lines: [] };
        else {
            await tpage.setViewportSize({ width: w, height: h });
            await sleep(300);
            m = await measureTokenDesktop(tpage, [w, h]);
        }
        if (!m.ok) failed++;
        rows.push({ tag, verdict: m.ok ? 'PASS' : 'FAIL', notes: m.notes });
        console.log(`${m.ok ? 'PASS' : 'FAIL'}  ${tag.padEnd(34)} bezel=${m.bezel ?? '?'} compact=${m.compact ?? '?'} lines=${(m.lines || []).join(' ')}${m.notes?.length ? '  ' + m.notes.join('; ') : ''}`);
    }
    console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILURE(S)'} over ${rows.length} checks (games ${id} and ${tokenId})`);
    await browser.close();
    process.exit(failed === 0 ? 0 : 1);
})();
