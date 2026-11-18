// Live check: player_state "notes" must not grow across reloads (on_resume Mission Brief).
//   node tools/playtest/brief-note-reload-growth.mjs --port 3097 --games 7623,7624 [--reloads 3]
// Reads the saved notes size with tools/playtest/player-state-size.rb (read-only) and the
// client notes from window.gameState.notes. Exit 0 when the Mission Brief note count stays at 1
// and the saved notes size is flat after the first load.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

const a = process.argv.slice(2);
const arg = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; };
const port = Number(arg('--port', 3097));
const games = arg('--games', '').split(',').filter(Boolean).map(Number);
const reloads = Number(arg('--reloads', 3));
const env = { ...process.env, RBENV_VERSION: '2.7.8', BREAK_ESCAPE_STANDALONE: 'true' };
const notesBytes = id => JSON.parse(execFileSync('bin/rails', ['runner', 'tools/playtest/player-state-size.rb', String(id)], { env, encoding: 'utf8' }).trim().split('\n').pop()).keys.notes || 0;

async function settle(page) {
  for (let i = 0; i < 30; i++) {
    const s = await page.evaluate(() => { const st = window.__test.getState(); return { mg: st.activeMinigame?.id || null, blk: st.player?.blocking || false }; });
    if (s.mg === 'title-screen') { await page.keyboard.press('Enter'); await page.waitForTimeout(400); continue; }
    if (s.mg) { await page.evaluate(() => window.__test.minigame.close().catch(() => {})); await page.waitForTimeout(400); continue; }
    const d = await page.evaluate(() => window.__test.dismissBlockingUi('No').catch(e => ({ ok: false })));
    if (d.nothingToDismiss && !s.blk) return true;
    await page.waitForTimeout(400);
  }
  return false;
}
async function ready(page) {
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  await page.evaluate(() => { try { window.game?.physics?.world?.setFPS?.(20); } catch {} });
  await settle(page);
  await page.waitForTimeout(Number(arg('--wait', 6000))); // let state sync flush
}
const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM;
const browser = await chromium.launch({ headless: true, executablePath: exe || undefined });
let bad = 0;
for (const id of games) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/break_escape/games/${id}`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  const rows = [];
  for (let r = 0; r <= reloads; r++) {
    if (r > 0) { await page.reload({ waitUntil: 'domcontentloaded' }); await ready(page); }
    const c = await page.evaluate(() => ({ brief: (window.gameState?.notes || []).filter(n => n.title === 'Mission Brief').length, total: (window.gameState?.notes || []).length, mode: window.gameScenario?.show_scenario_brief }));
    rows.push({ load: r, ...c, bytes: notesBytes(id) });
    console.log(`game ${id} load ${r}: client brief notes ${c.brief}/${c.total} mode ${c.mode} server notes ${rows.at(-1).bytes} bytes`);
  }
  const flat = rows.slice(1).every(x => x.bytes === rows[1].bytes) && rows.every(x => x.brief <= 1);
  console.log(`${flat ? 'PASS' : 'FAIL'} game ${id} notes flat after first load; pageErrors=${errs.length}`);
  if (!flat) bad++;
  await page.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
