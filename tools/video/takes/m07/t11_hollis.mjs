// t11_hollis (m07, keyless, NOT YET RUN): security_checkpoint. Hollis's torch finds the player (los.challengeOnSight, needs briefing_played). Target 1 "Building's evacuating. So you're lost, or you're the other thing." (challenge, 6.34 s). Fallback in the same take: hub [The grid goes down tonight...] > stakes > [No. It's exactly what you meant.] > "Walk away. Right now. I'm asking." (3.62 s). Ends at the hub menu, never picks a fight.
// Entry state (new-game): --imports=none --start-room security_checkpoint --set briefing_played=true --set team_assigned=true --set team_assignment=fracture   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh <avatar> t11_hollis "<flags>" "--hide-hud --zoom-step 1"     (avatar: ngozi_adeyemi)
// Marks: walk-start, spotted, line-start:/line-end:, choices-shown, choice:*, challenge-done, walkaway-done, targets-done. Hollis patrols x 3.5-6.5 tiles (6.3 row); if the cone has not caught the player in 8 s the take walks toward him in 60 px pulses.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} }); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  mark('walk-start', (await bridge.getState()).player);
  const t0 = Date.now(); let open = false;
  while (Date.now() - t0 < 60000 && !open) {
    open = !!(await bridge.getState()).dialogue;
    if (!open && Date.now() - t0 > 8000) {
      const s = await bridge.getState(); const h = await page.evaluate(() => { const n = window.npcManager.getNPC('ray_hollis'); return n && n._sprite && { x: n._sprite.x, y: n._sprite.y }; });
      mark('pulse', { h, p: { x: s.player.x, y: s.player.y } });
      if (h && Math.hypot(h.x - s.player.x, h.y - s.player.y) <= 110 && Date.now() - t0 > 14000) { mark('interact'); await bridge.interact('ray_hollis', { timeoutMs: 8000 }).catch(() => {}); await sleep(1500); continue; }
      if (h && Math.hypot(h.x - s.player.x, h.y - s.player.y) > 110) await bridge.walk(Math.abs(h.x - s.player.x) > Math.abs(h.y - s.player.y) ? (h.x > s.player.x ? 'right' : 'left') : (h.y > s.player.y ? 'down' : 'up'), 400);
    }
    await sleep(200);
  }
  if (!open) throw new Error('Hollis never challenged');
  mark('spotted');
  await runDialogue(page, bridge, mark, vw, {
    steps: [/The grid goes down tonight/i, /exactly what you meant/i],
    targets: [{ name: 'challenge', re: /Building.s evacuating/i }, { name: 'walkaway', re: /Walk away\. Right now/i }], lingerMs: 900, timeoutMs: 120000 });
};
