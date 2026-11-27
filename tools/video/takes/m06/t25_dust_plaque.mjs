// t25_dust_plaque (m06, keyless, NOT YET RUN): fingerprint dusting on the framed press clipping (executive_wing_plaque, hasFingerprint, easy) in executive_wing. The kit is a starting item (no injection). BRUSH ONLY: the take closes before lift/compare (candidate cards carry names). Crop the edit to .dusting-canvas.
// minder_passed=true skips Kemal's sight challenge by the scenario's own skipIfGlobal (his ink says "He is expecting you" if spoken to; no chat is opened).
// Entry state (new-game): --imports=none --unlock executive_wing --start-room executive_wing --set briefing_played=true --set minder_passed=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh lucia_moreno t25_dust_plaque "<flags above>" "--hide-hud --zoom-step 1"
// Marks: kit-open, step:find, found, powder, dust-pass, dusted, closed. Same flow as m05 t15 (selectors reused).
import { sleep, clearScreen } from '../lib/lib.mjs';
const PANEL = 'executive_wing_plaque';
const mgState = (page) => page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; if (!mg || typeof mg.getTestState !== 'function') return null; const s = mg.getTestState(); return { step: s.step, coverage: s.coverage, canLift: s.canLift, centre: s.debug && s.debug.printCentre }; });
const canvasBox = (page) => page.locator('.dusting-canvas').boundingBox();
const toPage = (box, x, y) => ({ x: box.x + (x / 128) * box.width, y: box.y + (y / 128) * box.height });
async function zigzag(page, box, r, rows, steps = 14) {
  const ys = Array.from({ length: rows }, (_, i) => r.y + (r.h * (i + 0.5)) / rows);
  let p = toPage(box, r.x, ys[0]); await page.mouse.move(p.x, p.y); await page.mouse.down();
  for (let i = 0; i < ys.length; i++) { const x1 = i % 2 === 0 ? r.x + r.w : r.x; p = toPage(box, x1, ys[i]); await page.mouse.move(p.x, p.y, { steps }); if (i + 1 < ys.length) { const q = toPage(box, x1, ys[i + 1]); await page.mouse.move(q.x, q.y, { steps: 3 }); } }
  await page.mouse.up();
}
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const m = await bridge.moveToNear(PANEL, { timeoutMs: 25000 }); if (!m || !m.ok) throw new Error('moveToNear plaque ' + JSON.stringify(m).slice(0, 300)); await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1600);
  const r = await bridge.interact(PANEL, { approach: false, timeoutMs: 20000 });
  await bridge.waitForMinigame('dusting', { timeoutMs: 10000 }); mark('kit-open', { ok: r && r.ok }); await sleep(2500);
  await page.click('.dusting-panel [data-action="start"]'); mark('step:find'); await sleep(2500);
  let s = await mgState(page), box = await canvasBox(page); const c = s.centre;
  for (const [x, y] of [[20, 30], [60, 25], [100, 70], [c.x + 18, c.y + 10]]) { const p = toPage(box, x, y); await page.mouse.move(p.x, p.y, { steps: 18 }); await sleep(250); }
  const pc = toPage(box, c.x, c.y); await page.mouse.move(pc.x, pc.y, { steps: 12 }); await sleep(500); await page.mouse.click(pc.x, pc.y); mark('found', { centre: c });
  for (let i = 0; i < 20 && (s = await mgState(page)).step !== 'powder'; i++) await sleep(150);
  await sleep(1800); await page.click('.dusting-panel [data-action="powder"][data-powder="silver"]'); mark('powder'); await sleep(1500);
  box = await canvasBox(page);
  for (let pass = 0; pass < 6; pass++) { await zigzag(page, box, { x: c.x - 30, y: c.y - 30, w: 60, h: 60 }, 9, 16); s = await mgState(page); mark('dust-pass', { pass, coverage: s.coverage }); if (s.canLift && s.coverage >= 0.5) break; }
  mark('dusted', { coverage: s.coverage }); await sleep(1500);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed'); await sleep(800);
};
