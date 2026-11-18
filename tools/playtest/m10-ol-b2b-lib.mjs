import { start, settle, EXTRAS } from './m10-ol-lib.mjs';
export { start, settle };
export async function monitor(g) {
  await g.ev(() => {
    window.__m = []; window.__logSeen = window.npcNeedsSystem.getLog().length; const T0 = Date.now();
    const body = (sp) => sp ? [Math.round(sp.x * 10) / 10, Math.round((sp.y + 31) * 10) / 10] : null;
    const seen = new Set();
    setInterval(() => {
      try {
        const nns = window.npcNeedsSystem;
        const log = nns.getLog();
        // log is capped; track by tick+ev signature
        for (const e of log) { const k = e.t + '|' + e.npc + '|' + e.ev + '|' + (e.knot||''); if (!seen.has(k)) { seen.add(k); if (/exchange|job|use|brew|cut/.test(e.ev) || e.knot) window.__m.push({ w: Date.now() - T0, kind: 'log', e }); } }
        for (const c of nns._chats.values()) {
          if (c.ex) { const k = 'ex|' + c.ex.knot + '|' + c.ex.startedAt; if (!seen.has(k)) { seen.add(k);
            const sp = id => { try { return window.npcBehaviorManager.getBehavior(id).sprite; } catch (e) { return null; } };
            const s = body(sp('sofia_marchetti')), d = body(sp('darren_price')), p = [Math.round(window.player.x), Math.round(window.player.y + 31)];
            const dd = (a, b) => a && b ? Math.round(Math.hypot(a[0]-b[0], a[1]-b[1])*10)/10 : null;
            window.__m.push({ w: Date.now() - T0, clock: Math.round(nns.clockMs), kind: 'exstart', knot: c.ex.knot, spk0: c.ex.lines[0].speakerId, nlines: c.ex.lines.length, player: p, sofia: s, darren: d, dSofia: dd(p, s), dDarren: dd(p, d) }); } }
        }
      } catch (e) {}
    }, 100);
  });
}
export const mlog = (g) => g.ev(() => window.__m);
export const globs = (g, re = /split|gate|door_scene|aside|arakawa|breach|tether|fp_|flag|heard_ex|pair_back|closing/) => g.ev((r) => { const s = window.__test.getState(); return Object.fromEntries(Object.entries(s.globals).filter(([k]) => new RegExp(r).test(k))); }, re.source);
export const dlg = (g) => g.ev(() => { try { const s = window.__test.getState(); return { mg: s.activeMinigame && s.activeMinigame.type, d: s.dialogue && Object.keys(s.dialogue).join(','), npc: s.dialogue && (s.dialogue.npcId || s.dialogue.npc || s.dialogue.speaker), blocking: !!s.blockingUi }; } catch (e) { return String(e); } });
export const pos = (g) => g.ev(() => [Math.round(window.player.x), Math.round(window.player.y + 31)]);
export const tp = (g, x, y) => g.ev(([x, y]) => { window.player.body.reset(x, y - 31); window.player.setPosition(x, y - 31); }, [x, y]);
export async function brewIdle(g, maxS = 120) {
  const end = Date.now() + maxS * 1000; let quiet = 0;
  while (Date.now() < end) {
    const idle = await g.ev(() => ['darren_price','sofia_marchetti'].every(id => { const s = window.npcNeedsSystem.getState(id); return !s.job; }));
    quiet = idle ? quiet + 1 : 0; if (quiet >= 6) return true; await g.t(500);
  }
  return false;
}

// absolute-time event capture and an NPC position sampler (all visible sprites in forward_post, every 200 ms)
export async function monitor2(g) {
  await g.ev(() => {
    window.__abs = []; window.__traj = [];
    const ed = window.eventDispatcher, o = ed.emit.bind(ed);
    ed.emit = (ev, data) => { try { if (/^(npc_(use_started|used|exchange|left_post|returned|need_urgent|action_windup)|conversation_|global_variable_changed:(split|arakawa|gate|door_scene|breach|pair|heard|fp_|flag|closing)|door_unlock)/.test(ev)) window.__abs.push({ a: Date.now(), ev, d: data && data.npcId ? data.npcId : (data && data.name ? data.name + '=' + data.value : null) }); } catch (e) {} return o(ev, data); };
    setInterval(() => {
      try {
        const room = window.rooms.forward_post; if (!room || !room.npcSprites) return;
        const row = { a: Date.now(), p: [Math.round(window.player.x), Math.round(window.player.y + 31)], n: {} };
        for (const sp of room.npcSprites) { const id = sp.npcId || sp.name || (sp.npc && sp.npc.id); if (!id) continue; if (sp.visible && sp.active !== false) row.n[id] = [Math.round(sp.x), Math.round(sp.y + 31)]; }
        window.__traj.push(row);
      } catch (e) {}
    }, 200);
  });
}
export const absLog = (g) => g.ev(() => window.__abs);
export const traj = (g) => g.ev(() => window.__traj);

// drive any open conversation/minigame forward; onChat(npcId) is called once per newly seen chat.
export async function drive(g, { until, maxMs = 90000, onChat, stopAfterChat = false }) {
  const end = Date.now() + maxMs; let last = null; const tr = []; let saw = false;
  while (Date.now() < end) {
    if (until && await until()) return { ok: true, tr };
    const info = await g.ev(() => {
      try {
        const st = window.__test.getState();
        const m = window.MinigameFramework.currentMinigame;
        const npc = m && (m.npcId || (m.npc && m.npc.id)) || null;
        if (st.blockingUi) return { kind: 'blocking' };
        if (!st.activeMinigame) return null;
        return { kind: st.activeMinigame.type, npc, d: st.dialogue };
      } catch (e) { return null; }
    });
    if (!info) { last = null; if (saw && stopAfterChat) { await g.t(300); return { ok: true, tr }; } await g.t(300); continue; }
    if (info.kind === 'PersonChatMinigame' && info.npc !== last) { last = info.npc; tr.push('chat:' + info.npc); saw = true; if (onChat) await onChat(info.npc); }
    if (info.kind === 'blocking') { await g.ev(() => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {}); tr.push('dismiss'); }
    else if (info.d && info.d.choices && info.d.choices.length) { await g.ev(() => window.__test.minigame.chooseIndex(1)).catch(() => {}); }
    else if (info.d && info.d.canContinue) { await g.ev(() => window.__test.minigame.continue()).catch(() => {}); }
    else if (info.kind !== 'PersonChatMinigame') { tr.push('close:' + info.kind); await g.ev(() => window.__test.minigame.close && window.__test.minigame.close()).catch(() => {}); }
    await g.t(250);
  }
  return { ok: false, tr };
}
