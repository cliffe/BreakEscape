// t12_ops_exchange (m07, keyless, NOT YET RUN): operations_floor, the needs-driven exchange ex_last_two: Adaeze "The muster board still has us missing." (2.93 s), Gwen "Somebody ought to cross us off." (2.50 s). Setup drops both staff's thirst below urgentAt (30) through window.npcNeedsSystem.states so both walk to ops_cooler at once; the take holds up to 240 s for both lines (voice marks), the player standing near the cooler.
// The Architect's withheld call is suppressed (architect_t20_played seeded) so it does not collide.
// Entry state (new-game): --imports=none --start-room operations_floor --set briefing_played=true --set inside_reached=true --set architect_t20_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh <avatar> t12_ops_exchange "<flags>" "--hide-hud --zoom-step 1"     (avatar: lucia_moreno)
// Marks: needs-set, line-start:/line-end:, adaeze-done, gwen-done, linger-end (or end-timeout).
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} });
  await bridge.moveToNear('ops_cooler', { timeoutMs: 20000 }).catch(() => {}); await sleep(800);
}
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const set = await page.evaluate(() => { const s = window.npcNeedsSystem; const out = {}; for (const id of ['adaeze_okafor', 'gwen_pritchard']) { const st = s && s.states.get(id); if (st) { st.levels.thirst = 20; out[id] = true; } } return out; });
  mark('needs-set', set);
  const a = await vw.waitForLine(/muster board still has us missing/i, 240000);
  if (!a) { mark('end-timeout'); throw new Error('exchange never played (both at cooler? voiced?)'); }
  mark('adaeze-done', { durMs: a.durMs });
  const g = await vw.waitForLine(/cross us off/i, 15000);
  if (g) mark('gwen-done', { durMs: g.durMs });
  await sleep(1500); await vw.stop(); mark('linger-end');
};
