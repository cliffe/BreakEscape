// D34 live proof: chatter volume falls with distance, carries faintly through an open door, and is
// blocked by a shut one. Keyless server from the worktree on PORT (default 3092). Headless, setFPS(20)
// with fixed steps on. Drives only a game id passed in (made by tools/playtest/new-game.rb).
//
//   node tools/playtest/chatter-falloff-proof.mjs <gameId> [probe|run|faint|explore]
//
// `faint` (D34 second pass) drives the real ambient chat path and logs the voice's decisions:
// a faint line from a distance and through the open kitchen door, silence while a person-chat is
// open, chatter voiced again after a phone-chat closes, and a faint line ducking under a full one.
//
// The page is changed in memory only: getTTS returns a short silent clip (the server is keyless),
// and TTSManager.play / setDistanceGain are wrapped to log the volume each receives. The real
// Web Audio graph is used, and the distance gain node's value is read back.
import { chromium } from 'playwright';
const PORT = Number(process.env.PORT || 3092), BASE = `http://127.0.0.1:${PORT}`;
const id = process.argv[2], mode = process.argv[3] || 'run';
if (!id) throw new Error('game id required');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* blocked */ } });
await page.goto(`${BASE}/break_escape/games/${id}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
for (let i = 0; i < 20; i++) {
    const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame, bl: s.blockingUi }; });
    if (st.mg) { await page.evaluate(() => window.__test.minigame.close()); await sleep(600); continue; }
    if (st.bl) { const l = st.bl.buttons.map(x => x.label).find(x => /no,|figure it out|continue|ok|close/i.test(x)) || st.bl.buttons[0].label; await page.evaluate(x => window.__test.dismissBlockingUi(x), l); await sleep(800); continue; }
    break;
}

// Instrument
await page.evaluate(async () => {
    const tm = await import('/break_escape/js/systems/tts-manager.js');
    const api = await import('/break_escape/js/api-client.js').catch(() => null);
    window.__plays = []; window.__gains = [];
    const wav = () => { const n = 8000 * (window.__clipSeconds || 1), b = new ArrayBuffer(44 + n * 2), v = new DataView(b); const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
        w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
        for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(8000 * Math.sin(i / 8)), true); return new Blob([b], { type: 'audio/wav' }); };
    if (api?.ApiClient?.getTTS) api.ApiClient.getTTS = async () => wav();
    const P = tm.default.prototype, play = P.play, sdg = P.setDistanceGain;
    P.play = function (npcId, text, opts) { window.__plays.push({ npcId, volume: opts?.volume ?? null }); return play.call(this, npcId, text, opts); };
    P.setDistanceGain = function (v, imm) { window.__gains.push({ v: Math.round(v * 1000) / 1000, imm: !!imm, node: this._distanceNode ? Math.round(this._distanceNode.gain.value * 1000) / 1000 : null }); return sdg.call(this, v, imm); };
    window.__hasApi = !!api;
});

const info = () => page.evaluate(() => {
    const npcs = {};
    for (const n of (window.npcNeedsSystem?.states?.keys?.() || [])) {
        const b = window.npcBehaviorManager?.getBehavior?.(n);
        if (b?.sprite) npcs[n] = { x: Math.round(b.sprite.x), y: Math.round(b.sprite.y), room: b.roomId };
    }
    return { room: window.currentPlayerRoom, player: { x: Math.round(window.player.x), y: Math.round(window.player.y) }, npcs, hasApi: window.__hasApi,
        rooms: Object.fromEntries(Object.entries(window.rooms || {}).map(([k, r]) => [k, { doors: (r.doorSprites || []).map(d => ({ to: d.doorProperties?.connectedRoom, open: !!d.doorProperties?.open, x: Math.round(d.x), y: Math.round(d.y) })), b: r.position && { x: r.position.x, y: r.position.y } }])) };
});
console.log(JSON.stringify(await info(), null, 1));
if (mode === 'probe') { await browser.close(); process.exit(0); }
if (mode === 'explore' || mode === 'faint') {
    const { runFaint } = await import('./chatter-faint-cases.mjs');
    await runFaint({ page, errs, sleep, info, mode });
    await browser.close(); process.exit(0);
}

const out = { cases: [] };
// Put the player at (x, y) in the current room (page only), say a line as `npc`, read what play() and the gain node got
async function sayAt(label, npc, target, { wait = 700 } = {}) {
    // target: {dist} places the player that far from the speaker's current spot, inside the room; {x, y} places it exactly
    await page.evaluate(([npc, target]) => {
        let x = target.x, y = target.y;
        if (target.dist) {
            const sp = window.npcBehaviorManager.getBehavior(npc).sprite;
            let ok = false;
            for (let a = 0; a < Math.PI / 2 + 0.01 && !ok; a += Math.PI / 36) {   // sweep from east round to south
                x = sp.x + Math.cos(a) * target.dist; y = sp.y + Math.sin(a) * target.dist;
                ok = x > 30 && x < 300 && y > 60 && y < 260;
            }
            if (!ok) throw new Error('no in-room spot at ' + target.dist);
        }
        window.player.body.reset(x, y); window.player.setPosition(x, y); window.__plays.length = 0; window.__gains.length = 0;
    }, [npc, target]);
    const r = await page.evaluate(async ([npc]) => {
        const v = window.npcChatterVoice;
        const d = v._distance(npc), h = v._hearing(npc);
        v.say(npc, 'Proof line for ' + npc, {});
        return { room: window.currentPlayerRoom, distance: d === null ? null : Math.round(d), hearing: h, expected: Math.round(v._volumeFor(npc) * 1000) / 1000 };
    }, [npc]);
    await sleep(wait);
    const after = await page.evaluate(() => ({ plays: window.__plays.slice(), gains: window.__gains.slice(), log: window.npcChatterVoice.log.slice(-1)[0] }));
    const c = { label, npc, ...r, playVolume: after.plays[0]?.volume == null ? null : Math.round(after.plays[0].volume * 1000) / 1000, nodeAtStart: after.gains[0]?.node ?? null, setAtStart: after.gains[0]?.v ?? null, log: after.log && { spoken: after.log.spoken, reason: after.log.reason || null, volume: after.log.volume ?? null } };
    out.cases.push(c); console.log(JSON.stringify(c));
    await sleep(1200);   // let the 0.5 s clip end before the next
}

// 1. Same room, three distances from Sanjay (office)
const i0 = await info();
const sp = i0.npcs.sanjay;
for (const [lab, dist] of [['100 px', 100], ['190 px', 190], ['250 px', 250]]) await sayAt(`same room ${lab}`, 'sanjay', { dist });

// 2. Open the kitchen door by walking through it, come back, stand in the office
await page.evaluate(() => window.__test.enterRoom('kitchen'));
await sleep(1500);
const ik = await info();
console.log('in kitchen', JSON.stringify({ room: ik.room, player: ik.player, npcs: ik.npcs }));
await page.evaluate(() => window.__test.enterRoom('office'));
await sleep(1500);
const i1 = await info();
console.log('back', JSON.stringify({ room: i1.room, player: i1.player, doors: i1.rooms.office?.doors, kdoors: i1.rooms.kitchen?.doors }));
// Send Sanjay to the kitchen cooler by the needs system's own control path (thirst), and wait for him to arrive
console.log('needs.set', JSON.stringify(await page.evaluate(() => window.__test.needs.set('sanjay', 'thirst', 100))));
let kn = null;
for (let t = 0; t < 120 && !kn; t++) { await sleep(1000); const ii = await info(); kn = Object.entries(ii.npcs).find(([, n]) => n.room === 'kitchen'); if (t % 10 === 0) console.log('wait', t, JSON.stringify(ii.npcs.sanjay)); }
await sleep(1500);
out.kitchenNpc = kn && kn[0];
if (kn) {
    const [kid, kp] = kn;
    const door = i1.rooms.office.doors.find(d => d.to === 'kitchen') || { x: 16, y: 80 };
    await sayAt('open door, near', kid, { x: door.x + 60, y: door.y });
    await sayAt('open door, far', kid, { x: door.x + 230, y: door.y + 120 });
    // Closed door: a shut-door sprite added to the kitchen's list in the page only (a stand-in; the real
    // door is open for good once opened), then removed
    await page.evaluate(() => { window.rooms.kitchen.doorSprites = (window.rooms.kitchen.doorSprites || []).concat([{ __proof: true, active: true, doorProperties: { connectedRoom: window.currentPlayerRoom, open: false } }]); });
    await sayAt('shut door (stand-in sprite)', kid, { x: door.x + 60, y: door.y });
    await page.evaluate(() => { window.rooms.kitchen.doorSprites = window.rooms.kitchen.doorSprites.filter(d => !d.__proof); });
}

// 3. Leaving the room mid-line: a long clip would be needed; the unit test covers the follow loop.
out.errors = errs;
console.log(JSON.stringify(out, null, 1));
await browser.close();
