// Hostile restore keeps configured combat stats - live proof. Keyless server on PORT (default 3095).
// Usage: node hostile-restore-damage-proof.mjs <gameId> <hostileNpcId> <calmNpcId> <koNpcId>
//   The three ids must be NPCs with a behaviour in the game's scenario. Each should have a
//   hostile.attackDamage set that differs from the engine default of 10, or the check proves
//   nothing. Exits 0 when every NPC's attackDamage matches its configured value after a reload,
//   1 on a mismatch or a missing NPC.
// WARNING: this turns NPCs hostile and KOs one through the page, which syncs into the game's
//   saved npcHostility. Run it only against a fresh throwaway game on a test scenario, never an
//   existing playtest or student game.
// Run from inside the worktree so playwright resolves its node_modules.
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 3095), BASE = `http://127.0.0.1:${PORT}`;
const gameId = Number(process.argv[2]);
const [, , , hostileId, calmId, koId] = process.argv;
if (!gameId || !hostileId || !calmId || !koId) {
  console.error('Usage: node hostile-restore-damage-proof.mjs <gameId> <hostileNpcId> <calmNpcId> <koNpcId>');
  process.exit(2);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { gameId };

// Capture every sync_state request body with npcHostility
const syncBodies = [];
function hook(page) {
  page.on('request', req => {
    if (!req.url().includes('sync_state')) return;
    let body = null; try { body = JSON.parse(req.postData() || '{}'); } catch { /* */ }
    if (body && body.npcHostility) syncBodies.push(body.npcHostility);
  });
}

async function clearUi(page) {
  // Title-screen minigame (Enter starts it), Mission Brief and resume prompts: close each
  // way until the bridge reports neither, twice in a row.
  let clean = 0;
  for (let i = 0; i < 30 && clean < 2; i++) {
    const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame?.id || null, blk: !!(s.blockingUi || s.player?.blocking) }; }).catch(() => ({ mg: 'x', blk: false }));
    if (!st.mg && !st.blk) { clean++; await sleep(300); continue; }
    clean = 0;
    if (st.mg === 'title-screen') await page.keyboard.press('Enter').catch(() => {});
    else if (st.mg) await page.evaluate(() => window.__test.minigame.close()).catch(() => {});
    else {
      // Never press Escape here: it opens the pause menu. Resume closes that if it is up.
      let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => null);
      if (!d || d.ok === false) d = await page.evaluate(() => window.__test.dismissBlockingUi()).catch(() => null);
      if (!d || d.ok === false) await page.evaluate(() => window.__test.dismissBlockingUi('No')).catch(() => {});
    }
    await sleep(600);
  }
  out.clearUiClean = clean >= 2;
  await sleep(300);
}

async function ready(page) {
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
  await clearUi(page);
}

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* */ } });
  hook(page);
  await page.goto(`${BASE}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  await sleep(600);
  return page;
}

async function flushNav(page) {
  // Real reload: go to about:blank first so pagehide flushes, then back.
  await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
  await sleep(600);
  await page.goto(`${BASE}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  await sleep(1000);
}


const ids = [hostileId, calmId, koId];
const read = (page) => page.evaluate((list) => {
  const h = window.npcHostileSystem, r = {};
  for (const id of list) {
    const cfg = window.npcBehaviorManager.getBehavior(id)?.config?.hostile?.attackDamage;
    if (cfg === undefined) { r[id] = { missing: true }; continue; }
    const st = h.getState(id);
    r[id] = { attackDamage: st.attackDamage, hostile: st.isHostile, ko: st.isKO, hp: st.currentHP, cfg };
  }
  return r;
}, ids);
const browser = await chromium.launch();
let failed = false;
try {
  const page = await open(browser);
  out.beforeActions = await read(page);
  const missing = ids.filter(id => out.beforeActions[id].missing);
  if (missing.length) {
    console.error(`No behaviour for: ${missing.join(', ')} (wrong game or scenario?)`);
    failed = true;
  } else {
    await page.evaluate(([hid, cid, kid]) => {
      const h = window.npcHostileSystem;
      h.setNPCHostile(hid, true); h.setNPCHostile(cid, true); h.setNPCHostile(cid, false);
      h.setNPCHostile(kid, true);
      h.damageNPC(kid, 10000);
    }, ids);
    await sleep(1500);
    out.beforeReload = await read(page);
    out.exportBefore = await page.evaluate(() => window.npcHostileSystem.exportHostility());
    await sleep(4000);
    await flushNav(page);
    out.afterReload = await read(page);
    out.exportAfter = await page.evaluate(() => window.npcHostileSystem.exportHostility());
    for (const id of ids) {
      const a = out.afterReload[id];
      if (a.missing || a.attackDamage !== a.cfg) {
        console.error(`FAIL ${id}: attackDamage ${a.attackDamage} after reload, configured ${a.cfg}`);
        failed = true;
      }
    }
    if (JSON.stringify(out.exportBefore) !== JSON.stringify(out.exportAfter)) {
      console.error('FAIL: exported hostility changed across the reload');
      failed = true;
    }
  }
  console.log(JSON.stringify(out, null, 1));
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS');
} finally { await browser.close(); }
process.exit(failed ? 1 : 0);
