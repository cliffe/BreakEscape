// S2 live proof helpers for office_life_showcase: in-page event recorder + object lookup.
import { open, ev, waitAtPost } from './m01-ol-lib.mjs';
import fs from 'node:fs';
export { open, ev, waitAtPost };
export const OUT = 'scenarios/office_life_showcase/planning/screens';
export const NPCS = ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda', 'zainab_hussain'];
export const TASKS = ['see_queue', 'hear_queue_chat', 'see_coffee_off', 'hear_cooler_exchange'];
export const GLOBALS = ['chidi_pc_screen_locked', 'kitchen_seen', 'heard_exchange_cooler_chat', 'office_coffee_off'];

export async function start(gid) {
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync('tmp/s2', { recursive: true });
  const h = await open(gid);
  await h.page.route('**/tts**', r => r.abort());
  return h;
}
export const shot = (h, n) => h.page.screenshot({ path: `${OUT}/${n}.png` });

// Records, against the needs clock: every world emit, speak, bark, sound, global change, task change, job change, bubble speakers.
export async function install(h) {
  await ev(h, ({ ids, tasks, globals }) => {
    const sys = window.npcNeedsSystem, w = sys.world, L = window.__rec = [];
    const clk = () => +(sys.clockMs / 1000).toFixed(1);
    const add = (k, o) => L.push({ c: clk(), k, ...o });
    const oe = w.emit; w.emit = function (n, d) { if (!/^(npc_need_urgent|npc_used|npc_arrived)/.test(n)) { let dd; try { dd = JSON.stringify(d).slice(0, 200); } catch (e) { dd = '?'; } add('emit', { n, d: dd }); } return oe.call(this, n, d); };
    const ed = window.eventDispatcher, oed = ed.emit; ed.emit = function (n, d) { if (/^(workstation_|door_|room_entered)/.test(n)) { let dd; try { dd = JSON.stringify(d).slice(0, 200); } catch (e) { dd = '?'; } add('emit', { n, d: dd }); } return oed.apply(this, arguments); };
    const os = w.speak; if (typeof os === 'function') w.speak = function (id, line, info) { add('speak', { id, line, info: JSON.stringify({ topic: info?.topic, knot: info?.knot, overheard: info?.overheard, unheard: info?.unheard }) }); return os.apply(this, arguments); };
    const bs = window.barkSystem, ob = bs.showBark; bs.showBark = function (p) { add('bark', { npc: p?.npcId, text: String(p?.text || p?.message || '').slice(0, 100) }); return ob.apply(this, arguments); };
    const snd = window.game.sound, op = snd.play; snd.play = function (key) { add('sound', { key: String(key) }); return op.apply(this, arguments); };
    const prev = { g: {}, t: {}, j: {}, room: null, bub: '' };
    setInterval(() => {
      const gv = window.gameState?.globalVariables || {};
      for (const g of globals) if (gv[g] !== prev.g[g]) { prev.g[g] = gv[g]; add('global', { g, v: gv[g] }); }
      for (const t of tasks) { const s = window.objectivesManager?.getTask?.(t)?.status; if (s !== prev.t[t]) { prev.t[t] = s; add('task', { t, s }); } }
      for (const id of ids) { const st = sys.getState(id); const j = st?.job ? `${st.job.need || st.job.kind}:${st.job.targetId || ''}:${st.job.phase || ''}` : (st?.atPost ? 'post' : st?.mode); if (j !== prev.j[id]) { prev.j[id] = j; add('job', { id, j, room: window.npcManager.npcs.get(id)?.roomId }); } }
      const rm = window.currentPlayerRoom; if (rm !== prev.room) { prev.room = rm; add('room', { rm }); }
      const bub = [...(window.npcWorldBubbles?.bubbles?.keys() || [])].filter(i => window.npcWorldBubbles.showsBubble(i)).sort().join(','); if (bub !== prev.bub) { prev.bub = bub; add('bubbles', { who: bub }); }
    }, 200);
  }, { ids: NPCS, tasks: TASKS, globals: GLOBALS });
}
export const rec = h => ev(h, () => window.__rec);
export const clock = h => ev(h, () => +(window.npcNeedsSystem.clockMs / 1000).toFixed(1));
export const dump = async (h, name) => { const d = { rec: await rec(h), log: await ev(h, () => window.__test.needs.log()) }; fs.writeFileSync(`tmp/s2/${name}.json`, JSON.stringify(d)); return d; };
export async function objPos(h, room, ...ids) {
  return ev(h, ({ room, ids }) => { const out = {}; for (const [k, o] of Object.entries(window.rooms[room]?.objects || {})) { const id = o.objectId || k; if (ids.some(i => id === i || id.startsWith(i))) out[id] = [Math.round(o.x), Math.round(o.y)]; } return out; }, { room, ids });
}
export async function lever(h) {
  console.log('moveToNear', JSON.stringify(await ev(h, () => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 30000 })).catch(e => String(e))));
  console.log('interact', JSON.stringify(await ev(h, () => window.__test.interact('office_coffee_socket')).catch(e => String(e)))); await h.t(800);
  const ok = await ev(h, () => { const b = document.querySelector('.game-confirm-ok'); if (b) { b.click(); return true; } return false; });
  console.log('confirm', ok); await h.t(600);
}
export async function waitClock(h, c, poll = 500) { for (;;) { if (await clock(h) >= c) return; await h.t(poll); } }
export async function waitFor(h, fn, arg, maxClock, poll = 400) { for (;;) { if (await ev(h, fn, arg)) return true; if (await clock(h) >= maxClock) return false; await h.t(poll); } }
export const queuers = h => ev(h, () => window.npcNeedsSystem && ['chidi_okeke', 'jun_watanabe', 'zainab_hussain', 'graham_whitfield', 'agnieszka_duda'].filter(i => { const j = window.__test.needs.state(i)?.job; return j && /queue/.test(`${j.phase}`); }));
export const log = (c, ...a) => console.log(`[${c}]`, ...a);
