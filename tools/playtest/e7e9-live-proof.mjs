// E7 to E9 live proof (OFFICE_LIFE_MISSIONS_PLAN 9.1) on test_needs_sims and copies of it.
// Needs a keyless server from the build's worktree on PORT (default 3088). Headless, setFPS(20)
// with Arcade's fixed steps left on. Games come from tools/playtest/new-game.rb unless an id is given.
//
//   node tools/playtest/e7e9-live-proof.mjs <mode> [gameId]
//
// Modes:
//   probe      walkability and routes of the kitchen cooler's side cells (E8 set-up check)
//   e7         a coupled cooler break with the player in the office, then walking in
//   e9neg      Sanjay (the rota exchange's first speaker) sent first, so Rosa stands on the open
//              east side; the player stands east of Rosa, in her earshot and out of his
//   e9pos      Rosa sent first, the player by Sanjay; runs to the end of the exchange
//   e9unheard  as e9pos, but the player is moved to the office on the tick the exchange starts,
//              so it plays to the end with no line heard
//   parcel     exchange_tom_parcel at the office coffee (amara_opened_parcel set), player by Tom
//   e8         five coupled breaks (BREAKS=n) on a copy with the cooler's right cell blocked;
//              E8_BLOCK_ABOVE=1 when the copy blocks the above cell too (expects no_beside_cell)
//
//   e7 options (R1 rerun): COUPLED_ONLY=1 sends Rosa only and lets the scenario's coupling send
//   Sanjay; LATE_MS=n walks the player in (placed beside the pair) once n ms or less of the overlap
//   is left; SECOND_BREAK=1 runs a second coupled break with the player kept in the office and
//   compares both bags before and after it.
//
// Every bag draw (_bagNext) is logged with the needs clock, and every chat line with its bubble's
// end and the pair's overlap end, so a run shows whether any line was drawn and not said, drawn
// unheard, or said past the overlap (out.drawCheck).
//
// Env: PORT, SHOTS (screenshot folder), MISSION (default test_needs_sims), BREAKS.
// Everything the harness changes is in the page only; the output JSON lists it.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

const PORT = Number(process.env.PORT || 3088), BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.SHOTS || '.';
const mode = process.argv[2] || 'probe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function newGame(mission) {
    const out = execFileSync('bundle', ['exec', 'rails', 'runner', 'tools/playtest/new-game.rb', mission], {
        env: { ...process.env, PLAYTEST_PORT: String(PORT), BREAK_ESCAPE_STANDALONE: 'true' }, encoding: 'utf8'
    });
    return Number(out.match(/GAME_ID=(\d+)/)[1]);
}

