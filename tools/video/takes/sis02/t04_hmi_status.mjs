// t04_hmi_status: HMI-OPS-01 SCADA Live Status, 28.0 C on all four racks, all NORMAL (normal shot, first 2.70 s).
// Entry state: tools/video/takes/run-take.sh sis02 t04_hmi_status "--set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
// Actions: interact('hmi_ops_01') opens the ContainerMinigame desktop (icons: SCADA Live Status, Export PLC-BMS Register Table, Historian Trend Viewer); a REAL mouse click on the
//   "SCADA Live Status" icon label only (never the register export or the historian). Panel text: four racks 28.0C NORMAL, "All SIS setpoints: WITHIN CERTIFIED RANGE (per SCADA)",
//   "Alarm status: ALL CLEAR". The 28 is the falsified "normal" reading and is allowed on this screen alone (never beside the dial).
// No narrow variant: the monitor is a fixed 1168 px frame whose inner panels do not reflow under CSS (a 560 px cap clips the text); the 9:16 and 1:1 edits scale the whole
//   monitor (376,143 1168x790) to the frame width (about 0.9x at 1080 px wide, text stays legible).
// Marks: sprite, desktop-open (icon list), clicked, text (panel text), rects (monitor, file window), frame:status_t+N, bark-check, end.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  const r = await interact(bridge, mark, 'hmi_ops_01');
  if (!r || !r.ok) throw new Error('hmi_ops_01 interact failed');
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('.pc-monitor .desktop-icon-label'))) break; await sleep(100); }
  mark('desktop-open', await page.evaluate(() => [...document.querySelectorAll('.desktop-icon-label')].map(e => e.textContent.trim())));
  await sleep(500);
  const box = await page.evaluate(() => { const e = [...document.querySelectorAll('.desktop-icon-label')].find(x => /^\s*SCADA Live Status\s*$/.test(x.textContent)); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  if (!box) throw new Error('SCADA Live Status icon not found');
  await page.mouse.move(box.x, box.y); await sleep(150); await page.mouse.click(box.x, box.y);
  mark('clicked', { x: Math.round(box.x), y: Math.round(box.y) });
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => !!document.querySelector('.pc-file-window'))) break; await sleep(100); }
  await sleep(700);
  mark('text', await page.evaluate(() => (document.querySelector('.pc-file-window') || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 700)));
  mark('rects', { monitor: await rectOf(page, '.pc-monitor'), file: await rectOf(page, '.pc-file-window') });
  const t1 = Date.now();
  for (const t of [0.3, 1.2, 2.2, 2.7]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, 'status_t+' + t); await says.drain(); }
  await sleep(700);
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
};
