// t07_rfid_clone (m04): the RFID cloner reads and saves a Level 1 facility card (the m04 payoff of the cloner, m03 t04 pattern). Opened directly with window.startRFIDMinigame(null, null, {mode:'clone', cardToClone}) (the same minigame the ink tag opens).
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room scada_control_room --set briefing_played=true
// Record: BE_SPRITE=mei_lin_chow tools/video/takes/run-take.sh m04 t07_rfid_clone "--imports=none --start-room scada_control_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: cloner-open, step:<button>, saved. The UID rows are blurred (display only) so no card number is readable.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
const buttons = (page) => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(Boolean)).catch(() => []);
const clickBtn = (page, reSrc) => page.evaluate((src) => { const re = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button')].filter(b => b.offsetParent).find(b => re.test(b.innerText.trim())); if (b) { b.click(); return b.innerText.trim(); } return null; }, reSrc).catch(() => null);
const blurUid = (page) => page.evaluate(() => { if (window.__uidBlur) return; window.__uidBlur = setInterval(() => { document.querySelectorAll('div,span,td').forEach(d => { const t = d.textContent.trim(); if (d.children.length <= 3 && t.length < 90 && (/^(UID|Hex|ID|Facility|Card|DEZ ?\d*|Checksum|Number|Data)[:\s]/i.test(t) || /[0-9A-F]{2}( [0-9A-F]{2}){3,}|[0-9A-F]{8,}/i.test(t))) d.style.filter = 'blur(6px)'; }); }, 30); });
export default async (page, bridge, mark) => {
  await sleep(1000);
  await blurUid(page);
  await page.evaluate(() => {
    const card = { card_id: 'facility_keycard_level1', rfid_protocol: 'EM4100', name: 'Level 1 Facility Card', type: 'keycard' };
    window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: card });
  });
  mark('cloner-open');
  await sleep(2500);
  let saved = false;
  for (let i = 0; i < 14 && !saved; i++) {
    const bs = await buttons(page);
    console.error('BTNS', i, JSON.stringify(bs));
    for (const o of ['^Save$', 'Dictionary Attack \\(instant\\)', 'Crack keys first', '^>?\\s*Read', 'Place card|Facility Card']) {
      const c = await clickBtn(page, o);
      if (c) { mark('step:' + c, { buttons: bs }); if (/^Save$/i.test(c)) saved = true; break; }
    }
    await sleep(saved ? 400 : 2200);
  }
  if (!saved) throw new Error('never reached Save');
  await sleep(3000);
  mark('saved', { buttons: await buttons(page) });
  await sleep(1200);
};
