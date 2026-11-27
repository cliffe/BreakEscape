// t10_ambient_spares: spare ambient lines in the studio: Thandiwe A3 "Rev C or Rev D?", Julian A4 "That roof pitch still won't work.",
// Julian A5 kettle line. All three are RANDOM (a chatter bag with a cooldown; A5 from the ambient ink kettle trip), so this take is a
// patient hold, not a script: it waits up to 300 s for any bubble and ends 3 s after A3 and A4 have both shown. Marks bubble-start/end per NPC.
// FALLBACK: window.npcNeedsSystem.world.speak(id, line) forces the same bubble after 45 s (marks forced-speak:*); the line text must be exact.
// Entry state: fresh game, run-take.sh ca12_visitor_tailgater t10_ambient_spares "" "--hide-hud --zoom-step 1". NOT deterministic: see the runbook.
import { sleep, prepare, watchBubbles } from './_ca12b.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); }
export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  const t0 = Date.now(); let done = null, forced = 0;
  const force = async (id, line) => { mark('forced-speak:' + id, { line }); return page.evaluate(([i, l]) => { const w = window.npcNeedsSystem && window.npcNeedsSystem.world; return !!(w && w.speak && (w.speak(i, l, {}) || true)); }, [id, line]).catch(() => false); };
  while (Date.now() - t0 < 300000) {
    await bw.drain();
    const has = (id, re) => bw.seen.some(e => e.id === id && re.test(e.text));
    if (has('kit_thandiwe_moyo', /Rev C/i) && has('kit_julian_sallow', /roof pitch/i)) { done = Date.now(); break; }
    // Fallback (set FORCE_AFTER_S to 0 to force at once): after the wait, speak the two lines through the needs world's own speak(), the path the game's chatter uses.
    const FA = Number(process.env.FORCE_AFTER_S ?? 45) * 1000;
    if (forced === 0 && Date.now() - t0 > FA) { forced = 1; await force('kit_julian_sallow', "That roof pitch still won't work."); }
    if (forced === 1 && Date.now() - t0 > FA + 7000) { forced = 2; await force('kit_thandiwe_moyo', 'Rev C or Rev D?'); }
    if (Math.floor((Date.now() - t0) / 30000) !== Math.floor((Date.now() - t0 - 400) / 30000)) mark('frame:hold-' + Math.round((Date.now() - t0) / 1000));
    await sleep(300);
  }
  if (done) await sleep(3000);
  mark(done ? 'end-all-seen' : 'end-timeout', { seen: bw.seen.map(e => e.id + ': ' + e.text.replace(/\n/g, ' ')) });
  await bw.stop();
};
