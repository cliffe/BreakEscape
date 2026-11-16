// Live proof that NPC phone and use poses show (docs/achitechture/NPC_POSES.md, POSE_FIXES.md) on test_needs_sims.
// Phone: use the spare desk phone (the scenario lever) so Tom's phone rings and he answers; the ring
// comes while Tom is idle with no job and no call, seated or standing (he stands up for it).
// Chat mid-call: talking to Tom hangs up; he must stay standing for the whole chat, then re-seat.
// Use: lower Tom's caffeine through __test.needs.set so he walks to a coffee machine (use, then drink).
// Chat mid-pose: talking to Tom during the pose turns him to the player (crops tom-chat-facing*.png).
// Headless, setFPS(20) with fixed steps on. Screenshots go to <outDir>.
//   node tools/playtest/npc-pose-live-proof.mjs <gameId> <port> <outDir>
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';   // resolved from the repo's node_modules, as the sibling scripts do
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
await page.evaluate(() => window.__test.needs.overlay(false));   // the needs bars would cover the crops
const snap = id => page.evaluate(id => {
    const b = window.npcBehaviorManager.getBehavior(id), sp = b?.sprite, st = window.npcNeedsSystem.getState(id);
    const frames = {}; for (const n of ['phone', 'use', 'drink']) frames[n] = ['right','down-right','down','down-left','left','up-left','up','up-right'].filter(d => window.game.anims.exists(`npc-${id}-pose_${n}-${d}`)).length;
    return { anim: sp?.anims?.currentAnim?.key || null, frame: sp?.frame?.name || null, tex: sp?.texture?.key, dir: b?.direction, mode: st?.mode, job: st?.job && { need: st.job.need, obj: st.job.objectId || st.job.obj }, poseActive: window.npcPoses.active.get(id) || null, poseFrameDirs: frames, at: sp && [Math.round(sp.x), Math.round(sp.y)] };
}, id);
// A zoomed crop (x4) around an NPC: its sprite's screen position from the camera, the chat overlay hidden
const crop = async (name, id) => {
    await page.addStyleTag({ content: '.minigame-container{visibility:hidden !important}' });
    await page.waitForTimeout(300);
    const pos = await page.evaluate(id => { const sp = window.npcBehaviorManager.getBehavior(id)?.sprite, cam = window.game.cameras.main, r = document.querySelector('canvas').getBoundingClientRect();
        const k = r.width / cam.width; return { x: r.x + (sp.x - cam.worldView.x) * cam.zoom * k, y: r.y + (sp.y - cam.worldView.y) * cam.zoom * k, size: Math.round(80 * cam.zoom * k) }; }, id);
    const f = `${out}/${name}.png`;
    const x = Math.max(0, Math.round(pos.x - pos.size / 2)), y = Math.max(0, Math.round(pos.y - pos.size / 2));
    await page.screenshot({ path: f, clip: { x, y, width: pos.size, height: pos.size } });
    execFileSync('python3', ['-I', '-c', 'import sys;from PIL import Image;i=Image.open(sys.argv[1]);i.resize((480,480),Image.NEAREST).save(sys.argv[1])', f]);
    await page.addStyleTag({ content: '.minigame-container{visibility:visible !important}' });
    return f;
};
const tomState = () => page.evaluate(() => { const b = window.npcBehaviorManager.getBehavior('tom'), sp = b.sprite, st = window.npcNeedsSystem.getState('tom'), p = window.player;
    return { seated: !!b._seat, seatMove: !!b._seatMove, moving: !!b.isMoving, dir: b.direction, hold: !!b._poseHoldFacing, anim: sp.anims?.currentAnim?.key || null,
        call: !!st.call, mode: st.mode, chat: window.npcNeedsSystem.world.inChatWith('tom'), tom: [Math.round(sp.x), Math.round(sp.y)], player: [Math.round(p.x), Math.round(p.y)],
        toPlayer: Math.abs(p.x - sp.x) > 2 * Math.abs(p.y - sp.y) ? (p.x > sp.x ? 'right' : 'left') : Math.abs(p.y - sp.y) > 2 * Math.abs(p.x - sp.x) ? (p.y > sp.y ? 'down' : 'up') : `${p.y > sp.y ? 'down' : 'up'}-${p.x > sp.x ? 'right' : 'left'}` }; });
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
// Ring the spare phone while Tom is idle (no job, no call): seated or standing, he answers standing.
result.phone = null; result.rings = 0;
for (let i = 0; i < 360 && !result.phone; i++) {
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => { const s = window.npcNeedsSystem.getState('tom'); return { idle: s.mode === 'idle' && !s.job && !s.call }; });
    if (st.idle && i % 12 === 0) { result.rings++; await page.evaluate(() => window.__test.interact('spare_phone', { approach: false }).catch(() => null)); }
    const sn = await snap('tom');
    if (/pose_phone/.test(sn.anim || '')) result.phone = { ...sn, shot: await shot('tom-phone', 'tom'), crop: await crop('tom-phone-crop', 'tom'), state: await tomState() };
}
result.phoneLog = await page.evaluate(() => window.npcPoses.log.slice(-6));
// ---- talk to Tom mid-call: the call ends, he stays standing for the whole chat, then re-seats
if (result.phone) {
    result.chatCall = { opened: await page.evaluate(() => window.__test.interact('tom').then(r => !!r.ok).catch(e => String(e).slice(0, 100))) };
    await page.waitForTimeout(500);
    result.chatCall.atStart = await tomState();
    const during = [];
    for (let i = 0; i < 16; i++) { await page.waitForTimeout(500); during.push(await tomState()); }
    result.chatCall.sampled = during.length;
    result.chatCall.everSeatedOrMoving = during.filter(d => d.seated || d.seatMove || d.moving).length;
    result.chatCall.allChat = during.every(d => d.chat);
    result.chatCall.callEnded = !during[during.length - 1].call;
    result.chatCall.crop = await crop('tom-chat-call', 'tom');
    await page.evaluate(() => window.__test.minigame.close()).catch(() => null);
    let seatedAfter = null;
    for (let i = 0; i < 120 && !seatedAfter; i++) { await page.waitForTimeout(500); const t = await tomState(); if (t.seated) seatedAfter = { afterMs: (i + 1) * 500, ...t }; }
    result.chatCall.reseated = seatedAfter;
}
// ---- use (machine): lower caffeine for Tom
await page.waitForTimeout(4000);
result.set = await page.evaluate(() => window.__test.needs.set('tom', 'caffeine', 5));
result.use = null; result.drinkSeen = null;
const t0 = Date.now();
while (Date.now() - t0 < 240000 && !result.use) {
    await page.waitForTimeout(500);
    const s = await snap('tom');
    if (/pose_use/.test(s.anim || '')) result.use = { ...s, shot: await shot('tom-use', 'tom'), crop: await crop('tom-use-crop', 'tom'), state: await tomState(), trigger: 'needs.set(tom, caffeine, 5)' };
}
result.useLog = await page.evaluate(() => window.npcPoses.log.slice(-8));
// ---- talk to Tom mid-pose (the use lead, or the drink): he turns to the player and the hold is gone
if (result.use) {
    result.chatPose = { before: await tomState() };
    result.chatPose.opened = await page.evaluate(() => window.__test.interact('tom').then(r => !!r.ok).catch(e => String(e).slice(0, 100)));
    await page.waitForTimeout(800);
    result.chatPose.during = await tomState();
    result.chatPose.crop = await crop('tom-chat-facing', 'tom');
    await page.evaluate(() => window.__test.minigame.close()).catch(() => null);
}
result.errs = errs;
console.log(JSON.stringify(result, null, 1));
await browser.close();
