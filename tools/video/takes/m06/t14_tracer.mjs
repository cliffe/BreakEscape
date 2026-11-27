// t14_tracer (m06, keyless): the Settlement Tracer (transaction_server, blockchain_explorer, mode mixer_match) in the data centre. On camera: open the server-room door, the motion lights strike, walk to the server, open it; board open 1 s; click the first deposit; click the matching credit (found from the board's own model); green match; stop. NEVER a second match.
// MOSAIC (display only, runs every 30 ms): blur every .bce-mx-slot and .bce-mx-card-link, so no frame pairs a match with a slot number. The all-matched pane, the TRACED pane and "Server files" are never reached.
// Entry state (new-game): --imports=none --unlock data_center --start-room server_room --set briefing_played=true   (found_architects_fund and traced_fund_slot NOT set)   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh <avatar> t14_tracer "<flags above>" "--hide-hud --zoom-step 1"
// Marks: door-interact, room-entered, server-interact, board-open, deposit-clicked, credit-clicked, matched, linger-end, closed.
// TODO first run: the model import path below is a guess (/break_escape/js/...); fall back to reading board.withdrawals and testing amount = deposit less fee with hold >= minHoldHours by hand.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { closeAll } from './_conv.mjs';
// 23 Nov: the door server_room->data_center had a rack under it (engine/scenario bug, fixed on this branch), so block 1 started inside data_center. Now the take starts in server_room and crosses the door (motion lights strike).
const DOOR = 'door:server_room->data_center';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await page.evaluate(() => { try { window.__test.throttleFps(20); } catch (_) {} }); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await page.evaluate(() => { if (window.__mxBlur) return; window.__mxBlur = setInterval(() => document.querySelectorAll('.bce-mx-slot,.bce-mx-card-link').forEach(e => { e.style.filter = 'blur(6px)'; }), 30); });
  await sleep(1000); mark('door-interact');
  await bridge.interact(DOOR, { timeoutMs: 20000, approach: false });
  for (let i = 0; i < 16 && (await bridge.getState()).player.room !== 'data_center'; i++) await sleep(250);
  if ((await bridge.getState()).player.room !== 'data_center') { const r = await bridge.enterRoom('data_center', { timeoutMs: 30000 }); mark('enterRoom', { r: JSON.stringify(r).slice(0, 160) }); }
  mark('room-entered', { room: (await bridge.getState()).player.room }); if ((await bridge.getState()).player.room !== 'data_center') throw new Error('did not cross the door');
  await sleep(1500);
  await bridge.moveToNear('transaction_server', { timeoutMs: 25000 }); await sleep(500);
  mark('server-interact');
  await bridge.interact('transaction_server', { timeoutMs: 20000, approach: false });
  for (let i = 0; i < 40 && !(await page.evaluate(() => !!document.querySelector('.bce-mx'))); i++) await sleep(250);
  mark('board-open'); await sleep(1000);
  const plan = await page.evaluate(async () => {
    const b = window.MinigameFramework.currentMinigame._mixerBoard; const m = await import('/break_escape/js/minigames/blockchain-explorer/mixer-match-model.js');
    const d = b.deposits[0]; const w = b.withdrawals.find(x => m.evaluateLink(d, x, b.mixer).ok); return { dep: d.id, wd: w && w.id };
  });
  if (!plan.wd) throw new Error('no matching credit found');
  await page.click(`[data-dep="${plan.dep}"]`); mark('deposit-clicked'); await sleep(1100);
  await page.click(`[data-wd="${plan.wd}"]`); mark('credit-clicked'); await sleep(300);
  mark('matched', { fb: await page.evaluate(() => (document.querySelector('.bce-mx-feedback') || {}).className) });
  await sleep(1700); mark('linger-end');
  await closeAll(page, bridge); mark('closed');
};
