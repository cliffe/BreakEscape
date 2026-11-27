// t13_rfid_clone (m05), keyless: the RFID cloner reads and saves Owen's badge (the game's own clone minigame, as the owen_clone ink tag opens it). Setup (off camera) meets Owen in open_office_area so the server accepts the copy.
// RULE: Owen's card number is the lockbox code. A 30 ms interval blurs every UID/hex/facility/card/number row; frames MUST be checked for any readable number, and the edit crops the card data anyway.
// Entry state: new-game.rb m05_insider_trading --imports=none --start-room open_office_area --set briefing_played=true
// Record: MISSION=m05 run.sh <avatar> t13_rfid_clone "--imports=none --start-room open_office_area --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: cloner-open, step:<button>, saved.
import { sleep, clearScreen } from '../lib/lib.mjs';
export const buttons = (page) => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(Boolean)).catch(() => []);
export const clickBtn = (page, reSrc) => page.evaluate((src) => { const re = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button')].filter(b => b.offsetParent).find(b => re.test(b.innerText.trim())); if (b) { b.click(); return b.innerText.trim(); } return null; }, reSrc).catch(() => null);
export const blurUid = (page) => page.evaluate(() => { if (window.__uidBlur) return; window.__uidBlur = setInterval(() => { document.querySelectorAll('div,span,td,p,li').forEach(d => { const t = d.textContent.trim(); if (d.children.length <= 3 && t.length < 90 && (/^(UID|Hex|ID|Facility|Card|DEZ ?\d*|Checksum|Number|Data|Name)[:\s#]/i.test(t) || /[0-9A-F]{2}( [0-9A-F]{2}){3,}|[0-9A-F]{8,}|#\s?\d{3,}|\b\d{4,}\b/i.test(t))) d.style.filter = 'blur(6px)'; }); }, 30); });
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const r = await bridge.interact('owen_gallagher', { timeoutMs: 30000 });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 }).catch(() => null);
  console.error('SETUP chat', JSON.stringify(r).slice(0, 160), JSON.stringify(w).slice(0, 80));
  await sleep(1500);
  await page.evaluate(() => window.MinigameFramework.endMinigame(false));
  await sleep(800);
}
export const openClone = (page) => page.evaluate(() => {
  const rc = window.npcManager.getNPC('owen_gallagher').rfidCard;
  const cardData = { name: rc.name, card_id: rc.card_id, rfid_protocol: rc.rfid_protocol, type: 'keycard' };
  for (const k of ['rfid_hex', 'rfid_facility', 'rfid_card_number', 'rfid_data']) if (rc[k] !== undefined) cardData[k] = rc[k];
  window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: cardData, cloneSource: { npc_id: 'owen_gallagher' } });
});
export async function cloneAndSave(page, mark) {
  let saved = false;
  for (let i = 0; i < 20 && !saved; i++) {
    const bs = await buttons(page);
    console.error('BTNS', i, JSON.stringify(bs));
    for (const o of ['^Save$', 'Dictionary Attack', 'Crack keys first', '^>?\\s*Read', 'Place card|Badge|Card']) {
      const c = await clickBtn(page, o);
      if (c) { if (mark) mark('step:' + c, { buttons: bs }); if (/^Save$/i.test(c)) saved = true; break; }
    }
    await sleep(saved ? 400 : 2200);
  }
  return saved;
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  await blurUid(page);
  await openClone(page);
  mark('cloner-open');
  await sleep(2500);
  if (!(await cloneAndSave(page, mark))) throw new Error('never reached Save');
  await sleep(3000);
  mark('saved', { buttons: await buttons(page) });
  await sleep(1200);
};
