// R1 m1/M1 live proof of the npcThoughts flag. Usage:
//   node tools/playtest/npc-thoughts-proof.mjs <gameId> <label> <needs-csv npc:need,...> <phases> [port]
// phases: comma list of "far" / "near" / "room:<id>[+<id>...]"; each phase runs PHASE_S seconds with the listed needs forced low at its start.
import { chromium } from 'playwright';
import fs from 'node:fs';
const EXEC = process.env.CHROMIUM_PATH || undefined;   // optional override; playwright finds its own browser otherwise
const [gid, label, needsCsv = '', phases = 'far,near', port = '3093'] = process.argv.slice(2);
const PHASE_S = Number(process.env.PHASE_S || 60);
const out = (process.env.OUT_DIR || 'tmp/npc-thoughts-proof') .replace(/\/?$/, '/');   // relative to the repo root; screenshots are not committed
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const t = ms => page.waitForTimeout(ms);
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body, null, { timeout: 90000 });
await t(2000);
for (let i = 0; i < 6; i++) {
    const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
    if (!busy) break;
    // Never press Escape here: it opens the pause menu, which then blocks enterRoom. Resume closes it if it is up.
    await page.evaluate(() => { if (window.__test.getState().activeMinigame) window.__test.minigame.close(); }).catch(() => {});   // a person-chat or title minigame
    let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => null);
    if (!d || d.ok === false) d = await page.evaluate(() => window.__test.dismissBlockingUi()).catch(() => null);
    if (!d || d.ok === false) await page.evaluate(() => window.__test.dismissBlockingUi('No')).catch(() => {});
    await t(500);
}
if (process.env.FLIP) await page.evaluate(() => { window.gameScenario.npcThoughts = true; });   // in-page only, nothing saved
// setFPS(20), fixed steps left ON
await page.evaluate(() => { window.game.physics.world.setFPS(20); });
const info = await page.evaluate(() => ({
    flag: window.gameScenario.npcThoughts, showPressingNeeds: window.gameScenario.showPressingNeeds, room: window.currentPlayerRoom,
    fixedStep: window.game.physics.world.fixedStep, fps: window.game.physics.world.fps,
    npcs: [...(window.npcNeedsSystem?.states?.keys?.() || [])].map(n => { const b = window.npcBehaviorManager.getBehavior(n); return { n, room: b?.roomId, x: Math.round(b?.sprite?.x), y: Math.round(b?.sprite?.y) }; }),
    pl: { x: Math.round(player.x), y: Math.round(player.y) }
}));
console.log(JSON.stringify(info));
await page.evaluate(() => {
    window.__S = { n: 0, maxIcons: 0, maxIconVisible: 0, maxThoughtVisible: 0, maxWorldVisible: 0, maxPictureWorld: 0, maxSpokenWorld: 0, maxDom: 0, maxSceneBubbleObjs: 0,
        iconsCreated: 0, thoughtsCreated: 0, pictureTurnTicks: 0, picDebug: null, spoken: new Set(), pictures: new Set(), turns: new Set() };
    setInterval(() => {
        const S = window.__S, ai = window.npcActionIcons, wb = window.npcWorldBubbles; S.n++;
        for (const id of window.npcNeedsSystem.states.keys()) { const tk = window.npcNeedsSystem.getState(id)?.talking; if (tk) S.turns.add(id + ' ' + (tk.line ? 'line' : tk.picture ? 'picture:' + tk.picture : 'silent'));
            // Deterministic picture chat: walk the player to any NPC that is saying a picture so its bubble is in view
            if (tk && tk.picture && !tk.line) { S.pictureTurnTicks = (S.pictureTurnTicks || 0) + 1; { const bb = window.npcWorldBubbles?.bubbles.get(id); S.picDebug = JSON.stringify({ id, hasBb: !!bb, box: bb?.box?.visible, img: bb?.img?.visible, tex: bb?.img?.texture?.key, txt: bb?.text?.text, pic: tk.picture }); }
                const sp = window.npcBehaviorManager.getBehavior(id)?.sprite; if (sp && window.player) window.player.setPosition(sp.x + 40, sp.y + 30); } }
        if (ai) {
            S.iconsCreated = Math.max(S.iconsCreated, ai.icons.size); S.thoughtsCreated = Math.max(S.thoughtsCreated, ai.bubbles.size);
            let iv = 0, tv = 0;
            for (const ic of ai.icons.values()) if (ic?.box?.visible) iv++;
            for (const b of ai.bubbles.values()) if (b?.box?.visible) tv++;
            S.maxIconVisible = Math.max(S.maxIconVisible, iv); S.maxThoughtVisible = Math.max(S.maxThoughtVisible, tv);
        }
        if (wb) {
            let w = 0, p = 0, sp = 0;
            for (const [id, bb] of wb.bubbles) {
                if (!bb.box.visible) continue; w++;
                const txt = bb.text?.text || '';
                if (bb.img?.visible && !txt) { p++; S.pictures.add(id); } else if (txt) { sp++; S.spoken.add(id + ': ' + txt); }
            }
            S.maxWorldVisible = Math.max(S.maxWorldVisible, w); S.maxPictureWorld = Math.max(S.maxPictureWorld, p); S.maxSpokenWorld = Math.max(S.maxSpokenWorld, sp);
        }
        S.maxDom = Math.max(S.maxDom, document.querySelectorAll('[class*="bubble" i], [id*="bubble" i], [class*="thought" i]').length);
        const sc = window.game; let o = 0;
        for (const c of sc.children.list) if (c.visible && c.type === 'Container' && c.list && c.list.some(x => x.type === 'Image' && x.visible && x.texture && x.texture.key !== '__DEFAULT')) o++;
        S.maxSceneBubbleObjs = Math.max(S.maxSceneBubbleObjs, o);
    }, 100);
});
const force = async () => { for (const pair of needsCsv.split(',').filter(Boolean)) { const [n, need] = pair.split(':'); await page.evaluate(([n, need]) => window.__test.needs.set(n, need, 5), [n, need]); } };
const park = async (where) => page.evaluate((where) => {
    const b = window.npcBehaviorManager.getBehavior([...window.npcNeedsSystem.states.keys()][0]); const sp = b.sprite;
    const room = window.rooms[window.currentPlayerRoom]; const pos = room.position || { x: 0, y: 0 };
    if (where === 'near') player.setPosition(sp.x + 40, sp.y + 30); else { const x = sp.x < pos.x + 160 ? sp.x + 320 : sp.x - 320; player.setPosition(Math.max(pos.x + 40, x), sp.y); }
    return { x: Math.round(player.x), y: Math.round(player.y), npc: [Math.round(sp.x), Math.round(sp.y)] };
}, where);
let k = 0;
for (const ph of phases.split(',')) {
    // room:a+b+c walks through each room in turn (enterRoom only crosses one door), then the phase runs in the last
    if (ph.startsWith('room:')) { for (const hop of ph.slice(5).split('+')) { const r = await page.evaluate((r) => window.__test.enterRoom(r, { timeoutMs: 25000 }), hop).catch(() => null); console.log('enterRoom', hop, JSON.stringify(r)); } }
    else console.log('park', ph, JSON.stringify(await park(ph)));
    await force();
    const start = Date.now(); let shots = 0, lastPic = 0, lastSpoken = 0, lastForce = Date.now();
    while (Date.now() - start < PHASE_S * 1000) {
        await t(1500);
        if (Date.now() - lastForce > 10000) { await force(); lastForce = Date.now(); }   // keep the needs low: one push at phase start left some runs with NPCs that never acted
        const s = await page.evaluate(() => ({ pic: window.__S.pictures.size, sp: window.__S.spoken.size, ic: window.__S.maxIconVisible, th: window.__S.maxThoughtVisible }));
        const interesting = s.pic > lastPic || s.sp > lastSpoken;
        if ((interesting && shots < 4) || (shots === 0 && Date.now() - start > 20000)) { await page.screenshot({ path: `${out}${label}-${k}-${ph.replace(':', '_')}-${shots}.png` }); shots++; }
        lastPic = s.pic; lastSpoken = s.sp;
    }
    k++;
}
const S = await page.evaluate(() => { const s = window.__S; return { ...s, spoken: [...s.spoken], pictures: [...s.pictures], turns: [...s.turns] }; });
const needsNow = await page.evaluate(() => [...window.npcNeedsSystem.states.keys()].map(n => ({ n, mode: window.__test.needs.state(n)?.mode })));
console.log("RESULT " + JSON.stringify({ gid, label, errs: [...new Set(errs)], nErrs: errs.length, S, needsNow }));
await page.screenshot({ path: `${out}${label}-final.png` });
await browser.close();
