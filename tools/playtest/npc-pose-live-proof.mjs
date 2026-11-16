// Live proof that NPC phone and use poses show (docs/achitechture/NPC_POSES.md) on test_needs_sims.
// Phone: use the spare desk phone (the scenario lever) so Tom's phone rings and he answers.
// Use: lower Tom's caffeine through __test.needs.set so he walks to a coffee machine (use, then drink).
// Headless, setFPS(20) with fixed steps on. Screenshots go to <outDir>.
//   node tools/playtest/npc-pose-live-proof.mjs <gameId> <port> <outDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player?.body && window.npcNeedsSystem && window.npcPoses, null, { timeout: 90000 });
await page.waitForTimeout(2000);
await page.keyboard.press('Escape');
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
const snap = id => page.evaluate(id => {
    const b = window.npcBehaviorManager.getBehavior(id), sp = b?.sprite, st = window.npcNeedsSystem.getState(id);
    const frames = {}; for (const n of ['phone', 'use', 'drink']) frames[n] = ['right','down-right','down','down-left','left','up-left','up','up-right'].filter(d => window.game.anims.exists(`npc-${id}-pose_${n}-${d}`)).length;
    return { anim: sp?.anims?.currentAnim?.key || null, frame: sp?.frame?.name || null, tex: sp?.texture?.key, dir: b?.direction, mode: st?.mode, job: st?.job && { need: st.job.need, obj: st.job.objectId || st.job.obj }, poseActive: window.npcPoses.active.get(id) || null, poseFrameDirs: frames, at: sp && [Math.round(sp.x), Math.round(sp.y)] };
}, id);
const shot = async (name, id) => {
    await page.evaluate(id => { const sp = window.npcBehaviorManager.getBehavior(id)?.sprite; const cam = window.game.cameras.main; if (sp) cam.centerOn(sp.x, sp.y); }, id);
    await page.waitForTimeout(300);
    const f = `${out}/${name}.png`; await page.screenshot({ path: f }); return f;
};
const result = { gid, errs };
// ---- phone
await page.waitForTimeout(3000); await page.evaluate(() => window.__test.minigame.close()).catch(() => null); await page.waitForTimeout(800);
result.minigameAfterClose = await page.evaluate(() => window.__test.minigame.getState?.()?.id || null).catch(() => null);
result.tomBefore = await snap('tom');
result.move = await page.evaluate(() => window.__test.moveToNear('spare_phone').then(r => !!r.ok).catch(() => false));
// Tom sits at his desk for long stretches and a seated NPC keeps its sit frame (by design), so ring
// only while he is standing at his post with no job.
result.phone = null; result.rings = 0;
for (let i = 0; i < 360 && !result.phone; i++) {
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => { const b = window.npcBehaviorManager.getBehavior('tom'), s = window.npcNeedsSystem.getState('tom'); return { seated: !!b._seat, idle: s.mode === 'idle' && !s.job && !s.call }; });
    if (st.idle && i % 12 === 0) { result.rings++; await page.evaluate(() => window.__test.interact('spare_phone', { approach: false }).catch(() => null)); }
    const sn = await snap('tom');
    if (/pose_phone/.test(sn.anim || '')) result.phone = { ...sn, shot: await shot('tom-phone', 'tom'), trigger: 'spare desk phone interact -> desk_phone_ring:tom_phone, Tom standing' };
}
result.phoneLog = await page.evaluate(() => window.npcPoses.log.slice(-6));
// ---- use (machine): lower caffeine for Tom
await page.waitForTimeout(4000);
result.set = await page.evaluate(() => window.__test.needs.set('tom', 'caffeine', 5));
result.use = null; result.drinkSeen = null;
const t0 = Date.now();
while (Date.now() - t0 < 240000 && !result.use) {
    await page.waitForTimeout(500);
    const s = await snap('tom');
    const d = await page.evaluate(() => { const st = window.npcNeedsSystem.getState('tom'); const j = st?.job; const o = j?.targetId ? window.npcNeedsSystem.world.getObject(j.targetId) : null; const b = window.npcBehaviorManager.getBehavior('tom'); const sp = o?._sprite; return j ? { need: j.need, phase: j.phase, kind: j.kind, target: j.targetId, dir: b?.direction, facing: sp && (() => { const c = sp.getCenter?.(); return c && [Math.round(c.x), Math.round(c.y)]; })(), aff: o?.affordance && { satisfies: o.affordance.satisfies, pose: o.affordance.pose, machine: o.affordance.machine }, preset: sp?._officeAffordance?.preset, objXY: sp && [Math.round(sp.x), Math.round(sp.y)], npcXY: [Math.round(b.sprite.x), Math.round(b.sprite.y)], clock: window.npcNeedsSystem.clockMs } : null; });
    if (d && JSON.stringify(d) !== JSON.stringify(result.lastDiag)) { (result.diag ||= []).push(d); result.lastDiag = d; }
    if (/pose_use/.test(s.anim || '')) result.use = { ...s, shot: await shot('tom-use', 'tom'), trigger: 'needs.set(tom, caffeine, 5)' };
}
result.useLog = await page.evaluate(() => window.npcPoses.log.slice(-8));
result.needsLog = await page.evaluate(() => window.npcNeedsSystem.getLog().filter(e => e.npc === 'tom').slice(-8));
result.diag = (result.diag || []).slice(0, 25); delete result.lastDiag;
result.errs = errs;
console.log(JSON.stringify(result, null, 1));
await browser.close();
