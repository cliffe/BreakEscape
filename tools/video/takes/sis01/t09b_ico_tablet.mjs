// t09b_ico_tablet: the crescendo's opening "countdown on screen" shot (15 f). The ICO Notification Deadline tablet in the major incident room has no id in
// scenario.json.erb; its generated id is major_incident_room_tablet_5 (found at run time from getState().nearby by name, that id as the fallback).
// FINDING (dry run 23 Nov): the tablet opens a READABLE text panel (not a minigame; getState().activeMinigame stays null) that says "A countdown timer in the corner shows
// time remaining ... also visible in the top-right HUD", "DEADLINE COUNTDOWN: top-right corner of the screen, in hours left". It shows NO countdown itself. So the shot is the
// HUD timer (#scenario-timer-display, "NN h left"): part 1 below keeps ONLY the timer from the HUD (the take's own CSS re-shows #scenario-timer-display over --hide-hud), part 2 is the tablet panel.
// HUD DETAIL (dry run): with a plain fresh game the HUD timer is "PATIENT DETERIORATION 07:5x" (the soonest timer, Bed 4), NOT the ICO clock. With --set bed4_escalated=true the Bed 4
// timers drop out and the HUD reads "ICO 72-HOUR DEADLINE / 63 h left" (box x760 y30 w400 h122): that is the entry state for this take.
// Entry state: tools/video/takes/run-take.sh sis01 t09b_ico_tablet "--start-room major_incident_room --set briefing_played=true --set bed4_escalated=true" "--hide-hud --zoom-step 1"
// Marks: tablet-id, hud-timer (text + rect, crop box), frame:hud_t+N (part 1, 3 s), interact, panel (text, rect), frame:ico_t+N (part 2), closed, end.
import { sleep, prepare, sprite, interact, rectOf } from './_sis01b.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await page.addStyleTag({ content: '#scenario-timer-display{display:block !important}' });
  mark('start-hold'); await sleep(1200);
  const hud = await page.evaluate(() => { const e = document.querySelector('#scenario-timer-display'); if (!e) return null; const r = e.getBoundingClientRect(); return { text: (e.innerText || '').slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vis: getComputedStyle(e).display !== 'none' }; });
  mark('hud-timer', hud);
  for (const f of [0.5, 1.5, 2.5]) { await sleep(1000); mark('frame:hud_t+' + f); }
  const s = await bridge.getState({ radius: 2000, limit: 200 });
  const t = s.nearby.find(n => /ICO Notification Deadline/i.test(n.name || ''));
  const id = t ? t.id : 'major_incident_room_tablet_5';
  mark('tablet-id', { id, found: !!t });
  await interact(bridge, mark, id);
  let txt = ''; for (let i = 0; i < 40 && !/ICO Notification Deadline/.test(txt); i++) { txt = await page.evaluate(() => document.body.innerText || ''); if (!/ICO Notification Deadline/.test(txt)) await sleep(150); }
  if (!/DEADLINE COUNTDOWN/.test(txt)) throw new Error('ICO tablet panel did not open');
  mark('panel', { activeMinigame: (await bridge.getState()).activeMinigame ? 'set' : null, text: txt.slice(txt.indexOf('ICO Notification'), txt.indexOf('ICO Notification') + 300) });
  for (const f of [0.4, 1.4, 2.4]) { await sleep(f === 0.4 ? 400 : 1000); mark('frame:ico_t+' + f); }
  await bridge.minigame.close().catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(500);
  mark('closed', { panelStillUp: /DEADLINE COUNTDOWN/.test(await page.evaluate(() => document.body.innerText || '')) });
  mark('end');
};
