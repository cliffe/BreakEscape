// t04_rfid_clone (m03): the RFID cloner (the m03 signature mechanic) reads Ffion's staff badge at reception, cracks the keys (dictionary attack) and saves it.
// Opened directly with window.startRFIDMinigame(null, null, {mode:'clone', cardToClone}) (the hub path needs ink flags; this is the same minigame the ink tag opens).
// Entry state: new-game.rb m03_ghost_in_the_machine --set briefing_played=true (day, reception_lobby is the start room).
// Record: BE_SPRITE=mei_lin_chow tools/video/takes/run-take.sh m03 t04_rfid_clone "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Flow: 1 s hold on the map, cloner opens, then Read / (tap badge) / crack (dictionary) / Save by clicking the .flipper DOM buttons, one beat each, buttons logged in marks.
// Marks: cloner-open, step:<button>, saved. No card code is typed; the read screen lists card fields (checked in frames).
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await sleep(500);
}
const buttons = (page) => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(Boolean)).catch(() => []);
const clickBtn = (page, reSrc) => page.evaluate((src) => { const re = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button')].filter(b => b.offsetParent).find(b => re.test(b.innerText.trim())); if (b) { b.click(); return b.innerText.trim(); } return null; }, reSrc).catch(() => null);
export default async (page, bridge, mark) => {
  await sleep(1000);
  // The read and info screens list the card UID (a real-looking hex ID): blur that row (display only) so no card code is readable in frame.
  await page.evaluate(() => { if (window.__uidBlur) return; window.__uidBlur = setInterval(() => { document.querySelectorAll('div').forEach(d => { if (d.children.length <= 3 && /^\s*UID:\s*[0-9A-F]{2}( [0-9A-F]{2})+\s*$/i.test(d.textContent)) d.style.filter = 'blur(6px)'; }); }, 30); });
  await page.evaluate(() => {
    const card = { card_id: 'receptionist_badge', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Staff Access Badge' };
    window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: card });
  });
  mark('cloner-open');
  await sleep(2500);
  const order = ['^>?\\s*Read', 'Staff Access Badge', 'Dictionary Attack \\(instant\\)', '^Save$'];
  let saved = false;
  for (let i = 0; i < 14 && !saved; i++) {
    const bs = await buttons(page);
    console.error('BTNS', i, JSON.stringify(bs));
    for (const o of ['^Save$', 'Dictionary Attack \\(instant\\)', 'Crack keys first', '^>?\\s*Read', 'Place card|Staff Access Badge']) {
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
