// t02_ransom_station: the ward monitoring station's ransom note (ransomware-display minigame, DOM, so CSS/DOM can mask it in the take).
// Feeds: ransom (headline, amount, countdown; 2.47 to 7.80 s of the trailer) and Helen's 12 f amount-line insert (the 'amount-rect' mark).
// Entry state: run-take.sh sis01 t02_ransom_station "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Masks in the take: the Wallet and Support (onion) lines are removed from the <pre> text once the panel is up (before the first frame check).
// The panel never prints the group name (groupName is data only); the organisation line says "Northgate General Hospital NHS Trust" (kept).
// Marks: panel-open, mask-applied (what was removed), rects (panel, pre, amount-line, timer), frame:t+N, timer-values, end.
// Hold 4 s after the mask. The countdown ticks (TIME REMAINING hh:mm:ss) so the edit can use any 2 s inside the hold.
import { sleep, prepare, sprite, interact, rectOf, frame } from './_sis01.mjs';

export const MASK = () => {
  const pre = document.querySelector('.ransomware-display-body:not(.ransomware-display-extra)');
  if (!pre) return { ok: false };
  const before = pre.textContent;
  const keep = before.split('\n').filter(l => !/^\s*Wallet:/i.test(l) && !/onion|^\s*Support:/i.test(l) && !/^bc1/i.test(l.trim()));
  pre.textContent = keep.join('\n');
  return { ok: true, removed: before.split('\n').length - keep.length, left: keep };
};
export const AMOUNT_RECT = () => {
  const pre = document.querySelector('.ransomware-display-body:not(.ransomware-display-extra)'); if (!pre) return null;
  const tn = pre.firstChild; if (!tn) return null; const i = tn.textContent.indexOf('£'); if (i < 0) return null;
  const ls = tn.textContent.lastIndexOf('\n', i) + 1; let le = tn.textContent.indexOf('\n', i); if (le < 0) le = tn.textContent.length;
  const r = document.createRange(); r.setStart(tn, ls); r.setEnd(tn, le); const b = r.getBoundingClientRect();
  return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
};

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await prepare(page, bridge, mark);
  const r = await interact(bridge, mark, 'ward_monitoring_station');
  if (!r || !r.ok) throw new Error('station interact failed');
  for (let i = 0; i < 40; i++) { if (await page.evaluate(() => !!document.querySelector('.ransomware-display-body'))) break; await sleep(150); }
  mark('panel-open');
  await sleep(300);
  mark('mask-applied', await page.evaluate(MASK));
  const rects = { panel: await rectOf(page, '.ransomware-display-game-container'), pre: await rectOf(page, '.ransomware-display-body'), title: await rectOf(page, '.ransomware-display-title'), timer: await rectOf(page, '.ransomware-display-timer-row'), amount: await page.evaluate(AMOUNT_RECT) };
  mark('rects', rects); mark('amount-rect', rects.amount);
  const t0 = Date.now(); const vals = [];
  for (const t of [1, 2, 3, 3.9]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t0))); frame(mark, 't+' + t); vals.push(await page.evaluate(() => (document.getElementById('ransomware-timer-value') || {}).textContent)); }
  mark('timer-values', vals);
  mark('text-check', await page.evaluate(() => { const t = document.body.innerText; return { wallet: /wallet|bc1q/i.test(t), onion: /onion/i.test(t), darkvault: /darkvault/i.test(t), safetynet: /safetynet|cyber aware|break escape/i.test(t) }; }));
  mark('end');
};
