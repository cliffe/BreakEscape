// t01_vm_approach (m10): the approach to the Field Console (Gate) VM launcher (gate_console, "Field Console (Gate)")
// in forward_post, the spawn room. The player walks up to it (key-driven, no click marker), opens it: the VM panel
// opens with the launcher's login post-it, and the embedded monitor shows the Kali login screen. Holds on the monitor.
// MASK: the post-it (user: kali / password: kali) is on screen from panel-open to the end; the console is the login
// greeter (no secret typed). Do not log in on camera.
// Entry state: LIVE game 81 (playtest01, m10, set 917, all flags in, VMs up); no new game. Replayable (gate_console_used
// is already set; the launcher still opens, it just does not re-fire its setGlobal). Does not finish the mission.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/81 STORAGE_STATE=<playtest01 login.mjs state> \
//   BE_DISPLAY=95 tools/video/takes/run-take.sh m10 t01_vm_approach "" "--hide-hud --zoom-step 1"
// setup(): makes sure we are in forward_post, finds the launcher's standing point, backs off down + right.
// Marks: walk-start, leg:*, walk-end, launcher-open {postit}, monitor-drawn {drawn, frame, msFromOpen}, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { goRoom } from '../m03/_live.mjs';

const SPEED = 145;
const VM_ID = 'gate_console';
let vm = null;

// The embedded console is a noVNC canvas some frames deep in the VM panel iframe. "Drawn" = a canvas at least 300 px wide
// whose pixels are not all one colour (the login greeter), read in each same-origin frame.
async function monitorState(page) {
  const out = [];
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    const r = await f.evaluate(() => {
      const res = [];
      for (const c of document.querySelectorAll('canvas')) {
        if (c.width < 300) continue;
        let spread = null;
        try {
          const x = c.getContext('2d', { willReadFrequently: true });
          const d = x && x.getImageData(0, 0, c.width, c.height).data;
          if (d) { let lo = 255, hi = 0; for (let i = 0; i < d.length; i += 4 * 97) { const v = d[i] + d[i + 1] + d[i + 2]; if (v < lo) lo = v; if (v > hi) hi = v; } spread = hi - lo; }
        } catch (_) { spread = -1; }
        res.push({ w: c.width, h: c.height, spread });
      }
      return { url: location.pathname, canvases: res };
    }).catch(() => null);
    if (r) out.push(r);
  }
  return out;
}

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  // A fresh (non-concluded) m10 game opens in Director Netherton's briefing person-chat. It is a cutscene,
  // so minigame.close() does not dismiss it: drive it to close (continue through voiced lines, pick the
  // first option at any menu) so main-world input is re-enabled before the approach. Caps at 60 iters.
  for (let i = 0; i < 60; i++) {
    const s = await bridge.getState();
    if (!s.activeMinigame && !s.dialogue) break;
    const d = s.dialogue;
    if (d && d.awaitingChoice && (d.choices || []).length) { await bridge.minigame.chooseIndex(1).catch(() => {}); }
    else if (d && d.canContinue) { await bridge.minigame.continue_().catch(() => {}); }
    else { await bridge.minigame.close().catch(() => {}); }
    await sleep(600);
  }
  const here = (await bridge.getState()).player;
  if (!here || here.room !== 'forward_post') await goRoom(page, bridge, 'forward_post');
  // The launcher's reported x/y is its sprite corner, not where a player stands to use it: find the standing point once
  // with moveToNear (off camera), then back off down and to the right so the take walks up to it with keys.
  const m = await bridge.moveToNear(VM_ID, { timeoutMs: 20000 });
  if (!m || !m.ok) throw new Error('moveToNear launcher ' + JSON.stringify(m).slice(0, 300));
  const at = (await bridge.getState()).player;
  vm = { x: Math.round(at.x), y: Math.round(at.y) };
  const OFFX = 75, OFFY = 105;
  await keyLegs(bridge, [['down', vm.y + OFFY], ['right', vm.x + OFFX]], SPEED);
  await sleep(1000);
  console.error('SETUP', JSON.stringify({ stand: vm, player: (await bridge.getState()).player }));
}

export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('walk-start', { stand: vm });
  await keyLegs(bridge, [['left', vm.x], ['up', vm.y]], SPEED, mark);
  mark('walk-end', { player: (await bridge.getState()).player });
  await sleep(700);
  const r = await bridge.interact(VM_ID, { approach: false, timeoutMs: 20000 });
  const w = await bridge.waitForMinigame('vm-launcher', { timeoutMs: 10000 }).catch(e => ({ ok: false, e: String(e) }));
  const tOpen = Date.now();
  mark('launcher-open', { ok: w && w.ok !== false, interact: r && r.ok, postit: await page.locator('.postit-note').count() });
  let drawn = false, last = null;
  while (Date.now() - tOpen < 75000) {
    last = await monitorState(page);
    if (last.some(f => f.canvases.some(c => c.spread > 60))) { drawn = true; break; }
    await sleep(1000);
  }
  mark('monitor-drawn', { drawn, frames: last, msFromOpen: Date.now() - tOpen });
  console.error('MONITOR', drawn, JSON.stringify(last));
  await sleep(5000);
  mark('linger-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
  if (!drawn) throw new Error('embedded monitor never drew: ' + JSON.stringify(last));
};
