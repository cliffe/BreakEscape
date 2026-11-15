// Live browser proof for commit eb42245bc: a game with no scenario_brief gets NO "Mission Brief"
// note in the Notepad, and a game with a brief still gets one. It drives the REAL client path
// (introduceScenario in public/break_escape/js/utils/helpers.js) on a keyless server, over the real
// game routes, and reads the note out of window.gameState.notes (where window.addNote stores it),
// never the module in isolation. Every page error is a hard failure.
//
//   node tools/playtest/mission-brief-note-live-proof.mjs [--port 3610]
//
// The two games are created in memory through tools/playtest/brief-note-game.rb (no Mission row).
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE (or CHROMIUM) picks the browser; HEADED=1 shows it.
// The server must already be keyless and headless on the given port. Exit 0 if every check passed.

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const opts = { port: 3610 };
  const a = [...argv];
  while (a.length) {
    const [name, inline] = a.shift().split('=', 2);
    const take = () => (inline !== undefined ? inline : a.shift());
    if (name === '--port') opts.port = Number(take());
  }
  return opts;
}

const railsEnv = port => ({ ...process.env, RBENV_VERSION: '2.7.8', PLAYTEST_PORT: String(port), BREAK_ESCAPE_STANDALONE: 'true' });

function makeGames(host, port) {
  const out = execFileSync('bin/rails', ['runner', 'tools/playtest/brief-note-game.rb', host], { env: railsEnv(port), encoding: 'utf8' });
  const brief = out.match(/BRIEF_GAME_ID=(\d+)/);
  const none = out.match(/NO_BRIEF_GAME_ID=(\d+)/);
  if (!brief || !none) throw new Error(`brief-note-game.rb gave no ids:\n${out}`);
  return { briefId: Number(brief[1]), noBriefId: Number(none[1]) };
}

const pageErrors = [];

async function settle(page) {
  for (let i = 0; i < 30; i++) {
    const s = await page.evaluate(() => { const st = window.__test.getState(); return { mg: st.activeMinigame?.id || null, blk: st.player?.blocking || false }; });
    if (s.mg === 'title-screen') { await page.keyboard.press('Enter'); await page.waitForTimeout(400); continue; }
    if (s.mg) { await page.evaluate(() => window.__test.minigame.close().catch(() => {})); await page.waitForTimeout(400); continue; }
    const d = await page.evaluate(() => window.__test.dismissBlockingUi('No').catch(e => ({ ok: false, reason: String(e) })));
    if (d.nothingToDismiss && !s.blk) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

async function openPage(browser, baseUrl, gameId) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', e => { const s = String(e); pageErrors.push(`game ${gameId}: ${s}`); console.log('  PAGEERROR', s.slice(0, 160)); });
  await page.goto(`${baseUrl}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  await page.evaluate(() => { try { window.game?.physics?.world?.setFPS?.(20); } catch { /* ignore */ } });
  await settle(page);
  return page;
}

// Whether the Notepad holds a "Mission Brief" note, read from window.gameState.notes (where the
// real window.addNote stores it).
async function hasBriefNote(page) {
  return page.evaluate(() => (window.gameState?.notes || []).some(n => n && n.title === 'Mission Brief'));
}

async function briefField(baseUrl, gameId) {
  const r = await fetch(`${baseUrl}/break_escape/games/${gameId}/scenario`);
  if (!r.ok) throw new Error(`bootstrap GET failed: ${r.status}`);
  const j = await r.json();
  return Object.prototype.hasOwnProperty.call(j, 'scenario_brief');
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  const baseUrl = `http://127.0.0.1:${opts.port}`;
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM;
  const browser = await chromium.launch({ headless: !process.env.HEADED, executablePath: exe || undefined });

  const checks = [];
  const record = (name, pass, detail) => { checks.push({ name, pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); };

  const host = process.env.HOST_MISSION || 'ceo_exfil';
  const { briefId, noBriefId } = makeGames(host, opts.port);
  console.log(`GAME IDS: brief=${briefId} no_brief=${noBriefId}`);

  try {
    // Server path: the bootstrap ships scenario_brief for the brief game, not for the other.
    record('bootstrap ships scenario_brief only for the brief game',
      (await briefField(baseUrl, briefId)) === true && (await briefField(baseUrl, noBriefId)) === false);

    // Client path, brief game: the Mission Brief note is added, and survives a reload.
    const brief = await openPage(browser, baseUrl, briefId);
    record('brief game: a Mission Brief note is in the Notepad', (await hasBriefNote(brief)) === true);
    await brief.reload({ waitUntil: 'domcontentloaded' });
    await brief.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
    await brief.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await settle(brief);
    record('brief game: the Mission Brief note is still there after a reload', (await hasBriefNote(brief)) === true);
    await brief.close();

    // Client path, no-brief game: no empty Mission Brief note, after load and after a reload.
    const none = await openPage(browser, baseUrl, noBriefId);
    record('no-brief game: no Mission Brief note after load', (await hasBriefNote(none)) === false);
    await none.reload({ waitUntil: 'domcontentloaded' });
    await none.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
    await none.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await settle(none);
    record('no-brief game: still no Mission Brief note after a reload', (await hasBriefNote(none)) === false);
    await none.close();
  } finally {
    await browser.close();
  }

  record('no page errors on any booted page', pageErrors.length === 0,
    pageErrors.length ? pageErrors.join(' ; ').slice(0, 300) : 'pageErrors=0');

  const failed = checks.filter(c => !c.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(e => { console.error(e); process.exit(1); });
}
