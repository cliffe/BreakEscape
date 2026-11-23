// t14_phantom_accuse (m08, keyless, NOT YET RUN): intel_analysis. Phantom (phantom_interviewed seeded, so no sight challenge and his hub opens): hub line, [I think it's you, Phantom. (Out loud. The whole floor will hear.)], else branch "Bold. On what? An empty morning on a roster, and a vibe?" (fallback) then the action line "I've been hunting this leak longer than you've known it existed. Accuse me properly, or get out of my way and let one of us catch him." (7.7 s whole; the edit keeps the second sentence from ~3.4 s). LISTEN: the read may be too calm. Then the chat is closed, the player faces him and strikes once (window.playerCombat.attack), 1.8 s of chase, stops BEFORE any KO. Record the line first: after a strike he never talks again.
// Entry state (new-game): --imports=none --start-room intel_analysis --set briefing_played=true --set brief_taken=true --set phantom_interviewed=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh frank_callahan t14_phantom_accuse "<flags>" "--hide-hud --zoom-step 1"
// Marks: choices-shown, choice:*, bold-done, accuse-done, targets-done, strike, chase-held, end. throttleFps(20) in setup.
import { sleep } from '../lib/lib.mjs';
import { makeBeat } from '../m05/_beat.mjs';
import { closeAll, npcPos } from './_c8.mjs';
const b = makeBeat({ npcId: 'agent_phantom', start: [70, 90], stop: [30, 45], order: 'xy', lingerMs: 300, preMs: 600, steps: [/I think it.s you, Phantom/i], targets: [{ name: 'bold', re: /Bold\. On what/i }, { name: 'accuse', re: /hunting this leak longer than you/i }] });
export async function setup(page, bridge) { await b.setup(page, bridge); await page.evaluate(() => window.__test && window.__test.throttleFps && window.__test.throttleFps(20)).catch(() => {}); }
export default async (page, bridge, mark) => {
  await b.run(page, bridge, mark);
  await closeAll(page, bridge); await sleep(500);
  const p = (await bridge.getState()).player; const n = await npcPos(page, 'agent_phantom');
  const dir = Math.abs(n.x - p.x) > Math.abs(n.y - p.y) ? (n.x > p.x ? 'right' : 'left') : (n.y > p.y ? 'down' : 'up');
  await bridge.walk(dir, 60).catch(() => {}); await sleep(150);
  const n2 = await npcPos(page, 'agent_phantom');
  mark('strike', { player: (await bridge.getState()).player, phantom: n2 });
  await page.evaluate((t) => window.playerCombat.attack({ x: t.x, y: t.y }), n2);
  await sleep(1800); mark('chase-held', { player: (await bridge.getState()).player }); mark('end');
};
