// t13_architect_call (m07, keyless, NOT YET RUN, needs BE_KEEP_RING=1): the withheld call, one take for beat 7 and the ending. Start in server_room, walk through the door into operations_floor (first entry: room_entered fires), stand still, ring after 5 s (no caller ID), answer. taunt_t30 plays narrator "No caller ID. The line opens before you speak." (voiced? untested), then beat 7 "Don't look for the trace. It isn't there." (3.41 s), "I've read your file..." (9.17 s), ENDING "Four fires tonight, and only one of you. I set them so you'd have to choose." (7.06 s, tagged). Take stops before taunt_t30_choices (no reply picked).
// Entry state (new-game): --imports=none --unlock server_room --start-room server_room --set briefing_played=true --set inside_reached=true   Record: ""
// Record: BE_KEEP_RING=1 MISSION=m07 run.sh <avatar> t13_architect_call "<flags>" ""     (avatar: harjit_singh)
// Marks: walk-start, entered, ring-seen, answered, sub:* (call subtitles; calls do not drive the TTS marks), line-start:/line-end: if any, menu-reached, linger-end.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { playThrough } from './_live.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} }); await sleep(800); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  // The call UI types each subtitle out char by char, so a node is re-read every scan: a mark is logged when it first has text, and again as 'full:' when the text stops growing for 3 scans.
  await page.evaluate(() => { window.__subs = []; const st = new Map(); const scan = () => document.querySelectorAll('.call-subtitle, .message-text').forEach(n => { const tx = n.textContent.trim(); let e = st.get(n); if (!e) { if (!tx) return; e = { first: performance.timeOrigin + performance.now(), last: tx, same: 0, done: false, ix: window.__subs.length }; st.set(n, e); window.__subs.push({ t: e.first, text: tx, full: false }); } if (tx === e.last) e.same++; else { e.last = tx; e.same = 0; } window.__subs[e.ix].text = tx; if (!e.done && e.same >= 3) { e.done = true; window.__subs[e.ix].full = true; window.__subs[e.ix].tFull = performance.timeOrigin + performance.now(); } }); setInterval(scan, 40); });
  let nsub = 0, fires = 0; const marked = new Set(); const drain = async () => { const a = await page.evaluate(() => window.__subs.slice()).catch(() => []); for (let i = 0; i < a.length; i++) { if (!marked.has(i)) { marked.add(i); mark('sub:' + a[i].text.slice(0, 40), { text: a[i].text }, a[i].t); } if (a[i].full && !marked.has('f' + i)) { marked.add('f' + i); mark('subfull:' + a[i].text.slice(0, 40), { len: a[i].text.length }, a[i].tFull); } if (!fires && /^(.{0,30}:\s*)?Four fires/i.test(a[i].text)) { fires = a[i].t; mark('ending-line-start', { clipS: 7.06 }, a[i].t); } } };
  const timer = setInterval(drain, 200);
  await sleep(1200); mark('walk-start');
  const e = await bridge.enterRoom('operations_floor', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 30000) { ok = await page.evaluate(() => { const b = document.querySelector('.incoming-call-answer'); return !!(b && b.offsetParent); }).catch(() => false); if (ok) break; await sleep(100); }
  if (!ok) throw new Error('no ring (room_entered not fired? an NPC chat open?)');
  mark('ring-seen', { afterMs: Date.now() - t0, text: await page.evaluate(() => (document.querySelector('.incoming-call-answer')?.closest('div')?.textContent || '').slice(0, 80)) });
  await sleep(2000);
  await page.evaluate(() => document.querySelector('.incoming-call-answer').click()); mark('answered'); await page.evaluate(() => { const st = document.createElement('style'); st.textContent = '.notification, .toast-live-region { display: none !important; }'; document.head.appendChild(st); }); await sleep(1200);
  await playThrough(page, bridge, mark, vw, { steps: [], settleMs: 700, timeoutMs: 120000 });
  await vw.stop(); await sleep(1500); clearInterval(timer); await drain();
  // round-2 ending line "Four fires tonight..." (7.06 s): its subtitle must have appeared, and the take must stay open for the whole clip
  if (!fires) throw new Error('ending line subtitle "Four fires tonight" never seen (call did not reach it, or the text changed)');
  const left = fires + 7600 - Date.now(); if (left > 0) await sleep(left);
  mark('ending-line-end', { clipS: 7.06 }); mark('linger-end');
};
