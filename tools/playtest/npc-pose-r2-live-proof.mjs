// Live proof for POSE_FIXES_REVIEW_R2.md m1 and m2 on test_needs_sims (keyless server, own game).
// m1: a chat that opens the NPC's inventory and resumes keeps Tom standing (no seat move) until the whole conversation closes.
// m2: after a chat, _chatFaced is clear while Tom is seated, and a chat opened as he steps off his chair for a call turns him to the player.
// Headless, setFPS(20) with fixed steps on. node tools/playtest/npc-pose-r2-live-proof.mjs <gameId> <port>
import { chromium } from 'playwright';
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
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
R.errs = errs;
console.log(JSON.stringify(R, null, 1));
await browser.close();
