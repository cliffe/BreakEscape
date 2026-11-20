// Overlap survey (overlap menu plan 8.3): per scenario, how many interactable things lie on top of
// each other, so the pick menu's reach is known before it ships to a mission.
//
//   node tools/overlap_survey.mjs --port 3468 --game m01_first_contact=5788 [--game lab_x=5790] \
//        [--new m02_ransomed_trust] [--sample test_needs_sims=5800] [--out survey.json] [--exe <chrome>]
//
// --game name=gid   a game already made on the keyless server (tools/playtest/new-game.rb).
// --new name        makes the game by running new-game.rb with every room unlocked (needs BREAK_ESCAPE_STANDALONE=true and
//                   BUNDLE_PATH in the environment, like the other playtest tools; never runs a db: task).
// --sample name=gid also samples the scenario's NPC positions every 10 s over one routine cycle
//                   (--sample-seconds, default 120) and counts how often an NPC's figure overlaps an
//                   object's pixels.
// For every room (loadRoom) it counts pairs of interactable things whose OPAQUE pixels intersect
// (objects, NPCs where they stand at load, shut doors), by room and by type pair, lists sprites whose
// alpha could not be read (a sprite whose texture cannot be sampled counts as no overlap), and
// lists rooms with a hostile NPC at load. Output: JSON on stdout (and --out), plus a readable summary.
// Boot as the other tools: ?skip_resume=1, setFPS(20) with fixed steps ON (never fixedStep=false).
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const DEFAULT_EXE = join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell');

export function parseArgs(argv) {
    const o = { port: null, games: [], news: [], samples: [], out: null, exe: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || DEFAULT_EXE, sampleSeconds: 120 };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i], v = () => argv[++i];
        if (a === '--port') o.port = Number(v());
        else if (a === '--game') o.games.push(v());
        else if (a === '--new') o.news.push(v());
        else if (a === '--sample') o.samples.push(v());
        else if (a === '--out') o.out = v();
        else if (a === '--exe') o.exe = v();
        else if (a === '--sample-seconds') o.sampleSeconds = Number(v());
        else return { error: `unknown argument ${a}` };
    }
    if (!o.port) return { error: '--port is required' };
    if (!o.games.length && !o.news.length && !o.samples.length) return { error: 'give at least one --game, --new or --sample' };
    for (const g of [...o.games, ...o.samples]) if (!/^[^=]+=\d+$/.test(g)) return { error: `bad name=gid: ${g}` };
    return o;
}

/** Page-side survey of the room the player is in. Returns plain data. */
function surveyRoomInPage(roomId) {
    const r = window.rooms?.[roomId];
    if (!r) return null;
    const things = [], unreadable = [], hostile = [];
    const add = (id, type, s) => { if (s && s.visible !== false && s.getBounds) things.push({ id, type, s }); };
    for (const o of Object.values(r.objects || {})) if (o && o.visible && o.interactable && o.scenarioData) add(o.scenarioData.id || o.objectId, o.scenarioData.type || 'object', o);
    for (const n of (r.npcSprites || [])) if (n && n.npcId) {
        if (window.npcHostileSystem?.isNPCHostile?.(n.npcId)) hostile.push(n.npcId);
        if (window.npcHostileSystem?.isNPCKO?.(n.npcId)) continue;
        add('npc:' + n.npcId, 'npc', n);
    }
    for (const d of (r.doorSprites || window.doorSprites || [])) if (d?.doorProperties && !d.doorProperties.open && d.visible) add(`door:${d.doorProperties.roomId}->${d.doorProperties.connectedRoom}`, 'door', d);
    const alpha = (s, wx, wy) => {
        try {
            const b = s.getBounds();
            if (wx < b.left || wx >= b.right || wy < b.top || wy >= b.bottom) return 0;
            let lx = (wx - b.left) / Math.abs(s.scaleX || 1), ly = (wy - b.top) / Math.abs(s.scaleY || 1);
            if (s.flipX) lx = s.frame.realWidth - 1 - lx;
            const a = s.scene.textures.getPixelAlpha(Math.floor(lx), Math.floor(ly), s.texture.key, s.frame.name);
            if (a === null || a === undefined) throw new Error('no alpha');
            return a;
        } catch (e) { return null; }
    };
    for (const t of things) { const b = t.s.getBounds(); if (alpha(t.s, b.left + b.width / 2, b.top + b.height / 2) === null) unreadable.push(t.id); }
    const pairs = [];
    for (let i = 0; i < things.length; i++) for (let j = i + 1; j < things.length; j++) {
        const A = things[i], B = things[j], ba = A.s.getBounds(), bb = B.s.getBounds();
        const L = Math.max(ba.left, bb.left), Rr = Math.min(ba.right, bb.right), T = Math.max(ba.top, bb.top), Bt = Math.min(ba.bottom, bb.bottom);
        if (L >= Rr || T >= Bt) continue;
        let n = 0;
        for (let y = Math.ceil(T); y < Bt; y++) for (let x = Math.ceil(L); x < Rr; x++) if (alpha(A.s, x + .5, y + .5) > 0 && alpha(B.s, x + .5, y + .5) > 0) n++;
        if (n) pairs.push({ a: A.id, b: B.id, types: [A.type, B.type].sort().join('+'), pixels: n });
    }
    return { things: things.length, pairs, unreadable, hostile };
}

