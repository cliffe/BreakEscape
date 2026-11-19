// Live proof of the sis02 historian "find it yourself" flow (D167), headless, real mouse/touch/keyboard.
//
//   ~/.cache/ms-playwright-go/1.57.0/node tools/playtest/historian-live-proof.mjs \
//     --url http://127.0.0.1:3207/break_escape/games/<id> --vw 1280 --vh 720 --out <dir> --tag 1280 [--mode pointer|keyboard] [--touch]
//
// pointer: mark too early, too late, in the window; wrong choice, right choice, confirm.
// keyboard: the same finding reached with keys only; also checks the game's own key handlers stay out of the way and Esc closes.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const argv = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => {
  if (v.startsWith('--')) a.push([v.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return a;
}, []));
const VW = +argv.vw || 1280, VH = +argv.vh || 720, TAG = argv.tag || String(VW), MODE = argv.mode || 'pointer';
const OUT = argv.out; fs.mkdirSync(OUT, { recursive: true });
const results = [];
const shot = async (page, name) => { const p = path.join(OUT, `${name}-${TAG}.png`); await page.screenshot({ path: p }); return p; };
const step = async (name, fn) => {
  try { const r = await fn(); const ok = r === undefined ? true : !!r.ok; results.push({ name, ok, ...(r || {}) }); console.log(ok ? 'PASS' : 'FAIL', name, JSON.stringify(r || {}).slice(0, 400)); }
  catch (e) { results.push({ name, ok: false, error: String(e) }); console.log('FAIL', name, String(e).slice(0, 300)); }
};

const browser = await chromium.launch({ headless: true, args: [`--window-size=${VW},${VH}`] });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, hasTouch: !!argv.touch, isMobile: !!argv.touch });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('pageerror', e => consoleErrors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/tts|503/i.test(m.text())) consoleErrors.push(m.text()); });

