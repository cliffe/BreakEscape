// Train smoke: boots each given game headless on a keyless server and checks it came up clean.
//
//   node tools/playtest/train-smoke.mjs --port 3081 --game 1201 --game 1202 [--game 1203,1204]
//
// Per game it checks: 0 page errors, the player is present, the start room is resolved (the engine
// names a current room and has it loaded), and no 4xx/5xx responses except the two expected on a
// keyless server: POST /tts cache misses (no key, so no live generation) and /favicon. It also fails on
// a failed request (connection reset, aborted module load; a request the page itself cancelled,
// net::ERR_ABORTED, and the same /tts and favicon requests are ignored) and on a console.error line,
// except the browser's own "Failed to load resource" echo of an HTTP status (already judged above)
// and the keyless text-to-speech noise. Any other console.error means a boot step failed and was
// logged instead of thrown, so it fails the smoke; the allow-list is CONSOLE_ALLOW below.
// Prints one "SMOKE <game> OK|FAIL ..." line per game and a final "TRAIN-SMOKE n games, f failed".
// Exit 0 when nothing failed, 1 on any failure, 2 on a setup error (bad arguments, no browser).
//
// Boot follows the other tools here (shell-x-check.mjs, sync-delta-proof.mjs): ?skip_resume=1, wait for
// window.__test, __test.waitUntilReady, then setFPS(20) with fixed steps ON (never fixedStep=false,
// which lets the player tunnel through 8 px wall boxes).
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE picks the browser; the default is the chrome-headless-shell
// under ~/.cache/ms-playwright.
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const DEFAULT_EXE = join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell');

/** Parse argv (without node and the script). Returns { port, games, exe, timeoutMs } or { error }. */
export function parseArgs(argv, env = {}) {
    const games = [];
    let port = null, timeoutMs = 120000;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        const take = () => argv[++i];
        if (a === '--port') port = take();
        else if (a === '--game') games.push(...String(take() ?? '').split(','));
        else if (a === '--timeout') timeoutMs = Number(take()) * 1000;
        else return { error: `unknown argument ${a}` };
    }
    const ids = games.map(g => g.trim()).filter(Boolean);
    if (!port || !/^\d+$/.test(String(port))) return { error: '--port <number> is required' };
    if ([3000, 3085, 3086].includes(Number(port))) return { error: `port ${port} is reserved and never used for the smoke` };
    if (!ids.length) return { error: 'at least one --game <id> is required' };
    const bad = ids.find(g => !/^\d+$/.test(g));
    if (bad) return { error: `game id must be a number, got "${bad}"` };
    if (!(timeoutMs > 0)) return { error: '--timeout must be a positive number of seconds' };
    return { port: String(port), games: ids, exe: env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || DEFAULT_EXE, timeoutMs };
}

/** Is this response a failure? 4xx/5xx, except POST /tts (keyless cache miss) and /favicon. */
export function badResponse({ status, method, url }) {
    if (!(status >= 400)) return false;
    let path = url;
    try { path = new URL(url).pathname; } catch { /* already a path */ }
    if (/\/favicon/i.test(path)) return false;
    if (String(method).toUpperCase() === 'POST' && /\/tts\/?$/.test(path)) return false;
    return true;
}

/** Is this failed request (Playwright requestfailed) a failure? */
export function badRequestFailure({ method, url, error }) {
    if (/ERR_ABORTED/i.test(String(error))) return false;
    let path = url;
    try { path = new URL(url).pathname; } catch { /* already a path */ }
    if (/\/favicon/i.test(path)) return false;
    if (String(method).toUpperCase() === 'POST' && /\/tts\/?$/.test(path)) return false;
    return true;
}

// console.error text that is expected on a keyless server and is not a boot problem. Keep it to
// messages the engine really logs: a broad pattern (such as anything mentioning tts) would hide a real error.
export const CONSOLE_ALLOW = [/Failed to load resource/i, /favicon/i];
export function badConsole(text) {
    return !CONSOLE_ALLOW.some(re => re.test(String(text)));
}

