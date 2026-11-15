// Live proof for docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md on scenarios/test_needs_sims:
// row 2 of the README tour ("Someone turns back": see_turned_back, see_look_round) and Marek's
// walk home after his coffee (used -> returned_post), with every return_resumed, return_stuck,
// walk_rerouted, walk_stuck and arrival line from the needs log. Headless, setFPS(20).
//   node tools/playtest/needs-stuck-return-proof.mjs <gameId> [port] [outDir]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port = '3093', outDir = './tmp/stuck-proof/'] = process.argv.slice(2);
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
    ed.emit = (ev, data) => { try { if (/^(npc_(turned_back|swivelled|chatted|returned_post|left_post)|task_completed)/.test(ev)) window.__p.push({ c: window.npcNeedsSystem.clockMs, ev, d: data && { npcId: data.npcId, reason: data.reason, line: data.line, picture: !!data.picture, overheard: data.overheard, speakerId: data.speakerId, topic: data.topic } }); } catch (e) {} return orig(ev, data); };
});
const clock = () => page.evaluate(() => window.npcNeedsSystem.clockMs);
const st = id => page.evaluate(id => { const s = window.npcNeedsSystem.getState(id) || {}; const b = window.npcBehaviorManager.getBehavior(id); const c = b?.sprite?.body?.center; return { mode: s.mode, phase: s.job?.phase, target: s.job?.targetId, x: c ? Math.round(c.x) : null, y: c ? Math.round(c.y) : null }; }, id);
const tasksDone = () => page.evaluate(() => Object.values(window.objectivesManager?.taskIndex || {}).filter(x => x.status === 'completed' || x.status === 'completing').map(x => x.taskId || x.id));

// Row 1's queue: wait until nobody is headed for, queued at or using the office coffee (60 s+)
const t0 = Date.now();
while (Date.now() - t0 < 200000) {
    const c = await clock();
    const busy = await page.evaluate(() => ['amara', 'tom', 'marek', 'sanjay'].some(id => window.npcNeedsSystem.getState(id)?.job?.targetId === 'office_coffee'));
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
const readAt = await clock();
console.log('notice read', JSON.stringify(report.after_read_ui), 'clock', readAt);
if (where.coffee) {
    const mx = (where.sanjay.x + where.coffee.x) / 2, my = (where.sanjay.y + where.coffee.y) / 2;
    report.stand = { x: Math.round(mx), y: Math.round(my) };
    await page.evaluate(([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 15000 }), [mx, my]).catch(() => null);
}
// Watch for 100 s of needs clock: Marek's coffee and his walk home
const trace = [];
const tw = Date.now();
while ((await clock()) - readAt < 100000 && Date.now() - tw < 300000) {
    const m = await st('marek');
    trace.push({ c: Math.round(((await clock()) - readAt) / 100) / 10, ...m });
    if (trace.length % 15 === 0) console.log('t', trace.at(-1).c, JSON.stringify(m));
    const log = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => e.npc === 'marek'));
    const used = log.filter(e => e.ev === 'used' && e.target === 'office_coffee' && e.t >= 0);
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
const tasks = await tasksDone();
report.see_turned_back = tasks.includes('see_turned_back');
report.see_look_round = tasks.includes('see_look_round');
const sanjayChat = report.events.filter(e => e.ev.startsWith('npc_chatted') && (e.d?.speakerId || e.d?.npcId) === 'sanjay');
report.sanjay_grumble = sanjayChat.map(e => ({ s: Math.round((e.c - readAt) / 100) / 10, line: e.d.line || null, picture: e.d.picture, overheard: e.d.overheard }));
report.player = await page.evaluate(() => ({ x: Math.round(window.player.body.center.x), y: Math.round(window.player.body.center.y) }));
report.trace_tail = trace.slice(-5);
await page.screenshot({ path: `${outDir}/stuck-proof-${gid}.png` });
fs.writeFileSync(`${outDir}/stuck-proof-${gid}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ gid, turned_back: report.see_turned_back, look_round: report.see_look_round, marek_home_s: report.marek_home_s, stalls: report.stall_lines.length, stuck: report.stall_lines.filter(e => /stuck/.test(e.ev)).length, sanjay: report.sanjay_grumble, errs: errs.length }));
await page.goto('about:blank');
await browser.close();
