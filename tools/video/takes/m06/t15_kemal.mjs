// t15_kemal (m06, keyless): Kemal Aydin, SIGHT version (the picks' fallback; the lockpick-in-view version is a TODO below). The player walks up the executive wing; on_sighted: "The FCA does not come up here." (3.74 s, target) > [The FCA. Routine supervisory visit.] (cover_strained set so it leads to cover_blown) > ... > [Then step aside, or I'll move you.] > narrator, then "Then come and move me." (2.45 s, #hostile, target). Stops after that line; menus are on screen only while the picks are made (edit cuts them out).
// Entry state (new-game): --imports=none --unlock executive_wing --start-room executive_wing --set briefing_played=true --set cover_strained=true   (found_architects_fund NOT set)   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh <avatar> t15_kemal "<flags above>" "--hide-hud --zoom-step 1"   (window.__test.throttleFps(20) is set here: he turns hostile)
// Marks: sighted, line-start:/line-end:, choices-shown, choice:*, fca-done, moveme-done, targets-done.
// TODO lockpick version: moveToNear door:executive_wing->satoshi_office, interact approach:false, pick with the kit in view, expect on_lockpick_seen "No." then cover_blown; not written (key-selection flow unverified here).
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { ttsPlaying, pickMenu } from './_conv.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await page.evaluate(() => window.__test && window.__test.throttleFps && window.__test.throttleFps(20)).catch(() => {}); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const t0 = Date.now(); let d = null;
  while (Date.now() - t0 < 60000) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(200); } // TODO: if no sight fires, walk him into view with keyLegs
  if (!d) throw new Error('Kemal never sighted the player');
  mark('sighted');
  const l1 = await vw.waitForLine(/FCA does not come up here/i, 20000); if (!l1) throw new Error('FCA line never voiced'); mark('fca-done', { durMs: l1.durMs });
  await pickMenu(bridge, /Routine supervisory visit/i, mark);
  await pickMenu(bridge, /step aside/i, mark, 60000);
  const l2 = await vw.waitForLine(/Then come and move me/i, 30000); if (!l2) throw new Error('move-me line never voiced'); mark('moveme-done', { durMs: l2.durMs });
  await sleep(900); await vw.stop(); mark('targets-done');
};
