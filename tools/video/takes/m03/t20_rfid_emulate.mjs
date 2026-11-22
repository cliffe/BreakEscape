// t20_rfid_emulate (m03): the new mechanic's payoff. The cloner emulates Victoria's cloned executive card at the server-room card reader
// (main_hallway side), the door opens and the player steps through, key-driven and straight.
// Entry state (day): new-game.rb m03_ghost_in_the_machine --start-room conference_room_01 --unlock conference_room_01 --set briefing_played=true
// Record: BE_SPRITE=lucia_moreno tools/video/takes/run-take.sh m03 t20_rfid_emulate "--start-room conference_room_01 --unlock conference_room_01 --set briefing_played=true" "--hide-hud --zoom-step 1"
// The card is REAL: setup() (off camera) opens Victoria's conversation once (so the server counts her as encountered), closes it, then runs the game's own
// clone minigame the way the #clone_keycard tag does (cloneSource npc_id victoria_sterling): Read, Darkside (about 30 s), Save. That POSTs /clone_card, so the server
// records the copy and the door unlock is checked against it. No game row is edited. Then it walks to main_hallway and lines up under the server-room door.
// Marks: door-interact, reader-open, step:<button>, door-open, walk-start/leg:up, walk-end. UID rows are blurred (display only) so no hex/code is readable.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { goRoom } from './_live.mjs';
const DOOR = 'door:main_hallway->server_room';
const buttons = (page) => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(Boolean)).catch(() => []);
const clickBtn = (page, reSrc) => page.evaluate((src) => { const re = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button')].filter(b => b.offsetParent).find(b => re.test(b.innerText.trim())); if (b) { b.click(); return b.innerText.trim(); } return null; }, reSrc).catch(() => null);
const blurUid = (page) => page.evaluate(() => { if (window.__uidBlur) return; window.__uidBlur = setInterval(() => { document.querySelectorAll('div,span,td').forEach(d => { if (d.children.length <= 3 && /(UID|Hex|ID|Number)[:\s]/i.test(d.textContent) && /[0-9A-F]{2}( [0-9A-F]{2}){3,}|\b\d{4,}\b/i.test(d.textContent) && d.textContent.length < 80) d.style.filter = 'blur(6px)'; }); }, 30); });
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await sleep(500);
  // 1. meet Victoria (the server refuses a copy of an NPC not yet encountered), then close the chat
  const r = await bridge.interact('victoria_sterling', { timeoutMs: 30000 });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 });
  console.error('SETUP chat', JSON.stringify(r).slice(0, 160), JSON.stringify(w).slice(0, 80));
  await sleep(1500);
  await page.evaluate(() => window.MinigameFramework.endMinigame(false));
  await sleep(800);
  // 2. the game's own clone minigame, as the #clone_keycard tag opens it
  await blurUid(page);
  await page.evaluate(() => {
    const npc = window.npcManager.getNPC('victoria_sterling');
    const rc = npc.rfidCard;
    const cardData = { name: rc.name, card_id: rc.card_id, rfid_protocol: rc.rfid_protocol, type: 'keycard' };
    for (const k of ['rfid_hex', 'rfid_facility', 'rfid_card_number', 'rfid_data']) if (rc[k] !== undefined) cardData[k] = rc[k];
    window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: cardData, cloneSource: { npc_id: 'victoria_sterling' } });
  });
  await sleep(2500);
  let saved = false;
  for (let i = 0; i < 40 && !saved; i++) {
    const bs = await buttons(page);
    console.error('BTNS', i, JSON.stringify(bs));
    for (const o of ['^Save$', 'Darkside Attack', 'Crack keys first', '^>?\\s*Read', 'Executive Keycard|Place card']) {
      const c = await clickBtn(page, o);
      if (c) { console.error('CLICK', c); if (/^Save$/i.test(c)) saved = true; break; }
    }
    await sleep(saved ? 1500 : 2000);
  }
  if (!saved) throw new Error('never reached Save');
  await sleep(2500);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework.endMinigame(false)); await sleep(600); }
  // 3. to the main hallway and under the server-room door
  await goRoom(page, bridge, 'main_hallway');
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 });
  // line up under the door's centre (off camera): pulse the player onto the door's x so the walk-through is one straight key-driven leg
  const dx0 = (await bridge.getState()).nearby.find(n => n.id === DOOR).x;
  for (let i = 0; i < 10; i++) {
    const px = (await bridge.getState()).player.x; const d = dx0 - px;
    if (Math.abs(d) <= 2) break;
    await bridge.walk(d > 0 ? 'right' : 'left', Math.max(30, Math.round(Math.abs(d) / 145 * 1000)));
    await sleep(150);
  }
  await sleep(900);
  const s = await bridge.getState();
  console.error('SETUP end', JSON.stringify({ player: s.player, door: s.nearby.filter(n => /server_room/.test(n.id)).map(n => [n.id, n.x, n.y, n.inRange]) }));
}
export default async (page, bridge, mark) => {
  await blurUid(page);
  await sleep(1200);
  mark('door-interact', { player: (await bridge.getState()).player });
  const r = await bridge.interact(DOOR, { timeoutMs: 20000 });
  console.error('INTERACT', JSON.stringify(r).slice(0, 300));
  await sleep(1800);
  mark('reader-open', { mg: (await bridge.getState()).activeMinigame, buttons: await buttons(page) });
  let ok = false;
  for (let i = 0; i < 8 && !ok; i++) {
    const bs = await buttons(page); console.error('RBTNS', i, JSON.stringify(bs));
    const c = await clickBtn(page, 'Emulate');
    if (c) { mark('step:' + c); ok = true; break; }
    await sleep(900);
  }
  if (!ok) throw new Error('no Emulate button');
  for (let i = 0; i < 40; i++) { await sleep(250); if (!(await bridge.getState()).activeMinigame) break; }
  await sleep(600);
  const st = await bridge.getState();
  mark('door-open', { room: st.player.room, mg: st.activeMinigame });
  // step through: straight north, about 2 s (aligned under the door centre in setup)
  const p = st.player;
  mark('walk-start', { player: p });
  await keyLegs(bridge, [['up', p.y - 290]], 145, mark);
  mark('walk-end', { player: (await bridge.getState()).player });
  await sleep(1500);
};
