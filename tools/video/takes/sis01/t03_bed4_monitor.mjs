// t03_bed4_monitor: the Bed 4 bedside monitor read-out (a readable vitals-monitor object shown in the game display: HR 47, SpO2 91%, BP 88/52, "CENTRAL STATION: OFFLINE").
// Feeds: bed4 (3.43 s of the trailer) and the crescendo's Bed 4 cut.
// Entry state: run-take.sh sis01 t03_bed4_monitor "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Hazard: reading it sets bed4_monitor_viewed, and Sarah's bark "That alarm from Bed 4. Come and talk to me about it." follows after about 3 s (barkDelay 3000) as a world bubble + bark audio.
//   HIDE_BUBBLES hides the Phaser bubble, MUTE_BARKS mutes the bark audio; watchSays marks 'bubble-start:' so the edit knows when it would have shown; muteSummary proves no audible bark.
// Hold 3.8 s after the panel is up. Marks: panel-open, panel-info (what the minigame is, its text, whether a canvas is in the DOM), rects, frame:t+0.5..3.8 (3.0 to 3.8 every 0.2 s),
//   bubble-start:*, bubble-visible-check, mute-summary, end.
import { sleep, prepare, sprite, interact, rectOf, frame, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis01.mjs';

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await prepare(page, bridge, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  // Part 1 (fallback shot): the overworld Bed 4 with its pulsing red emitter, 1.6 s, then the reader. The monitor sits in the bed bay: walk next to it first.
  const st0 = await bridge.getState({ radius: 400, limit: 120 });
  const mon = (st0.nearby || []).find(n => /bed4_monitor/.test(n.id));
  mark('monitor-pos', mon ? { x: mon.x | 0, y: mon.y | 0, inRange: mon.inRange } : null);
  if (mon) { const w = await bridge.moveTo(Math.round(mon.x), Math.round(mon.y + 70), { timeoutMs: 15000 }).catch(e => ({ ok: false, err: String(e).slice(0, 80) })); mark('walk-to-monitor', { ok: w && w.ok, reached: w && w.reachedTarget }); }
  await sleep(300);
  mark('overworld_start');
  for (const t of [0.4, 1.4]) { await sleep(t === 0.4 ? 400 : 1000); frame(mark, 'overworld_t+' + t); }
  if (process.env.BE_DRY) await sleep(800); // the dry run's screenshots lag ~0.5 s; in a real capture the overworld hold ends here
  mark('overworld_end');
  const r = await interact(bridge, mark, 'bed4_monitor');
  if (!r || !r.ok) throw new Error('monitor interact failed');
  // The reader is the game-display modal (.game-display-dialog), NOT a minigame: getState().activeMinigame stays null, so wait for the DOM.
  let up = false;
  for (let i = 0; i < 80; i++) { if (await page.evaluate(() => !!document.querySelector('.game-display-dialog .game-display-body'))) { up = true; break; } await sleep(100); }
  mark('panel-open', { up });
  // Reads as a document with the italic scene paragraph; drop it so only the monitor read-out shows (HR / SpO2 / BP / CENTRAL STATION: OFFLINE).
  mark('intro-dropped', await page.evaluate(() => { const b = document.querySelector('.game-display-dialog .game-display-body'); if (!b) return false; const em = b.querySelector('em'); if (!em) return false; let n = em.nextSibling; em.remove(); while (n && n.nodeName === 'BR') { const x = n.nextSibling; n.remove(); n = x; } return true; }));
  await sleep(200);
  const info = await page.evaluate(() => { const c = document.querySelector('.game-display-dialog'); const t = (c || document.body).innerText || ''; return { cls: c && c.className, text: t.replace(/\s+/g, ' ').slice(0, 260), canvases: document.querySelectorAll('canvas').length }; });
  mark('panel-info', info);
  mark('rects', { dialog: await rectOf(page, '.game-display-dialog'), body: await rectOf(page, '.game-display-body'), scroll: await page.evaluate(() => { const b = document.querySelector('.game-display-body'); return b && { sh: b.scrollHeight, ch: b.clientHeight }; }) });
  const t1 = Date.now();
  for (const t of [0.5, 1.5, 2.5, 3.0, 3.2, 3.4, 3.6, 3.8]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t1))); frame(mark, 't+' + t); await says.drain(); }
  const vis = await page.evaluate(() => { const nb = window.npcWorldBubbles; if (!nb) return null; let v = 0, n = 0; for (const bb of nb.bubbles.values()) { n++; if (bb.box && (bb.box.visible || bb.box.alpha > 0)) v++; } return { bubbles: n, visible: v, says: [...nb.says.keys()] }; });
  mark('bubble-visible-check', vis);
  await says.drain();
  mark('mute-summary', await muteSummary(page));
  mark('end');
};
