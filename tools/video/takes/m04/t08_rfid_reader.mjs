// t08_rfid_reader (m04): the Hall 2 door's RFID reader (door:battery_hall_1->battery_hall_2) with the cloned Level 1 card (setup, off camera: meet Vance, run the cloner, walk to Hall 1; the card in the inventory would open the door with no reader). The take opens the reader, shows it, then Emulate.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room operations_office --set briefing_played=true --set cipher_walked=true
// Record: BE_SPRITE=ngozi_adeyemi tools/video/takes/run-take.sh m04 t08_rfid_reader "--imports=none --start-room operations_office --set briefing_played=true --set cipher_walked=true" "--hide-hud --zoom-step 1"
// Marks: door-interact, reader-open (with buttons), step:<button>, door-open, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom } from './_live.mjs';
const DOOR = 'door:battery_hall_1->battery_hall_2';
const buttons = (page) => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(Boolean)).catch(() => []);
const clickBtn = (page, reSrc) => page.evaluate((src) => { const re = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button')].filter(b => b.offsetParent).find(b => re.test(b.innerText.trim())); if (b) { b.click(); return b.innerText.trim(); } return null; }, reSrc).catch(() => null);
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  // 1. meet Vance (the server refuses a copy of an NPC not yet encountered), close the chat
  const r = await bridge.interact('robert_vance', { timeoutMs: 30000 });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 }).catch(() => null);
  console.error('SETUP chat', JSON.stringify(r).slice(0, 160), JSON.stringify(w).slice(0, 80));
  await sleep(1500);
  await page.evaluate(() => window.MinigameFramework.endMinigame(false));
  await sleep(800);
  // 2. the game's own clone minigame, as the #clone_keycard tag opens it (EM4100: read in clear, Save)
  await page.evaluate(() => {
    if (window.__uidBlur) return; window.__uidBlur = setInterval(() => { document.querySelectorAll('div,span,td').forEach(d => { const t = d.textContent.trim(); if (d.children.length <= 3 && t.length < 90 && (/^(UID|Hex|ID|Facility|Card|DEZ ?\\d*|Checksum|Number|Data)[:\\s]/i.test(t) || /[0-9A-F]{2}( [0-9A-F]{2}){3,}|[0-9A-F]{8,}/i.test(t))) d.style.filter = 'blur(6px)'; }); }, 30);
    const npc = window.npcManager.getNPC('robert_vance');
    const rc = npc.rfidCard;
    const cardData = { name: rc.name, card_id: rc.card_id, rfid_protocol: rc.rfid_protocol, type: 'keycard' };
    for (const k of ['rfid_hex', 'rfid_facility', 'rfid_card_number', 'rfid_data']) if (rc[k] !== undefined) cardData[k] = rc[k];
    window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: cardData, cloneSource: { npc_id: 'robert_vance' } });
  });
  await sleep(2500);
  let saved = false;
  for (let i = 0; i < 20 && !saved; i++) {
    const bs = await buttons(page);
    console.error('BTNS', i, JSON.stringify(bs));
    for (const o of ['^Save$', 'Dictionary Attack', 'Crack keys first', '^>?\\s*Read', 'Level 1|Place card']) {
      const c = await clickBtn(page, o);
      if (c) { console.error('CLICK', c); if (/^Save$/i.test(c)) saved = true; break; }
    }
    await sleep(saved ? 1500 : 2000);
  }
  if (!saved) throw new Error('never reached Save');
  await sleep(2500);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework.endMinigame(false)); await sleep(600); }
  // 3. to Hall 1, beside the Hall 2 door
  await goRoom(page, bridge, ['scada_control_room', 'battery_hall_1']);
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 }).catch(e => console.error('moveToNear', String(e).slice(0, 200)));
  await sleep(900);
  console.error('SETUP end', JSON.stringify((await bridge.getState()).player));
}
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('door-interact', { player: (await bridge.getState()).player });
  const r = await bridge.interact(DOOR, { timeoutMs: 20000 });
  console.error('INTERACT', JSON.stringify(r).slice(0, 300));
  await sleep(1800);
  mark('reader-open', { mg: (await bridge.getState()).activeMinigame, buttons: await buttons(page) });
  await sleep(1500);
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) {
    const bs = await buttons(page); console.error('RBTNS', i, JSON.stringify(bs));
    const c = await clickBtn(page, 'Emulate');
    if (c) { mark('step:' + c, { buttons: bs }); ok = true; break; }
    await sleep(700);
  }
  for (let i = 0; i < 24; i++) { await sleep(250); if (!(await bridge.getState()).activeMinigame) break; }
  await sleep(600);
  const st = await bridge.getState();
  mark('door-open', { room: st.player.room, mg: st.activeMinigame, ok });
  await sleep(1500);
  mark('linger-end');
};
