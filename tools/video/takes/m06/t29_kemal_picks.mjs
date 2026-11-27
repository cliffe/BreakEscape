// t29_kemal_picks (m06, keyless, NOT YET RUN): Kemal Aydin, LOCKPICK-IN-VIEW version. The player walks a straight line up executive_wing to Satoshi's door (door:executive_wing->satoshi_office, key lock), starts picking with Kemal in sight. The engine stops the pick at once (lockpick-catch.js) and opens on_lockpick_seen: narrator "A hand the size of a shovel closes over yours before the second pin sets." > "No." (target) > cover_blown "The FCA does not carry picks." > ... > [Then step aside, or I'll move you.] > "Then come and move me." (target, #hostile). Stops after that line.
// Setup (off camera) turns his los.challengeOnSight off (else on_sighted opens first); the catch mapping stays. If the lockpick overlay opens instead (he was not looking), the take closes it and retries (up to 8 times, 2 s apart).
// Entry state (new-game): --imports=none --unlock executive_wing --start-room executive_wing --set briefing_played=true   (no cover_strained: "The FCA does not carry picks." plays; found_architects_fund unset)   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh frank_callahan t29_kemal_picks "<flags above>" "--hide-hud --zoom-step 1"   (throttleFps(20) is set in setup: he turns hostile)
// Marks: walk-start, leg:*, interact-door, unseen-pick-closed, conversation-open, line-start:/line-end:, no-done, picks-done, choices-shown, choice:*, moveme-done, targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { driveToMenu } from './_cres.mjs';
const DOOR = 'door:executive_wing->satoshi_office';
let stand = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { window.__test && window.__test.throttleFps && window.__test.throttleFps(20); const k = window.npcManager.getNPC('satoshi_minder'); if (k && k.los) k.los = { ...k.los, challengeOnSight: false }; }).catch(() => {});
  await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(600);
  stand = (await bridge.getState()).player;
  await bridge.moveTo(stand.x, stand.y + 110, { timeoutMs: 20000 }); await sleep(600);
  const p = (await bridge.getState()).player; if (Math.abs(p.x - stand.x) > 4) await keyLegs(bridge, [[p.x < stand.x ? 'right' : 'left', stand.x]], 145);
  await sleep(800); console.error('SETUP', JSON.stringify({ stand, player: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(1000); mark('walk-start', { player: (await bridge.getState()).player });
  await keyLegs(bridge, [['up', stand.y]], 145, mark); await sleep(500);
  let chat = false;
  for (let i = 0; i < 8 && !chat; i++) {
    mark('interact-door');
    await bridge.interact(DOOR, { timeoutMs: 20000, approach: false });
    for (let j = 0; j < 12 && !chat; j++) { await sleep(250); const s = await bridge.getState(); if (s.dialogue) chat = true; }
    if (!chat) { for (let k = 0; k < 3 && (await bridge.getState()).activeMinigame; k++) { await page.evaluate(() => window.MinigameFramework && window.MinigameFramework.endMinigame(false)); await sleep(400); } mark('unseen-pick-closed'); await sleep(2000); }
  }
  if (!chat) throw new Error('Kemal never caught the pick');
  mark('conversation-open');
  const l1 = await vw.waitForLine(/^No\.?$/i, 20000); if (!l1) throw new Error('"No." never voiced'); mark('no-done', { durMs: l1.durMs });
  await driveToMenu(page, bridge, /step aside/i, mark);
  const l2 = await vw.waitForLine(/Then come and move me/i, 30000); if (!l2) throw new Error('move-me line never voiced'); mark('moveme-done', { durMs: l2.durMs });
  await sleep(900); await vw.stop(); mark('targets-done');
};