/** Turn what one game's page showed into a result: { game, ok, problems }. */
export function judgeGame(game, obs) {
    const problems = [];
    if (obs.bootError) problems.push(`boot: ${obs.bootError}`);
    for (const e of obs.pageErrors || []) problems.push(`page error: ${e}`);
    if (!obs.bootError) {
        if (!obs.player) problems.push('no player');
        if (!obs.room) problems.push('start room not resolved');
        else if (!obs.roomLoaded) problems.push(`start room "${obs.room}" is not loaded`);
    }
    for (const r of obs.badResponses || []) problems.push(`HTTP ${r.status} ${r.method} ${r.url}`);
    for (const r of obs.failedRequests || []) problems.push(`request failed ${r.method} ${r.url}: ${r.error}`);
    for (const c of obs.consoleErrors || []) problems.push(`console error: ${c}`);
    return { game, ok: problems.length === 0, room: obs.room || null, problems };
}

export function formatResult(r) {
    return r.ok ? `SMOKE ${r.game} OK room=${r.room}` : `SMOKE ${r.game} FAIL ${r.problems.join('; ')}`;
}

export function summarise(results) {
    const failed = results.filter(r => !r.ok).length;
    return `TRAIN-SMOKE ${results.length} games, ${failed} failed`;
}

async function smokeOne(browser, port, game, timeoutMs) {
    const obs = { pageErrors: [], badResponses: [], failedRequests: [], consoleErrors: [] };
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => obs.pageErrors.push(String(e && e.message || e).split('\n')[0].slice(0, 200)));
    page.on('response', res => {
        const rec = { status: res.status(), method: res.request().method(), url: res.url() };
        if (badResponse(rec)) obs.badResponses.push(rec);
    });
    page.on('requestfailed', req => {
        const rec = { method: req.method(), url: req.url(), error: (req.failure() && req.failure().errorText) || 'failed' };
        if (badRequestFailure(rec)) obs.failedRequests.push({ ...rec, url: rec.url.slice(0, 160) });
    });
    page.on('console', msg => {
        if (msg.type() !== 'error') return;
        const text = msg.text().split('\n')[0].slice(0, 200);
        if (badConsole(text)) obs.consoleErrors.push(text);
    });
    try {
        await page.goto(`http://127.0.0.1:${port}/break_escape/games/${game}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
        await page.waitForFunction(() => !!window.__test, null, { timeout: timeoutMs });
        await page.evaluate(ms => window.__test.waitUntilReady({ timeoutMs: ms }), Math.min(timeoutMs, 90000));
        // setFPS(20), fixed steps ON (never fixedStep=false).
        await page.evaluate(() => {
            try {
                const g = window.game?.sys?.game;
                if (g) { g.loop.smoothStep = false; g.loop.minFps = 1; }
                window.game?.physics?.world?.setFPS?.(20);
            } catch { /* ignore */ }
        });
        await page.waitForTimeout(2500);
        const s = await page.evaluate(() => {
            const st = window.__test.getState();
            const room = st.room || null;
            return { player: !!(st.player && Number.isFinite(st.player.x) && Number.isFinite(st.player.y)), room, roomLoaded: !!(room && window.rooms && window.rooms[room]) };
        });
        Object.assign(obs, s);
    } catch (e) {
        obs.bootError = String(e && e.message || e).split('\n')[0].slice(0, 200);
    }
    await ctx.close();
    return judgeGame(game, obs);
}

async function main() {
    const a = parseArgs(process.argv.slice(2), process.env);
    if (a.error) { console.error(`train-smoke: ${a.error}`); process.exit(2); }
    const { chromium } = await import('playwright');
    let browser;
    try {
        browser = await chromium.launch({ executablePath: a.exe, headless: true });
    } catch (e) {
        console.error(`train-smoke: cannot start the browser at ${a.exe}: ${String(e.message).split('\n')[0]}`);
        process.exit(2);
    }
    const results = [];
    for (const g of a.games) {
        const r = await smokeOne(browser, a.port, g, a.timeoutMs);
        console.log(formatResult(r));
        results.push(r);
    }
    await browser.close();
    console.log(summarise(results));
    process.exit(results.some(r => !r.ok) ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
