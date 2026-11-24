// Shared by the m08 keyless takes t10..t27 (23 Nov, written, NOT run). Never types a PIN/password/code: only PAD digits (checked by check_digits.rb) or z/q/x, never ENTER.
import { sleep } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { openChat, closeAll } from '../m06/_cres.mjs';
export { faceFlash, openMg, typeKeys, pickLock, closeAll, openChat, driveToMenu } from '../m06/_cres.mjs';
import { buttons, clickBtn } from '../m05/t13_rfid_clone.mjs';
export { blurUid, buttons, clickBtn } from '../m05/t13_rfid_clone.mjs';
/** m03-style clone: Crack keys first > Darkside (about 30 s) > Read > Save. (m05's version picks Dictionary Attack, which loops on the menu.) */
export async function cloneAndSave(page, mark) {
  let saved = false;
  for (let i = 0; i < 40 && !saved; i++) {
    const bs = await buttons(page);
    for (const o of ['^Save$', 'Darkside Attack', 'Crack keys first', '^>?\\s*Read', 'Place card|Badge|Card']) {
      const c = await clickBtn(page, o);
      if (c) { if (mark) mark('step:' + c, { buttons: bs }); if (/^Save$/i.test(c)) saved = true; break; }
    }
    await sleep(saved ? 400 : 2000);
  }
  return saved;
}
export { goRoom } from './_live.mjs';
export const PAD = { all: ['1', '0', '2'] };   // prefix/position-checked by check_digits.rb (yes/no only)
/** Off camera: open the Director's chat and sit through his opening (about 30 s) to the first menu, so the server has met him and brief_taken is set; then close. */
export async function meetNetherton(page, bridge) {
  await bridge.moveToNear('director_netherton', { timeoutMs: 25000 }); await sleep(600);
  await openChat(bridge, 'director_netherton');
  for (let i = 0; i < 400; i++) { const d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice) break; if (d && d.canContinue && i % 40 === 39) await bridge.minigame.continue_().catch(() => {}); await sleep(250); }
  await closeAll(page, bridge); await sleep(800);
}
export const openCloneNeth = (page) => page.evaluate(() => { const rc = window.npcManager.getNPC('director_netherton').rfidCard; const cardData = { name: rc.name, card_id: rc.card_id, rfid_protocol: rc.rfid_protocol, type: 'keycard' }; for (const k of ['rfid_hex', 'rfid_facility', 'rfid_card_number', 'rfid_data']) if (rc[k] !== undefined) cardData[k] = rc[k]; window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: cardData, cloneSource: { npc_id: 'director_netherton' } }); });
/** Straight key-driven walk, legs relative (dx/dy px), 145 px/s. */
export async function walkRel(bridge, mark, dx, dy) { const p = (await bridge.getState()).player; const legs = []; if (dx) legs.push([dx > 0 ? 'right' : 'left', p.x + dx]); if (dy) legs.push([dy > 0 ? 'down' : 'up', p.y + dy]); await keyLegs(bridge, legs, 145, mark); }
export const npcPos = (page, id) => page.evaluate((id) => { const n = window.npcManager.getNPC(id); return n && n._sprite && { x: n._sprite.x, y: n._sprite.y }; }, id);
