// t09_esd_station: the hall-door Emergency Shutdown station (mechanic shot, 81 f): the guard flap clicked open at 0.3 s, the button is NEVER pressed.
// Entry state: tools/video/takes/run-take.sh sis02 t09_esd_station "--set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
//   Fresh game. Helen's audio (849f3b) comes from t12; this take is silent.
// Actions: interact('esd_station_hall_door') opens the pushbutton minigame (.esd-pushbutton-game-container; label "EMERGENCY SHUTDOWN - BATTERY HALL 1 (HALL DOOR)", status "Click the flap to
//   lift it, then press the button."). After a 0.8 s hold a REAL mouse click on #esd-guard lifts it (class 'open'). Hold 1.5 s, close with the X. The button (#esd-button) is never clicked;
//   the confirm modal (#esd-confirm-modal) is the thing to prove stays closed. No globals change.
// Marks: sprite, panel-open, rects (panel, guard, button), guard-click, guard-state (class before/after), modal-check (confirm modal display, activeMinigame), globals-check (esd_activated),
//   frame:esd_t+N, bark-check, end.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export async function run(page, bridge, mark, narrowPx) {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  if (narrowPx) await page.addStyleTag({ content: `.esd-pushbutton-game-container{width:${narrowPx}px !important;max-width:${narrowPx}px !important;margin-left:auto !important;margin-right:auto !important}.esd-panel{width:${narrowPx - 40}px !important;box-sizing:border-box !important}` });
  const r = await interact(bridge, mark, 'esd_station_hall_door');
  if (!r || !r.ok) throw new Error('esd_station_hall_door interact failed');
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('#esd-guard'))) break; await sleep(100); }
  mark('panel-open'); await sleep(800);
  mark('rects', { panel: await rectOf(page, '.esd-panel'), guard: await rectOf(page, '#esd-guard'), button: await rectOf(page, '#esd-button') });
  frame(mark, 'esd_t+0.0');
  const g = await page.evaluate(() => { const e = document.querySelector('#esd-guard'); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, cls: e.className }; });
  await page.mouse.move(g.x, g.y); await sleep(200); await page.mouse.click(g.x, g.y); const tc = Date.now();
  mark('guard-click', { x: Math.round(g.x), y: Math.round(g.y) });
  await sleep(700);   // frame screenshots lag about 0.5 s
  mark('guard-state', { before: g.cls, after: await page.evaluate(() => document.querySelector('#esd-guard').className) });
  for (const t of [0.8, 1.5]) { await sleep(Math.max(0, t * 1000 - (Date.now() - tc))); frame(mark, 'esd_open_t+' + t); await says.drain(); }
  await sleep(700);
  mark('modal-check', await page.evaluate(() => { const m = document.querySelector('#esd-confirm-modal'); const cs = m && getComputedStyle(m); const r = m && m.getBoundingClientRect(); return { exists: !!m, display: cs && cs.display, visibility: cs && cs.visibility, w: r && r.width, h: r && r.height, cls: m && m.className }; }));
  const st = await bridge.getState(); mark('globals-check', { esd_activated: st.globals && st.globals.esd_activated, early_esd_activation: st.globals && st.globals.early_esd_activation, active: st.activeMinigame });
  await bridge.minigame.close().catch(() => {}); await sleep(500); mark('closed');
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, 0);
