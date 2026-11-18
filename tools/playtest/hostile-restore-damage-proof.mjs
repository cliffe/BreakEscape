// D5 KO position on reload - live proof. Keyless server on PORT (default 3095).
// Usage: node ko-pos-proof.mjs <gameId>   (OUT=<dir> for before/after crop PNGs)
// Run from inside the worktree so playwright resolves its node_modules.
import { chromium } from 'playwright';
import fs from 'node:fs';

const PORT = Number(process.env.PORT || 3095), BASE = `http://127.0.0.1:${PORT}`;
const gameId = Number(process.argv[2]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { gameId };
const OUT = process.env.OUT || '';
if (OUT) fs.mkdirSync(OUT, { recursive: true });

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

const npcPos = (page, id) => page.evaluate(i => {
  const p = window.npcNeedsSystem?.world?.npcPos?.(i);
  return p ? { x: Math.round(p.x), y: Math.round(p.y), room: p.roomId } : null;
}, id);


// Sprite anchor, body centre and the synced KO fields, read live.
const readNpc = (page, id) => page.evaluate(i => {
  const n = window.npcManager?.getNPC?.(i); const sp = n?._sprite || n?.sprite;
  const st = window.npcHostileSystem?.getState?.(i);
  const bc = sp?.body?.center;
  const r = v => (Number.isFinite(v) ? Math.round(v) : null);
  return { spriteX: r(sp?.x), spriteY: r(sp?.y), bodyX: r(bc?.x), bodyY: r(bc?.y),
    visible: sp ? !!sp.visible : null, koRoom: st?.koRoom ?? null, koX: st?.koX ?? null, koY: st?.koY ?? null,
    isKO: !!window.npcHostileSystem?.isNPCKO?.(i) };
}, id);

// 160x160 screenshot crop centred on the sprite as it is drawn (camera + zoom aware).
async function cropNpc(page, id, name) {
  if (!OUT) return null;
  // Hide HUD panels that overlap the canvas so the crop shows the room, not the activity log.
  await page.evaluate(() => {
    const cv = document.querySelector('canvas'); if (!cv) return;
    for (const el of document.body.querySelectorAll('*')) {
      if (el === cv || el.contains(cv) || cv.contains(el) || el.tagName === 'SCRIPT') continue;
      const cs = getComputedStyle(el);
      if ((cs.position === 'fixed' || cs.position === 'absolute') && cs.visibility !== 'hidden') el.style.visibility = 'hidden';
    }
  });
  const box = await page.evaluate(i => {
    const n = window.npcManager?.getNPC?.(i); const sp = n?._sprite || n?.sprite;
    const cam = sp?.scene?.cameras?.main || window.game?.scene?.scenes?.[0]?.cameras?.main;
    const cv = (window.game?.canvas || document.querySelector('canvas'))?.getBoundingClientRect?.();
    if (!sp || !cam || !cv) return null;
    const z = cam.zoom || 1, k = cv.width / cam.width;
    // world -> canvas pixel: about the camera's centre point (works whatever the zoom/bounds)
    const mx = cam.midPoint?.x ?? (cam.scrollX + cam.width / 2), my = cam.midPoint?.y ?? (cam.scrollY + cam.height / 2);
    return { x: cv.left + (cam.x + cam.width / 2 + (sp.x - mx) * z) * k, y: cv.top + (cam.y + cam.height / 2 + (sp.y - my) * z) * k };
  }, id);
  if (!box) return { error: 'no-box' };
  const vp = page.viewportSize(), S = 160;
  const clip = { x: Math.max(0, Math.min(vp.width - S, Math.round(box.x - S / 2))), y: Math.max(0, Math.min(vp.height - S, Math.round(box.y - S / 2))), width: S, height: S };
  const file = `${OUT}/g${gameId}-${name}.png`;
  await page.screenshot({ path: file, clip });
  return { file, clip };
}

// Move an NPC's sprite and body into a room (target = where its body centre should be) as
// if it had walked there, and freeze the needs update, the behaviour update and the body
// itself (moves = false) so nothing walks it back before the KO.
async function placeNpc(page, id, roomId, fx = 0.5, fy = 0.6) {
  return page.evaluate(([i, rid, ax, ay]) => {
    const n = window.npcManager?.getNPC?.(i); const sp = n?._sprite || n?.sprite;
    const room = window.rooms?.[rid];
    if (!sp?.body || !room?.position || !room?.map) return { ok: false, why: 'no sprite or room' };
    try { window.npcNeedsSystem.update = () => {}; } catch { /* */ }
    try { window.npcBehaviorManager.update = () => {}; } catch { /* */ }
    const tx = room.position.x + room.map.widthInPixels * ax, ty = room.position.y + room.map.heightInPixels * ay;
    const offX = sp.body.center.x - sp.x, offY = sp.body.center.y - sp.y;
    sp.body.moves = false;
    sp.setPosition(tx - offX, ty - offY);
    sp.body.reset(tx - offX, ty - offY);
    sp.body.setVelocity(0, 0);
    return { ok: true, target: { x: Math.round(tx), y: Math.round(ty) }, sprite: { x: sp.x, y: sp.y }, bc: { x: sp.body.center.x, y: sp.body.center.y } };
  }, [id, roomId, fx, fy]);
}

async function flushNav(page) {
  // Real reload: go to about:blank first so pagehide flushes, then back.
  await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
  await sleep(600);
  await page.goto(`${BASE}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  await sleep(1000);
}


const read = (page) => page.evaluate(() => {
  const h = window.npcHostileSystem, r = {};
  for (const id of ['security_guard', 'operative_relay', 'voltage']) {
    const st = h.getState(id);
    r[id] = { attackDamage: st.attackDamage, hostile: st.isHostile, ko: st.isKO, hp: st.currentHP, cfg: window.npcBehaviorManager.getBehavior(id)?.config?.hostile?.attackDamage };
  }
  return r;
});
const browser = await chromium.launch();
try {
  const page = await open(browser);
  out.beforeActions = await read(page);
  await page.evaluate(() => {
    const h = window.npcHostileSystem;
    h.setNPCHostile('operative_relay', true); h.setNPCHostile('voltage', true); h.setNPCHostile('voltage', false);
    h.setNPCHostile('security_guard', true);
    h.damageNPC('security_guard', 10000);
  });
  await sleep(1500);
  out.beforeReload = await read(page);
  out.exportBefore = await page.evaluate(() => window.npcHostileSystem.exportHostility());
  await sleep(4000);
  await flushNav(page);
  out.afterReload = await read(page);
  out.exportAfter = await page.evaluate(() => window.npcHostileSystem.exportHostility());
  console.log(JSON.stringify(out, null, 1));
} finally { await browser.close(); }
