// t14_dust_print (m04, keyless): the same dusting chain as t03_print_lift, from a fresh keyless game. Hall 1 start, the OptiGrid
// fingerprint kit (no id, so --give fails) is injected into window.inventory.items in setup, off camera; the take stands 90 px below the
// Duty Round Panel, walks up, dusts, lifts, matches and logs Robert Vance's print. Marks as t03.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room battery_hall_1 --set briefing_played=true --set cipher_walked=true
// Record: BE_SPRITE=daniel_seo tools/video/takes/run-take.sh m04 t14_dust_print "<same flags>" "--hide-hud --zoom-step 1"
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { globals } from './_live.mjs';

const PANEL = 'hall1_round_panel';
let stand = null;

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

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { window.inventory.items.push({ scenarioData: { type: 'fingerprint_kit', name: 'Fingerprint Kit', id: 'fingerprint_kit_video' } }); });
  const m = await bridge.moveToNear(PANEL, { timeoutMs: 20000 });
  if (!m || !m.ok) throw new Error('moveToNear panel ' + JSON.stringify(m).slice(0, 300));
  const at = (await bridge.getState()).player;
  stand = { x: Math.round(at.x), y: Math.round(at.y) };
  await keyLegs(bridge, [['down', stand.y + 90]], 145);
  await sleep(1000);
}

export default async (page, bridge, mark) => {
  await sleep(1000);
  await keyLegs(bridge, [['up', stand.y]], 145, mark);
  mark('walk-end');
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
  await sleep(1200);
  await page.click('.dusting-panel [data-action="to-lift"]');
  mark('step:lift');
  await sleep(1500);
  for (let pass = 0; pass < 4; pass++) {
    s = await mgState(page); box = await canvasBox(page);
    const t = s.tape || { x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R };
    await zigzag(page, box, t, Math.max(6, Math.round(t.h / 5)), 12);
    s = await mgState(page);
    mark('tape-pass', { pass, tapeCoverage: s.tapeCoverage });
    if (s.tapeCoverage >= 0.95) break;
  }
  mark('taped', { tapeCoverage: s.tapeCoverage });
  await sleep(1000);
  await page.click('.dusting-panel [data-action="peel"]');
  for (let i = 0; i < 30 && (s = await mgState(page)).step !== 'compare'; i++) await sleep(150);
  mark('mounted');
  await sleep(2500);
  await page.click(`.dusting-panel [data-action="pattern"][data-pattern="${s.pattern}"]`);
  mark('pattern', { pattern: s.pattern });
  await sleep(2500);
  s = await mgState(page);
  const idx = s.correct != null ? s.correct : (s.candidates || []).findIndex(x => /vance/i.test(x.label));
  await page.click(`.dusting-panel [data-action="ref"][data-index="${idx}"]`);
  mark('matched', { idx, candidates: s.candidates });
  await sleep(3000);
  await page.click('.dusting-panel [data-action="finish"]');
  await sleep(2500);
  mark('logged', await globals(page, ['vance_print_lifted']));
  await sleep(3500);
  mark('linger-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  await sleep(800);
};
