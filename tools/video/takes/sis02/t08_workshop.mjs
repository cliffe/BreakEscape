// t08_workshop: montage_b + crescendo shots in the engineering workshop: the jump-server access log (hmi_eng_02) with the filter typing NON-ANSWER values, the jump server rack, the cable,
//   the filing cabinet lock, the site phone contact list.
// Entry state: tools/video/takes/run-take.sh sis02 t08_workshop "--start-room engineering_workshop --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
//   (--start-room puts the player in the workshop; the workshop key needs no seeding. New-game WARNING about Helen is expected: no hall bark.)
// Log: interact('hmi_eng_02') opens the access log (ConsoleLogFilter, .lf-wrapper). CSS hides the anomaly row (.lf-anomaly-row, the c.ellison ACTIVE 03:22-class row), the ENG TOOL HISTORY tab
//   (.lf-tab-unread) and anything SESSION DETAIL (never opened: no row is clicked). Chips: + ADD FILTER, ACCOUNT = typed "m.patel" (a daytime engineer account), Enter; then + ADD FILTER, ACCESS_LEVEL = ENGINEER
//   if the picker offers a value list. Never c.ellison, ACTIVE, CONTRACTOR or 03:22. The unfiltered table is also framed first (frame:log_unfiltered; the edit may use it with the filter pane out of frame).
// Marks: sprite, log-open, log-rects (window, filter pane, table), anomaly-hidden (display of the anomaly row, tab), text-check (visible table text: must have no ellison/ACTIVE/03:22),
//   chip1-typed/chip2-*, frame:log_*, then rack/cable overworld walks (dialogs never opened: the rack dialog shows c.ellison), cabinet-*, phone-* pieces, bark-check, end.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

const LOG_CSS = '.lf-anomaly-row{display:none !important}.lf-tab-unread{display:none !important}[class*="session-detail"],[class*="lf-detail"],[class*="lf-session"]{display:none !important}';

async function piece(page, bridge, mark, name, id, holdS, { frames = [0.5], closeAfter = true } = {}) {
  const r = await interact(bridge, mark, id);
  if (!r || !r.ok) { mark(name + '-FAILED'); return null; }
  await sleep(1000); mark(name + '-open', { active: (await bridge.getState()).activeMinigame });
  const t1 = Date.now(); for (const t of frames) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, name + '_t+' + t); }
  await sleep(Math.max(0, holdS * 1000 - (Date.now() - t1)));
  const txt = await page.evaluate(() => { const c = document.querySelector('.minigame-container, .game-display-dialog, #phone-container') || document.body; return (c.innerText || '').replace(/\n+/g, ' | ').slice(0, 400); });
  mark(name + '-text', txt);
  if (closeAfter) { await bridge.minigame.close().catch(() => {}); await sleep(600); mark(name + '-closed'); }
  return txt;
}

