// t13_architect_call (m07, keyless, NOT YET RUN, needs BE_KEEP_RING=1): the withheld call, one take for beat 7 and the ending. Start in server_room, walk through the door into operations_floor (first entry: room_entered fires), stand still, ring after 5 s (no caller ID), answer. taunt_t30 plays narrator "No caller ID. The line opens before you speak." (voiced? untested), then beat 7 "Don't look for the trace. It isn't there." (3.41 s), "I've read your file..." (9.17 s), ENDING "Four fires tonight, and only one of you. I set them so you'd have to choose." (7.06 s, tagged). Take stops before taunt_t30_choices (no reply picked).
// Entry state (new-game): --imports=none --unlock server_room --start-room server_room --set briefing_played=true --set inside_reached=true   Record: ""
// Record: BE_KEEP_RING=1 MISSION=m07 run.sh <avatar> t13_architect_call "<flags>" ""     (avatar: harjit_singh)
// Marks: walk-start, entered, ring-seen, answered, sub:* (call subtitles; calls do not drive the TTS marks), line-start:/line-end: if any, menu-reached, linger-end.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { playThrough } from './_live.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} }); await sleep(800); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await page.evaluate(() => { window.__subs = []; const seen = new WeakSet(); const scan = () => document.querySelectorAll('.call-subtitle').forEach(n => { if (!seen.has(n)) { seen.add(n); window.__subs.push({ t: performance.timeOrigin + performance.now(), text: n.textContent.trim() }); } }); setInterval(scan, 40); });
  let nsub = 0, fires = 0; const drain = async () => { const a = await page.evaluate(() => window.__subs.slice()).catch(() => []); for (; nsub < a.length; nsub++) { mark('sub:' + a[nsub].text.slice(0, 60), { text: a[nsub].text }, a[nsub].t); if (/Four fires tonight, and only one of you/i.test(a[nsub].text)) { fires = a[nsub].t; mark('ending-line-start', { clipS: 7.06 }, a[nsub].t); } } };
  const timer = setInterval(drain, 200);
  await sleep(1200); mark('walk-start');
  const e = await bridge.enterRoom('operations_floor', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 30000) { ok = await page.evaluate(() => { const b = document.querySelector('.incoming-call-answer'); return !!(b && b.offsetParent); }).catch(() => false); if (ok) break; await sleep(100); }
  if (!ok) throw new Error('no ring (room_entered not fired? an NPC chat open?)');
  mark('ring-seen', { afterMs: Date.now() - t0, text: await page.evaluate(() => (document.querySelector('.incoming-call-answer')?.closest('div')?.textContent || '').slice(0, 80)) });
  await sleep(2000);
  await page.evaluate(() => document.querySelector('.incoming-call-answer').click()); mark('answered'); await sleep(1200);
  await playThrough(page, bridge, mark, vw, { steps: [], settleMs: 700, timeoutMs: 120000 });
  await vw.stop(); await sleep(1500); clearInterval(timer); await drain();
  // round-2 ending line "Four fires tonight..." (7.06 s): its subtitle must have appeared, and the take must stay open for the whole clip
  if (!fires) throw new Error('ending line subtitle "Four fires tonight" never seen (call did not reach it, or the text changed)');
  const left = fires + 7600 - Date.now(); if (left > 0) await sleep(left);
  mark('ending-line-end', { clipS: 7.06 }); mark('linger-end');
};
