// t10_drug_scan: the Drug Library Integrity Terminal (drug_library_checker, major incident room) running its SHA-256 scan, for the crescendo's 15 f checker shot.
// Entry state: tools/video/takes/run-take.sh sis01 t10_drug_scan "--start-room major_incident_room --set briefing_played=true --set manufacturer_datasheet_available=true --set paper_charts_collected=true" "--hide-hud --zoom-step 1"
// Fresh game. DOM minigame (not canvas), so CSS could mask, but the edit crops: frame ONLY the title, the status bar and table rows 1 to 5 (rows 0..4); NEVER the MORPHINE row
// (row index 5, drawn from the first frame, hex scan 2.2 s then FAIL at ~2.55 s, scan complete + drug_library_compromised + barks at ~2.95 s).
// HARD STOP: the take clicks RUN, samples rows 1-5 PASS (~0.7-0.9 s), and closes the minigame at scan+1.4 s (cleanup() clears every scan timer, so no FAIL and no tamper alert ever fires).
// It then asserts drug_library_compromised is NOT set, and that no bark fired.
// Marks: minigame, rects (title, status bar, rows 0..5 with names, crop-bottom = row 5 top - 4), run-click, scan-start, frame:scan_t+N, rows-pass (statuses), hard-stop, global-check, closed, end.
import { sleep, prepare, sprite, interact, watchSays } from './_sis01b.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export async function openChecker(page, bridge, mark) {
  await interact(bridge, mark, 'drug_library_checker');
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => !!document.querySelector('#dli-run-btn'))) break; await sleep(150); }
  const mg = (await bridge.getState()).activeMinigame; mark('minigame', { mg: JSON.stringify(mg).slice(0, 140) });
  if (!await page.evaluate(() => !!document.querySelector('#dli-run-btn'))) throw new Error('checker panel / RUN button not found');
  await sleep(500);
}

export async function geometry(page, mark) {
  const g = await page.evaluate(() => {
    const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const title = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /PUMP FLEET MANAGEMENT/i.test(e.textContent || ''))[0];
    const rows = [0, 1, 2, 3, 4, 5, 6].map(i => { const e = document.querySelector('#dli-row-' + i); return e ? { i, name: (e.querySelector('.dli-col-drug')?.textContent || '').trim(), ...R(e) } : null; });
    const panel = document.querySelector('#dli-panel');
    return { wrap: R(document.querySelector('.dli-wrap')), container: R(document.querySelector('.minigame-container')), title: R(title), status: R(document.querySelector('#dli-status-bar')), panel: R(panel), rows, runBtn: R(document.querySelector('#dli-run-btn')), thead: R(document.querySelector('.dli-lib-table thead')) };
  });
  g.cropBottom = g.rows[5] ? g.rows[5].y - 4 : null;
  mark('rects', g); return g;
}

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  const sw = await watchSays(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChecker(page, bridge, mark);
  const g = await geometry(page, mark);
  mark('frame:pre_scan');
  // the RUN button sits at y958-1020, below the panel's clipped area (panel ends y962), and scrolling to it would scroll rows 1-5 away: dispatch the button's own click (no scroll, no game global)
  await page.evaluate(() => document.querySelector('#dli-run-btn').click());
  const tClick = Date.now(); mark('run-click');
  await page.waitForFunction(() => !!document.querySelector('#dli-status-0 .dli-badge-scanning') && !/^\u2014$/.test(document.querySelector('#dli-status-0').textContent.trim()), null, { timeout: 5000 });
  mark('scan-start', null, tClick);
  await sleep(150);
  const g2 = await geometry(page, (l, d) => mark(l + '-scanning', d));   // the progress bar appears at scan start and shifts the rows down
  mark('crop-box', { x: 322, y: 100, w: 1276, h: g2.rows[5].y - 100, note: 'frame title through row 5 (index 4) as laid out DURING the scan; bottom = MORPHINE row top (rows shift ~4 px when the progress bar shows)' });
  const sample = () => page.evaluate(() => [0, 1, 2, 3, 4, 5].map(i => (document.querySelector('#dli-status-' + i)?.textContent || '').trim().slice(0, 8)));
  let ft = [0.3, 0.6, 0.9, 1.2], fi = 0, rowsPass = null;
  while ((Date.now() - tClick) / 1000 < 1.4) {
    const el = (Date.now() - tClick) / 1000;
    while (fi < ft.length && el >= ft[fi]) { mark('frame:scan_t+' + ft[fi]); fi++; }
    const s = await sample(); if (!rowsPass && s.slice(0, 5).every(x => /PASS/.test(x))) { rowsPass = el; mark('rows-pass', { atS: +el.toFixed(2), statuses: s }); }
    await sleep(40);
  }
  mark('hard-stop', { elapsedS: +((Date.now() - tClick) / 1000).toFixed(2), statuses: await sample() });
  await bridge.minigame.close().catch(() => {});
  await sleep(2500);   // past the point the FAIL / scan-complete would have fired, to prove cleanup cancelled it
  const st = await bridge.getState();
  mark('global-check', { drug_library_compromised: st.globals && st.globals.drug_library_compromised, minigame: st.activeMinigame ? 'still-open' : null });
  await sw.drain(); mark('closed'); mark('end');
};