export async function run(page, bridge, mark, narrowPx) {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  await page.addStyleTag({ content: LOG_CSS });
  if (narrowPx) await page.addStyleTag({ content: `.console-window{width:${narrowPx}px !important;max-width:${narrowPx}px !important;margin-left:auto !important;margin-right:auto !important}` });
  // 1. access log
  const r = await interact(bridge, mark, 'hmi_eng_02');
  if (!r || !r.ok) throw new Error('hmi_eng_02 interact failed');
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('.lf-log-table'))) break; await sleep(100); }
  await sleep(700); mark('log-open');
  mark('log-rects', { window: await rectOf(page, '.console-window'), filterPane: await rectOf(page, '.lf-filter-pane'), table: await rectOf(page, '.lf-log-table-wrap') });
  mark('anomaly-hidden', await page.evaluate(() => ({ rowDisplay: [...document.querySelectorAll('.lf-anomaly-row')].map(e => getComputedStyle(e).display), tabDisplay: [...document.querySelectorAll('.lf-tab-unread')].map(e => getComputedStyle(e).display) })));
  frame(mark, 'log_unfiltered'); await sleep(900);
  // 2. chip typing: ACCOUNT = m.patel
  await page.click('.lf-add-filter-btn'); await sleep(500);
  await page.click('.lf-filter-category:has-text("ACCOUNT")'); await sleep(500);
  await page.click('.lf-filter-text-input'); await sleep(300);
  mark('chip1-typing-start'); await page.keyboard.type('m.patel', { delay: 130 }); frame(mark, 'log_typed'); await sleep(400);
  await page.keyboard.press('Enter'); await sleep(900); mark('chip1-committed', { active: await page.evaluate(() => (document.querySelector('.lf-active-filters-label') || {}).innerText) });
  frame(mark, 'log_chip1');
  // second chip: ACCESS_LEVEL = ENGINEER if a value list appears (never CONTRACTOR)
  await page.click('.lf-add-filter-btn').catch(() => {}); await sleep(500);
  await page.click('.lf-filter-category:has-text("ACCESS_LEVEL")').catch(() => {}); await sleep(500);
  const vals = await page.evaluate(() => [...document.querySelectorAll('.lf-filter-values > *')].map(e => e.tagName + ':' + (e.innerText || e.placeholder || '').trim().slice(0, 24)));
  mark('chip2-values', vals);
  const eng = await page.$('.lf-filter-values >> text=/^ENGINEER$/');
  if (eng) { await eng.click(); await sleep(900); mark('chip2-committed', { active: await page.evaluate(() => (document.querySelector('.lf-active-filters-label') || {}).innerText) }); }
  frame(mark, 'log_chip2'); await sleep(700);
  const vis = await page.evaluate(() => [...document.querySelectorAll('.lf-log-table tr')].filter(r => getComputedStyle(r).display !== 'none').map(r => r.innerText.replace(/\s+/g, ' ')).join(' || '));
  mark('text-check', { rows: vis.split(' || ').length, hasEllison: /ellison/i.test(vis), hasActive: /ACTIVE/.test(vis), has0322: /03:22/.test(vis), hasContractor: /CONTRACTOR/.test(vis), preview: await page.evaluate(() => (document.querySelector('.lf-command-preview') || {}).innerText) });
  await bridge.minigame.close().catch(() => {}); await sleep(700); mark('log-closed');
  // 3. overworld pieces
  // The rack and cable dialogs are NOT shown: the rack dialog prints "User: c.ellison" and the cable opens a "Disconnect cable?" confirm. Overworld only: the player stays put (no walk), frame each object at rest, hold.
  for (const [name, id] of [['rack', 'jump_server_rack'], ['cable', 'jump_server_cable']]) {
    const st = await bridge.getState({ radius: 2000, limit: 200 }); const o = (st.nearby || []).find(n => n.id === id);
    mark(name + '-obj', o || null);   // full nearby entry (room px + onScreen); NO moveTo: walking onto the cable opens its "Disconnect cable?" confirm
    await sleep(400); frame(mark, name + '_walk_t+0.4'); await sleep(900); frame(mark, name + '_walk_t+1.3');
    const p = (await bridge.getState()).player; mark(name + '-player', { x: p.x, y: p.y, active: (await bridge.getState()).activeMinigame });
  }
  await piece(page, bridge, mark, 'cabinet', 'engineering_filing_cabinet', 1.2, { frames: [0.5, 1.0] });
  // phone: inventory item
  // the tray is hidden by --hide-hud: lift the HUD style for the call, restore it once the phone is open
  const hud = await page.evaluate(() => { const e = document.getElementById('be-hide-hud'); if (!e) return null; const t = e.textContent; e.textContent = ''; return t; }); await sleep(300);
  const po = await bridge.openInventoryItem('phone').catch(e => ({ ok: false, err: String(e).slice(0, 100) })); mark('phone-call', po); await sleep(900);
  if (hud) await page.evaluate((t) => { const e = document.getElementById('be-hide-hud'); if (e) e.textContent = t.replace('#npc-bark-container,.npc-bark-clear-all,', '').replace('#inventory-container,', '') + '#inventory-container{visibility:hidden !important}'; }, hud); await sleep(300);
  mark('phone-open', { active: (await bridge.getState()).activeMinigame, text: await page.evaluate(() => (document.querySelector('.phone-container, .phone-minigame, [class*=phone], .minigame-container') || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 500)), rect: await rectOf(page, '.phone-container, .phone-minigame, [class*=phone-]') });
  mark('phone-dom', await page.evaluate(() => [...document.querySelectorAll('[class*=phone],[id*=phone],.minigame-container,.minigame-overlay')].map(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return e.tagName + '#' + e.id + '.' + String(e.className).slice(0, 40) + ' ' + c.display + '/' + c.visibility + '/' + c.opacity + ' ' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); }).slice(0, 14)));
  frame(mark, 'phone_t+0.5'); await sleep(1500); frame(mark, 'phone_t+2');
  await bridge.minigame.close().catch(() => {}); await sleep(500);
  await says.drain();
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
}
export default (page, bridge, mark) => run(page, bridge, mark, 0);
