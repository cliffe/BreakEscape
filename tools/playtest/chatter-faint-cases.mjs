// Faint-chatter cases for chatter-falloff-proof.mjs (D34 second pass). Receives the live page.
//
// The ambient chat turn is slow and random to wait for, so each case runs the same two steps the
// needs system's chat turn runs, through the live objects: world.faintVolume (via the voice) to
// decide, then _pickBark({faint}) to draw a line from the bag and _speak to hand it to the voice.
// Only the page is changed; no game row, scenario copy or global is touched.
export async function runFaint({ page, errs, sleep, info, mode }) {
    await page.evaluate(() => {
        window.__clipSeconds = 6; window.__seen = 0; window.__events = [];
        const v = window.npcChatterVoice;
        window.__poll = () => { while (window.__seen < v.log.length) { const e = v.log[window.__seen++]; window.__events.push({ npc: e.npcId, spoken: e.spoken, faint: !!e.faint, volume: e.volume ?? null, reason: e.reason || null }); } };
        // the clip is regenerated each call from __clipSeconds, but the earlier closure fixed it at 1 s; rebuild via getTTS wrapper
        window.__sayLine = (npc, faint) => {
            const s = window.npcNeedsSystem, st = s.states.get(npc);
            if (faint) st.faintQuietUntil = 0;   // the faint throttle (R1 M2) is not what these cases test
            const pick = s._pickBark(st, 'coffee', { faint, ignoreCooldown: true });
            if (!pick?.line) return { npc, line: null, note: 'no bag line (lock held or empty pool)' };
            // No bubble is staged for a hand-drawn line, so the bubble layer would hold the voice back for ever:
            // let the voice through (what the layer does once the bubble shows)
            const wb = window.npcWorldBubbles, keep = wb?.deferChatterVoice;
            if (wb) wb.deferChatterVoice = () => false;
            try { s._speak(npc, pick.line, s.clockMs + 5500, { topic: 'coffee', overheard: !faint, faint }); } finally { if (wb) wb.deferChatterVoice = keep; }
            return { npc, line: pick.line.slice(0, 30) };
        };
        // best player spot in the current room: within `near` of `keep` (or anywhere) and as far as possible from `far`
        window.__place = (far, keep, near) => {
            const f = window.npcBehaviorManager.getBehavior(far).sprite, k = keep && window.npcBehaviorManager.getBehavior(keep).sprite;
            let best = null;
            for (let x = 40; x <= 290; x += 10) for (let y = 70; y <= 250; y += 10) {
                if (k && Math.hypot(x - k.x, y - k.y) > near) continue;
                const d = Math.hypot(x - f.x, y - f.y);
                if (!best || d > best.d) best = { x, y, d };
            }
            window.player.body.reset(best.x, best.y); window.player.setPosition(best.x, best.y);
            return { x: best.x, y: best.y };
        };
        window.__snap = () => { window.__poll(); const e = window.__events.splice(0), p = window.__plays.splice(0), g = window.__gains.splice(0); return { events: e, plays: p.map(x => ({ npc: x.npcId, volume: x.volume == null ? null : Math.round(x.volume * 1000) / 1000 })), gains: g.map(x => ({ set: x.v, node: x.node })) }; };
    });
    // The instrumented getTTS was built with a 1 s clip; replace it with the long one for these cases
    await page.evaluate(async () => {
        const api = await import('/break_escape/js/api-client.js');
        const wav = () => { const n = 8000 * 6, b = new ArrayBuffer(44 + n * 2), v = new DataView(b); const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
            w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
            v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
            for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(8000 * Math.sin(i / 8)), true); return new Blob([b], { type: 'audio/wav' }); };
        api.ApiClient.getTTS = async () => wav();
    });
    const out = { cases: {} };
    const rec = async (name, extra = {}) => { const r = { ...extra, ...(await page.evaluate(() => window.__snap())) }; out.cases[name] = r; console.log(name, JSON.stringify(r)); };
    const state = () => page.evaluate(() => { const v = window.npcChatterVoice; return { room: window.currentPlayerRoom, conv: v.conversationOpen() }; });
    const fv = id => page.evaluate(id => { const v = window.npcChatterVoice; return { faintVolume: Math.round(v.faintVolume(id) * 1000) / 1000, dist: Math.round(v._distance(id)), hearing: v._hearing(id) }; }, id);
    const idle = () => sleep(6500);   // let a 5.5 s line finish

    // 1. Faint from a distance (office, player far from Sanjay, outside earshot)
    const pos1 = await page.evaluate(() => window.__place('sanjay'));
    const f1 = await fv('sanjay');
    const r1 = await page.evaluate(() => window.__sayLine('sanjay', true));
    await sleep(1500);
    await rec('1_faint_distance', { player: pos1, ...f1, said: r1 });
    await idle(); await page.evaluate(() => window.__snap());

    // 2. Faint through the open kitchen door: player in the kitchen (door opened by walking in), speaker in the office
    await page.evaluate(() => window.__test.enterRoom('kitchen')); await sleep(1500);
    const who = await page.evaluate(() => Object.keys(window.npcBehaviorManager ? Object.fromEntries([...window.npcNeedsSystem.states.keys()].map(k => [k, 1])) : {}).filter(k => window.npcBehaviorManager.getBehavior(k)?.roomId === 'office'));
    const pos2 = await page.evaluate(() => { window.__snap(); const p = window.player; return { x: Math.round(p.x), y: Math.round(p.y), room: window.currentPlayerRoom }; });
    let door = null;
    for (const id of who) { const f = await fv(id); if (f.hearing > 0 && f.faintVolume > 0) { door = { id, ...f }; break; } }
    if (door) {
        const r2 = await page.evaluate(id => window.__sayLine(id, true), door.id);
        await sleep(1500);
        await rec('2_faint_open_door', { player: pos2, speakerRoom: 'office', ...door, said: r2 });
        await idle(); await page.evaluate(() => window.__snap());
    } else console.log('2_faint_open_door: no NPC in range', JSON.stringify({ who, pos2 }));
    await page.evaluate(() => window.__test.enterRoom('office')); await sleep(2000);

    // 3. Person-chat open: faint volume is 0, the system's turn is silent, a direct say is refused
    await page.evaluate(() => window.__place('tom'));
    const before3 = await fv('tom');
    await page.evaluate(() => window.MinigameFramework.startMinigame('person-chat', null, { npcId: 'amara', title: 'Amara' })); await sleep(1500);
    const st3 = await state(); const during3 = await fv('tom');
    await page.evaluate(() => window.__snap());
    const sys3 = await page.evaluate(() => { const s = window.npcNeedsSystem; const st = s.states.get('tom'); s._speak('tom', 'Is there any milk left?', s.clockMs + 3000, { topic: 'coffee', overheard: true }); return 'system _speak called'; });
    const direct3 = await page.evaluate(() => { window.npcChatterVoice.say('tom', 'Direct line', { overheard: true }); return 'v.say called'; });
    await sleep(1200);
    await rec('3_person_chat_open', { conversationOpen: st3.conv, before: before3, during: during3, sys3, direct3 });
    await page.evaluate(() => window.__test.minigame.close()); await sleep(1500);

    // 4. Phone-chat opens and closes; chatter is voiced again after it closes
    await page.evaluate(() => window.MinigameFramework.startMinigame('phone-chat', null, { phoneId: 'proof_phone', npcIds: ['amara'], title: 'Phone' })); await sleep(2000);
    const st4 = await state(); const during4 = await fv('tom');
    await page.evaluate(() => { window.npcChatterVoice.say('tom', 'Direct line on the phone', { overheard: true }); });
    await sleep(1200);
    await rec('4a_phone_chat_open', { conversationOpen: st4.conv, during: during4 });
    await page.evaluate(() => window.__test.minigame.close()); await sleep(1800);
    const st4b = await state(); const after4 = await fv('tom');
    await idle();
    const r4 = await page.evaluate(() => window.__sayLine('tom', false));
    await sleep(1500);
    await rec('4b_after_phone_closes', { conversationOpen: st4b.conv, after: after4, said: r4 });
    await idle(); await page.evaluate(() => window.__snap());

    // 5. Preempt: a faint line from Sanjay is playing; a full line near the player takes the voice and the faint one fades
    const pos5 = await page.evaluate(() => window.__place('sanjay', 'amara', 110));
    const r5a = await page.evaluate(() => window.__sayLine('sanjay', true));
    await sleep(1800);
    const mid5 = await page.evaluate(() => ({ plays: window.__plays.slice(), gains: window.__gains.length }));
    const r5b = await page.evaluate(() => window.__sayLine('amara', false));
    await sleep(1600);
    await rec('5_full_over_faint', { player: pos5, faintSaid: r5a, fullSaid: r5b, playsBeforeFull: mid5.plays.length });
    await idle(); await page.evaluate(() => window.__snap());

    // 6. Duck: a scripted bark is playing (page-only stand-in), a faint line plays at 0.25 of its volume
    const pos6 = await page.evaluate(() => window.__place('sanjay'));
    await page.evaluate(() => { const bs = window.barkSystem; window.__bs = { m: bs.ttsManagers, p: bs._voicePlaying }; bs.ttsManagers = new Map([['proof', {}]]); bs._voicePlaying = () => true; });
    const f6 = await fv('sanjay');
    const r6 = await page.evaluate(() => window.__sayLine('sanjay', true));
    await sleep(1500);
    await rec('6_duck_under_bark', { player: pos6, undampedFaintVolume: f6.faintVolume, said: r6 });
    await page.evaluate(() => { const bs = window.barkSystem; bs.ttsManagers = window.__bs.m; bs._voicePlaying = window.__bs.p; });
    await idle();

    // 7. R1 M1: the mute lifts the moment a phone-chat closes, and a later non-conversation minigame is not a conversation
    //    although currentConversationMinigameType stays 'phone-chat' (a page-only stand-in minigame stands for a lockpick)
    // stand 200 px from Tom: out of earshot (160) but inside the falloff range (480)
    await page.evaluate(() => { const t = window.npcBehaviorManager.getBehavior('tom').sprite; const x = Math.max(40, t.x - 200), y = t.y; window.player.body.reset(x, y); window.player.setPosition(x, y); });
    await page.evaluate(() => window.MinigameFramework.startMinigame('phone-chat', null, { phoneId: 'proof_phone', npcIds: ['amara'], title: 'Phone' })); await sleep(1500);
    const open7 = await page.evaluate(() => ({ conv: window.npcChatterVoice.conversationOpen(), type: window.currentConversationMinigameType, scene: window.MinigameFramework.currentMinigame?._sceneType || null }));
    await page.evaluate(() => window.__test.minigame.close()); await sleep(300);
    const closed7 = await page.evaluate(() => ({ conv: window.npcChatterVoice.conversationOpen(), type: window.currentConversationMinigameType, faint: window.npcChatterVoice.faintVolume('tom') }));
    const stub7 = await page.evaluate(() => {
        const mf = window.MinigameFramework, keep = mf.currentMinigame;
        mf.currentMinigame = { constructor: { name: 'LockpickingMinigamePhaser' }, _sceneType: 'lockpicking' };
        const r = { conv: window.npcChatterVoice.conversationOpen(), type: window.currentConversationMinigameType, hears: window.npcNeedsSystem.world.playerHears('tom', 160) };
        mf.currentMinigame = keep; return r;
    });
    await rec('7_mute_lifts_on_close', { open7, closed7, stub7 });

    // 8. R1 M2: a faint draw leaves the full cooldown alone; a heard draw straight after still gets a line
    const r8 = await page.evaluate(() => {
        const s = window.npcNeedsSystem, st = s.states.get('sanjay');
        st.chatterQuietUntil = 0; st.faintQuietUntil = 0;
        const f = s._pickBark(st, 'coffee', { faint: true });
        const after = { chatterQuietUntil: st.chatterQuietUntil || 0, faintQuietUntil: Math.round(st.faintQuietUntil - s.clockMs) };
        const again = s._pickBark(st, 'coffee', { faint: true });
        const heard = s._pickBark(st, 'coffee', {});
        return { faintLine: !!f?.line, ...after, secondFaintIsPicture: !again?.line, heardLine: !!heard?.line, chatterQuietAfterHeard: Math.round(st.chatterQuietUntil - s.clockMs) };
    });
    await rec('8_faint_keeps_full_cooldown', r8);

    out.errors = errs;
    console.log(JSON.stringify({ errors: errs }));
}
