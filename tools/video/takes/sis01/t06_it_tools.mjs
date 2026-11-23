// t06_it_tools: the three IT Security office tools, one take (t06b = the same at 560 px, see t06b_it_tools_narrow.mjs). Feeds the "tools" montage (35 f each).
// Entry state: tools/video/takes/run-take.sh sis01 t06_it_tools "--start-room it_security_office --set briefing_played=true" "--hide-hud --zoom-step 1"   (fresh game)
//   (1) SIEM console (siem_console, ".siem-alert-list"): CRIT and HIGH rows are removed from the list (display:none, re-applied every 80 ms), the list scrolls from the top by ~290 px over 1.2 s.
//       Crop to the alert list ONLY (rect 'siem-list'): the right-hand pane carries the "CRIT 4 / HIGH 1" severity counts and the escalated queue.
//   (2) VPN log (vpn_terminal, ".lf-log-table-wrap"): the table scrolls top to bottom unfiltered. The anomalous row (m.blake, 185.220.101.47, RO, MFA NO; the 21st row) is removed by matching its IP text, because
//       the engine puts `.lf-anomaly-row` on EVERY row (isAnomaly compares undefined fields), so the class cannot be used. ".lf-session-detail" (SESSION DETAIL) only exists after a row click: never clicked here, hidden by CSS as insurance.
//       Crop to the log pane (rect 'vpn-log': the FILTER BUILDER pane is the 238 px to its left and stays out of frame).
//   (3) Network map (network_map_screen, ".nsm-svg"): no clicks; the consequence pane shows its default text. Whole panel or the map area.
// Marks: <tool>-open, <tool>-rects, <tool>-hidden (counts of removed rows), <tool>_scroll_start / <tool>_scroll_end, frame:<tool>_*, <tool>-closed, end.
import { sleep, prepare, sprite, interact, rectOf, narrow, frame } from './_sis01.mjs';

const wait = async (page, sel, n = 60) => { for (let i = 0; i < n; i++) { if (await page.evaluate((s) => !!document.querySelector(s), sel)) return true; await sleep(100); } return false; };
const snap = (mark, name) => { frame(mark, name); return process.env.BE_DRY ? sleep(700) : sleep(0); };

/** Smooth-scroll an element (rAF, linear) by `by` px over `ms`; resolves when done. */
const scrollBy = (page, sel, by, ms) => page.evaluate(({ sel, by, ms }) => new Promise((res) => { const e = document.querySelector(sel); if (!e) return res(null); const s0 = e.scrollTop, t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms); e.scrollTop = s0 + by * k; if (k < 1) requestAnimationFrame(step); else res({ from: s0, to: e.scrollTop, max: e.scrollHeight - e.clientHeight }); }; requestAnimationFrame(step); }), { sel, by, ms });

