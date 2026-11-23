// t15_dust_brush (m05, keyless): dusting close-up for torres_mug, BRUSH ONLY. The kit goes into window.inventory.items off camera; the take stops after the powder passes (step:find, powder, dust passes) and closes the minigame BEFORE the lift/compare steps (candidate reference cards carry names, one is Torres').
// RULES: crop to .dusting-canvas only in the edit; no object label, mug text, room or reference cards. Check every frame for a name.
// Entry state: new-game.rb m05_insider_trading --imports=none --start-room torres_office --set briefing_played=true
// Record: MISSION=m05 run.sh <avatar> t15_dust_brush "--imports=none --start-room torres_office --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: kit-open, step:find, found, powder, dust-pass, dusted, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const mgState = (page) => page.evaluate(() => {
  const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
  if (!mg || typeof mg.getTestState !== 'function') return null;
  const s = mg.getTestState();
  return { step: s.step, coverage: s.coverage, tapeCoverage: s.tapeCoverage, canLift: s.canLift, found: s.found, pattern: s.debug && s.debug.pattern,
    correct: s.debug && s.debug.correctCandidate, centre: s.debug && s.debug.printCentre, tape: mg.tapeBounds || null, candidates: s.candidates };
});
const canvasBox = (page) => page.locator('.dusting-canvas').boundingBox();
const toPage = (box, x, y) => ({ x: box.x + (x / 128) * box.width, y: box.y + (y / 128) * box.height });

// A zigzag drag over a 128-grid rectangle, at a visible pace.
async function zigzag(page, box, r, rows, stepsPerRow = 14) {
  const ys = Array.from({ length: rows }, (_, i) => r.y + (r.h * (i + 0.5)) / rows);
  let p = toPage(box, r.x, ys[0]);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  ys.forEach(() => {});
  for (let i = 0; i < ys.length; i++) {
    const x1 = i % 2 === 0 ? r.x + r.w : r.x;
    p = toPage(box, x1, ys[i]);
    await page.mouse.move(p.x, p.y, { steps: stepsPerRow });
    if (i + 1 < ys.length) { const q = toPage(box, x1, ys[i + 1]); await page.mouse.move(q.x, q.y, { steps: 3 }); }
  }
  await page.mouse.up();
}

const PANEL = 'torres_mug';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { window.inventory.items.push({ scenarioData: { type: 'fingerprint_kit', name: 'Fingerprint Kit', id: 'fingerprint_kit_video' } }); });
  const m = await bridge.moveToNear(PANEL, { timeoutMs: 20000 });
  if (!m || !m.ok) throw new Error('moveToNear mug ' + JSON.stringify(m).slice(0, 300));
  await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  await sleep(600);
  const r = await bridge.interact(PANEL, { approach: false, timeoutMs: 20000 });
  await bridge.waitForMinigame('dusting', { timeoutMs: 10000 });
  mark('kit-open', { ok: r && r.ok });
  await sleep(2500);
  await page.click('.dusting-panel [data-action="start"]');
  mark('step:find');
  await sleep(2500);
  let s = await mgState(page), box = await canvasBox(page);
  // Sweep the light across, then settle on the print.
  const c = s.centre;
  for (const [x, y] of [[20, 30], [60, 25], [100, 70], [c.x + 18, c.y + 10]]) { const p = toPage(box, x, y); await page.mouse.move(p.x, p.y, { steps: 18 }); await sleep(250); }
  const pc = toPage(box, c.x, c.y);
  await page.mouse.move(pc.x, pc.y, { steps: 12 }); await sleep(500);
  await page.mouse.click(pc.x, pc.y);
  mark('found', { centre: c });
  for (let i = 0; i < 20 && (s = await mgState(page)).step !== 'powder'; i++) await sleep(150);
  await sleep(1800);
  await page.click('.dusting-panel [data-action="powder"][data-powder="silver"]');
  mark('powder', { powder: 'silver' });
  await sleep(1500);
  box = await canvasBox(page);
  const R = 30;
  for (let pass = 0; pass < 6; pass++) {
    await zigzag(page, box, { x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R }, 9, 16);
    s = await mgState(page);
    mark('dust-pass', { pass, coverage: s.coverage, canLift: s.canLift });
    if (s.canLift && s.coverage >= 0.5) break;
  }
  mark('dusted', { coverage: s.coverage });
  await sleep(1500);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed');
  await sleep(800);
};