/** NPC figures over object pixels right now (for the routine sample). */
function sampleOverlapInPage() {
    const out = [];
    const alpha = (s, wx, wy) => { try { const b = s.getBounds(); if (wx < b.left || wx >= b.right || wy < b.top || wy >= b.bottom) return 0; let lx = (wx - b.left) / Math.abs(s.scaleX || 1), ly = (wy - b.top) / Math.abs(s.scaleY || 1); if (s.flipX) lx = s.frame.realWidth - 1 - lx; return s.scene.textures.getPixelAlpha(Math.floor(lx), Math.floor(ly), s.texture.key, s.frame.name) || 0; } catch (e) { return 0; } };
    for (const r of Object.values(window.rooms || {})) {
        const objs = Object.values(r.objects || {}).filter(o => o && o.visible && o.interactable && o.scenarioData);
        for (const n of (r.npcSprites || [])) {
            if (!n.npcId || !n.visible) continue;
            const nb = n.getBounds();
            for (const o of objs) {
                const ob = o.getBounds(); const L = Math.max(nb.left, ob.left), Rr = Math.min(nb.right, ob.right), T = Math.max(nb.top, ob.top), B = Math.min(nb.bottom, ob.bottom);
                if (L >= Rr || T >= B) continue;
                let hit = false;
                for (let y = Math.ceil(T); y < B && !hit; y++) for (let x = Math.ceil(L); x < Rr; x++) if (alpha(n, x + .5, y + .5) > 0 && alpha(o, x + .5, y + .5) > 0) { hit = true; break; }
                if (hit) out.push(`${n.npcId}|${o.scenarioData.id || o.objectId}`);
            }
        }
    }
    return out;
}

async function bootGame(chromium, exe, port, gid) {
    const browser = await chromium.launch({ headless: true, executablePath: exe });
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) { /* none */ } });
    await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.__test && window.gameScenario && window.rooms && window.player?.body, null, { timeout: 120000 });
    await page.evaluate(ms => window.__test.waitUntilReady({ timeoutMs: ms }), 90000).catch(() => {});
    await page.evaluate(() => { const l = window.game.sys.game.loop; l.smoothStep = false; l.minFps = 1; window.game.physics.world.setFPS(20); });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 6; i++) {
        const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
        if (!busy) break;
        await page.keyboard.press('Enter'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    }
    return { browser, page, errs };
}