export async function tools(page, bridge, mark, narrowed) {
  await sprite(page, mark);
  await prepare(page, bridge, mark);
  // ---- (1) SIEM ----
  const SIEM_BOX = '.siem-minigame-game-container';
  await interact(bridge, mark, 'siem_console');
  if (!await wait(page, '.siem-alert-list')) throw new Error('siem never opened');
  if (narrowed) await narrow(page, SIEM_BOX);
  await sleep(400);
  const hideSiem = () => page.evaluate(() => { let n = 0; for (const r of document.querySelectorAll('.siem-alert-row')) { const t = (r.innerText || '').trim(); if (/^(CRIT|HIGH)\b/.test(t)) { r.style.display = 'none'; n++; } } return n; });
  await page.evaluate(() => 0); const hiddenN = await hideSiem();
  await page.evaluate(() => { window.__hideSiem = setInterval(() => { for (const r of document.querySelectorAll('.siem-alert-row')) if (/^(CRIT|HIGH)\b/.test((r.innerText || '').trim())) r.style.display = 'none'; }, 80); });
  await sleep(150);
  mark('siem-open'); mark('siem-hidden', { hidden: hiddenN });
  mark('siem-rects', { list: await rectOf(page, '.siem-alert-list'), box: await rectOf(page, SIEM_BOX), counts: await rectOf(page, '.siem-severity-chart') });
  await snap(mark, 'siem_top');
  mark('siem_scroll_start'); const sc1 = await scrollBy(page, '.siem-alert-list', 290, 1200); mark('siem_scroll_end', sc1);
  const vis = await page.evaluate(() => { const L = document.querySelector('.siem-alert-list').getBoundingClientRect(); return [...document.querySelectorAll('.siem-alert-row')].filter(r => r.style.display !== 'none').map(r => { const b = r.getBoundingClientRect(); return { sev: (r.innerText || '').trim().split(/\s/)[0], inView: b.bottom > L.top && b.top < L.bottom }; }); });
  mark('siem-visible-sev', vis.filter(v => v.inView).map(v => v.sev));
  await snap(mark, 'siem_end');
  await page.evaluate(() => clearInterval(window.__hideSiem));
  await bridge.minigame.close().catch(() => {}); await sleep(600); mark('siem-closed');

  // ---- (2) VPN log ----
  const VPN_BOX = '.lf-game-container';
  await page.addStyleTag({ content: '.lf-session-detail{display:none !important}' });
  await interact(bridge, mark, 'vpn_terminal');
  if (!await wait(page, '.lf-log-row')) throw new Error('vpn log never opened');
  if (narrowed) await narrow(page, VPN_BOX);
  await sleep(400);
  const hideVpn = () => page.evaluate(() => { let n = 0; for (const r of document.querySelectorAll('.lf-log-row')) if (/185\.220\.101\.47/.test(r.innerText || '')) { r.style.display = 'none'; n++; } return n; });
  const hiddenV = await hideVpn();
  await page.evaluate(() => { window.__hideVpn = setInterval(() => { for (const r of document.querySelectorAll('.lf-log-row')) if (/185\.220\.101\.47/.test(r.innerText || '')) r.style.display = 'none'; }, 80); });
  await sleep(150);
  mark('vpn-open'); mark('vpn-hidden', { hidden: hiddenV });
  mark('vpn-rects', { log: await rectOf(page, '.lf-log-table-wrap'), filterPane: await rectOf(page, '.lf-filter-pane'), box: await rectOf(page, VPN_BOX), detail: await rectOf(page, '.lf-session-detail') });
  await snap(mark, 'vpn_top');
  mark('vpn_scroll_start'); const sc2 = await scrollBy(page, '.lf-log-table-wrap', 1000, 1200); mark('vpn_scroll_end', sc2);
  mark('vpn-anomaly-visible', await page.evaluate(() => [...document.querySelectorAll('.lf-log-row')].filter(r => /185\.220\.101\.47|RO\s+NO/.test(r.innerText || '') && r.style.display !== 'none').length));
  await snap(mark, 'vpn_end');
  await page.evaluate(() => clearInterval(window.__hideVpn));
  await bridge.minigame.close().catch(() => {}); await sleep(600); mark('vpn-closed');

  // ---- (3) network map ----
  const NSM_BOX = '.nsm-game-container';
  await interact(bridge, mark, 'network_map_screen');
  if (!await wait(page, '.nsm-svg')) throw new Error('nsm never opened');
  if (narrowed) await narrow(page, NSM_BOX);
  await sleep(900);
  mark('nsm-open');
  mark('nsm-rects', { box: await rectOf(page, NSM_BOX), map: await rectOf(page, '.nsm-topology-area'), svg: await rectOf(page, '.nsm-svg'), modalVisible: await page.evaluate(() => !!document.querySelector('.nsm-modal-visible')) });
  await snap(mark, 'nsm_0'); await sleep(700); await snap(mark, 'nsm_1');
  await bridge.minigame.close().catch(() => {}); await sleep(600); mark('nsm-closed');
  mark('end');
}

export default async (page, bridge, mark) => tools(page, bridge, mark, false);
