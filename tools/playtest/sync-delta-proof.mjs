// Live proof for the player-state sync-delta work (SYNC_DELTAS_PLAN.md 10.3).
//
// Drives the real page through the window.__test bridge on a keyless server and
// records every request to /break_escape/games/:id/* : method, path, request
// body bytes (from request.postDataBuffer()), and response body bytes where the
// page can still read them. It writes a JSON file and prints a Markdown table so
// the build log can show before (base commit) and after (branch) for each route.
//
// The tool only drives the page and reads requests, so it runs unchanged against
// any server: the base-commit server for the baseline and the branch server for
// the after run (plan section 9, item 9).
//
//   node tools/playtest/sync-delta-proof.mjs --url <gameUrl> --case <A|B|bootstrap> \
//     [--out <file.json>] [--label before|after] [--idle 40000] [--reloads 2]
//
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE (or CHROMIUM) picks the browser;
// HEADED=1 shows it. The server must be keyless and headless, setFPS(20), fixed
// steps on (the tool sets the physics step itself after the bridge is ready).
//
// Cases (plan 10.3):
//   bootstrap  open the game, record the GET /scenario bootstrap size, no play.
//   A          first sync after load: play until state exists, reload, force a
//              sync, record the first PUT /sync_state body after each load.
//   B          network answers: open with a full cloner seeded by new-game.rb
//              --seed-full-cloner, drive plant/unplug/join/implant, record each
//              answer size and check for saved_cards in the body.
// Cases C to F (cloner, captures, Len's PIN, old save, old tab) run with the
// full live proof after step 6; see the build log.

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ----- pure helpers (unit-tested in test/js/sync-delta-proof.test.mjs) -----

// The route label is the path after /break_escape/games/<id>/, or 'page' for the
// bare game page (the HTML bootstrap document). Returns null for anything that is
// not a game route, so the recorder ignores assets and other hosts.
export function routeLabel(urlOrPath) {
  let path = urlOrPath;
  try {
    path = new URL(urlOrPath).pathname;
  } catch {
    // already a path
  }
  const m = path.match(/\/break_escape\/games\/(\d+)(?:\/(.*))?$/);
  if (!m) return null;
  const tail = m[2];
  if (!tail || tail === '') return 'page';
  // Keep the first two segments so network/plant stays distinct from network/join.
  return tail.split('?')[0].split('/').slice(0, 2).join('/');
}

// The numeric game id in a game URL or path, or null.
export function gameIdOf(urlOrPath) {
  let path = urlOrPath;
  try {
    path = new URL(urlOrPath).pathname;
  } catch {
    // already a path
  }
  const m = path.match(/\/break_escape\/games\/(\d+)/);
  return m ? Number(m[1]) : null;
}

// Collapse a list of records into one row per (method, route, phase), with the
// count, the total and the largest request and response body in bytes. Records
// are { method, route, phase, reqBytes, respBytes }.
export function summarise(records) {
  const rows = new Map();
  for (const r of records) {
    const key = `${r.phase}\u0000${r.method}\u0000${r.route}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        phase: r.phase, method: r.method, route: r.route,
        count: 0, reqBytesTotal: 0, respBytesTotal: 0, maxReqBytes: 0, maxRespBytes: 0
      };
      rows.set(key, row);
    }
    row.count += 1;
    row.reqBytesTotal += r.reqBytes || 0;
    row.respBytesTotal += r.respBytes || 0;
    row.maxReqBytes = Math.max(row.maxReqBytes, r.reqBytes || 0);
    row.maxRespBytes = Math.max(row.maxRespBytes, r.respBytes || 0);
  }
  return [...rows.values()].sort((a, b) =>
    a.phase.localeCompare(b.phase) || a.route.localeCompare(b.route) || a.method.localeCompare(b.method));
}

// A GitHub-flavoured Markdown table of the summary rows.
export function renderTable(rows, { label = '' } = {}) {
  const head = label ? `### ${label}\n\n` : '';
  const lines = [
    '| Phase | Method | Route | Count | Req total | Resp total | Max req | Max resp |',
    '|---|---|---|---:|---:|---:|---:|---:|'
  ];
  for (const r of rows) {
    lines.push(`| ${r.phase} | ${r.method} | ${r.route} | ${r.count} | ${r.reqBytesTotal} | ${r.respBytesTotal} | ${r.maxReqBytes} | ${r.maxRespBytes} |`);
  }
  return head + lines.join('\n') + '\n';
}

// Does a parsed body hold a saved_cards list anywhere (an inventory echo leaking
// the cloner's list, plan P1/P2)? Walks objects and arrays.
export function hasSavedCards(value) {
  if (Array.isArray(value)) return value.some(hasSavedCards);
  if (value && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'saved_cards')) return true;
    return Object.values(value).some(hasSavedCards);
  }
  return false;
}

