// Shared by the m09 trailer takes t10..t18 (23 Nov, written, NOT run). Re-exports the proven m05/m06/m07 helpers. Never types any code/password; never ENTER.
import { sleep } from '../lib/lib.mjs';
import { closeAll as closeMg } from '../m06/_cres.mjs';
export { faceFlash, openMg, typeKeys, pickLock, openChat, driveToMenu } from '../m06/_cres.mjs';
/** closeAll plus the notes reader (gameDisplay dialog, not a minigame): click its X. */
export async function closeAll(page, bridge) { await closeMg(page, bridge); for (let i = 0; i < 3; i++) { const n = await page.evaluate(() => { const b = document.querySelector('.game-display-dialog .game-modal-close'); if (b) { b.click(); return 1; } return 0; }); if (!n) break; await sleep(500); } }
export { pickMenu } from '../m06/_conv.mjs';
export { makeBeat } from '../m05/_beat.mjs';
export { blurUid } from '../m05/t13_rfid_clone.mjs';
export const setGlobal = (page, name, value) => page.evaluate(async ([n, v]) => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal(n, v); return window.gameState.globalVariables[n]; }, [name, value]);
/** Blur any element showing the shelf-mark key words (the chart text IS the Vigenere key clue): runs every 30 ms. */
export const blurShelfText = (page) => page.evaluate(() => { if (window.__shelfBlur) return; window.__shelfBlur = setInterval(() => { document.querySelectorAll('div,span,p,pre,td,li').forEach(d => { const t = d.textContent || ''; if (d.children.length <= 6 && t.length < 900 && /BONEYARD|COTTONWOOD|MERIDIAN|WATCHTOWER|STANDBY|Bay \d+/i.test(t)) d.style.filter = 'blur(9px)'; }); }, 30); });