export async function surveyGame(chromium, exe, port, name, gid, { sampleSeconds = 0 } = {}) {
    const { browser, page, errs } = await bootGame(chromium, exe, port, gid);
    const res = { name, gid, rooms: {}, totals: { rooms: 0, things: 0, pairs: 0 }, byTypePair: {}, unreadable: [], hostileRooms: [] };
    try {
        const ids = await page.evaluate(() => Object.keys(window.gameScenario.rooms));
        for (const id of ids) {
            // loadRoom, not enterRoom: the room is read where it stands, without walking the player there.
            // The server refuses a locked room, so a game made by --new has every room unlocked.
            await page.evaluate(r => window.loadRoom(r), id).catch(() => {});
            await page.waitForTimeout(800);
            const s = await page.evaluate(surveyRoomInPage, id);
            if (!s) { res.rooms[id] = { note: 'not loaded (locked or missing)' }; continue; }
            res.rooms[id] = { things: s.things, pairs: s.pairs };
            res.totals.rooms++; res.totals.things += s.things; res.totals.pairs += s.pairs.length;
            for (const p of s.pairs) res.byTypePair[p.types] = (res.byTypePair[p.types] || 0) + 1;
            for (const u of s.unreadable) res.unreadable.push(`${id}/${u}`);
            if (s.hostile.length) res.hostileRooms.push({ room: id, npcs: s.hostile });
        }
        if (sampleSeconds > 0) {
            const counts = {}; let samples = 0, withAny = 0;
            for (let t = 0; t <= sampleSeconds; t += 10) {
                const o = await page.evaluate(sampleOverlapInPage); samples++;
                if (o.length) withAny++;
                for (const k of new Set(o)) counts[k] = (counts[k] || 0) + 1;
                if (t < sampleSeconds) await page.waitForTimeout(10000);
            }
            res.routine = { samples, samplesWithAnOverlap: withAny, pairSamples: counts };
        }
    } finally { res.pageErrors = errs; await browser.close(); }
    return res;
}

export function summarise(r) {
    const lines = [`${r.name} (game ${r.gid}): ${r.totals.rooms} rooms, ${r.totals.things} things, ${r.totals.pairs} overlapping pairs`];
    for (const [k, v] of Object.entries(r.byTypePair).sort((a, b) => b[1] - a[1])) lines.push(`  ${k}: ${v}`);
    for (const [id, v] of Object.entries(r.rooms)) if (v.pairs?.length) lines.push(`  ${id}: ` + v.pairs.map(p => `${p.a}x${p.b}(${p.pixels}px)`).join(', '));
    if (r.unreadable.length) lines.push(`  alpha unreadable: ${r.unreadable.join(', ')}`);
    if (r.hostileRooms.length) lines.push(`  hostile at load: ${r.hostileRooms.map(h => `${h.room}[${h.npcs.join(',')}]`).join(', ')}`);
    if (r.routine) lines.push(`  routine sample: ${r.routine.samplesWithAnOverlap}/${r.routine.samples} samples had an NPC figure on an object's pixels; ` + Object.entries(r.routine.pairSamples).map(([k, v]) => `${k}:${v}`).join(', '));
    return lines.join('\n');
}

async function main() {
    const o = parseArgs(process.argv.slice(2));
    if (o.error) { console.error(o.error); process.exit(2); }
    const { chromium } = await import('playwright');
    const jobs = o.games.map(g => [...g.split('='), 0]);
    for (const n of o.news) {
        const make = (extra) => /GAME_ID=(\d+)/.exec(execFileSync('bundle', ['exec', 'rails', 'runner', 'tools/playtest/new-game.rb', n, ...extra],
            { env: { ...process.env, PLAYTEST_PORT: String(o.port) }, encoding: 'utf8' }))?.[1];
        // One plain game to read the room ids, then the one that is surveyed, with every room unlocked
        const first = make([]);
        if (!first) { console.error(`no game made for ${n}`); continue; }
        const probe = await bootGame(chromium, o.exe, o.port, first);
        const ids = await probe.page.evaluate(() => Object.keys(window.gameScenario.rooms));
        await probe.browser.close();
        const gid = make(ids.flatMap(r => ['--unlock', r]));
        if (!gid) { console.error(`no unlocked game made for ${n}`); continue; }
        jobs.push([n, gid, 0]);
    }
    for (const s of o.samples) jobs.push([...s.split('='), o.sampleSeconds]);
    const all = [];
    for (const [name, gid, sampleSeconds] of jobs) {
        try { const r = await surveyGame(chromium, o.exe, o.port, name, gid, { sampleSeconds }); all.push(r); console.error(summarise(r)); }
        catch (e) { all.push({ name, gid, error: String(e).slice(0, 300) }); console.error(`${name}: ${String(e).slice(0, 200)}`); }
    }
    if (o.out) fs.writeFileSync(o.out, JSON.stringify(all, null, 1));
    console.log(JSON.stringify(all));
}
if (import.meta.url === `file://${process.argv[1]}`) main();
