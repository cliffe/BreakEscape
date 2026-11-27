// t30_walks (m09, keyless, NOT YET RUN): walk shots, selected by env M09_WALK = noor | closet | stacks | laptop (default noor). Each is purposeful, one NPC at most, nothing opened, never into an NPC. noor: loading_dock west through the (unlocked) front desk door, then towards Noor's desk, stop 70 px short. closet: from open_stacks east to the server closet door and in, towards tape_side_console, stop short of Jesse. stacks: loading_dock north through the door into open_stacks (motion lights), 2 s in. laptop: reading_room straight to field_laptop, stop 40 px short (never opened: it shows a post-it).
// Entry state (new-game): noor: --imports=none --start-room loading_dock --unlock front_desk --set briefing_played=true | closet: --imports=none --start-room open_stacks --set old_coyote_quiet=true --set briefing_played=true | stacks: --imports=none --start-room loading_dock --set old_coyote_quiet=true --set briefing_played=true | laptop: --imports=none --start-room reading_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: M09_WALK=<w> MISSION=m09 run.sh <avatar> t30_walks "<flags>" "--hide-hud --zoom-step 1"   Avatars: noor ngozi_adeyemi, closet daniel_seo, stacks mei_lin_chow, laptop harjit_singh
// Marks: walk-start, door-open, walk-end, linger-end. TODO first run: the legs are moveToNear (pathing, visible walk); check no click marker and no bump.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { doorId } from './_c9x.mjs';
const W = process.env.M09_WALK || 'noor';
const PLAN = { noor: { door: ['loading_dock', 'front_desk'], to: 'noor_haddad' }, closet: { door: ['open_stacks', 'server_closet'], to: 'tape_side_console' }, stacks: { door: ['loading_dock', 'open_stacks'], to: null }, laptop: { door: null, to: 'field_laptop' } };
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(700); }
export default async (page, bridge, mark) => {
  const P = PLAN[W]; if (!P) throw new Error('M09_WALK ' + W); await sleep(1200); mark('walk-start', (await bridge.getState()).player);
  if (P.door) { const D = await doorId(bridge, ...P.door); await bridge.moveToNear(D, { timeoutMs: 25000 }); const r = await bridge.interact(D, { timeoutMs: 20000 }); mark('door-open', { ok: r && r.ok, D }); await sleep(900); }
  if (P.to) { const r = await bridge.moveToNear(P.to, { timeoutMs: 25000 }).catch(e => ({ ok: false, e: String(e).slice(0, 100) })); mark('arrived', { ok: r && r.ok }); } else await sleep(2000);
  await sleep(600); mark('walk-end', (await bridge.getState()).player);
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened on the walk');
  await sleep(1000); mark('linger-end');
};
