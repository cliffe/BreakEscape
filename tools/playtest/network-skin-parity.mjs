// Live parity runner for the network view's two skins (Ops S6 unit 25).
//
//   PATH=<node 22>/bin:$PATH PLAYWRIGHT_CHROMIUM_EXECUTABLE=<headless shell> \
//     node tools/playtest/network-skin-parity.mjs --base http://127.0.0.1:3017 [--out <dir>]
//
// Points at a keyless server that runs this worktree. It makes three FRESH games of `test_ops_skin` (as
// scenarios/test_ops_skin/PLAYTEST.md says: swap-scenario-game.rb; it never touches an existing game row)
// and plays one sequence in each with `window.__test.network.run`:
//   A  stays in Panels (a use by `select`, a use by drag);
//   B  stays in the Terminal (a use by `typed`, a use by `button`, the quick command);
//   C  presses the header switch after each step and calls `run` with no `path`.
// The player acts only through real clicks, key presses and drags. The runner never builds a request, never
// calls the server, and reads each game's server record only through the Rails runner (as verify-run.rb does).
//
// What is compared (any difference fails the run, exit code 1):
//   1. the requests: every POST to /network/*, to the sign-in route and to the share route (never the timed
//      GET /network), as method, path with the game id removed, and body, exactly equal across the games;
//   2. the answers, after `normaliseAnswer` (the removed keys are the one list REMOVED_KEYS, each with its reason);
//   3. each game's server record: footholds, sessions, opsDiscovered, opsFindings (aliases included), opsUsed,
//      the keyring's entries and, per log source, log_rows_for(source, compare: true).
// The sequence stops short of unplugging, so the record still holds the session the two uses opened. A sign-in or
// open hands the screen over to another minigame and sends no request of its own; the sequence leaves those out.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The ops fields of an answer: the parity claim is about these, so no list of removed keys may name one. */
export const OPS_FIELDS = Object.freeze(['finding', 'alias', 'status', 'reason', 'need', 'already']);

/**
 * Keys removed from an answer before two answers are compared, each with the reason it differs between two
 * correct games. Everything else, at any depth, is compared. Add a key only with a reason; never an ops field.
 */
export const REMOVED_KEYS = Object.freeze([
    { key: 'gameId', reason: 'the id of the game row: three fresh games have three ids' },
    { key: 'game_id', reason: 'the id of the game row: three fresh games have three ids' },
    { key: 'at', reason: 'a wall-clock time the server stamped' },
    { key: 'ts', reason: 'a wall-clock time the server stamped' },
    { key: 'time', reason: 'a wall-clock time the server stamped' },
    { key: 'expiresAt', reason: 'a wall-clock time the server stamped' },
    { key: 'gainedAt', reason: 'a wall-clock time the server stamped' }
]);

/** Throws when a list of removed keys names an ops field, repeats a key or leaves a reason out. */
export function checkRemovedList(list) {
    if (!Array.isArray(list)) throw new Error('the removed-keys list must be an array');
    const seen = new Set();
    for (const entry of list) {
        if (!entry || typeof entry.key !== 'string' || typeof entry.reason !== 'string' || !entry.reason.trim()) {
            throw new Error('every removed key needs a key and a reason');
        }
        if (OPS_FIELDS.includes(entry.key)) throw new Error(`"${entry.key}" is an ops field and may not be removed from an answer`);
        if (seen.has(entry.key)) throw new Error(`"${entry.key}" is listed twice`);
        seen.add(entry.key);
    }
    return true;
}

/** A copy of `answer` with the listed keys removed at every depth; nothing else changes. */
export function normaliseAnswer(answer, removed = REMOVED_KEYS) {
    checkRemovedList(removed);
    const drop = new Set(removed.map(e => e.key));
    const walk = (v) => {
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === 'object') {
            const out = {};
            for (const [k, x] of Object.entries(v)) if (!drop.has(k)) out[k] = walk(x);
            return out;
        }
        return v;
    };
    return walk(answer === undefined ? null : answer);
}

/** Request records kept: a POST to /network/*, the sign-in route or the share route. The timed GET /network is not. */
export function isRecorded(method, path) {
    if (String(method).toUpperCase() !== 'POST') return false;
    return /^\/network\//.test(path) || path === '/login' || /^\/(share|network_share)(\/|$)/.test(path);
}

