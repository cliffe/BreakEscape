// Live proof for docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md on scenarios/test_needs_sims:
// row 2 of the README tour ("Someone turns back": see_turned_back, see_look_round) and Marek's
// walk home after his coffee (used -> returned_post), with every return_resumed, return_stuck,
// walk_rerouted, walk_stuck and arrival line from the needs log. Headless, setFPS(20).
//   node tools/playtest/needs-stuck-return-proof.mjs <gameId> [port] [outDir] [standX,standY]
// The stand point (default 232,176, east of mid-office, south of Amara's desk) is off Marek's routes
// between his post (west wall, about 52,176) and the office coffee (bottom right): a player on a
// route is yielded to (README tour step 7), which held Marek up in games 5361, 5363 and 5366 (the
// old midpoint, 176,192) and 5378 (64,224, south of his post). It is within earshot (160 px) of
// Sanjay's desk and of the seated staff.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3093', outDir = './tmp/stuck-proof/', standArg = '232,176'] = process.argv.slice(2);
const [standX, standY] = standArg.split(',').map(Number);
if (!gid) { console.error('usage: needs-stuck-return-proof.mjs <gameId> [port] [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const t = ms => page.waitForTimeout(ms);
const report = { gid, errs };

await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcNeedsSystem, null, { timeout: 90000 });
await t(2000);
for (let i = 0; i < 6; i++) {
    const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
    if (!busy) break;
    await page.keyboard.press('Enter'); await t(400); await page.keyboard.press('Escape'); await t(400);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
}
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
await page.evaluate(() => {
    const ed = window.eventDispatcher; window.__p = [];
    const orig = ed.emit.bind(ed);
    ed.emit = (ev, data) => { try { if (/^(npc_(turned_back|swivelled|chatted|returned_post|left_post|overheard|need_parked|mutter)|task_completed)/.test(ev)) window.__p.push({ c: window.npcNeedsSystem.clockMs, ev, d: data && { npcId: data.npcId, reason: data.reason, line: data.line, picture: !!data.picture, overheard: data.overheard, speakerId: data.speakerId, topic: data.topic } }); } catch (e) {} return orig(ev, data); };
    // Each tick Sanjay has a line or picture up: who could look round (seated, distance, typing)
    window.__listen = [];
    // Sanjay's seating, on every change: stop key, seat move stage, seated, feet to his home cell
    // and to his chair's foot (a seat move that ends unseated ended on its last stage)
    window.__seatTrace = [];
    window.npcNeedsSystem.onTick(sys => {
        const b = window.npcBehaviorManager.getBehavior('sanjay'); const ns = sys.getState('sanjay');
        if (!b?.sprite?.body || !ns || window.__seatTrace.length > 300) return;
        const bb = b.sprite.body, feet = { x: bb.center.x, y: bb.bottom };
        const ch = (window.chairs || []).find(c => c.texture?.key === 'chair-white-1-rotate8');
        const cf = ch?.body ? { x: ch.body.center.x, y: ch.body.bottom } : null;
        const row = { mode: ns.mode, atPost: !!ns.atPost, key: b._seatStopKey || null, mv: b._seatMove?.stage || null, fetch: b._fetch?.phase || null,
            seated: !!b._seat, moving: !!b.isMoving, dest: !!b._goToStayDest };
        const last = window.__seatTrace.at(-1);
        if (last && JSON.stringify(last.row) === JSON.stringify(row)) return;
        window.__seatTrace.push({ c: sys.clockMs, row, feet: { x: Math.round(feet.x), y: Math.round(feet.y) },
            home: ns.home ? { x: Math.round(ns.home.x), y: Math.round(ns.home.y) } : null,
            dHome: ns.home ? Math.round(Math.hypot(ns.home.x - feet.x, ns.home.y - feet.y)) : null,
            chairFoot: cf && { x: Math.round(cf.x), y: Math.round(cf.y) }, dChair: cf ? Math.round(Math.hypot(cf.x - feet.x, cf.y - feet.y)) : null,
            dChairHome: cf && ns.home ? Math.round(Math.hypot(cf.x - ns.home.x, cf.y - ns.home.y)) : null, chairBy: ch?.seatedBy || null });
    });
    window.npcNeedsSystem.onTick(sys => {
        const sj = sys.getState('sanjay'); const sp = sys.speakers.find(x => x.npcId === 'sanjay');
        if (!sp || window.__listen.length > 40) return;
        const out = { c: sys.clockMs, saying: sj?.saying ? { line: sj.saying.line || null, picture: sj.saying.picture || null, topic: sj.saying.topic } : null, sp: { x: Math.round(sp.x), y: Math.round(sp.y), roomId: sp.roomId }, staff: {} };
        for (const id of ['amara', 'tom', 'grace', 'marek']) {
            const b = window.npcBehaviorManager.getBehavior(id); const p = sys.world.npcPos(id); const ns = sys.getState(id) || {};
            out.staff[id] = { seated: !!b?._seat, kind: b?._seat?.seat?.kind || null, facing: b?._seat?.facing || null, home: b?._seat?.homeFacing || null,
                d: p ? Math.round(Math.hypot(p.x - sp.x, p.y - sp.y)) : null, room: p?.roomId, typing: !!(ns.mode === 'job' && ns.job?.need === 'work' && ns.job?.phase === 'using'), mode: ns.mode, phase: ns.job?.phase || null };
        }
        window.__listen.push(out);
    });
});
const clock = () => page.evaluate(() => window.npcNeedsSystem.clockMs);
const st = id => page.evaluate(id => { const s = window.npcNeedsSystem.getState(id) || {}; const b = window.npcBehaviorManager.getBehavior(id); const c = b?.sprite?.body?.center; return { mode: s.mode, phase: s.job?.phase, target: s.job?.targetId, x: c ? Math.round(c.x) : null, y: c ? Math.round(c.y) : null }; }, id);
const tasksDone = () => page.evaluate(() => Object.values(window.objectivesManager?.taskIndex || {}).filter(x => x.status === 'completed' || x.status === 'completing').map(x => x.taskId || x.id));

// Row 1's queue: wait until nobody is headed for, queued at or using the office coffee (60 s+)
const t0 = Date.now();
while (Date.now() - t0 < 200000) {
    const c = await clock();
    // and Marek is back at his post: the notice's beat keys on him leaving it (npc_left_post), so
    // a notice read while he still walks home from row 1 sends him straight back with no
    // left_post, and Sanjay never sets off (games 5349 to 5352, 5358)
    const busy = await page.evaluate(() => ['amara', 'tom', 'marek', 'sanjay'].some(id => window.npcNeedsSystem.getState(id)?.job?.targetId === 'office_coffee')
        || window.npcNeedsSystem.getState('marek')?.mode !== 'idle'
        // and Sanjay is free at his desk: a work spell is never interrupted, and one that ends after
        // Marek reaches the coffee parks the caffeine at selection, with no turn-back (game 5378)
        || window.npcNeedsSystem.getState('sanjay')?.mode !== 'idle');
    if (c > 60000 && !busy) break;
    await t(1000);
}
report.queue_cleared_s = Math.round((await clock()) / 1000);
console.log('queue cleared at needs s', report.queue_cleared_s, 'wall s', Math.round((Date.now() - t0) / 1000));
const where = await page.evaluate(() => {
    const s = window.npcBehaviorManager.getBehavior('sanjay').sprite.body.center;
    const o = Object.values(window.rooms.office.objects).find(x => x.scenarioData?.id === 'office_coffee' || x.objectId === 'office_coffee' || x.name === 'office_coffee');
    return { sanjay: { x: s.x, y: s.y }, coffee: o ? { x: o.x, y: o.y } : null };
});
report.where = where;
await page.evaluate(() => window.__test.moveToNear('coffee_notice', { timeoutMs: 20000 })).catch(() => null);
await t(500);
const read = await page.evaluate(() => window.__test.interact('coffee_notice')).catch(e => ({ err: String(e) }));
report.read_notice = read && (read.ok ?? read);
await t(1200);
// Close the notice: whatever minigame or overlay it raised, until the needs clock runs again
for (let i = 0; i < 10; i++) {
    const c1 = await clock(); await t(600); const c2 = await clock();
    const ui = await page.evaluate(() => { const st = window.__test.getState(); return { mg: !!window.MinigameFramework?.currentMinigame, mgName: window.MinigameFramework?.currentMinigame?.constructor?.name || null, blocking: st.blockingUi || null }; });
    if (i === 0) report.after_read_ui = ui;
    if (c2 > c1 && !ui.mg && !ui.blocking) break;
    if (ui.mg) await page.evaluate(() => { try { window.MinigameFramework.endMinigame(true); } catch (e) {} });
    await page.keyboard.press('Escape'); await t(300);
    await page.evaluate(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {});
}
report.notice_closed = await page.evaluate(() => !window.__test.getState().blockingUi && !window.MinigameFramework?.currentMinigame);
const readAt = await clock();
console.log('notice read', JSON.stringify(report.after_read_ui), 'clock', readAt);
report.stand = { x: standX, y: standY };
await page.evaluate(([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 15000 }), [standX, standY]).catch(() => null);
report.npcs_at_read = await page.evaluate(() => Object.fromEntries(['amara', 'tom', 'grace', 'sanjay', 'marek'].map(id => { const p = window.npcNeedsSystem.world.npcPos(id); return [id, p && { x: Math.round(p.x), y: Math.round(p.y) }]; })));
// Watch for 100 s of needs clock: Marek's coffee and his walk home
const trace = [];
const tw = Date.now();
while ((await clock()) - readAt < 100000 && Date.now() - tw < 300000) {
    const m = await st('marek');
    trace.push({ c: Math.round(((await clock()) - readAt) / 100) / 10, ...m });
    if (trace.length % 15 === 0) console.log('t', trace.at(-1).c, JSON.stringify(m));
    // A stall on the walk home: one dump of Marek's path and every body within 48 px
    const prev = trace.at(-6);
    if (!report.stall_dump && m.mode === 'returning' && prev && prev.mode === 'returning' && Math.hypot(prev.x - m.x, prev.y - m.y) < 2) {
        report.stall_dump = await page.evaluate(() => {
            const b = window.npcBehaviorManager.getBehavior('marek'), sp = b.sprite, c = sp.body.center;
            const near = [];
            const look = (o, tag) => { const bb = o?.body; if (!bb || !o.active) return; const d = Math.hypot(bb.center.x - c.x, bb.center.y - c.y); if (d < 48) near.push({ tag, key: o.texture?.key || o.name, x: Math.round(bb.x), y: Math.round(bb.y), w: bb.width, h: bb.height, imm: !!bb.immovable, d: Math.round(d) }); };
            for (const id of ['amara', 'tom', 'grace', 'sanjay']) look(window.npcBehaviorManager.getBehavior(id)?.sprite, id);
            for (const ch of window.chairs || []) look(ch, 'chair');
            look(window.player, 'player');
            const r = window.rooms.office; for (const o of Object.values(r.objects || {})) look(o, 'obj');
            return { body: { x: Math.round(sp.body.x), y: Math.round(sp.body.y), w: sp.body.width, h: sp.body.height, vx: Math.round(sp.body.velocity.x), vy: Math.round(sp.body.velocity.y) },
                path: (b.currentPath || b.path || []).map(p => [Math.round(p.x), Math.round(p.y)]), idx: b.pathIndex, dest: b._goToStayDest, moving: b.isMoving, settle: b._settleUntil || b.settleUntil || null,
                touching: { ...sp.body.touching }, blocked: { ...sp.body.blocked }, near };
        });
    }
    const log = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => e.npc === 'marek'));
    // after the notice only: row 1's queue gave Marek a cup and a walk home before it, which ended
    // this watch at once (games 5375, 5376)
    const used = log.filter(e => e.ev === 'used' && e.target === 'office_coffee' && e.t >= Math.round(readAt / 250));
    if (used.length && log.some(e => e.ev === 'returned_post' && e.t > used[used.length - 1].t)) { await t(3000); break; }
    await t(1000);
}
const needsLog = await page.evaluate(() => window.npcNeedsSystem.getLog());
const readTick = Math.round(readAt / 250);
const mlog = needsLog.filter(e => e.npc === 'marek' && e.t >= readTick);
const used = mlog.find(e => e.ev === 'used' && e.target === 'office_coffee');
const back = used && mlog.find(e => e.ev === 'returned_post' && e.t > used.t);
report.marek_used_tick = used?.t ?? null;
report.marek_home_s = used && back ? (back.t - used.t) * 0.25 : null;
report.stall_lines = needsLog.filter(e => e.t >= readTick && /^(return_resumed|return_stuck|walk_rerouted|walk_stuck|arrival_far)$/.test(e.ev)).map(e => ({ t: e.t, npc: e.npc, ev: e.ev, x: e.x, y: e.y }));
report.marek_arrivals = mlog.filter(e => e.ev === 'arrival').map(e => ({ t: e.t, pathLeft: e.pathLeft, dist: e.dist }));
report.events = await page.evaluate(() => window.__p.filter(e => !e.ev.startsWith('npc_chatted') || ['sanjay', 'marek'].includes(e.d?.speakerId || e.d?.npcId)));
report.listen = await page.evaluate(() => window.__listen);
report.sanjay_seat = await page.evaluate(ra => window.__seatTrace.filter(e => e.c >= ra - 5000), readAt);
report.sanjay_log = needsLog.filter(e => e.npc === 'sanjay' && e.t >= readTick - 40 && !/^(arrival|need|decay)/.test(e.ev)).slice(0, 40);
report.marek_path = trace.filter((e, i) => i % 2 === 0).map(e => [e.c, e.x, e.y]);
const tasks = await tasksDone();
report.see_turned_back = tasks.includes('see_turned_back');
report.see_look_round = tasks.includes('see_look_round');
const sanjayChat = report.events.filter(e => /^npc_(chatted|overheard)/.test(e.ev) && (e.d?.speakerId || e.d?.npcId) === 'sanjay');
report.sanjay_grumble = sanjayChat.map(e => ({ s: Math.round((e.c - readAt) / 100) / 10, line: e.d.line || null, picture: e.d.picture, overheard: e.d.overheard }));
report.player = await page.evaluate(() => ({ x: Math.round(window.player.body.center.x), y: Math.round(window.player.body.center.y) }));
report.trace_tail = trace.slice(-5);
await page.screenshot({ path: `${outDir}/stuck-proof-${gid}.png` });
fs.writeFileSync(`${outDir}/stuck-proof-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ gid, notice_closed: report.notice_closed, turned_back: report.see_turned_back, look_round: report.see_look_round, marek_home_s: report.marek_home_s, stalls: report.stall_lines.length, stuck: report.stall_lines.filter(e => /stuck/.test(e.ev)).length, sanjay: report.sanjay_grumble, errs: errs.length }));
await page.goto('about:blank');
await browser.close();
