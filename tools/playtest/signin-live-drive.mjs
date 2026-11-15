// K0 R1 live drive (credential keyring plan 5.5): plants the drop box in game, opens each remote
// sign-in from the view (before and after the capture cards), runs once with /login_accounts held
// 5 s by a route, then signs in from a captured tile. Modes: main | edge (failed, 403 and late-403
// closes) | plant. Needs a keyless server on port 3062 from this worktree.
//   SHOTS=<dir> [CHROME=<exe>] node tools/playtest/signin-live-drive.mjs main [gameId]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { chromium } = createRequire(ROOT + '/node_modules/')('playwright');
const PORT = 3062, BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.SHOTS, MODE = process.argv[2] || 'main';
const sleep = ms => new Promise(r => setTimeout(r, ms));
function newGame() {
    const out = execFileSync('bundle', ['exec', 'rails', 'runner', 'tools/playtest/new-game.rb', 'test_access_networks'], {
        cwd: ROOT, env: { ...process.env, PLAYTEST_PORT: String(PORT), BREAK_ESCAPE_STANDALONE: 'true', RBENV_VERSION: '2.7.8' }, encoding: 'utf8' });
    return Number(out.match(/GAME_ID=(\d+)/)[1]);
}
const id = Number(process.argv[3]) || newGame();
console.log('GAME', id);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], executablePath: process.env.CHROME });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} });
let delayLogin = 0, forceStatus = 0, forceBody = '{}'; const loginHits = [];
await page.route('**/login_accounts*', async (route) => { loginHits.push(route.request().url().slice(-60)); if (delayLogin) await sleep(delayLogin); if (forceStatus) return route.fulfill({ status: forceStatus, contentType: 'application/json', body: forceBody }); route.continue(); });
await page.goto(`${BASE}/break_escape/games/${id}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
const T = (fn, ...a) => page.evaluate(fn, ...a);
const clear = async () => { for (let i = 0; i < 12; i++) { const s = await T(() => { const s = window.__test.getState(); return { mg: s.activeMinigame, bl: s.blockingUi }; });
    if (s.mg) { await T(() => window.__test.minigame.close()); await sleep(300); continue; } if (s.bl) { await T(() => window.__test.dismissBlockingUi?.()); await sleep(300); continue; } break; } };
await sleep(3000); await clear();
await T(() => { window.__alerts = []; const g = window.gameAlert; window.gameAlert = (...a) => { window.__alerts.push([a[0], a[1]]); return g?.(...a); }; });
const snap = () => T(() => {
    const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.offsetParent !== null;
    const area = document.querySelector('.pc-monitor .pc-monitor-area');
    const tilesEl = document.querySelector('#signin-tiles');
    return { title: document.querySelector('.signin-title')?.textContent, rowShown: vis(tilesEl),
        tiles: [...document.querySelectorAll('.signin-tile[data-username]')].map(t => `${t.dataset.username}[${[...t.querySelectorAll('.signin-tag')].map(x => x.textContent)}] title="${t.title}"`),
        msg: document.querySelector('#signin-message')?.textContent, prompt: document.querySelector('#signin-prompt')?.textContent,
        change: vis(document.querySelector('#signin-change')), form: vis(document.querySelector('#signin-form')), userRow: vis(document.querySelector('#signin-username-row')),
        selected: document.querySelector('#signin-selected')?.textContent, active: document.activeElement?.id,
        scroll: area ? [area.scrollHeight, area.clientHeight] : null, rowScroller: tilesEl?.classList.contains('signin-tiles-scroll'),
        mg: window.__test.minigame.which?.()?.type };
});
const shot = async (name, sizes = [[1400, 1000], [800, 600], [915, 412], [390, 844]]) => {
    for (const [w, h] of sizes) {
        await page.setViewportSize({ width: w, height: h }); await sleep(250);
        await T(() => { const mon = document.querySelector('.pc-monitor'); document.querySelectorAll('body > *').forEach(e => { if (mon && e !== mon && !e.contains(mon)) e.style.visibility = 'hidden'; }); document.querySelectorAll('canvas').forEach(c => c.style.visibility = 'hidden'); });
        const el = await page.$('.pc-monitor'); if (el) await el.screenshot({ path: `${SHOTS}/${name}-${w}x${h}.png` });
        await T(() => { document.querySelectorAll('body > *, canvas').forEach(e => e.style.visibility = ''); });
    }
    await page.setViewportSize({ width: 1400, height: 1000 });
};
const log = (...a) => console.log(...a);
const retry = async (fn) => { let r; for (let i = 0; i < 5; i++) { await clear(); r = await fn(); if (r?.ok || !/minigame/.test(r?.reason || '')) return r; } return r; };
const interact = (oid) => retry(() => T((o) => window.__test.interact(o), oid));
const enter = (room) => retry(() => T((r) => window.__test.enterRoom(r), room));
const confirm = (label) => T((l) => window.__test.dismissBlockingUi(l), label);
const clickSel = (sel) => T((s) => window.__test.minigame.clickSelector(s), sel);
const view = async () => { await clear(); const r = await interact('comms_port'); await sleep(1500); return r; };
const openHost = async (host) => { await view(); const r = await clickSel(`[data-host-id="${host}"] [data-action="sign-in"]`); return r; };
const waitMg = async (ms) => sleep(ms);
globalThis.H = { enter, page, T, snap, shot, log, interact, confirm, clickSel, view, openHost, clear, sleep, setDelay: (n) => { delayLogin = n; }, setForce: (st, b = '{}') => { forceStatus = st; forceBody = b; }, errs, loginHits, id };

if (MODE === 'plant') {
    log('lobby interact kit:', JSON.stringify(await interact('kit_dropbox')));
    log('enter comms:', JSON.stringify(await enter('comms_room')).slice(0,200));
    log('plant interact:', JSON.stringify(await interact('comms_port')));
    await sleep(500); log('confirm:', JSON.stringify(await confirm('Plug it in')));
    await sleep(2500);
    log('state:', JSON.stringify(await T(() => ({ mg: window.__test.minigame.which?.(), fh: window.__test.access.footholds() }))));
}

if (MODE === 'main') {
    await interact('kit_dropbox'); await enter('comms_room'); await interact('comms_port'); await sleep(500);
    await confirm('Plug it in'); await sleep(2500);
    log('planted:', JSON.stringify(await T(() => ({ mg: window.__test.minigame.which?.()?.type, fh: window.__test.access.footholds().map(f => f.id) }))));
    const rows = await T(() => [...document.querySelectorAll('[data-host-id]')].map(r => r.dataset.hostId + ':' + [...r.querySelectorAll('[data-action]')].map(a => a.dataset.action)));
    log('view rows:', JSON.stringify(rows));
    const open = async (host, name, { wait = 1500, sizes } = {}) => {
        await clear(); const v = await interact('comms_port'); await sleep(1200);
        const c = await clickSel(`[data-host-id="${host}"] [data-action="sign-in"]`); await sleep(wait);
        const s = await snap(); log(`${name}:`, JSON.stringify(s), c?.ok === false ? JSON.stringify(c).slice(0, 200) : '');
        await shot(name, sizes); return s;
    };
    await open('sam_pc', 'sam-before-cards');
    await open('lena_pc', 'lena-before-cards');
    // The capture cards in the lobby
    await enter('lobby');
    for (const c of ['capture_note_lena', 'capture_note_ian']) { log(c, JSON.stringify(await interact(c)).slice(0, 120)); await sleep(800); await clear(); }
    await enter('comms_room');
    await open('sam_pc', 'sam-after-cards');
    await open('it_pc', 'it-ian-tile');
    await open('ops_pc', 'ops-typed-nla');
    await open('door_box', 'door-headless');
    await open('lena_pc', 'lena-after-cards');
    // Other user under a tiles screen: the message line
    await clickSel('.signin-other'); await sleep(400); log('lena other-user:', JSON.stringify(await snap())); await shot('lena-other-user', [[800, 600], [390, 844]]);
    // Delay run: /login_accounts 5 s
    H.setDelay(5000);
    await clear(); await interact('comms_port'); await sleep(1200);
    await clickSel('[data-host-id="lena_pc"] [data-action="sign-in"]');
    await sleep(900); log('delay +1s:', JSON.stringify(await snap())); await shot('delay-1s-checking', [[800, 600]]);
    await sleep(2700); log('delay +3.6s (cap):', JSON.stringify(await snap())); await shot('delay-cap-still-checking', [[800, 600]]);
    await sleep(2600); log('delay +6.2s (late):', JSON.stringify(await snap())); await shot('delay-late-redraw', [[1400, 1000], [800, 600], [915, 412], [390, 844]]);
    H.setDelay(0);
    // Sign in from the captured tile (password typed from the letter's earned source)
    const t = await T(() => { const el = document.querySelector('.signin-tile[data-username="lfox"]'); el?.click(); return !!el; });
    await sleep(500); log('lfox tile clicked:', t, JSON.stringify(await snap())); await shot('lena-tile-chosen', [[800, 600]]);
    const ty = await T(() => window.__test.minigame.type(0, 'Ledger-Lena-9', { submit: true })); await sleep(2500);
    log('signed in:', JSON.stringify(ty).slice(0, 160), JSON.stringify(await T(() => ({ mg: window.__test.minigame.which?.()?.type, sessions: window.__test.access.sessions() }))).slice(0, 400));
    await shot('lena-remote-desktop', [[1400, 1000]]);
    log('login_accounts hits:', loginHits.length, 'errors:', JSON.stringify(errs));
}

if (MODE === 'edge') {

    await interact('kit_dropbox'); await enter('comms_room'); await interact('comms_port'); await sleep(500);
    await confirm('Plug it in'); await sleep(2500);
    const open = async (host) => { await clear(); await interact('comms_port'); await sleep(1200); return clickSel(`[data-host-id="${host}"] [data-action="sign-in"]`); };
    // E1: slow /login_accounts, no captures: the cap shows the Other user form, the late answer brings the row
    H.setDelay(5000); await open('sam_pc');
    await sleep(900); log('E1 +1s:', JSON.stringify(await snap()));
    await sleep(2700); log('E1 cap:', JSON.stringify(await snap())); await shot('edge-cap-other-form', [[800, 600]]);
    await sleep(2600); log('E1 late:', JSON.stringify(await snap())); await shot('edge-late-row-no-captures', [[800, 600]]);
    H.setDelay(0);
    // cards
    await enter('lobby');
    for (const c of ['capture_note_lena', 'capture_note_ian']) { await interact(c); await sleep(800); await clear(); }
    await enter('comms_room');
    // E2: /login_accounts fails with 500: captures stay, the failed line shows
    H.setForce(500); await open('lena_pc'); await sleep(1500);
    log('E2 500:', JSON.stringify(await snap())); await shot('edge-failed-accounts-captures', [[800, 600], [390, 844]]);
    // E3: 403 not_responding closes the screen with a toast (P6)
    H.setForce(403, JSON.stringify({ reason: 'not_responding' }));
    await clear(); await interact('comms_port'); await sleep(1200); await clickSel('[data-host-id="lena_pc"] [data-action="sign-in"]'); await sleep(1500);
    log('E3 403:', JSON.stringify(await T(() => ({ mg: window.__test.minigame.which?.()?.type, alerts: window.__alerts }))));
    // E4: X pressed before a late 403: no toast
    H.setForce(0); H.setDelay(0);
    await clear(); await interact('comms_port'); await sleep(1200);
    await page.route('**/login_accounts*', async (route) => { await sleep(2500); route.fulfill({ status: 403, contentType: 'application/json', body: '{}' }); });
    await clickSel('[data-host-id="lena_pc"] [data-action="sign-in"]'); await sleep(400);
    await T(() => window.__test.minigame.close()); await sleep(3500);
    log('E4 late 403 after X:', JSON.stringify(await T(() => ({ mg: window.__test.minigame.which?.()?.type, alerts: window.__alerts }))));
    log('errors:', JSON.stringify(errs));
}

await browser.close();