/** `/break_escape/games/12/network/scan` becomes `/network/scan` (the game id, and what leads to it, removed). */
export function stripGameId(pathname) {
    return pathname.replace(/^.*?\/games\/\d+/, '') || '/';
}

/** One request record: { method, path, body }; body is the exact text sent. */
export const requestRecord = (method, pathname, body) => ({ method: String(method).toUpperCase(), path: stripGameId(pathname), body: body ?? '' });

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** The differences between named lists of requests: [{ games, index, a, b }]. Exact, byte for byte. */
export function compareRequests(named) {
    const names = Object.keys(named);
    const diffs = [];
    for (let i = 1; i < names.length; i++) {
        const a = named[names[0]], b = named[names[i]];
        const n = Math.max(a.length, b.length);
        for (let k = 0; k < n; k++) {
            const x = a[k], y = b[k];
            if (!x || !y || x.method !== y.method || x.path !== y.path || x.body !== y.body) {
                diffs.push({ games: `${names[0]} / ${names[i]}`, index: k, [names[0]]: x ?? null, [names[i]]: y ?? null });
            }
        }
    }
    return diffs;
}

/** The differences between named values, compared whole: [{ games, a, b }]. */
export function compareValues(named, label) {
    const names = Object.keys(named);
    const diffs = [];
    for (let i = 1; i < names.length; i++) {
        if (!same(named[names[0]], named[names[i]])) diffs.push({ what: label, games: `${names[0]} / ${names[i]}`, [names[0]]: named[names[0]], [names[i]]: named[names[i]] });
    }
    return diffs;
}

/** The sequence. `A` and `B` name the path each fixed-skin game uses; C names none. `find` picks the offer. */
export const STEPS = Object.freeze([
    // The server sends `ops: true` for a discovery network only once it is swept, so the view has no Terminal
    // (and no switch) before the sweep: the first step is a press of the button in every game.
    { name: 'sweep', find: { action: 'sweep', ids: { networkId: 'office_lan' } }, A: 'button', B: 'button' },
    { name: 'scan files01', find: { action: 'scan', ids: { hostId: 'files01' } }, A: 'button', B: 'typed' },
    { name: 'check storage', find: { action: 'check', ids: { hostId: 'files01', service: 'storage' } }, A: 'button', B: 'typed' },
    { name: 'confirm entry_a', find: { action: 'confirm', ids: { findingId: 'files01.storage.entry_a' } }, A: 'button', B: 'typed' },
    { name: 'confirm entry_b', find: { action: 'confirm', ids: { findingId: 'files01.storage.entry_b' } }, A: 'button', B: 'typed' },
    { name: 'confirm entry_c', find: { action: 'confirm', ids: { findingId: 'files01.storage.entry_c' } }, A: 'button', B: 'typed' },
    { name: 'use settings note on the decoy (refused)', find: { action: 'use', ids: { techniqueId: 'settings_review', findingId: 'files01.storage.entry_b' } }, A: 'select', B: 'typed' },
    { name: 'use update note on entry_a', find: { action: 'use', ids: { techniqueId: 'update_notes', findingId: 'files01.storage.entry_a' } }, A: 'select', B: 'typed' },
    { name: 'use settings note on entry_c', find: { action: 'use', ids: { techniqueId: 'settings_review', findingId: 'files01.storage.entry_c' } }, A: 'drag', B: 'button' }
]);

const GAMES = Object.freeze({ A: { skin: 'gui' }, B: { skin: 'cli' }, C: { skin: 'gui' } });
const WANTED_SKIN = Object.freeze({ A: 'gui', B: 'cli' });

const CARDS = Object.freeze(['Field note: file server updates', 'Field note: reviewing settings']);

// The record of one game, read by the Rails runner as verify-run.rb --access and --ops-log read it. Times are
// not compared: log_rows_for(compare: true) has none, and RECORD_TIMES lists the keys dropped from the rest.
export const RECORD_TIMES = Object.freeze([
    { key: 'at', reason: 'a wall-clock time the server stamped' },
    { key: 'gainedAt', reason: 'a wall-clock time the server stamped' },
    { key: 'expiresAt', reason: 'a wall-clock time the server stamped' },
    { key: 'expiresInS', reason: 'seconds left on a token: it counts down in real time' },
    { key: 'rev', reason: 'a digest of the keyring that holds the stamped times' }
]);