await page.goto(argv.url + '?skip_resume=1');
await page.waitForFunction(() => window.__test && window.__test.getState, null, { timeout: 60000 });
await page.waitForTimeout(1500);
for (let i = 0; i < 4; i++) {
  const b = page.getByText(/NO, I'LL FIGURE IT OUT/i).first();
  if (await b.count()) { await b.click(); await page.waitForTimeout(500); }
}
for (let i = 0; i < 10; i++) {
  const mg = await page.evaluate(() => (window.__test.getState().activeMinigame || {}).id || null);
  if (mg === 'title-screen') { await page.keyboard.press('Enter'); await page.waitForTimeout(1200); } else {
    const b = page.getByText(/NO, I'LL FIGURE IT OUT/i).first();
    if (await b.count()) { await b.click(); await page.waitForTimeout(600); } else break;
  }
}
for (let i = 0; i < 4; i++) {
  const mg = await page.evaluate(() => (window.__test.getState().activeMinigame || {}).id || null);
  if (mg) { await page.keyboard.press('Escape'); await page.waitForTimeout(700); } else break;
}
try { const b = page.getByText(/NO, I'LL FIGURE IT OUT/i).first(); await b.waitFor({ timeout: 6000 }); await page.waitForTimeout(800); await b.click(); await page.waitForTimeout(800); } catch (e) {}
await page.evaluate(() => window.__test.throttleFps(20));
await page.waitForTimeout(500);

const state = () => page.evaluate(() => { const s = window.__test.getState(); return { room: s.room, x: s.player && s.player.x, y: s.player && s.player.y, mg: s.activeMinigame && s.activeMinigame.id, dlg: !!s.dialogue }; });
const glob = n => page.evaluate(n => (window.gameState && window.gameState.globalVariables || {})[n], n);
const hint = () => page.evaluate(() => { const e = document.querySelector('.sh-hint'); return e ? { text: e.textContent.trim(), retry: e.classList.contains('retry'), found: e.classList.contains('found') } : null; });
const annotateEnabled = () => page.evaluate(() => { const b = [...document.querySelectorAll('button, div')].find(e => /ANNOTATE FINDING/.test(e.textContent) && e.children.length === 0); return b ? { disabled: !!b.disabled, active: b.classList.contains('active'), text: b.textContent } : null; });
const hasRedLine = () => page.evaluate(() => !!document.querySelector('#sh-chart-area svg line[stroke-dasharray="4,3"]'));
const markLine = () => page.evaluate(() => !!document.querySelector('.sh-mark-line'));

// Where a reading sits on screen, using the scene's own geometry
const pxFor = (iso) => page.evaluate((iso) => {
  const m = window.MinigameFramework.currentMinigame;
  const ts = new Date(iso).getTime();
  let best = null; for (const p of m._visible) if (!best || Math.abs(p.ts - ts) < Math.abs(best.ts - ts)) best = p;
  const area = document.getElementById('sh-chart-area'); const svg = area.querySelector('svg'); const r = svg.getBoundingClientRect();
  const { startTs, tsRange, PAD, plotW, plotH, W, H } = m._plot;
  const x = PAD.left + ((best.ts - startTs) / tsRange) * plotW;
  const y = PAD.top + plotH - ((best.value - 24) / (40 - 24)) * plotH; // refreshed below from the module constants
  return { best: new Date(best.ts).toISOString(), value: best.value, x: r.left + x * r.width / W, y0: y, W, H, rect: { l: r.left, t: r.top, w: r.width, h: r.height } };
}, iso);
async function pointAt(iso) {
  await page.evaluate(() => document.getElementById('sh-chart-area').scrollIntoView({ block: 'center' })); // short phones: the chart can sit below the fold
  await page.waitForTimeout(100);
  // Y_MIN/Y_MAX are module constants; derive y from the drawn polyline instead of assuming them
  const info = await page.evaluate((iso) => {
    const m = window.MinigameFramework.currentMinigame; const ts = new Date(iso).getTime();
    let best = null; for (const p of m._visible) if (!best || Math.abs(p.ts - ts) < Math.abs(best.ts - ts)) best = p;
    const area = document.getElementById('sh-chart-area'); const svg = area.querySelector('svg'); const r = svg.getBoundingClientRect();
    const { startTs, tsRange, PAD, plotW, W, H } = m._plot;
    const x = PAD.left + ((best.ts - startTs) / tsRange) * plotW;
    const a = document.querySelectorAll('#sh-chart-area svg line'); // y axis grid labels are text; compute y from value via grid
    return { ts: best.ts, value: best.value, xSvg: x, W, H, rect: { l: r.left, t: r.top, w: r.width, h: r.height }, PADtop: PAD.top, plotH: m._plot.plotH };
  }, iso);
  return info;
}
// Y range of the chart: read it from the module source constants through a probe (24 to 40 deg C in the drawn axis labels)
const Y_MIN = 24, Y_MAX = 42;
async function clickReading(iso, how = 'mouse', dx = 0) {
  const i = await pointAt(iso);
  const sx = i.rect.w / i.W, sy = i.rect.h / i.H;
  const x = i.rect.l + i.xSvg * sx + dx;
  const y = i.rect.t + (i.PADtop + i.plotH - ((i.value - Y_MIN) / (Y_MAX - Y_MIN)) * i.plotH) * sy;
  if (how === 'tap') await page.touchscreen.tap(x, y); else { await page.mouse.move(x, y); await page.waitForTimeout(150); await page.mouse.click(x, y); }
  await page.waitForTimeout(250);
  return { at: new Date(i.ts).toISOString().slice(11, 19), value: i.value };
}

let s0;
await step('bootstrap in control room', async () => { s0 = await state(); return { ok: s0.room === 'scada_control_room', ...s0 }; });
await step('open historian from HMI-OPS-01', async () => {
  await page.screenshot({ path: path.join(OUT, `dbg-before-open-${TAG}.png`) });
  await page.evaluate(() => window.__test.interact('hmi_ops_01'));
  await page.waitForFunction(() => window.__test.getState().activeMinigame && window.__test.getState().activeMinigame.id === 'container', null, { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__test.minigame.clickText('Historian Trend Viewer'));
  await page.waitForFunction(() => window.__test.getState().activeMinigame && window.__test.getState().activeMinigame.id === 'scada-historian', null, { timeout: 15000 });
  await page.waitForTimeout(600);
  return { ok: true };
});
await step('viewer open, no red line, ANNOTATE locked', async () => {
  const st = await state(); const h = await hint(); const a = await annotateEnabled(); await shot(page, 'b01-open');
  if (st.mg !== 'scada-historian') { console.log('viewer did not open, aborting'); fs.writeFileSync(path.join(OUT, `result-${TAG}-${MODE}.json`), JSON.stringify({ results }, null, 2)); await browser.close(); process.exit(1); }
  return { ok: st.mg === 'scada-historian' && !(await hasRedLine()) && !(await markLine()), mg: st.mg, hint: h && h.text, annotate: a };
});


// (a) plot width and how far from the cliff a tap still lands on an accepted reading (no click is made)
await step('plot geometry and tap tolerance around the cliff (no clicks)', async () => {
  await page.evaluate(() => document.getElementById('sh-chart-area').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(100);
  const r = await page.evaluate(async () => {
    const m = window.MinigameFramework.currentMinigame;
    const { judgeMark } = await import('/break_escape/js/minigames/scada-historian/scada-historian-data.js');
    const svg = document.querySelector('#sh-chart-area svg'); const rect = svg.getBoundingClientRect();
    const { startTs, tsRange, PAD, plotW, plotH, W, H } = m._plot; const sc = rect.width / W;
    const cliff = new Date('2026-03-20T23:12:07').getTime();
    const cx = rect.left + (PAD.left + ((cliff - startTs) / tsRange) * plotW) * sc;
    const cy = rect.top + (PAD.top + plotH / 2) * (rect.height / H);
    const rack = [...m._selectedRacks][0]; const an = m._anomalyFor(rack);
    const out = [];
    for (let d = -14; d <= 14; d += 1) {
      const el = document.elementFromPoint(cx + d, cy);
      if (!el || el.tagName !== 'rect') { out.push({ d, none: true }); continue; }
      const rx = +el.getAttribute('x'); let best = null;
      for (const p of m._visible) { const x = PAD.left + ((p.ts - startTs) / tsRange) * plotW; const k = Math.min(Math.abs(x - 2 - rx), Math.abs(x - 3 - rx)); if (!best || k < best.k) best = { k, p }; }
      const v = judgeMark(best.p, an, { pxPerMs: plotW / tsRange, rangeStartTs: startTs });
      out.push({ d, t: new Date(best.p.ts).toISOString().slice(11, 19), ok: v.ok });
    }
    const acc = out.filter(o => o.ok).map(o => o.d);
    return { cssPlotPx: Math.round(plotW * sc), svgW: W, svgCssW: Math.round(rect.width), pxPerMinute: +((plotW * sc) / (tsRange / 60000)).toFixed(3), cliffX: Math.round(cx), acceptedOffsetsPx: acc.length ? [Math.min(...acc), Math.max(...acc)] : null, samples: out.filter(o => o.d % 2 === 0).map(o => `${o.d}:${o.t || '-'}${o.ok ? '+' : ''}`).join(' ') };
  });
  return { ok: !!r.acceptedOffsetsPx && r.acceptedOffsetsPx[0] <= 0 && r.acceptedOffsetsPx[1] >= 0, ...r };
});
await page.evaluate(() => { window.__keys = []; window.addEventListener('keydown', e => window.__keys.push(e.key), false); });
const layoutProbe = () => page.evaluate(() => {
  const modal = document.querySelector('.sh-modal'); if (!modal) return null; const mr = modal.getBoundingClientRect();
  const btns = [...document.querySelectorAll('.sh-choice-btn, .sh-modal-confirm-btn, .sh-modal-cancel-btn')].map(b => { const r = b.getBoundingClientRect(), c = getComputedStyle(b);
    return { t: b.textContent.slice(0, 18), w: Math.round(r.width), h: Math.round(r.height), inModal: r.left >= mr.left - 1 && r.right <= mr.right + 1, inViewport: r.left >= 0 && r.right <= innerWidth, border: c.borderTopWidth + ' ' + c.borderTopStyle, radius: c.borderTopLeftRadius, font: c.fontFamily.split(',')[0], fs: c.fontSize, overflowX: b.scrollWidth > b.clientWidth + 1 }; });
  const hint = document.querySelector('.sh-hint-text') || document.querySelector('.sh-hint');
  return { modalW: Math.round(mr.width), modalOverflowX: modal.scrollWidth > modal.clientWidth + 1, pageOverflowX: document.documentElement.scrollWidth > innerWidth, viewport: [innerWidth, innerHeight], btns, hintH: hint && Math.round(hint.getBoundingClientRect().height) };
});
const layoutOk = L => L && !L.modalOverflowX && !L.pageOverflowX && L.btns.every(b => b.inModal && b.inViewport && !b.overflowX && /^2px solid/.test(b.border) && b.radius === '0px' && /VT323|GNF|Press/i.test(b.font) && parseFloat(b.fs) >= 14);

const T = { early: '2026-03-20T20:30:00', late: '2026-03-21T04:00:00', cliff: '2026-03-20T23:12:07' };
const stateAfterMg = () => page.evaluate(() => ({ mg: (window.__test.getState().activeMinigame || {}).id }));

if (MODE === 'pointer') {
  const tap = argv.touch ? 'tap' : 'mouse';
  await step(`mark too early (20:30) -> retry hint`, async () => {
    const r = await clickReading(T.early, tap); const h = await hint(); const a = await annotateEnabled(); await shot(page, 'b02-early');
    return { ok: /Still moving like a real sensor reading/.test(h.text) && h.retry && !(await markLine()) && (!a || a.disabled || !a.active), clicked: r, hint: h.text };
  });
  await step(`mark too late (04:00) -> other hint`, async () => {
    const r = await clickReading(T.late, tap); const h = await hint(); const a = await annotateEnabled(); await shot(page, 'b03-late');
    return { ok: /already like this before/.test(h.text) && h.retry && !(await markLine()) && (!a || a.disabled || !a.active), clicked: r, hint: h.text };
  });
  await step('1h range: the cliff is off the chart, a late mark says to widen the range', async () => {
    await page.locator('.sh-range-btn[data-hours="1"]').click(); await page.waitForTimeout(300);
    const r = await clickReading('2026-03-21T06:00:00', tap); const h = await hint(); await shot(page, 'b03b-late-1h');
    await page.locator('.sh-range-btn[data-hours="12"]').click(); await page.waitForTimeout(300);
    return { ok: /widen the range/.test(h.text) && !/Find where it starts/.test(h.text) && h.retry, clicked: r, hint: h.text };
  });
  await step(`mark in the window (23:12; touch: tapped ${argv.touch ? '+10px right of' : 'on'} the cliff) -> mark line, ANNOTATE unlocks`, async () => {
    const r = await clickReading(T.cliff, tap, argv.touch ? 10 : 0); const h = await hint(); const a = await annotateEnabled(); await shot(page, 'b04-marked');
    return { ok: /Marked 23:/.test(h.text) && h.found && await markLine() && a && a.active && !a.disabled, clicked: r, hint: h.text, annotate: a, redLineStill: await hasRedLine() };
  });
  await step('open report: asks first, no finding text, no confirm', async () => {
    await page.getByText(/ANNOTATE FINDING/).first().click(); await page.waitForTimeout(400);
    const vis = await page.evaluate(() => { const bs = [...document.querySelectorAll('.sh-choice-btn')]; const t = document.querySelector('.sh-modal-title').getBoundingClientRect(); return { allChoicesInView: bs.every(b => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), titleInView: t.top >= 0, xBtn: !!document.querySelector('.sh-modal-close'), cancel: !!document.querySelector('.sh-modal-cancel-btn'), sceneX: (() => { const x = document.querySelector('#minigame-close'); return x ? getComputedStyle(x).visibility : null; })() }; });
    results.push({ name: 'report on open: title in view (and all three choices when the window is 800px+ tall); one X only (the scene X), no CANCEL', ok: (VH < 800 || vis.allChoicesInView) && vis.titleInView && !vis.xBtn && !vis.cancel && vis.sceneX !== 'hidden', ...vis });
    const info = await page.evaluate(() => ({ text: document.querySelector('.sh-modal').textContent, choices: document.querySelectorAll('.sh-choice-btn').length, confirm: !!document.querySelector('.sh-modal-confirm-btn') }));
    await shot(page, 'b05-report-asks'); const L = await layoutProbe(); console.log('LAYOUT asks', JSON.stringify(L));
    results.push({ name: 'layout: report with choices (2px borders, no overflow, readable)', ok: !!layoutOk(L), L });
    return { ok: info.choices === 3 && !info.confirm && /What does the data show from that moment/.test(info.text) && !/injection/i.test(info.text.replace(/HISTORIAN ANOMALY REPORT/, '')), choices: info.choices, confirm: info.confirm, text: info.text.slice(0, 200) };
  });
  await step('scene X while asking closes the report only; the viewer stays and the mark is kept; reopen', async () => {
    await page.locator('#minigame-close').click(); await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({ modal: !!document.querySelector('.sh-modal'), mg: (window.__test.getState().activeMinigame || {}).id, mark: !!document.querySelector('.sh-mark-line'), h: document.querySelector('.sh-chart-area, #sh-chart-area').getBoundingClientRect().height }));
    await shot(page, 'b05b-scene-x-closed-report');
    await page.getByText(/ANNOTATE FINDING/).first().click(); await page.waitForTimeout(400);
    return { ok: !after.modal && after.mg === 'scada-historian' && after.mark && !!(await page.$('.sh-modal')), ...after };
  });
  await step('wrong choice (sensor dropout) -> reason shown, still no confirm', async () => {
    await page.locator('.sh-choice-btn[data-choice]').nth(2).click(); await page.waitForTimeout(300);
    const info = await page.evaluate(() => ({ fb: document.querySelector('.sh-choice-feedback').textContent, confirm: !!document.querySelector('.sh-modal-confirm-btn'), wrong: document.querySelectorAll('.sh-choice-btn.wrong').length, g: (window.gameState.globalVariables || {}).historian_flatline_found }));
    results.push({ name: 'after a wrong choice the choices and feedback are still in view', ok: await page.evaluate(() => { const bs = [...document.querySelectorAll('.sh-choice-btn'), document.querySelector('.sh-choice-feedback')]; return bs.every(b => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }); }) });
    await shot(page, 'b06-wrong-choice'); { const L = await layoutProbe(); console.log('LAYOUT wrong', JSON.stringify(L)); results.push({ name: 'layout: report after a wrong choice', ok: !!layoutOk(L), L }); }
    return { ok: /36\.5/.test(info.fb) && !info.confirm && info.wrong === 1 && !info.g, ...info };
  });
  await step('wrong choice (real cooling) -> its own reason', async () => {
    await page.locator('.sh-choice-btn[data-choice]').nth(0).click(); await page.waitForTimeout(300);
    const info = await page.evaluate(() => ({ fb: document.querySelector('.sh-choice-feedback').textContent, confirm: !!document.querySelector('.sh-modal-confirm-btn') }));
    await shot(page, 'b07-wrong-choice-2');
    return { ok: /cannot cool/i.test(info.fb) && !info.confirm, ...info };
  });
  await step('right choice (written, not measured) -> finding revealed, confirm appears', async () => {
    await page.locator('.sh-choice-btn[data-choice]').nth(1).click(); await page.waitForTimeout(400);
    const info = await page.evaluate(() => ({ confirm: !!document.querySelector('.sh-modal-confirm-btn'), text: document.querySelector('.sh-modal').textContent.slice(0, 300), choices: document.querySelectorAll('.sh-choice-btn').length, g: (window.gameState.globalVariables || {}).historian_flatline_found }));
    await shot(page, 'b08-revealed-report'); { const L = await layoutProbe(); console.log('LAYOUT revealed', JSON.stringify(L)); results.push({ name: 'layout: revealed report', ok: !!layoutOk(L), L }); }
    return { ok: info.confirm && info.choices === 0 && !info.g, ...info };
  });
  await step('chart behind the report now shows the red injection line (cancel to look, then reopen)', async () => {
    await page.getByText(/CANCEL/).first().click(); await page.waitForTimeout(400);
    const red = await hasRedLine(); await shot(page, 'b09-revealed-chart');
    const chartH = await page.evaluate(() => Math.round(document.getElementById('sh-chart-area').getBoundingClientRect().height));
    results.push({ name: `chart height back to normal after the report closes (R2 m1): ${chartH}px`, ok: VH <= 560 ? (chartH >= 130 && chartH <= 170) : VW > 600 ? chartH > 250 : chartH <= 300, chartH });
    const axis = await page.evaluate(() => { const t = [...document.querySelectorAll('#sh-chart-area svg text')]; const hs = t.map(e => e.getBoundingClientRect().height); const a = document.getElementById('sh-chart-area').getBoundingClientRect(); return { n: t.length, minH: Math.round(Math.min(...hs)), maxH: Math.round(Math.max(...hs)), lowestLabelBottom: Math.round(Math.max(...t.map(e => e.getBoundingClientRect().bottom))), areaBottom: Math.round(a.bottom) }; });
    results.push({ name: 'axis labels not squashed after CANCEL (R3 m1): ' + JSON.stringify(axis), ok: axis.minH >= 8 && axis.lowestLabelBottom <= axis.areaBottom + 1, ...axis });
    // R3 m2: the revealed anomaly tooltip must sit inside the chart area, last line included
    {
      const i = await pointAt('2026-03-20T23:40:00'); const sx = i.rect.w / i.W, sy = i.rect.h / i.H;
      const x = i.rect.l + i.xSvg * sx, y = i.rect.t + (i.PADtop + i.plotH - ((i.value - Y_MIN) / (Y_MAX - Y_MIN)) * i.plotH) * sy;
      await page.mouse.move(x, y); await page.waitForTimeout(300);
      const tt = await page.evaluate(() => { const e = document.querySelector('.sh-tooltip'); const a = document.getElementById('sh-chart-area').getBoundingClientRect(); const r = e.getBoundingClientRect(); return { text: e.textContent.slice(-60), shown: getComputedStyle(e).display !== 'none', clipped: e.scrollHeight > e.clientHeight + 1, top: Math.round(r.top - a.top), bottomGap: Math.round(a.bottom - r.bottom), h: Math.round(r.height), areaH: Math.round(a.height), fs: getComputedStyle(e).fontSize }; });
      await shot(page, 'b09b-tooltip');
      results.push({ name: 'anomaly tooltip fits the chart area (R3 m2): ' + JSON.stringify(tt), ok: tt.shown && !tt.clipped && tt.top >= 0 && tt.bottomGap >= -1, ...tt });
      await page.mouse.move(2, 2); await page.waitForTimeout(150);
    }
    await page.getByText(/ANNOTATE FINDING/).first().click(); await page.waitForTimeout(400);
    return { ok: red && !!(await page.$('.sh-modal-confirm-btn')), red };
  });
  await step('confirm -> historian_flatline_found set, review_historian complete, viewer closes', async () => {
    await page.locator('.sh-modal-confirm-btn').click();
    await page.waitForFunction(() => (window.gameState.globalVariables || {}).historian_flatline_found === true, null, { timeout: 8000 });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => { const t = window.objectivesManager && window.objectivesManager.taskStatus ? window.objectivesManager.taskStatus('review_historian') : null; return { g: window.gameState.globalVariables.historian_flatline_found, mg: (window.__test.getState().activeMinigame || {}).id || null, state: JSON.stringify(window.objectivesManager && (window.objectivesManager.getTask ? window.objectivesManager.getTask('review_historian') : null)) }; });
    const brief = await page.evaluate(() => window.__test.brief ? window.__test.brief() : null);
    await shot(page, 'b10-after-confirm');
    return { ok: info.g === true && info.mg === null, ...info, openTasks: brief && brief.openTasks, completed: await page.evaluate(() => { try { return window.__test.waitForTask && true; } catch (e) { return null; } }) };
  });
  await step('review_historian is complete in the objectives state', async () => {
    const r = await page.evaluate(async () => { try { const x = await window.__test.waitForTask('review_historian', { timeoutMs: 4000 }); return x; } catch (e) { return { err: String(e) }; } });
    return { ok: !!r && !r.err && (r.ok !== false), r };
  });
}

if (MODE === 'keyboard') {
  const press = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(40); } };
  const tipTime = () => page.evaluate(() => { const all = document.querySelectorAll('.sh-tooltip'); const t = all[all.length - 1]; const m = t && t.textContent.match(/(\d\d):(\d\d):(\d\d)/); return m ? m[0] : null; });
  const sec = t => { const [h, m, s] = t.split(':').map(Number); return ((h < 12 ? h + 24 : h) * 3600 + m * 60 + s); };
  const target = sec('23:12:07');
  const focusId = () => page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName));

  await step('Esc closes the viewer (and it reopens)', async () => {
    await page.keyboard.press('Escape'); await page.waitForTimeout(700);
    const closed = (await state()).mg;
    await page.evaluate(() => window.__test.interact('hmi_ops_01'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.__test.minigame.clickText('Historian Trend Viewer'));
    await page.waitForTimeout(1500);
    const reopened = (await state()).mg;
    return { ok: (closed === null || closed === 'container') && reopened === 'scada-historian', closed, reopened };
  });
  const before = await state();
  await step('no duplicate viewer DOM after Esc and reopen', async () => {
    const n = await page.evaluate(() => ({ areas: document.querySelectorAll('#sh-chart-area').length, tooltips: document.querySelectorAll('.sh-tooltip').length }));
    return { ok: n.areas === 1 && n.tooltips === 1, ...n };
  });
  await step('Tab reaches the chart (focus ring visible)', async () => {
    let f = null; for (let i = 0; i < 20; i++) { await page.keyboard.press('Tab'); f = await focusId(); if (f === 'sh-chart-area') break; }
    await page.waitForTimeout(200); await shot(page, 'k01-chart-focused');
    const outline = await page.evaluate(() => { const c = getComputedStyle(document.getElementById('sh-chart-area')); return { w: c.outlineWidth, s: c.outlineStyle }; });
    return { ok: f === 'sh-chart-area', focus: f, outline };
  });
  await step('arrows, Shift+arrows, PageUp/PageDown, Home/End move the cursor; game does not move or react', async () => {
    await press('ArrowRight'); const t1 = await tipTime();
    await press('ArrowRight'); const t2 = await tipTime();
    await page.keyboard.down('Shift'); await press('ArrowRight'); await page.keyboard.up('Shift'); const t3 = await tipTime();
    await press('PageDown'); const t4 = await tipTime();
    await press('End'); const t5 = await tipTime();
    await press('Home'); const t6 = await tipTime();
    // keys the game binds: e, space, wasd-style, Esc handled separately
    await press('e'); await press('w'); await press('a'); await press('s'); await press('d');
    const after = await state(); const f = await focusId();
    const reached = await page.evaluate(() => window.__keys.slice()); console.log('KEYS reaching window bubble listener:', JSON.stringify(reached));
    await shot(page, 'k02-cursor');
    const moved = t1 && t2 && t3 && t4 && t5 && t6 && t1 !== t2 && sec(t3) - sec(t2) > 5 * 60 && t5 !== t6;
    return { ok: !!moved && after.mg === 'scada-historian' && after.x === before.x && after.y === before.y && !after.dlg, t: [t1, t2, t3, t4, t5, t6], before, after, focus: f, windowSaw: reached };
  });
  await step('Enter on an early reading marks it: retry hint', async () => {
    await press('Home'); await press('Enter'); const h = await hint(); await shot(page, 'k03-early');
    return { ok: /Still moving like a real sensor reading/.test(h.text) && h.retry, hint: h.text };
  });
  await step('navigate to the first flat reading by keys, Enter marks it, ANNOTATE unlocks', async () => {
    // Home, then PageDown (60) until within an hour before, Shift+Right (10) then Right (1)
    let t = await tipTime(); let guard = 0;
    while (sec(t) < target - 3600 && guard++ < 40) { await press('PageDown'); t = await tipTime(); }
    guard = 0; while (sec(t) < target - 600 && guard++ < 40) { await page.keyboard.down('Shift'); await press('ArrowRight'); await page.keyboard.up('Shift'); t = await tipTime(); }
    guard = 0; while (sec(t) < target - 60 && guard++ < 40) { await press('ArrowRight'); t = await tipTime(); }
    const tt = await page.evaluate(() => document.querySelector('.sh-tooltip').textContent);
    await press('Enter'); const h = await hint(); const a = await annotateEnabled(); await shot(page, 'k04-marked');
    return { ok: /Marked 23:1/.test(h.text) && h.found && !!(await markLine()) && a && a.active, hint: h.text, cursorAt: t, tooltip: tt.slice(0, 120), annotate: a };
  });
  await step('Tab to ANNOTATE FINDING and open it with Enter', async () => {
    let f; for (let i = 0; i < 30; i++) { await page.keyboard.press('Shift+Tab'); f = await page.evaluate(() => document.activeElement && document.activeElement.textContent.slice(0, 30)); if (/ANNOTATE/.test(f || '')) break; }
    await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    const info = await page.evaluate(() => ({ choices: document.querySelectorAll('.sh-choice-btn').length, focus: document.activeElement && document.activeElement.className }));
    await shot(page, 'k05-report');
    return { ok: info.choices === 3, focusWas: f, ...info };
  });
  await step('wrong choice by keyboard, then right one, then confirm with Enter', async () => {
    // focus is on the first choice (real cooling): Enter -> wrong
    await page.keyboard.press('Enter'); await page.waitForTimeout(300);
    const fb = await page.evaluate(() => document.querySelector('.sh-choice-feedback').textContent);
    // Tab to the second choice
    const f1 = await page.evaluate(() => document.activeElement.className);
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    const info = await page.evaluate(() => ({ confirm: !!document.querySelector('.sh-modal-confirm-btn'), focus: document.activeElement && document.activeElement.className }));
    await shot(page, 'k06-revealed');
    const gBefore = await glob('historian_flatline_found');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => (window.gameState.globalVariables || {}).historian_flatline_found === true, null, { timeout: 8000 });
    await page.waitForTimeout(1500);
    const st = await state();
    return { ok: info.confirm && /confirm/i.test('confirm') && gBefore !== true && st.mg !== 'scada-historian', wrongFeedback: fb.slice(0, 90), focusFirst: f1, ...info, gBefore, mgAfter: st.mg };
  });
  await step('review_historian complete', async () => {
    const r = await page.evaluate(async () => { try { return await window.__test.waitForTask('review_historian', { timeoutMs: 4000 }); } catch (e) { return { err: String(e) }; } });
    return { ok: !!r && !r.err && r.ok !== false, r };
  });
}

// Layout checks for the open report (run in pointer mode right before confirm would have been better; do it here on a fresh report if the viewer is still up)
fs.writeFileSync(path.join(OUT, `result-${TAG}-${MODE}.json`), JSON.stringify({ tag: TAG, mode: MODE, vw: VW, vh: VH, consoleErrors, results }, null, 2));
console.log('consoleErrors', consoleErrors.length, consoleErrors.slice(0, 3));
await browser.close();
