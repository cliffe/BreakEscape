// D5 KO position on reload - live proof. Keyless server on PORT (default 3095).
// Usage: node ko-pos-proof.mjs <gameId>
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 3095), BASE = `http://127.0.0.1:${PORT}`;
const gameId = Number(process.argv[2]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { gameId, syncs: [], home: {}, cross: {} };

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
  for (let i = 0; i < 12; i++) {
    const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame?.id || null, bl: s.blockingUi || null }; });
    if (!st.mg && !st.bl) break;
    if (st.mg) { await page.evaluate(() => window.__test.minigame.close()).catch(() => {}); await sleep(600); continue; }
    if (st.bl) { await page.evaluate(l => window.__test.dismissBlockingUi(l), st.bl).catch(() => {}); await sleep(600); continue; }
  }
  await sleep(400);
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
  await page.goto(`${BASE}/break_escape/games/${gameId}`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  await sleep(600);
  return page;
}

const npcPos = (page, id) => page.evaluate(i => {
  const p = window.npcNeedsSystem?.world?.npcPos?.(i);
  return p ? { x: Math.round(p.x), y: Math.round(p.y), room: p.roomId } : null;
}, id);

async function flushNav(page) {
  // Real reload: go to about:blank first so pagehide flushes, then back.
  await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
  await sleep(600);
  await page.goto(`${BASE}/break_escape/games/${gameId}`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  await sleep(1000);
}

const browser = await chromium.launch();
try {
  let page = await open(browser);

  // --- HOME ROOM KO (amara is in the start room 'office') ---
  await page.evaluate(() => window.__test.enterRoom('office'));
  await sleep(600);
  const amaraBefore = await npcPos(page, 'amara');
  const koRes = await page.evaluate(() => window.__test.debugKO('amara'));
  await sleep(500);
  const amaraKO = await npcPos(page, 'amara');
  out.home.before = amaraBefore; out.home.koResult = koRes; out.home.koPos = amaraKO;
  // Wait for the debounced KO sync to carry the position
  for (let i = 0; i < 30 && !syncBodies.some(h => h.amara?.koRoom); i++) await sleep(500);
  out.home.koSyncSeen = syncBodies.filter(h => h.amara?.koRoom).map(h => h.amara);

  // --- CROSS ROOM KO: drive marek (home office) into the kitchen, KO him there ---
  await page.evaluate(() => window.__test.enterRoom('kitchen'));
  await sleep(400);
  await page.evaluate(() => {
    const s = window.__test?.needs || window.npcNeedsSystem;
    for (const n of ['caffeine', 'thirst', 'social', 'bladder', 'hunger']) { try { s.set('marek', n, 95); } catch { /* */ } }
  });
  let marekPos = null;
  for (let i = 0; i < 150; i++) {
    marekPos = await npcPos(page, 'marek');
    if (marekPos && marekPos.room && marekPos.room !== 'office') break;
    if (i % 8 === 7) await page.evaluate(() => {
      const s = window.__test?.needs || window.npcNeedsSystem;
      for (const n of ['caffeine', 'thirst', 'social']) { try { s.set('marek', n, 95); } catch { /* */ } }
    });
    await sleep(1000);
  }
  out.cross.marekWalkedTo = marekPos;
  if (marekPos && marekPos.room && marekPos.room !== 'office') {
    const crossKo = await page.evaluate(() => window.__test.debugKO('marek'));
    await sleep(500);
    out.cross.koResult = crossKo;
    out.cross.koPos = await npcPos(page, 'marek');
    for (let i = 0; i < 30 && !syncBodies.some(h => h.marek?.koRoom); i++) await sleep(500);
    out.cross.koSyncSeen = syncBodies.filter(h => h.marek?.koRoom).map(h => h.marek);
  }

  // Let a couple more syncs run so we can prove the position is not re-sent
  const syncCountAtReload = syncBodies.length;
  await sleep(6000);
  out.syncsAfterKoBeforeReload = syncBodies.slice(syncCountAtReload).map(h => ({
    amara: h.amara ? Object.keys(h.amara) : undefined,
    marek: h.marek ? Object.keys(h.marek) : undefined
  }));

  // --- RELOAD ---
  await flushNav(page);

  // Home: amara back in office at the same spot, KO
  await page.evaluate(() => window.__test.enterRoom('office'));
  await sleep(800);
  out.home.afterReload = await npcPos(page, 'amara');
  out.home.afterReloadKO = await page.evaluate(() => !!window.npcHostileSystem?.isNPCKO?.('amara'));

  // Cross: marek back in kitchen at the spot, KO, and not in office
  await page.evaluate(() => window.__test.enterRoom('kitchen'));
  await sleep(800);
  out.cross.afterReload = await npcPos(page, 'marek');
  out.cross.afterReloadKO = await page.evaluate(() => !!window.npcHostileSystem?.isNPCKO?.('marek'));
  await page.evaluate(() => window.__test.enterRoom('office'));
  await sleep(600);
  out.cross.marekInOfficeAfterReload = await page.evaluate(() => {
    const room = window.roomManager?.getRoom?.('office') || null;
    const npcs = window.npcManager?.getAllNPCs?.() || [];
    const m = npcs.find(n => (n.id || n.npcId) === 'marek');
    const p = window.npcNeedsSystem?.world?.npcPos?.('marek');
    return { pos: p ? { x: Math.round(p.x), y: Math.round(p.y), room: p.roomId } : null };
  });

  await page.goto('about:blank');
} catch (e) {
  out.error = String(e).slice(0, 400);
} finally {
  await browser.close();
}
console.log(JSON.stringify(out, null, 2));
