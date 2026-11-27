// Live proof for POSE_FIXES_REVIEW_R2.md m1 and m2 on test_needs_sims (keyless server, own game).
// m1: a chat that opens the NPC's inventory and resumes keeps Tom standing (no seat move) until the whole conversation closes.
// m2: after a chat, _chatFaced is clear while Tom is seated, and a chat opened as he steps off his chair for a call turns him to the player.
// Headless, setFPS(20) with fixed steps on. node tools/playtest/npc-pose-r2-live-proof.mjs <gameId> <port>
// Exits 1 if any check fails (R3 m1). A third argument 'forceclose' adds the R3 M1 case: a hit while the
// inventory is open from a chat must leave Tom free. 'itemexit' adds the R4 M1 case: a note opened from Tom's
// inventory mid-chat and closed by a non-return route (a hit, then a force close) must leave Tom free.
import { chromium } from 'playwright';
const [gid, port, extra] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player?.body && window.npcNeedsSystem && window.npcPoses, null, { timeout: 90000 });
await page.waitForTimeout(2000);
await page.keyboard.press('Escape');
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
await page.waitForTimeout(3000);
await page.evaluate(() => window.__test.minigame.close()).catch(() => null);   // the Mission Brief
await page.waitForTimeout(800);
const tom = () => page.evaluate(() => { const b = window.npcBehaviorManager.getBehavior('tom'), sp = b.sprite, st = window.npcNeedsSystem.getState('tom'), p = window.player;
    const toPlayer = Math.abs(p.x - sp.x) > 2 * Math.abs(p.y - sp.y) ? (p.x > sp.x ? 'right' : 'left') : Math.abs(p.y - sp.y) > 2 * Math.abs(p.x - sp.x) ? (p.y > sp.y ? 'down' : 'up') : `${p.y > sp.y ? 'down' : 'up'}-${p.x > sp.x ? 'right' : 'left'}`;
    return { seated: !!b._seat, seatMove: !!b._seatMove, moving: !!b.isMoving, chatFaced: !!b._chatFaced, dir: b.direction, toPlayer, call: !!st.call, mode: st.mode,
        chat: window.npcNeedsSystem.world.inChatWith('tom'), pending: !!window.pendingConversationReturn, mg: window.MinigameFramework?.currentMinigame?.constructor?.name || null }; });