const RECORD_RUBY = `
require 'json'
g = BreakEscape::Game.find(ARGV_ID)
ps = g.player_state || {}
sources = ps['opsLog'].is_a?(Hash) ? ps['opsLog'].keys.sort : []
out = {
  'footholds' => ps['footholds'], 'sessions' => ps['sessions'], 'opsDiscovered' => ps['opsDiscovered'],
  'opsFindings' => ps['opsFindings'], 'opsUsed' => ps['opsUsed'],
  'keyring' => g.keyring_for_client[:entries],
  'logs' => sources.map { |s| [s, g.log_rows_for(s, compare: true)] }.to_h
}
puts 'RECORD=' + JSON.generate(out)
`;

function railsEnv() {
    const env = { ...process.env };
    delete env.BUNDLE_PATH;
    for (const k of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY']) delete env[k];
    env.BREAK_ESCAPE_STANDALONE = 'true';
    if (!env.RBENV_VERSION) env.RBENV_VERSION = '3.1.6';
    if (!/rbenv/.test(env.PATH || '')) env.PATH = `/opt/rbenv/bin:/opt/rbenv/shims:${env.PATH || ''}`;
    return env;
}

function rails(args) {
    return execFileSync('bin/rails', ['runner', ...args], { cwd: ROOT, env: railsEnv(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/** A fresh game of test_ops_skin, made as PLAYTEST.md says. */
function makeGame() {
    const out = rails(['tools/playtest/swap-scenario-game.rb', 'test_access_signin', 'test_ops_skin']);
    const id = Number((out.match(/GAME_ID=(\d+)/) || [])[1]);
    if (!id) throw new Error(`no GAME_ID in the game maker's output:\n${out.slice(-400)}`);
    return id;
}

function readRecord(id) {
    const out = rails([RECORD_RUBY.replace('ARGV_ID', String(id))]);
    const line = out.split('\n').find(l => l.startsWith('RECORD='));
    if (!line) throw new Error(`no RECORD line for game ${id}:\n${out.slice(-400)}`);
    return normaliseAnswer(JSON.parse(line.slice('RECORD='.length)), RECORD_TIMES);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Open the game in a browser context of its own, clear the opening screens, plant the box. */
async function openGame(browser, base, id, skin, log) {
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    await context.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) { /* none */ } });
    const page = await context.newPage();
    const requests = [];
    page.on('request', (req) => {
        const u = new URL(req.url());
        if (isRecorded(req.method(), stripGameId(u.pathname))) requests.push(requestRecord(req.method(), u.pathname, req.postData()));
    });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
    await page.goto(`${base}/break_escape/games/${id}?skip_resume=1&net_skin=${skin}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
    const T = (fn, ...a) => page.evaluate(fn, ...a);
    const clear = async () => {
        for (let i = 0; i < 12; i++) {
            const s = await T(() => { const st = window.__test.getState(); return { mg: st.activeMinigame, bl: st.blockingUi }; });
            if (s.mg) { await T(() => window.__test.minigame.close()); await sleep(300); continue; }
            if (s.bl) { await T(() => window.__test.dismissBlockingUi?.()); await sleep(300); continue; }
            break;
        }
    };
    await sleep(3000);
    await clear();
    const retry = async (fn) => { let r; for (let i = 0; i < 5; i++) { await clear(); r = await fn(); if (r?.ok || !/minigame/.test(r?.reason || '')) return r; } return r; };
    const interact = (oid) => retry(() => T((o) => window.__test.interact(o), oid));

    // The two field notes from the cabinet, then the drop box, then the office port: what the sign in the lobby says
    const cab = await interact('lobby_cabinet');
    if (!cab?.ok) throw new Error(`game ${id}: the cabinet would not open: ${JSON.stringify(cab).slice(0, 200)}`);
    await sleep(500);
    for (const name of CARDS) { await T((n) => window.__test.minigame.take(n), name); await sleep(300); }
    await clear();
    const kit = await interact('kit_dropbox');
    if (!kit?.ok) throw new Error(`game ${id}: the drop box would not be taken: ${JSON.stringify(kit).slice(0, 200)}`);
    await sleep(500);
    const port = await interact('office_port');
    if (!port?.ok) throw new Error(`game ${id}: the office port would not open: ${JSON.stringify(port).slice(0, 200)}`);
    await sleep(500);
    await T(() => window.__test.dismissBlockingUi('Plug it in'));
    for (let i = 0; i < 60; i++) {
        const st = await T(() => window.__test.network.state());
        if (st.skin && st.offers.some(o => o.action === 'sweep')) { log(`game ${id}: view open in ${st.skin}, switch ${st.hasSwitch}`); return { page, context, requests, errors }; }
        await sleep(500);
    }
    throw new Error(`game ${id}: the network view did not open after the plug`);
}

/** One step of the sequence on one game; resolves { path, sent, answer }. */
async function doStep(page, step, mode) {
    const offer = await page.evaluate((find) => {
        const hit = window.__test.network.state().offers.find(o => o.action === find.action
            && Object.entries(find.ids).every(([k, v]) => o.ids?.[k] === v));
        return hit || null;
    }, step.find);
    if (!offer) {
        const listed = await page.evaluate(() => window.__test.network.state().offers.map(o => `${o.action} ${JSON.stringify(o.ids)}`));
        const where = await page.evaluate(() => JSON.stringify({ mg: window.__test.minigame.which?.() ?? null, net: window.__test.network.state().skin, holds: window.__test.access.footholds().map(f => f.id) }));
        throw new Error(`step "${step.name}": the offer is not listed (listed: ${listed.join('; ')}; ${where})`);
    }
    const path = mode === 'C' ? undefined : step[mode];
    if (path === 'drag') return dragUse(page, step, offer);
    return page.evaluate(({ offer, path }) => window.__test.network.run(offer, path ? { path } : {}), { offer, path });
}

/** A use by drag in Panels: a real pointer drag of the card onto the finding (Playwright's mouse), the answer heard on the scene's hook. */
async function dragUse(page, step, offer) {
    const tech = offer.ids.techniqueId;
    const alias = await page.evaluate((findingId) => {
        const st = window.MinigameFramework.currentMinigame.getTestState();
        const rows = [...(st.rows || []), ...(st.networks || []).flatMap(b => b.rows || [])];
        for (const r of rows) { const f = (r.findings || []).find(x => x.id === findingId); if (f) return { host: r.id, alias: f.alias }; }
        return null;
    }, offer.ids.findingId);
    if (!alias) throw new Error('drag: the finding is not listed');
    await page.evaluate(() => {
        const scene = window.MinigameFramework.currentMinigame;
        window.__parityHeard = null; window.__paritySent = false;
        const ended = scene.onEnded, sent = scene.onSent;
        scene.onSent = function (o, ...r) { if (o?.action === 'use') window.__paritySent = true; return sent?.call(this, o, ...r); };
        scene.onEnded = function (o, a, ...r) { try { return ended?.call(this, o, a, ...r); } finally { if (o?.action === 'use') window.__parityHeard = { answer: a ?? null }; } };
        window.__parityRestore = () => { scene.onEnded = ended; scene.onSent = sent; };
    });
    try {
        const card = page.locator(`[data-technique="${tech}"]`).first();
        const target = page.locator(`[data-host-id="${alias.host}"] [data-finding="${alias.alias}"]`).first();
        await card.dragTo(target);
        for (let i = 0; i < 60; i++) {
            const heard = await page.evaluate(() => window.__parityHeard);
            if (heard) return { ok: true, path: 'drag', sent: await page.evaluate(() => window.__paritySent), answer: heard.answer };
            await sleep(250);
        }
        throw new Error(`step "${step.name}": no answer to the drag within 15 s`);
    } finally {
        await page.evaluate(() => window.__parityRestore?.());
    }
}

/**
 * A use that opens a session hands the screen over to the server's own desktop, as the game means it to (the view
 * closes). The player closes that screen, and if the view is not back, plugs into the port again to see it.
 */
async function backToView(page, log, waitForHandover = false) {
    const open = () => page.evaluate(() => window.__test.network.state().skin !== null);
    // A session's desktop opens a moment after the answer: give it time to replace the view
    for (let i = 0; waitForHandover && i < 16 && (await open()); i++) await sleep(250);
    for (let i = 0; i < 8 && !(await open()); i++) {
        const mg = await page.evaluate(() => window.__test.getState().activeMinigame);
        if (!mg) break;
        await page.evaluate(() => window.__test.minigame.close());
        await sleep(600);
    }
    if (await open()) return false;
    const r = await page.evaluate(() => window.__test.interact('office_port'));
    if (!r?.ok) throw new Error(`the view would not reopen: ${JSON.stringify(r).slice(0, 200)}`);
    for (let i = 0; i < 40 && !(await open()); i++) await sleep(250);
    if (!(await open())) throw new Error('the view did not reopen at the port');
    log('  (the session handed the screen over; closed it and reopened the view)');
    return true;
}

/** Play the whole sequence on one game. */
async function play(page, mode, log, notes) {
    const answers = [];
    for (const step of STEPS) {
        const r = await doStep(page, step, mode);
        answers.push({ step: step.name, path: r.path, sent: r.sent, answer: normaliseAnswer(r.answer) });
        log(`  ${mode} ${step.name}: ${r.path}, sent ${r.sent}`);
        await sleep(600);
        await backToView(page, log, step.find.action === 'use');
        if (mode !== 'C') {
            // A fixed-skin game must be in its own skin once the view has ops (it is Panels before the sweep)
            const want = WANTED_SKIN[mode];
            for (let i = 0; i < 12 && (await page.evaluate(() => window.__test.network.skin())) !== want; i++) await sleep(250);
            const now = await page.evaluate(() => window.__test.network.skin());
            if (now !== want) notes.push({ step: step.name, game: mode, wanted: want, found: now });
        }
        if (mode === 'C') {
            const before = await page.evaluate(() => window.__test.network.skin());
            const to = before === 'gui' ? 'cli' : 'gui';
            const sw = await page.evaluate((n) => window.__test.network.setSkin(n), to);
            if (!sw.changed || sw.skin !== to) throw new Error(`step "${step.name}": the switch did not reach ${to}`);
            await sleep(300);
        }
    }
    return answers;
}

export async function main(argv = process.argv.slice(2)) {
    const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
    const base = (opt('base', '') || '').replace(/\/$/, '');
    if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) { console.error('--base http://127.0.0.1:<port> is required (a keyless server running this worktree)'); return 2; }
    const port = Number(base.split(':').pop());
    if ([3000, 3001, 3002, 3085, 3086, 3011, 3012, 3013, 3014, 3015, 3016].includes(port)) { console.error(`port ${port} is not for this runner`); return 2; }
    const out = opt('out', null);
    const log = (...a) => console.log(...a);
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
    const ids = {}, requests = {}, answers = {}, records = {}, errors = {}, notes = [];
    try {
        for (const name of Object.keys(GAMES)) {
            ids[name] = makeGame();
            log(`game ${name}: ${ids[name]} (${GAMES[name].skin} first)`);
        }
        for (const name of Object.keys(GAMES)) {
            const g = await openGame(browser, base, ids[name], GAMES[name].skin, log);
            answers[name] = await play(g.page, name, log, notes);
            requests[name] = g.requests;
            errors[name] = g.errors;
            await g.context.close();
            records[name] = readRecord(ids[name]);
        }
    } finally {
        await browser.close();
    }
    const diffs = [
        ...notes.map(n => ({ what: 'skin', ...n })),
        ...compareRequests(requests).map(d => ({ what: 'requests', ...d })),
        ...compareValues(Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.map(a => ({ step: a.step, sent: a.sent, answer: a.answer }))])), 'answers'),
        ...Object.keys(records.A).flatMap(key => compareValues(Object.fromEntries(Object.keys(records).map(n => [n, records[n][key]])), `record.${key}`))
    ];
    const report = { ids, requestCounts: Object.fromEntries(Object.entries(requests).map(([k, v]) => [k, v.length])), differences: diffs, pageErrors: errors };
    if (out) { mkdirSync(out, { recursive: true }); writeFileSync(join(out, 'parity-report.json'), JSON.stringify({ ...report, requests, answers, records }, null, 2)); }
    log(JSON.stringify(report, null, 2));
    log(diffs.length ? `FAIL: ${diffs.length} difference(s)` : 'PASS: requests, answers and server records are equal across the three games');
    return diffs.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    main().then(code => process.exit(code), (e) => { console.error(e); process.exit(1); });
}