// Parse argv into { url, case, out, label, idle, reloads }. Supports --opt value
// and --opt=value, as new-game.rb does.
export function parseArgs(argv) {
  const opts = { case: 'bootstrap', label: '', idle: 40000, reloads: 2 };
  const a = [...argv];
  while (a.length) {
    const tok = a.shift();
    const [name, inline] = tok.split('=', 2);
    const take = () => (inline !== undefined ? inline : a.shift());
    switch (name) {
      case '--url': opts.url = take(); break;
      case '--case': opts.case = take(); break;
      case '--out': opts.out = take(); break;
      case '--label': opts.label = take(); break;
      case '--idle': opts.idle = Number(take()); break;
      case '--reloads': opts.reloads = Number(take()); break;
      case '--help': case '-h': opts.help = true; break;
      default: break;
    }
  }
  return opts;
}

// ----- browser driving (not unit-tested; exercised by the live run) -----

const HELP = `sync-delta-proof.mjs - live request/response sizes for the sync-delta work
  --url <gameUrl>     the game page on a keyless server (required)
  --case <name>       bootstrap | A | B   (default bootstrap)
  --out <file.json>   write the full record and summary as JSON
  --label <text>      a label for the printed table (e.g. "base 6a834437c, case A")
  --idle <ms>         idle window after each load for case A (default 40000)
  --reloads <n>       reloads for case A (default 2)
See docs/achitechture/SYNC_DELTAS_PLAN.md 10.3 and the build log.`;

async function clearOverlays(page, rounds = 120) {
  for (let i = 0; i < rounds; i++) {
    const mg = await page.evaluate(() => window.__test.getState().activeMinigame);
    if (mg) {
      const d = await page.evaluate(() => window.__test.minigame.getState()?.dialogue);
      if (d) {
        await page.evaluate(() => {
          const s = window.__test.minigame.getState().dialogue;
          return s.awaitingChoice ? window.__test.minigame.choose(1) : window.__test.minigame.continue();
        });
        await page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 8000 })).catch(() => {});
      } else {
        await page.evaluate(() => window.__test.minigame.close());
        await page.waitForTimeout(500);
      }
      continue;
    }
    const bl = await page.evaluate(() => window.__test.getState().blockingUi);
    if (bl) {
      const pick = bl.buttons.map(x => x.label).find(l => /^resume$|no,|figure it out|continue|start/i.test(l)) || bl.buttons[0].label;
      await page.evaluate(l => window.__test.dismissBlockingUi(l), pick);
      await page.waitForTimeout(700);
      continue;
    }
    return i;
  }
  return rounds;
}

async function openPage(page, url) {
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'skip_resume=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 240000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  // setFPS(20), fixed steps ON (never fixedStep=false, which tunnels wall boxes).
  await page.evaluate(() => {
    try {
      const g = window.game?.sys?.game;
      if (g) { g.loop.smoothStep = false; g.loop.minFps = 1; }
      window.game?.physics?.world?.setFPS?.(20);
    } catch { /* ignore */ }
  });
  await page.waitForTimeout(2500);
}

// Drive a short conversation and set a few globals so there is real state to sync.
async function buildSomeState(page) {
  const npc = await page.evaluate(() => window.__test.getState().nearby.find(e => e.kind === 'npc') || null);
  if (npc) {
    await page.evaluate(id => window.__test.interact(id), npc.id).catch(() => {});
    await page.evaluate(() => window.__test.waitForMinigame(null, { timeoutMs: 12000 })).catch(() => {});
    await clearOverlays(page, 40);
  }
  await page.evaluate(() => { window.gameState.globalVariables.sync_proof_marker = 'present'; });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.stateSync?.sync?.()).catch(() => {});
  await page.waitForTimeout(1500);
}

