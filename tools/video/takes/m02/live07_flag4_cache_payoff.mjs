// live07_flag4_cache_payoff (m02): flag 4 (Ghost's operational log, submit_ghost_log_flag) payoff: the drop-site unlocks the
// ENTROPY Staging Cache in the server rack. The take walks into server_room, opens the now-unlocked cache and holds on its
// contents (Ghost's key material and his statement of intent are story text only; no flag, password or PIN). It only opens
// and closes the container (takes nothing), so it is replayable. NEVER film the drop-site screen: the submission is made
// OFF CAMERA in the playtest session (the session resolves the <vmflag:REF> token from the real VM; the take rig cannot).
// Entry state: LIVE game 93 (playtest03, m02, set 931) with flag 4 submitted. Refuses if the cache is still locked.
// Record (LIVE mode, see tools/video/takes/run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/93 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m02 live07_flag4_cache_payoff "" "--hide-hud --zoom-step 1"
// Marks: approach, cache-open {minigame}, items {names}, hold-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom } from './_live.mjs';

const CACHE_ID = 'entropy_staging_cache';
const ROUTE = ['reception_lobby', 'ward_vestibule', 'ward_approach', 'hospital_ward', 'ward_hall', 'office_corridor', 'security_office', 'server_room'];

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  if (!s.player || s.player.room !== 'server_room') await goRoom(page, bridge, ROUTE);
  const gv = await page.evaluate(() => (window.gameState && window.gameState.globalVariables) || {});
  console.error('SETUP', JSON.stringify({ room: (await bridge.getState()).player.room, ghostLog: Object.keys(gv).filter(k => /ghost|flag_/.test(k)) }));
  await sleep(500);
}

export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('approach');
  await bridge.moveToNear(CACHE_ID, { timeoutMs: 20000 }).catch(() => {});
  await sleep(600);
  const r = await bridge.interact(CACHE_ID, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('could not open the cache ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame(null, { timeoutMs: 10000 }).catch(() => {});
  const mg = (await bridge.getState()).activeMinigame;
  mark('cache-open', { minigame: mg && mg.id });
  const st = await bridge.minigame.getState().catch(() => ({}));
  const items = (st && Array.isArray(st.items)) ? st.items : [];
  mark('items', { count: items.length, names: items.map(i => (i && (i.name || i.label || i.title)) || '?').slice(0, 6) });
  await sleep(6500);
  mark('hold-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
