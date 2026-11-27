// t10_recruiter_call (m05, keyless): the Recruiter's first call, answered when she rings, played through with every voiced line heard in full,
// stopping at the deal menu (no deal choice is ever picked). Two kept lines: "I find people the week before they break, agent. Then I make them
// an offer." (recruiter_introduction) and the ending "Everyone has a price, agent. I'm asking what yours is." (recruiter_deal).
// m05 RULE (owner): Torres stays hidden. Lines that name him or say "the man" play in this take and must be CUT (picture and audio) in the edit:
//   "I run TalentStack... David Torres." / "Torres took debt relief..." / "He was a line item" (not on this route) / the casualty knot ("the man") /
//   "Under Torres' keyboard..." The call screen shows only the newest subtitle (CSS), so a window that starts on a clean line shows no older text.
// Entry state: fresh game, torres_identified seeded so her ring (game_loaded + 7.5 s) comes by itself; briefing_played skips the opening cutscene.
// Record: BE_KEEP_RING=1 MISSION=m05 run.sh <avatar> t10_recruiter_call "--imports=none --start-room main_corridor --set briefing_played=true --set torres_identified=true" ""
// Marks: ring-seen, answered, line-start:/line-end: for every voiced line, choices-shown, choice:*, menu-reached, linger-end.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { playThrough } from './_live.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  // phone calls do not drive the TTS-manager marks, so mark each call subtitle as it appears (subtitle leads the audio by 0.1 to 0.2 s)
  await page.evaluate(() => {
    window.__subs = []; const seen = new WeakSet();
    const scan = () => document.querySelectorAll('.call-subtitle').forEach(n => { if (!seen.has(n)) { seen.add(n); window.__subs.push({ t: performance.timeOrigin + performance.now(), text: n.textContent.trim() }); } });
    setInterval(scan, 40);
  });
  let nsub = 0;
  const drainSubs = async () => { const a = await page.evaluate(() => window.__subs.slice()).catch(() => []); for (; nsub < a.length; nsub++) mark('sub:' + a[nsub].text.slice(0, 60), { text: a[nsub].text }, a[nsub].t); };
  const subTimer = setInterval(drainSubs, 200);
  const t0 = Date.now();
  let ok = false;
  while (Date.now() - t0 < 30000) {
    ok = await page.evaluate(() => { const b = document.querySelector('.incoming-call-answer'); return !!(b && b.offsetParent); }).catch(() => false);
    if (ok) break; await sleep(100);
  }
  if (!ok) throw new Error('no ring');
  mark('ring-seen', { afterMs: Date.now() - t0 });
  await sleep(1500);
  await page.evaluate(() => document.querySelector('.incoming-call-answer').click());
  mark('answered');
  await sleep(1200);
  await playThrough(page, bridge, mark, vw, {
    steps: [/Say nothing/i, /What were you actually after/i, /Why does ENTROPY want control/i, /fanatic dressed up/i],
    dwellMs: 1800, settleMs: 700, timeoutMs: 150000,
  });
  await vw.stop();
  await sleep(1500);
  clearInterval(subTimer); await drainSubs();
  mark('linger-end');
};