const waitFor = async (pred, ms) => { const t0 = Date.now(); let last; while (Date.now() - t0 < ms) { last = await tom(); if (pred(last)) return last; await page.waitForTimeout(250); } return null; };
const ring = () => page.evaluate(() => window.__test.interact('spare_phone', { approach: false }).catch(() => null));
const R = { gid, m1: {}, m2: {} };
await page.evaluate(() => window.__test.moveToNear('spare_phone').catch(() => null));
// Ring until Tom is standing on a call
let onCall = null;
for (let i = 0; i < 40 && !onCall; i++) { const t = await tom(); if (t.mode === 'idle' && !t.call) await ring(); await page.waitForTimeout(500); const n = await tom(); if (n.call && !n.seated && !n.seatMove) onCall = n; }
R.onCall = onCall;
// ---- m1: chat mid-call (hangs up), then hand over to Tom's inventory and resume
await page.evaluate(() => window.__test.moveToNear('tom').catch(() => null));
R.m1.open = await page.evaluate(() => window.__test.interact('tom').then(r => !!r.ok).catch(e => String(e).slice(0, 100)));
await page.waitForTimeout(800);
R.m1.chat1 = await tom();
await page.evaluate(() => { const npc = window.npcManager.getNPC('tom'); npc.itemsHeld = [{ type: 'key', name: 'Spare key', takeable: true, observations: 'test' }]; });
// What person-chat does at a hand-over: it closes (clearing the type), the bridge opens the inventory
R.m1.bridge = await page.evaluate(() => { window.__test.minigame.close(); return window.npcGameBridge.showNPCInventory('tom'); });
const samples = [];
for (let i = 0; i < 12; i++) { await page.waitForTimeout(500); samples.push(await tom()); }
R.m1.inventory = { n: samples.length, mg: samples[0].mg, everSeatedOrMoving: samples.filter(s => s.seated || s.seatMove || s.moving).length, allChat: samples.every(s => s.chat) };
// Close the inventory: the chat resumes after 150 ms; sample the gap densely
await page.evaluate(() => window.__test.minigame.close());
const gap = [];
for (let i = 0; i < 20; i++) { gap.push(await tom()); await page.waitForTimeout(50); }
R.m1.afterClose = { everNotChat: gap.filter(s => !s.chat).length, everSeatedOrMoving: gap.filter(s => s.seated || s.seatMove || s.moving).length, last: gap[gap.length - 1] };
const resumed = await waitFor(t => t.mg && /Person/i.test(t.mg), 3000);
R.m1.resumed = resumed;
await page.waitForTimeout(3000);
R.m1.stillStanding = await tom();
await page.evaluate(() => window.__test.minigame.close());
R.m1.reseated = await waitFor(t => t.seated, 30000);
// ---- m2: _chatFaced is clear through the seat move and the seated spell
R.m2.seatedChatFaced = R.m1.reseated && R.m1.reseated.chatFaced;
await page.waitForTimeout(1500);
R.m2.seatedLater = await tom();
// Ring again; as Tom steps off his chair for the call, open a chat
await ring();
const stepping = await waitFor(t => !t.seated && !t.chat && (t.moving || t.seatMove || t.call), 20000);
R.m2.stepping = stepping;
R.m2.open = await page.evaluate(() => window.__test.interact('tom').then(r => !!r.ok).catch(e => String(e).slice(0, 100)));
await page.waitForTimeout(1200);
R.m2.chat2 = await tom();
R.m2.turned = R.m2.chat2.dir === R.m2.chat2.toPlayer;
await page.evaluate(() => window.__test.minigame.close()).catch(() => null);
// ---- M1 (R3): a force-closed inventory leaves Tom free
if (extra === 'forceclose') {
    R.m1fc = {};
    R.m1fc.waitSeated = await waitFor(t => t.seated && !t.call, 40000);
    await page.evaluate(() => window.__test.moveToNear('tom').catch(() => null));
    R.m1fc.open = await page.evaluate(() => window.__test.interact('tom').then(r => !!r.ok).catch(e => String(e).slice(0, 100)));
    await page.waitForTimeout(800);
    R.m1fc.bridge = await page.evaluate(() => { window.__test.minigame.close(); return window.npcGameBridge.showNPCInventory('tom'); });
    await page.waitForTimeout(800);
    R.m1fc.during = await tom();
    // A forced close with no complete(): the framework path player-damage-interrupt uses when there is none
    await page.evaluate(() => window.MinigameFramework.forceCloseMinigame());
    await page.waitForTimeout(600);
    R.m1fc.after = await tom();
    // A real hit while the inventory is open (player-damage-interrupt: complete(false), so the chat resumes);
    // closing that chat must leave Tom free
    R.m1fc.hasHealth = await page.evaluate(() => !!(window.playerHealth && window.playerHealth.damage));
    if (R.m1fc.hasHealth) {
        await page.evaluate(() => window.__test.interact('tom').catch(() => null));
        await page.waitForTimeout(800);
        await page.evaluate(() => { window.__test.minigame.close(); return window.npcGameBridge.showNPCInventory('tom'); });
        await page.waitForTimeout(800);
        R.m1fc.hitDuring = await tom();
        await page.evaluate(() => window.playerHealth.damage(1));
        await page.waitForTimeout(1500);
        R.m1fc.hitAfter = await tom();
        await page.evaluate(() => { try { window.__test.minigame.close(); } catch (e) {} window.MinigameFramework.forceCloseMinigame(); });
        await page.waitForTimeout(800);
        R.m1fc.hitFree = await tom();
    }
}
// ---- M1 (R4): a note opened from the inventory, closed by a route that never returns to the container
if (extra === 'itemexit') {
    R.m1ie = {};
    for (const route of ['hit', 'forceclose']) {
        const r = R.m1ie[route] = {};
        r.waitSeated = await waitFor(t => t.seated && !t.call && !t.chat, 60000);
        await page.evaluate(() => window.__test.moveToNear('tom').catch(() => null));
        r.open = await page.evaluate(() => window.__test.interact('tom').then(r => !!r.ok).catch(e => String(e).slice(0, 100)));
        await page.waitForTimeout(800);
        await page.evaluate(() => { const npc = window.npcManager.getNPC('tom'); npc.itemsHeld = [{ type: 'notes', name: 'Tom note', readable: true, text: 'Remember the milk.', takeable: true, observations: 'test' }]; });
        r.bridge = await page.evaluate(() => { window.__test.minigame.close(); return window.npcGameBridge.showNPCInventory('tom'); });
        await page.waitForTimeout(800);
        r.inInventory = await tom();
        r.clicked = await page.evaluate(() => { const el = document.querySelector('.container-content-item'); if (el) el.click(); return !!el; });
        await page.waitForTimeout(1200);
        r.reader = await tom();   // the notes reader is open; the pending chat return is still held
        if (route === 'hit') await page.evaluate(() => window.playerHealth.damage(1));
        else await page.evaluate(() => window.MinigameFramework.forceCloseMinigame());
        await page.waitForTimeout(1500);
        r.afterExit = await tom();
        // an unrelated minigame must not make Tom count as in a chat
        r.unrelated = await page.evaluate(() => { try { window.MinigameFramework.startMinigame('notes', null, { title: 'x', text: 'y' }); } catch (e) {} return window.npcNeedsSystem.world.inChatWith('tom'); });
        await page.evaluate(() => { try { window.__test.minigame.close(); } catch (e) {} window.MinigameFramework.forceCloseMinigame(); });
        await page.waitForTimeout(600);
        r.free = await tom();
        r.backOnSchedule = await waitFor(t => t.seated || t.moving || t.seatMove, 60000);
    }
}
R.errs = errs;
// Pass or fail (R3 m1)
const checks = {
    m1_open: R.m1.open === true,
    m1_inventory_standing: R.m1.inventory.everSeatedOrMoving === 0 && R.m1.inventory.allChat,
    m1_no_gap: R.m1.afterClose.everNotChat === 0 && R.m1.afterClose.everSeatedOrMoving === 0,
    m1_resumed: !!R.m1.resumed,
    m1_still_standing: !!R.m1.stillStanding && !R.m1.stillStanding.seated && !R.m1.stillStanding.seatMove && R.m1.stillStanding.chat,
    m2_seated_clear: !!R.m1.reseated && R.m2.seatedChatFaced === false,
    m2_turned: R.m2.turned === true,
    no_page_errors: errs.length === 0
};
if (extra === 'forceclose') {
    checks.m1fc_in_chat_while_open = !!R.m1fc.during && R.m1fc.during.chat === true && !!R.m1fc.during.pending;
    checks.m1fc_free_after = !!R.m1fc.after && R.m1fc.after.chat === false && R.m1fc.after.pending === false;
    if (R.m1fc.hasHealth) checks.m1fc_hit_chat_resumed = !!R.m1fc.hitAfter && R.m1fc.hitAfter.chat === true;
    if (R.m1fc.hasHealth) checks.m1fc_free_after_hit = !!R.m1fc.hitFree && R.m1fc.hitFree.chat === false && R.m1fc.hitFree.pending === false;
}
if (extra === 'itemexit') {
    for (const route of ['hit', 'forceclose']) {
        const r = R.m1ie[route];
        checks[`m1ie_${route}_note_open`] = !!r.reader && /Notes/i.test(r.reader.mg || '') && r.reader.chat === true;
        checks[`m1ie_${route}_free`] = !!r.afterExit && r.afterExit.chat === false && r.afterExit.pending === false;
        checks[`m1ie_${route}_free_during_other`] = r.unrelated === false;
        checks[`m1ie_${route}_schedule`] = !!r.backOnSchedule && r.free?.chat === false;
    }
}
R.checks = checks;
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
console.log(JSON.stringify(R, null, 1));
console.log(failed.length ? `FAIL: ${failed.join(', ')}` : 'PASS: all checks');
await browser.close();
process.exit(failed.length ? 1 : 0);
