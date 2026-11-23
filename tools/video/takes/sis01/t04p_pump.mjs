// t04p_pump: the Bed 2 infusion pump (a Phaser canvas scene: CSS cannot mask it). KEYPAD AND ENTRY ROW ONLY: the edit crops to the 'crop-box' mark; the LIBRARY RANGE row (just above the entry row),
// the screen's drug/rate lines and the whole prescription panel (left) must be outside it.
// Entry state: charts seed:  run-take.sh sis01 t04p_pump "--set briefing_played=true --set paper_charts_collected=true" "--hide-hud --zoom-step 1"
// FINDINGS: --set paper_charts_collected=true is enough for the pump (no PAPER MAR CHARTS REQUIRED screen). Keyboard digits do nothing: the keys are Phaser tap targets, so the take clicks them with the real mouse.
//   Typing 1 then 5 shows "15_" in the entry row with no modal (the modal only opens on CONFIRM). Never press CONFIRM. Marks: pump_open, objs (page-px rects of the entry row, library row, keypad, confirm), crop-box, key1/key5,
//   typed (currentInput, modal flag), frame:pump_*, end.
import { sleep, prepare, sprite, interact, frame } from './_sis01.mjs';

export async function pumpShot(page, bridge, mark, narrowed) {
  const r = await interact(bridge, mark, 'bed2_pump_terminal');
  if (!r || !r.ok) throw new Error('pump interact failed');
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => !!(window.MinigameFramework.currentMinigame && window.MinigameFramework.currentMinigame.scene))) break; await sleep(200); }
  await sleep(1500); mark('pump_open', { narrowed: !!narrowed });
  const geo = await page.evaluate(() => {
    const m = window.MinigameFramework.currentMinigame; const cv = [...document.querySelectorAll('canvas')].pop().getBoundingClientRect(); const z = cv.width / m.scene.scale.width || cv.width / m._L.w;
    const rect = (o) => { const b = o.getBounds(); return { x: Math.round(cv.x + b.x * z), y: Math.round(cv.y + b.y * z), w: Math.round(b.width * z), h: Math.round(b.height * z) }; };
    const L = m.scene.children.list; const T = (re) => L.find(o => o.type === 'Text' && re.test(o.text || ''));
    const enter = T(/ENTER NEW RATE/), lib = T(/LIBRARY RANGE/), conf = T(/^CONFIRM$/);
    const keys = {}; for (const k of ['1', '5', '0']) { const t = L.find(o => o.type === 'Text' && o.text === k); const b = t.getBounds(); const rr = L.find(o => o.type === 'Rectangle' && b.centerX >= o.getBounds().x && b.centerX <= o.getBounds().right && b.centerY >= o.getBounds().y && b.centerY <= o.getBounds().bottom); keys[k] = rect(rr); }
    const kp = L.filter(o => o.type === 'Rectangle' && o.getBounds().width * z < 400 && o.getBounds().width * z > 100 && o.getBounds().y > enter.getBounds().y).map(rect);
    return { zoom: z, canvas: { x: cv.x, y: cv.y, w: cv.width, h: cv.height }, enter: rect(enter), lib: rect(lib), confirm: rect(conf), keys, keypad: { x: Math.min(...kp.map(k => k.x)), y: Math.min(...kp.map(k => k.y)), r: Math.max(...kp.map(k => k.x + k.w)), b: Math.max(...kp.map(k => k.y + k.h)) }, stacked: m._L.stacked };
  });
  mark('objs', geo);
  const top = geo.lib.y + geo.lib.h + 1, left = geo.keypad.x, w = geo.keypad.r - geo.keypad.x, bot = geo.keypad.b;
  mark('crop-box', { x: left, y: top, w, h: bot - top, note: 'keypad plus entry row; top is 1 px under the LIBRARY RANGE row; confirm button and the screen above are excluded' });
  frame(mark, 'pump_before');
  const click = async (k) => { const c = geo.keys[k]; await page.mouse.move(c.x + c.w / 2, c.y + c.h / 2, { steps: 6 }); await sleep(120); mark('key' + k); await page.mouse.click(c.x + c.w / 2, c.y + c.h / 2); await sleep(500); };
  await click('1'); frame(mark, 'pump_1'); await click('5'); await sleep(200); frame(mark, 'pump_15');
  mark('typed', await page.evaluate(() => { const m = window.MinigameFramework.currentMinigame; return { input: m.currentInput, modal: m._modalVisible, confirmed: m.confirmed }; }));
  await sleep(900); frame(mark, 'pump_hold');
}

export default async (page, bridge, mark) => {
  await sprite(page, mark); await prepare(page, bridge, mark);
  await pumpShot(page, bridge, mark, false);
  mark('end');
};