const consoleErrors = [];
async function open(browser, id) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    page.on('pageerror', e => { consoleErrors.push('pageerror ' + String(e).slice(0, 200)); });
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* blocked */ } });
    if (process.env.ENGINE) {
        // A before case: serve another revision's npc-needs.js to this page only (no file changes).
        // E7 to E9 touch that module alone and add no import, so the rest of the engine is shared.
        const src = execFileSync('git', ['show', `${process.env.ENGINE}:public/break_escape/js/systems/npc-needs.js`], { encoding: 'utf8', maxBuffer: 64 << 20 });
        await page.route(/\/js\/systems\/npc-needs\.js(\?|$)/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: src }));
    }
    await page.goto(`${BASE}/break_escape/games/${id}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    // 20 fps, fixed steps on (never fixedStep=false: it tunnels 8 px walls)
    await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
    await clearUi(page);
    return page;
}

async function clearUi(page) {
    for (let i = 0; i < 20; i++) {
        const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame, bl: s.blockingUi }; });
        if (st.mg) { await page.evaluate(() => window.__test.minigame.close()); await sleep(600); continue; }
        if (st.bl) {
            const pick = st.bl.buttons.map(x => x.label).find(l => /no,|figure it out|continue|ok|close/i.test(l)) || st.bl.buttons[0].label;
            await page.evaluate(l => window.__test.dismissBlockingUi(l), pick); await sleep(800); continue;
        }
        break;
    }
}

// Record the needs events the proof reads, with the needs clock and the player's room
async function record(page) {
    await page.evaluate(() => {
        const sys = window.npcNeedsSystem;
        window.__ev = [];
        const orig = sys._emit.bind(sys);
        sys._emit = (n, d) => {
            if (/^npc_(chatted|overheard|exchange_heard|job_failed|use_started|left_post|used|queued)/.test(n)) {
                const e = { n, d: { ...d }, t: sys.clockMs, room: window.currentPlayerRoom };
                const c = n.startsWith('npc_chatted:') ? sys._chats.get(d.objectId) : null;
                if (c?.current) {
                    const A = sys.states.get(c.a), B = sys.states.get(c.b);
                    e.until = c.current.until;
                    e.overlapEnd = c.queue ? A?.job?.useUntil : Math.min(A?.job?.useUntil ?? Infinity, B?.job?.useUntil ?? Infinity);
                }
                window.__ev.push(e);
            }
            return orig(n, d);
        };
        window.__draws = [];
        const bag = sys._bagNext.bind(sys);
        sys._bagNext = (npcId, topic, lines) => { const idx = bag(npcId, topic, lines); window.__draws.push({ t: sys.clockMs, npcId, topic, idx }); return idx; };
    });
}

const snap = (page, pair = ['sanjay', 'rosa'], oid = 'water_cooler') => page.evaluate(([pair, oid]) => {
    const sys = window.npcNeedsSystem;
    const pos = id => { const p = sys.world.npcPos(id); return p ? { x: Math.round(p.x), y: Math.round(p.y), room: p.roomId } : null; };
    const pl = window.player?.body?.center;
    const job = id => { const j = sys.states.get(id)?.job; return j ? { phase: j.phase, target: j.targetId, dest: j.dest && { x: Math.round(j.dest.x), y: Math.round(j.dest.y) } } : null; };
    const g = window.gameState?.globalVariables || {};
    const task = t => window.objectivesManager?.getTask?.(t)?.status || null;
    const out = { t: sys.clockMs, room: window.currentPlayerRoom, player: pl ? { x: Math.round(pl.x), y: Math.round(pl.y) } : null };
    for (const id of pair) out[id] = { pos: pos(id), job: job(id) };
    out.bags = Object.fromEntries(pair.map(id => [id, JSON.stringify(sys._bags.get(`${id}|cooler`) || null)]));
    out.chat = (() => { const c = sys._chats.get(oid); return c ? { a: c.a, b: c.b, n: c.n, exDone: !!c.exDone, ex: c.ex ? { knot: c.ex.knot, i: c.ex.i, heardLines: c.ex.heardLines } : null } : null; })();
    out.heard = { rota: g.heard_exchange_rosa_rota, parcel: g.heard_exchange_tom_parcel };
    out.tasks = { hear_rota_exchange: task('hear_rota_exchange'), hear_parcel_exchange: task('hear_parcel_exchange') };
    return out;
}, [pair, oid]);
const events = page => page.evaluate(() => window.__ev);
// Each draw must be a line said on the same tick, heard, and ending inside the overlap
async function drawCheck(page) {
    const [ev, draws] = await Promise.all([events(page), page.evaluate(() => window.__draws)]);
    const said = ev.filter(e => e.n.startsWith('npc_chatted:') && e.d.line && !e.d.exchange);
    const rows = draws.map(d => {
        const e = said.find(x => x.t === d.t && x.d.speakerId === d.npcId && x.d.lineId === `${d.topic}:${d.idx}`);
        return { ...d, said: !!e, overheard: e ? e.d.overheard : null, until: e?.until ?? null, overlapEnd: e?.overlapEnd ?? null, inOverlap: e ? e.until <= e.overlapEnd : null };
    });
    return {
        draws: rows.length,
        drawnNotSaid: rows.filter(r => !r.said).length,
        drawnUnheard: rows.filter(r => r.said && !r.overheard).length,
        pastOverlap: rows.filter(r => r.said && !r.inOverlap).length,
        rows
    };
}
const usingBoth = (s, a, b, oid) => s[a].job?.phase === 'using' && s[b].job?.phase === 'using' && s[a].job.target === oid && s[b].job.target === oid;
const both = s => usingBoth(s, 'sanjay', 'rosa', 'water_cooler');

async function setup(page, rooms = ['lounge', 'office', 'kitchen', 'office']) {
    for (const r of rooms) {
        const res = await page.evaluate(r => window.__test.enterRoom(r), r);
        if (!res?.ok) console.error('enterRoom', r, JSON.stringify(res).slice(0, 200));
        await clearUi(page);
    }
    // Off the kitchen doorway: needs walks do not yield to the player, who would block it
    const m = await page.evaluate(() => window.__test.moveTo(90, 220, { timeoutMs: 8000 }));
    await sleep(1000);
    await record(page);
    return m;
}

async function waitFor(page, pred, ms, step = 150, pair, oid) {
    const end = Date.now() + ms;
    while (Date.now() < end) { const s = await snap(page, pair, oid); if (pred(s)) return s; await sleep(step); }
    return null;
}

const longUse = (page, oid = 'water_cooler', secs = 40) => page.evaluate(([oid, secs]) => {
    const o = window.npcNeedsSystem.world.getObject(oid); o.affordance.useSeconds = secs;
    return window.npcNeedsSystem.world.getObject(oid).affordance.useSeconds;
}, [oid, secs]);

const exLog = page => page.evaluate(() => window.__test.needs.log().filter(e => /exchange|job_failed|timeout|no_beside/.test(e.ev)));
const chatRows = (ev, oid = 'water_cooler') => ev.filter(e => e.n.startsWith(`npc_chatted:${oid}`)).map(e => [e.t, e.d.speakerId, e.d.lineId, e.d.overheard, e.d.playerDistance, e.room]);

async function probe(page, out) {
    await page.waitForFunction(() => !!window.npcNeedsSystem.world.getObject('water_cooler'), null, { timeout: 30000 });
    Object.assign(out, await page.evaluate(() => {
        const sys = window.npcNeedsSystem, pm = window.pathfindingManager, w = sys.world;
        const k = window.rooms.kitchen, o = w.getObject('water_cooler');
        const ap = w.approachCell(o);
        const cells = { approach: ap, right: { x: ap.x + 32, y: ap.y }, left: { x: ap.x - 32, y: ap.y }, below: { x: ap.x, y: ap.y + 32 }, above: { x: ap.x, y: ap.y - 32 } };
        const posts = { sanjay: w.npcPos('sanjay'), rosa: w.npcPos('rosa') };
        const res = {};
        for (const [n, c] of Object.entries(cells)) {
            const wk = pm.findNearestWalkableWorldCell(c.x, c.y, 0);
            res[n] = { at: c, walkable: wk, fromSanjay: wk && w.routeLength(posts.sanjay, wk, { detail: true }), fromRosa: wk && w.routeLength(posts.rosa, wk, { detail: true }) };
        }
        // The copy's blocking props (ids starting e8_): where they landed and their bodies
        const props = Object.values(k.objects || {}).filter(sp => /^e8_/.test(sp?.scenarioData?.id || '')).map(sp => ({
            id: sp.scenarioData.id, x: Math.round(sp.x), y: Math.round(sp.y), w: sp.displayWidth, h: sp.displayHeight,
            body: sp.body ? { x: Math.round(sp.body.x), y: Math.round(sp.body.y), w: sp.body.width, h: sp.body.height, immovable: !!sp.body.immovable, enable: sp.body.enable, isStatic: sp.body.physicsType === 1 } : null
        }));
        // Solid bodies within three tiles of the approach cell (what the walk grid blocks there)
        const solids = [];
        window.game.physics.world.bodies.iterate(b => {
            if (!b.enable || !(b.immovable || b.physicsType === 1)) return;
            const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
            if (Math.abs(cx - ap.x) < 96 && Math.abs(cy - ap.y) < 96) solids.push({ key: b.gameObject?.texture?.key || b.gameObject?.npcId || b.gameObject?.type, x: Math.round(b.x), y: Math.round(b.y), w: b.width, h: b.height });
        });
        window.game.physics.world.staticBodies?.iterate(b => {
            if (!b.enable) return;
            const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
            if (Math.abs(cx - ap.x) < 96 && Math.abs(cy - ap.y) < 96) solids.push({ static: true, key: b.gameObject?.texture?.key || b.gameObject?.npcId || b.gameObject?.type, x: Math.round(b.x), y: Math.round(b.y), w: b.width, h: b.height });
        });
        return { kitchen: { pos: k.position, w: k.map?.widthInPixels, h: k.map?.heightInPixels }, cooler: { x: o.x, y: o.y }, posts, cells: res, props, solids };
    }));
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const id = Number(process.argv[3]) || newGame(process.env.MISSION || 'test_needs_sims');
    const out = { mode, gameId: id, engine: process.env.ENGINE || 'worktree', harness: [] };
    try {
        const page = await open(browser, id);
        if (mode === 'parcel') { await parcel(page, out); return; }
        if (mode === 'regress') { await regress(page, out); return; }
        out.setupMove = (await setup(page))?.ok;
        if (mode === 'probe') { await probe(page, out); return; }
        if (mode === 'e8') { await e8(page, out); return; }
        if (mode === 'e7') { await page.evaluate(() => { window.gameState.globalVariables.heard_exchange_rosa_rota = true; }); out.harness.push('heard_exchange_rosa_rota preset (no exchange)'); }
        // R1 m1: the scenario's cooler is 40 s now; the page sets it only on an older scenario
        out.useSeconds = await page.evaluate(() => window.npcNeedsSystem.world.getObject('water_cooler')?.affordance?.useSeconds);
        if (!(out.useSeconds >= 40)) { out.useSeconds = await longUse(page); out.harness.push('water_cooler useSeconds 40'); }
        out.before = await snap(page);
        const first = mode === 'e9neg' ? 'sanjay' : 'rosa', second = first === 'sanjay' ? 'rosa' : 'sanjay';
        await page.evaluate(id => window.__test.needs.set(id, 'social', 10), first);
        out.harness.push(`${first} social 10 first`);
        if (first === 'rosa' && !process.env.COUPLED_ONLY) {
            // Head start for the partner: Rosa walks from the lounge, so Sanjay is sent once she is
            // in the kitchen (the coupling on her npc_use_started still fires; he is already going)
            out.firstInKitchen = !!(await waitFor(page, x => x.rosa.pos?.room === 'kitchen', 40000));
            await page.evaluate(() => window.__test.needs.set('sanjay', 'social', 10));
            out.harness.push('sanjay social 10 once rosa is in the kitchen');
        }
        if (mode === 'e9unheard') {
            // The player leaves on the tick the exchange starts (moved to the office, off the doorway):
            // the first line, spoken that same tick, and every later one is out of earshot
            await page.evaluate(() => {
                const sys = window.npcNeedsSystem, orig = sys._startExchange.bind(sys);
                sys._startExchange = (...a) => {
                    const r = orig(...a);
                    const p = window.player; p.setPosition(90, 220); p.body?.reset?.(90, 220);
                    // and stays there: a bridge moveTo still running would walk the player back
                    window.preventPlayerMovement = true;
                    window.__leftAt = sys.clockMs;
                    return r;
                };
            });
            out.harness.push('player moved to the office (90, 220) on the tick the exchange starts, then held there (preventPlayerMovement)');
        }
        // Sanjay-first: Rosa comes by the coupling on Sanjay's npc_use_started
        if (mode !== 'e7') {
            const s = await waitFor(page, x => x[first].job?.target === 'water_cooler' && x[first].job?.dest && x[second].job?.target === 'water_cooler' && x[second].job?.dest, 60000);
            out.dests = s && { sanjay: s.sanjay.job.dest, rosa: s.rosa.job.dest };
            if (s) {
                const S = s.sanjay.job.dest, R = s.rosa.job.dest;
                let P;
                if (mode === 'e9neg') {
                    // Out along the Sanjay-to-Rosa line: 150 px from Rosa, 150 + the gap from Sanjay
                    const dx = R.x - S.x, dy = R.y - S.y, L = Math.hypot(dx, dy) || 1;
                    P = { x: R.x + dx / L * 150, y: R.y + dy / L * 150 };
                } else P = { x: S.x + 40, y: S.y + 36 };
                out.playerTarget = P;
                await page.evaluate(() => window.__test.enterRoom('kitchen'));
                out.moved = await page.evaluate(p => window.__test.moveTo(p.x, p.y, { timeoutMs: 15000 }), P);
                out.moved = out.moved && { ok: out.moved.ok, reason: out.moved.reason };
            }
        }
        const met = await waitFor(page, both, 60000);
        out.metAt = met && { t: met.t, sanjay: met.sanjay.pos, rosa: met.rosa.pos, player: met.player, room: met.room };
        if (mode === 'e7' && process.env.LATE_MS) {
            // Out of earshot until LATE_MS or less of the overlap is left, then placed beside the pair
            const late = Number(process.env.LATE_MS);
            out.harness.push(`player placed beside the pair once ${late} ms or less of the overlap is left`);
            const left = () => page.evaluate(() => { const sys = window.npcNeedsSystem; const a = sys.states.get('sanjay')?.job, b = sys.states.get('rosa')?.job; return a && b ? Math.min(a.useUntil, b.useUntil) - sys.clockMs : null; });
            for (let i = 0; i < 400; i++) { const l = await left(); if (l !== null && l <= late) break; await sleep(50); }
            out.lateAt = await page.evaluate(() => {
                const sys = window.npcNeedsSystem; window.__test.enterRoom('kitchen');
                const s = sys.world.npcPos('sanjay'), r = sys.world.npcPos('rosa');
                const x = (s.x + r.x) / 2, y = Math.max(s.y, r.y) + 40;
                const p = window.player; p.setPosition(x, y); p.body?.reset?.(x, y);
                const a = sys.states.get('sanjay').job, b = sys.states.get('rosa').job;
                return { t: sys.clockMs, left: Math.min(a.useUntil, b.useUntil) - sys.clockMs, player: { x: Math.round(x), y: Math.round(y) } };
            });
            await waitFor(page, x => !both(x), 15000, 150);
            await sleep(1000);
            await page.screenshot({ path: `${SHOTS}/e7late-g${id}.png` });
        } else if (mode === 'e7') {
            await sleep(1500);
            out.unheardEvents = chatRows(await events(page));
            out.duringUnheard = await snap(page);
            await page.screenshot({ path: `${SHOTS}/e7-g${id}-office.png` });
            out.enter = (await page.evaluate(() => window.__test.enterRoom('kitchen')))?.ok;
            page.evaluate(() => window.__test.moveTo(-200, 270, { timeoutMs: 6000 })).catch(() => null);
            for (let i = 0; i < 60; i++) {
                const ev = (await events(page)).find(e => e.n.startsWith('npc_chatted:water_cooler') && e.d.line);
                if (ev) { out.firstHeardLine = [ev.t, ev.d.speakerId, ev.d.lineId, ev.d.overheard, ev.d.playerDistance, ev.room]; break; }
                await sleep(150);
            }
            await sleep(300);
            await page.screenshot({ path: `${SHOTS}/e7-g${id}-heard.png` });
            if (process.env.SECOND_BREAK) {
                // R1 m4: a second coupled break nobody hears, on bags that already exist
                await waitFor(page, x => !both(x), 60000, 300);
                await page.evaluate(() => { window.__test.enterRoom('office'); });
                await clearUi(page);
                await page.evaluate(() => window.__test.moveTo(90, 220, { timeoutMs: 8000 }));
                await waitFor(page, x => x.sanjay.job?.target !== 'water_cooler' && x.rosa.job?.target !== 'water_cooler', 60000, 300);
                const b0 = await snap(page);
                out.secondBefore = { t: b0.t, bags: b0.bags, room: b0.room };
                const n0 = (await events(page)).length;
                // Cooldowns cleared, so without E7 each speaker would draw a line on its first turn
                await page.evaluate(() => { for (const id of ['sanjay', 'rosa']) window.npcNeedsSystem.states.get(id).chatterQuietUntil = 0; });
                await page.evaluate(() => window.__test.needs.set('rosa', 'social', 10));
                out.harness.push('second break: both chatter cooldowns cleared, rosa social 10, player held in the office');
                out.secondMet = !!(await waitFor(page, both, 90000, 300));
                await waitFor(page, x => !both(x), 60000, 300);
                const b1 = await snap(page);
                out.secondAfter = { t: b1.t, bags: b1.bags, room: b1.room };
                out.secondTurns = chatRows((await events(page)).slice(n0));
                out.secondBagsUnchanged = JSON.stringify(b0.bags) === JSON.stringify(b1.bags);
            }
        } else if (mode === 'e9neg') {
            await sleep(6000);
            await page.screenshot({ path: `${SHOTS}/e9neg-g${id}.png` });
            // The rest of the meeting: until either leaves the cooler
            await waitFor(page, x => !both(x), 60000, 300);
        } else {
            // To the end of the exchange (or of the meeting)
            const done = await waitFor(page, x => !both(x) || (x.chat && x.chat.exDone && !x.chat.ex), 60000, 300);
            out.endedAt = done && done.t;
            await sleep(1500);
            await page.screenshot({ path: `${SHOTS}/${mode}-g${id}.png` });
        }
        out.after = await snap(page);
        const ev = await events(page);
        out.chatted = chatRows(ev);
        out.exchangeHeardEvents = ev.filter(e => e.n.startsWith('npc_exchange_heard')).map(e => [e.t, e.n, e.d.complete]);
        out.failed = ev.filter(e => e.n.startsWith('npc_job_failed')).map(e => e.d);
        out.log = await exLog(page);
        out.drawCheck = await drawCheck(page);
        out.leftAt = await page.evaluate(() => window.__leftAt ?? null);
    } finally {
        out.consoleErrors = consoleErrors;
        await browser.close();
        console.log(JSON.stringify(out));
    }
}

// exchange_tom_parcel: Amara's entry, gated on amara_opened_parcel; Tom says the first line.
// Only the office is loaded, so the office coffee station is the one caffeine source and Tom queues.
async function parcel(page, out) {
    out.setupMove = (await setup(page, ['office']))?.ok;
    await page.evaluate(() => { window.gameState.globalVariables.amara_opened_parcel = true; });
    out.harness.push('amara_opened_parcel set (the parcel drop is not replayed)');
    out.useSeconds = await longUse(page, 'office_coffee', 40); out.harness.push('office_coffee useSeconds 40');
    const pair = ['amara', 'tom'];
    await page.evaluate(() => window.__test.needs.set('amara', 'caffeine', 5));
    out.amaraUsing = !!(await waitFor(page, x => x.amara.job?.phase === 'using' && x.amara.job.target === 'office_coffee', 60000, 200, pair, 'office_coffee'));
    await page.evaluate(() => window.__test.needs.set('tom', 'caffeine', 5));
    out.harness.push('amara caffeine 5, then tom caffeine 5 once she is pouring');
    const s = await waitFor(page, x => x.tom.job?.target === 'office_coffee' && x.tom.job?.dest, 30000, 200, pair, 'office_coffee');
    if (s) {
        const T = s.tom.job.dest;
        out.tomDest = T;
        out.playerTarget = { x: T.x + 8, y: T.y - 40 };
        out.moved = await page.evaluate(p => window.__test.moveTo(p.x, p.y, { timeoutMs: 15000 }), out.playerTarget);
        out.moved = out.moved && { ok: out.moved.ok, reason: out.moved.reason };
    }
    const started = await waitFor(page, x => !!x.chat?.ex, 40000, 200, pair, 'office_coffee');
    out.startedSnap = started && { t: started.t, chat: started.chat, player: started.player, tom: started.tom.pos, amara: started.amara.pos };
    const done = await waitFor(page, x => !x.chat || (x.chat.exDone && !x.chat.ex), 60000, 300, pair, 'office_coffee');
    out.endedAt = done && done.t;
    await sleep(1500);
    await page.screenshot({ path: `${SHOTS}/parcel-g${out.gameId}.png` });
    out.after = await snap(page, pair, 'office_coffee');
    const ev = await events(page);
    out.chatted = chatRows(ev, 'office_coffee');
    out.exchangeHeardEvents = ev.filter(e => e.n.startsWith('npc_exchange_heard')).map(e => [e.t, e.n, e.d.complete]);
    out.log = await exLog(page);
}

// Regression: open ROOMS (comma list) in order, then watch the needs NPCs for SECONDS of wall time.
// Reports the needs log by event, each NPC's room trail, completed tasks and console errors, so a
// run on this engine and one with ENGINE=<main rev> can be compared.
async function regress(page, out) {
    const rooms = (process.env.ROOMS || '').split(',').filter(Boolean);
    out.rooms = [];
    for (const r of rooms) {
        const res = await page.evaluate(r => window.__test.enterRoom(r), r);
        out.rooms.push([r, !!res?.ok, res?.ok ? null : String(res?.reason || res?.error || JSON.stringify(res)).slice(0, 120)]);
        await clearUi(page);
    }
    if (process.env.PARK) {
        const [x, y] = process.env.PARK.split(',').map(Number);
        out.park = (await page.evaluate(([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 10000 }), [x, y]))?.ok;
    }
    await page.evaluate(() => {
        const sys = window.npcNeedsSystem;
        window.__trail = {};
        window.__trailTimer = setInterval(() => {
            for (const id of sys.states.keys()) {
                const p = sys.world.npcPos(id); const r = p?.roomId || null;
                const t = (window.__trail[id] ||= []);
                if (t[t.length - 1] !== r) t.push(r);
            }
        }, 250);
    });
    const secs = Number(process.env.SECONDS || 180);
    await sleep(secs * 1000);
    out.result = await page.evaluate(() => {
        clearInterval(window.__trailTimer);
        const sys = window.npcNeedsSystem;
        const log = window.__test.needs.log();
        const byEv = {};
        for (const e of log) { const k = `${e.npc}:${e.ev}`; byEv[k] = (byEv[k] || 0) + 1; }
        const tasks = [];
        for (const a of (window.objectivesManager?.aims || window.gameScenario?.objectives || [])) for (const t of (a.tasks || [])) {
            const st = window.objectivesManager?.getTask?.(t.taskId)?.status; if (st === 'completed') tasks.push(t.taskId);
        }
        return {
            clock: sys.clockMs, logLen: log.length, byEv, trail: window.__trail, tasks,
            jobs: Object.fromEntries([...sys.states.entries()].map(([id, st]) => [id, st.job ? `${st.job.phase} ${st.job.targetId}` : null])),
            interesting: log.filter(e => /exchange|job_failed|timeout|no_beside|leash|stuck/.test(e.ev)).slice(0, 40)
        };
    });
}

// E8: coupled breaks on a copy whose cooler right cell is solid. Rosa first (from the lounge), so
// she takes the approach cell and Sanjay is the second user who needs a side cell.
async function e8(page, out) {
    await probe(page, out);
    const blockAbove = process.env.E8_BLOCK_ABOVE === '1';
    out.useSeconds = await longUse(page); out.harness.push('water_cooler useSeconds 40');
    await page.evaluate(() => { window.gameState.globalVariables.heard_exchange_rosa_rota = true; });
    out.harness.push('heard_exchange_rosa_rota preset (no exchange)');
    const n = Number(process.env.BREAKS || (blockAbove ? 1 : 5));
    out.breaks = [];
    for (let i = 0; i < n; i++) {
        const b = { i };
        const t0 = await page.evaluate(() => window.npcNeedsSystem.clockMs);
        await page.evaluate(() => window.__test.needs.set('rosa', 'social', 10));
        b.rosaInKitchen = !!(await waitFor(page, x => x.rosa.pos?.room === 'kitchen', 60000));
        await page.evaluate(() => window.__test.needs.set('sanjay', 'social', 10));
        const until = blockAbove
            ? (x => x.sanjay.job === null || x.sanjay.job.phase === 'returning' || both(x))
            : both;
        const s = await waitFor(page, until, 60000, 150);
        b.snap = s && { t: s.t, sanjay: s.sanjay, rosa: s.rosa };
        if (s && both(s)) await page.screenshot({ path: `${SHOTS}/e8-g${out.gameId}-break${i}.png` });
        if (blockAbove) {
            await sleep(1500);
            await page.screenshot({ path: `${SHOTS}/e8above-g${out.gameId}-walkhome.png` });
            b.walkHome = await snap(page);
            await sleep(6000);
            b.later = await snap(page);
        }
        const ev = (await events(page)).filter(e => e.t >= t0);
        b.leftPost = ev.filter(e => e.n === 'npc_left_post:sanjay').map(e => [e.t, e.d.targetId]);
        b.failed = ev.filter(e => e.n.startsWith('npc_job_failed')).map(e => [e.t, e.n, e.d.reason, e.d.targetId]);
        b.useStarted = ev.filter(e => e.n.startsWith('npc_use_started:water_cooler')).map(e => [e.t, e.d.npcId]);
        out.breaks.push(b);
        // Both home again before the next break
        await waitFor(page, x => !x.sanjay.job && !x.rosa.job, 90000, 500);
        await sleep(2000);
    }
    out.log = await exLog(page);
}

main().catch(e => { console.error(e); process.exit(1); });
