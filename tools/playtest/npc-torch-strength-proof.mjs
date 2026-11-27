// Live proof for behavior.torch.strength / length (systems/lighting.js). Keyless server on PORT
// (default 3024), a game made by tools/playtest/new-game.sh with
//   --set briefing_played=true --set clone_call_done=true --start-room executive_wing_hallway
//   node tools/playtest/npc-torch-strength-proof.mjs <gameId> <outPrefix> [strength] [length]
// With a strength/length argument it overrides Terry's torch in memory (to compare values);
// without, it uses whatever the scenario says. Shots are cropped round Terry, headless.
import { chromium } from 'playwright';
const PORT = Number(process.env.PORT || 3024), BASE = `http://127.0.0.1:${PORT}`;
const [id, prefix, strength, length] = process.argv.slice(2);
if (!id || !prefix) throw new Error('usage: <gameId> <outPrefix> [strength] [length]');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on('pageerror', e => console.log('pageerror', String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} });
await page.goto(`${BASE}/break_escape/games/${id}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
await page.evaluate(() => { window.__test.throttleFps?.(20); });
for (let i = 0; i < 20; i++) {
  const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame, bl: s.blockingUi }; });
  if (st.mg) { await page.evaluate(() => window.__test.minigame.close()); await sleep(600); continue; }
  if (st.bl) { const l = st.bl.buttons.map(x => x.label).find(x => /no,|figure it out|continue|ok|close|start/i.test(x)) || st.bl.buttons[0].label; await page.evaluate(x => window.__test.dismissBlockingUi(x), l); await sleep(800); continue; }
  break;
}
if (strength !== undefined || length !== undefined) {
  await page.evaluate(([s, l]) => {
    const t = window.npcManager.npcs.get('night_guard') || [...window.npcManager.npcs.values()].find(n => /terry/i.test(n.displayName || n.id));
    const cur = t.behavior.torch;
    t.behavior.torch = { ...(typeof cur === 'object' ? cur : {}) };
    if (s !== undefined && s !== '') t.behavior.torch.strength = Number(s);
    if (l !== undefined && l !== '') t.behavior.torch.length = Number(l);
  }, [strength, length]);
}
// Hide HUD, park the player out of the beam, then wait for Terry to face east (the longest beam)
await page.addStyleTag({ content: '#objectives-panel,.toast,#inventory-container,.hud,#notes-button,[id*="objective"]{display:none!important}' }).catch(() => {});
await page.evaluate(() => { window.player.setPosition(280, 150); });
const find = () => page.evaluate(() => {
  const t = [...window.npcManager.npcs.values()].find(n => n.behavior?.torch);
  const sp = t._sprite, g = sp.scene.game, r = g.canvas.getBoundingClientRect(), sc = r.width / g.scale.gameSize.width;
  const cam = sp.scene.cameras.main;
  return { id: t.id, room: window.currentPlayerRoom, torch: t.behavior.torch, x: Math.round(sp.x), y: Math.round(sp.y), player: [Math.round(window.player.x), Math.round(window.player.y)],
    dir: window.npcBehaviorManager.getBehavior(t.id)?.direction, angle: t._torchAim?.angle,
    sx: r.left + (sp.x - cam.worldView.x) * cam.zoom * sc, sy: r.top + (sp.y - cam.worldView.y) * cam.zoom * sc };
});
let info;
for (let i = 0; i < 120; i++) { info = await find(); const a = ((info.angle % 360) + 360) % 360; if (info.dir === 'right' && Math.min(a, 360 - a) < 8) break; await sleep(500); }
await sleep(800); info = await find();
console.log(JSON.stringify(info));
await page.screenshot({ path: `${prefix}-full.png` });
const sx = Math.round(info.sx), sy = Math.round(info.sy);
await page.screenshot({ path: `${prefix}-crop.png`, clip: { x: Math.max(0, sx - 120), y: Math.max(0, sy - 130), width: 480, height: 260 } });
console.log('shots', prefix);
await browser.close();
