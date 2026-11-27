// t19_dock_closeups (m09, keyless, NOT YET RUN): loading_dock close-ups: (1) the notes pick: the guard's Incident Log (incident_book, notes, no code) opened, held 2.6 s, closed; (2) the KEY lock on the front desk door (key lock; dock_office_key given by --give, held by Cody in the scenario): key selection, pick the key, keyTarget click, door opens (cut at the click).
// Entry state (new-game): --imports=none --start-room loading_dock --give dock_office_key --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh frank_callahan t19_dock_closeups "<flags>" "--hide-hud --zoom-step 1"
// Marks: note-open, note-closed, interact-door, key-mode, key-selected, key-turn, door-open, linger-end. Door id resolved from nearby (either direction).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, closeAll, doorId } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  await bridge.moveToNear('incident_book', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'incident_book', 'note', mark); await sleep(2600); await closeAll(page, bridge); mark('note-closed'); await sleep(900);
  const D = await doorId(bridge, 'loading_dock', 'front_desk');
  await bridge.moveToNear(D, { timeoutMs: 25000 }); await sleep(900); mark('interact-door', { D });
  let ir = await bridge.interact(D, { timeoutMs: 20000, approach: false }); mark('interact-result', { r: JSON.stringify(ir).slice(0, 300) });
  let w = await bridge.waitForMinigame('lockpicking', { timeoutMs: 4000 });
  if (!w || w.ok === false) { const st = await bridge.getState(); mark('retry', { room: st.currentRoom, mg: JSON.stringify(st.activeMinigame || null).slice(0, 200), near: JSON.stringify((st.nearby || []).filter(n => n.id === D)).slice(0, 300) }); ir = await bridge.interact(D, { timeoutMs: 20000 }); mark('interact-result-2', { r: JSON.stringify(ir).slice(0, 300) }); await bridge.waitForMinigame('lockpicking', { timeoutMs: 8000 }); }
  await sleep(900);
  let ks = await bridge.minigame.getState(); mark('key-mode', { keyMode: ks && ks.keyMode }); await sleep(1200);
  const sel = ks && (ks.keySelection || (ks.state && ks.state.keySelection));
  if (sel && sel.length) { const pick = sel.find(s => /dock|key ring/i.test(s.label || '')) || sel[0]; await bridge.minigame.clickCanvas(pick.x, pick.y); mark('key-selected', { label: pick.label, n: sel.length }); await sleep(1200); ks = await bridge.minigame.getState(); }
  const kt = ks && (ks.keyTarget || (ks.state && ks.state.keyTarget)); if (!kt) throw new Error('no keyTarget ' + JSON.stringify(ks).slice(0, 400));
  await bridge.minigame.clickCanvas(kt.x, kt.y); mark('key-turn');
  await bridge.waitForMinigameClosed({ timeoutMs: 10000 }); mark('door-open'); await sleep(1000); mark('linger-end');
};
