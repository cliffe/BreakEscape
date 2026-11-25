// t08c_historian_chrome: the SCADA Historian Trend Viewer chrome only, for the crescendo's 4 f historian cut (title bar, rack ticks, time-range buttons; NO plot).
// Entry state: tools/video/takes/run-take.sh sis02 t08c_historian_chrome "--set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"   (fresh game; same room and desktop as t04)
// Actions: interact('hmi_ops_01') opens the desktop; a real click on the "Historian Trend Viewer" icon only (never the register export). The chart area (.sh-charts: hint, trend, banners,
//   tooltip, dZ/dt panel) is hidden with visibility:hidden BEFORE it can be seen, so the plot never renders on screen (the layout keeps its size, the crop takes the left rack panel + toolbar + title).
//   Nothing is clicked inside the viewer (no range button, no dZ/dt, no COMPARE RACKS, no ANNOTATE: those set globals and complete the task); the pointer is parked at (40,40).
// Spoiler guard: the take throws if any visible text contains a digit sequence other than the rack ids (A1..A4) and the range buttons (1h 3h 6h 12h 24h) and the "dZ/dt" label, and marks
//   the list as visible-numbers. The dial's reading and the plot values are never on screen (the plot is hidden).
// Marks: sprite, desktop-open, clicked, viewer-open, rects (window, left panel, toolbar, charts), visible-text, visible-numbers, globals-check (historian_flatline_found, rate_of_change_viewed,
//   compare_racks_viewed must be falsy), frame:hist_t+N, bark-check, end. Crop (edit): the .console-window bar y to the toolbar bottom, left panel plus toolbar; exclude everything under the toolbar.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

const HIDE = '.sh-charts{visibility:hidden !important}.sh-tooltip,.sh-hint,.sh-info-banner,.sh-banner,.sh-annotate-note{visibility:hidden !important}';

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  await page.addStyleTag({ content: HIDE });
  const r = await interact(bridge, mark, 'hmi_ops_01');
  if (!r || !r.ok) throw new Error('hmi_ops_01 interact failed');
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('.pc-monitor .desktop-icon-label'))) break; await sleep(100); }
  mark('desktop-open', await page.evaluate(() => [...document.querySelectorAll('.desktop-icon-label')].map(e => e.textContent.trim())));
  await sleep(500);
  const box = await page.evaluate(() => { const e = [...document.querySelectorAll('.desktop-icon-label')].find(x => /Historian/i.test(x.textContent)); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
  if (!box) throw new Error('Historian Trend Viewer icon not found');
  await page.mouse.move(box.x, box.y); await sleep(150); await page.mouse.click(box.x, box.y);
  mark('clicked', { x: Math.round(box.x), y: Math.round(box.y) });
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('.sh-wrapper'))) break; await sleep(100); }
  await page.mouse.move(40, 40); await sleep(800);
  mark('viewer-open', { active: (await bridge.getState()).activeMinigame });
  mark('rects', { window: await rectOf(page, '.console-window'), left: await rectOf(page, '.sh-left-panel'), toolbar: await rectOf(page, '.sh-toolbar'), charts: await rectOf(page, '.sh-charts') });
  const txt = await page.evaluate(() => (document.querySelector('.sh-wrapper') || document.body).innerText.replace(/\n+/g, ' | '));
  mark('visible-text', txt.slice(0, 600));
  const nums = (txt.replace(/\bA[1-4]\b/g, '').replace(/\b(1|3|6|12|24)h\b/g, '').replace(/dZ\/dt/gi, '').match(/\d+(\.\d+)?/g) || []);
  mark('visible-numbers', nums);
  if (nums.length) throw new Error('numbers visible in the historian chrome: ' + nums.join(','));
  const t1 = Date.now();
  for (const t of [0.4, 1.4, 2.4]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, 'hist_t+' + t); await says.drain(); }
  const st = await bridge.getState();
  mark('globals-check', { historian_flatline_found: st.globals && st.globals.historian_flatline_found, rate_of_change_viewed: st.globals && st.globals.rate_of_change_viewed, compare_racks_viewed: st.globals && st.globals.compare_racks_viewed });
  await bridge.minigame.close().catch(() => {}); await sleep(500);
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
};