function attachRecorder(page, records, getPhase) {
  const pending = new Map();
  page.on('request', req => {
    const route = routeLabel(req.url());
    if (route === null) return;
    let reqBytes = 0;
    try { reqBytes = req.postDataBuffer()?.length ?? 0; } catch { reqBytes = 0; }
    let body = null;
    try { body = req.postData() ? JSON.parse(req.postData()) : null; } catch { body = null; }
    const rec = { phase: getPhase(), method: req.method(), route, url: req.url(), reqBytes, respBytes: null, status: null, savedCardsInReq: body ? hasSavedCards(body) : false, t: Date.now() };
    records.push(rec);
    pending.set(req, rec);
  });
  page.on('requestfailed', req => {
    const rec = pending.get(req);
    if (rec) rec.status = 'failed';
  });
  page.on('response', async resp => {
    const req = resp.request();
    const rec = pending.get(req);
    if (!rec) return;
    rec.status = resp.status();
    try {
      const buf = await resp.body();
      rec.respBytes = buf.length;
      try { rec.savedCardsInResp = hasSavedCards(JSON.parse(buf.toString('utf8'))); } catch { /* not json */ }
    } catch {
      rec.respBytes = null; // keepalive / navigated away: read from player_state and the server log instead
    }
  });
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.url) { console.log(HELP); process.exit(opts.help ? 0 : 1); }

  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM;
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1', ...(exe ? { executablePath: exe } : {}) });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 200)));

  let phase = 'load';
  const records = [];
  attachRecorder(page, records, () => phase);

  const result = { case: opts.case, label: opts.label, url: opts.url, gameId: gameIdOf(opts.url), notes: [] };

  if (opts.case === 'bootstrap') {
    phase = 'load';
    await openPage(page, opts.url);
    await page.waitForTimeout(1500);
  } else if (opts.case === 'A') {
    phase = 'load1';
    await openPage(page, opts.url);
    await buildSomeState(page);
    phase = 'reload1';
    await openPage(page, opts.url);
    await clearOverlays(page, 40);
    phase = 'postload1';
    // Force the first sync after the load and record its body.
    await page.evaluate(() => window.stateSync?.sync?.()).catch(() => {});
    await page.waitForTimeout(2000);
    const idle = Math.max(2000, opts.idle);
    const t0 = Date.now();
    while (Date.now() - t0 < idle) await page.waitForTimeout(2000);
    for (let n = 2; n <= opts.reloads; n++) {
      phase = `reload${n}`;
      await openPage(page, opts.url);
      await clearOverlays(page, 40);
      phase = `postload${n}`;
      await page.evaluate(() => window.stateSync?.sync?.()).catch(() => {});
      const t1 = Date.now();
      while (Date.now() - t1 < idle) await page.waitForTimeout(2000);
    }
  } else if (opts.case === 'B') {
    phase = 'load';
    await openPage(page, opts.url);
    await clearOverlays(page, 40);
    // Network driving (plant/unplug/join/implant) is scenario-specific UI; the
    // full case B drive lands with the post-step-6 live proof. Here we record
    // the bootstrap (which carries the seeded cloner's saved_cards on the base
    // commit) and whatever network requests the run makes.
    result.notes.push('case B: bootstrap recorded; full plant/unplug/join/implant drive runs after step 6');
    await page.waitForTimeout(1500);
  } else {
    result.notes.push(`unknown case ${opts.case}; recorded the load only`);
    await openPage(page, opts.url);
  }

  await page.waitForTimeout(500);
  await browser.close();

  result.records = records;
  result.summary = summarise(records);
  result.savedCardsLeak = records.filter(r => r.savedCardsInResp || r.savedCardsInReq).map(r => ({ phase: r.phase, route: r.route, inReq: !!r.savedCardsInReq, inResp: !!r.savedCardsInResp }));

  if (opts.out) {
    writeFileSync(opts.out, JSON.stringify(result, null, 2));
    console.log(`wrote ${opts.out}`);
  }
  console.log(renderTable(result.summary, { label: opts.label || `${opts.case} ${result.gameId ?? ''}` }));
  if (result.savedCardsLeak.length) console.log('saved_cards seen in:', JSON.stringify(result.savedCardsLeak));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(e => { console.error(e); process.exit(1); });
}
