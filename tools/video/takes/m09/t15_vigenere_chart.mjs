// t15_vigenere_chart (m09, keyless, NOT YET RUN): tape_room. (1) the Shelf Marks chart (shelf_code_legend) opened with its text BLURRED by blurShelfText (the chart prints the Vigenere key word: a clue), held 1.8 s, closed. (2) the salvage door's password screen (door:tape_room->salvage_cage) showing its hint ("...Vigenere cipher keyed to this bay's word..."), NO characters typed, closed. Same room, one take.
// Entry state (new-game): --imports=none --start-room tape_room --unlock tape_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh harjit_singh t15_vigenere_chart "<flags>" "--hide-hud --zoom-step 1"
// Marks: chart-open, chart-closed, pw-open, pw-closed. Check EVERY chart frame for a readable key word; drop the chart shot if the blur leaks.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, closeAll, blurShelfText } from './_c9.mjs';
const DOOR = 'door:tape_room->salvage_cage';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('shelf_code_legend', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); await blurShelfText(page);
  await openMg(bridge, 'shelf_code_legend', 'chart', mark); await sleep(1800); await closeAll(page, bridge); mark('chart-closed'); await page.evaluate(() => { clearInterval(window.__shelfBlur); window.__shelfBlur = 0; document.querySelectorAll('*').forEach(d => { if (d.style && d.style.filter) d.style.filter = ''; }); }); await sleep(800);
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(700);
  await openMg(bridge, DOOR, 'pw', mark); await sleep(1200); await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /show hint/i.test(x.textContent)); if (b) b.click(); }); mark('hint-shown'); await sleep(2800); await closeAll(page, bridge); mark('pw-closed'); await sleep(900);
};
