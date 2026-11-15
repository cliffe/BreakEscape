// Live browser proof for scenario-format hardening step 3: the secret-leak withholding, the
// bootstrap strip, and the combination/cryptex comparator on the real POST /unlock route.
// (docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md, "Item 6 handover".)
//
// It drives the REAL client and server paths on a keyless server:
//   - test_secret_leaks (swapped onto a host mission, no Mission row): each of three secrets
//     (Mara's combination capture secret 12-30-5, Rhea's account password WOLF = the cryptex
//     answer, Tess's door-entry capture secret 4821) is ABSENT from every fresh server payload
//     (GET /scenario answer fields, GET /room for each room, GET /capture_secrets) before its
//     dropped-USB proof, and PRESENT from GET /capture_secrets after the real client drops
//     evidence_usb (the proof). The capture is earned through the game's own capture client
//     (window.submitSECapture), the drop through the real inventory "Drop here" action, and the
//     assertions read FRESH server responses, never the page's view. Each lock is then opened with
//     the earned secret through the real POST /unlock route (a legitimate player is never refused).
//   - the bootstrap GET /scenario carries no acknowledgedClues and no structured door/combination/
//     cryptex answer (no `requires` on any door or object, no locked contents), on test_secret_leaks
//     and on m06_follow_the_money (which has an acknowledgedClues marker with reason prose), after
//     load and after reload. window.gameScenario.acknowledgedClues is undefined.
//       Note: a scenario's authored narrative (scenario_brief / scenario_name / endGoal) is flavour
//       text the author chose to ship; test_secret_leaks' brief documents its own codes, so the raw
//       secret scan excludes those narrative fields and asserts the structured answer FIELDS instead.
//   - the comparator on test_unlock_gaps (read only): combination and cryptex locks refuse a wrong /
//     blank / malformed answer and open with the right one; a different-case cryptex answer opens
//     (casecmp?); a lock given only wrong answers stays shut across a reload.
//   - the runtime door-entry strip (R2): a scenario with a bare PIN door entry and an rfid door
//     entry (door-strip-game.rb, in-memory, no Mission row). GET /room/office strips the PIN
//     entry's `requires` (the PIN is absent from the whole room payload) and keeps the rfid card
//     id; the vault still opens with the right PIN on POST /unlock (a legitimate player is never
//     refused).
//   - no-regression on two shipped missions through POST /unlock: m01's PIN safe (derek_storage_safe,
//     1337) and lab_physical_pentest's shoulder-surf safe (p4_safe, 7041) each refuse a wrong PIN
//     and open with the right one.
//
// Games are created only through the app's normal routes (swap-scenario-game.rb, new-game.rb).
//
//   node tools/playtest/secret-leak-withholding-live-proof.mjs [--port 3678]
//
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE (or CHROMIUM) picks the browser; HEADED=1 shows it.
// The server must already be keyless and headless on the given port; this tool does not start or
// stop it. Exit 0 if every case passed, 1 otherwise.

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const opts = { port: 3678 };
  const a = [...argv];
  while (a.length) {
    const [name, inline] = a.shift().split('=', 2);
    const take = () => (inline !== undefined ? inline : a.shift());
    if (name === '--port') opts.port = Number(take());
  }
  return opts;
}

const railsEnv = port => ({ ...process.env, RBENV_VERSION: '2.7.8', PLAYTEST_PORT: String(port), BREAK_ESCAPE_STANDALONE: 'true' });

function newSwapGame(host, scenarioDir, port) {
  const out = execFileSync('bin/rails', ['runner', 'tools/playtest/swap-scenario-game.rb', host, scenarioDir], { env: railsEnv(port), encoding: 'utf8' });
  const m = out.match(/GAME_ID=(\d+)/);
  if (!m) throw new Error(`swap-scenario-game.rb gave no GAME_ID:\n${out}`);
  return Number(m[1]);
}

function newGame(mission, port) {
  const out = execFileSync('bin/rails', ['runner', 'tools/playtest/new-game.rb', mission], { env: railsEnv(port), encoding: 'utf8' });
  const m = out.match(/GAME_ID=(\d+)/);
  if (!m) throw new Error(`new-game.rb gave no GAME_ID for ${mission}:\n${out}`);
  return Number(m[1]);
}

// A game whose stored scenario carries a bare PIN door entry (the validator would reject it), so
// the runtime door-entry strip can be shown on the real GET /room payload. No Mission row.
function newDoorStripGame(host, port) {
  const out = execFileSync('bin/rails', ['runner', 'tools/playtest/door-strip-game.rb', host], { env: railsEnv(port), encoding: 'utf8' });
  const m = out.match(/GAME_ID=(\d+)/);
  if (!m) throw new Error(`door-strip-game.rb gave no GAME_ID:\n${out}`);
  return Number(m[1]);
}

async function roomJson(baseUrl, gameId, roomId) {
  const r = await fetch(`${baseUrl}/break_escape/games/${gameId}/room/${roomId}`);
  if (!r.ok) throw new Error(`room GET failed: ${r.status}`);
  return r.json();
}

// Dismiss the startup overlays the way a player does: the title screen (Enter), the Mission Brief
// notes popup (its close), and the first-run tutorial prompt ("No, I'll figure it out").
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
  page.on('pageerror', e => console.log('  PAGEERROR', String(e).slice(0, 160)));
  await page.goto(`${baseUrl}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  await page.evaluate(() => { try { window.game?.physics?.world?.setFPS?.(20); } catch { /* ignore */ } });
  await settle(page);
  return page;
}

async function bootstrap(baseUrl, gameId) {
  const r = await fetch(`${baseUrl}/break_escape/games/${gameId}/scenario`);
  if (!r.ok) throw new Error(`bootstrap GET failed: ${r.status}`);
  return r.json();
}
async function captureSecrets(baseUrl, gameId) {
  const r = await fetch(`${baseUrl}/break_escape/games/${gameId}/capture_secrets`);
  if (!r.ok) throw new Error(`capture_secrets GET failed: ${r.status}`);
  return r.json();
}
async function roomText(baseUrl, gameId, roomId) {
  const r = await fetch(`${baseUrl}/break_escape/games/${gameId}/room/${roomId}`);
  return r.ok ? r.text() : `__room_${roomId}_status_${r.status}__`;
}

async function waitFor(pred, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await pred()) return true; await new Promise(r => setTimeout(r, 100)); }
  return false;
}

const present = (text, secret) => String(text).toLowerCase().includes(secret.toLowerCase());

// The bootstrap with authored narrative fields removed, as a raw string, for the secret scan.
function bootWithoutNarrative(boot) {
  const copy = { ...boot };
  for (const k of ['scenario_brief', 'scenario_name', 'endGoal', 'scenario_id']) delete copy[k];
  return JSON.stringify(copy);
}
// Any `requires` answer still present on a door or object anywhere in the bootstrap rooms?
function bootHasRequires(boot) {
  let found = false;
  const walk = node => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node && typeof node === 'object') {
      if ('requires' in node) found = true;
      Object.values(node).forEach(walk);
    }
  };
  walk(boot.rooms || {});
  return found;
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  const baseUrl = `http://127.0.0.1:${opts.port}`;
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM;
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1', ...(exe ? { executablePath: exe } : {}) });

  const checks = [];
  const record = (name, pass, detail) => { checks.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${detail || ''}`); };
  const ids = {};

  try {
    // ================================================================ test_secret_leaks
    const slId = newSwapGame('test_seating', 'test_secret_leaks', opts.port);
    ids.test_secret_leaks = slId;
    const page = await openPage(browser, baseUrl, slId);

    const SECRETS = { mara: '12-30-5', dropzone: '4821', 'rhea(account)': 'WOLF' };

    // Bootstrap: no acknowledgedClues, no structured answer fields, window.acknowledgedClues undefined.
    const boot0 = await bootstrap(baseUrl, slId);
    const hasCluesKey = 'acknowledgedClues' in boot0;
    const hasRequires = bootHasRequires(boot0);
    const clues0 = await page.evaluate(() => (typeof window.gameScenario?.acknowledgedClues === 'undefined') ? 'undefined' : JSON.stringify(window.gameScenario.acknowledgedClues));
    record('sl bootstrap: no acknowledgedClues key, no requires answers, window undefined',
      !hasCluesKey && !hasRequires && clues0 === 'undefined',
      `acknowledgedClues-key=${hasCluesKey} requires-present=${hasRequires} window=${clues0}`);

    // No raw secret in the bootstrap's non-narrative fields, nor in either room, nor in capture_secrets.
    const bootScan = bootWithoutNarrative(boot0);
    const office0 = await roomText(baseUrl, slId, 'office');
    const vault0 = await roomText(baseUrl, slId, 'vault');
    const cs0 = JSON.stringify(await captureSecrets(baseUrl, slId));
    for (const [k, secret] of Object.entries(SECRETS)) {
      const where = { bootstrap: present(bootScan, secret), office: present(office0, secret), vault: present(vault0, secret), capture_secrets: present(cs0, secret) };
      const anywhere = Object.values(where).some(Boolean);
      record(`sl before-proof: ${k} secret absent from every payload`, !anywhere, `${secret} -> ${JSON.stringify(where)}`);
    }

    // Earn the three captures through the game's own capture client (real client write + sync).
    await page.evaluate(() => window.submitSECapture({ targetId: 'mara', kind: 'credential' }));
    await page.evaluate(() => window.submitSECapture({ targetId: 'rhea', kind: 'credential', address: 'r.mills' }));
    await page.evaluate(() => window.submitSECapture({ targetId: 'dropzone', kind: 'credential' }));
    await page.evaluate(() => window.stateSync?.flush?.({ reason: 'test' }));
    const earned = await waitFor(async () => { const b = await bootstrap(baseUrl, slId); const rec = b.captures || {}; return rec.mara && rec.rhea && rec.dropzone; });
    record('sl captures earned (server recorded mara/rhea/dropzone)', earned, `earned=${earned}`);

    // Earned but proof NOT held: capture_secrets must still withhold all three.
    const csMid = JSON.stringify(await captureSecrets(baseUrl, slId));
    for (const [k, secret] of Object.entries(SECRETS)) {
      record(`sl earned, proof unheld: ${k} still withheld`, !present(csMid, secret), `capture_secrets=${csMid}`);
    }

    // Drop evidence_usb through the real inventory action (the proof), retrying past any overlay.
    let dropOk = false;
    for (let i = 0; i < 8 && !dropOk; i++) {
      const act = await page.evaluate(() => window.__test.inventoryAct('evidence_usb', 'Drop here').catch(e => ({ ok: false, reason: String(e) })));
      dropOk = !!act.ok;
      if (!dropOk) await settle(page);
    }
    await page.evaluate(() => window.stateSync?.flush?.({ reason: 'test' }));
    const served = await waitFor(async () => { const cs = await captureSecrets(baseUrl, slId); return cs.secrets?.mara === '12-30-5'; });
    record('sl drop evidence_usb (the proof holds, secret now served)', dropOk && served, `dropOk=${dropOk} served-after-drop=${served}`);

    // After the proof: each secret served from /capture_secrets (the right route).
    const csAfter = await captureSecrets(baseUrl, slId);
    record('sl after-proof: Mara 12-30-5 served from /capture_secrets', csAfter.secrets?.mara === '12-30-5', JSON.stringify(csAfter.secrets));
    record('sl after-proof: Tess 4821 served from /capture_secrets (dropzone)', csAfter.secrets?.dropzone === '4821', JSON.stringify(csAfter.secrets));
    record('sl after-proof: Rhea WOLF served from /capture_secrets (account)', csAfter.secrets?.rhea === 'WOLF', JSON.stringify(csAfter.secrets));

    // Legitimate player opens each lock with the earned secret (real POST /unlock), never refused.
    const strongbox = await page.evaluate(() => window.ApiClient.unlock('object', 'strongbox', '12-30-5', 'combination'));
    record('sl legit unlock: strongbox combination 12-30-5 opens', strongbox?.success === true, JSON.stringify(strongbox).slice(0, 120));
    const cryptex = await page.evaluate(() => window.ApiClient.unlock('object', 'cryptex_cabinet', 'WOLF', 'cryptex'));
    record('sl legit unlock: cryptex WOLF opens (casecmp over requires wolf)', cryptex?.success === true, JSON.stringify(cryptex).slice(0, 120));
    const vaultDoor = await page.evaluate(() => window.ApiClient.unlock('door', 'vault', '4821', 'pin'));
    record('sl legit unlock: vault PIN door 4821 opens', vaultDoor?.success === true, JSON.stringify(vaultDoor).slice(0, 120));

    // Reload: bootstrap still clean; secrets still served (persisted).
    const page2 = await openPage(browser, baseUrl, slId);
    const boot1 = await bootstrap(baseUrl, slId);
    const clues1 = await page2.evaluate(() => (typeof window.gameScenario?.acknowledgedClues === 'undefined') ? 'undefined' : 'present');
    record('sl reload: bootstrap still clean (no clues key/requires, window undefined)',
      !('acknowledgedClues' in boot1) && !bootHasRequires(boot1) && clues1 === 'undefined',
      `clues-key=${'acknowledgedClues' in boot1} requires=${bootHasRequires(boot1)} window=${clues1}`);
    const csReload = await captureSecrets(baseUrl, slId);
    record('sl reload: secrets still served', csReload.secrets?.mara === '12-30-5' && csReload.secrets?.dropzone === '4821' && csReload.secrets?.rhea === 'WOLF', JSON.stringify(csReload.secrets));
    await page2.close();
    await page.close();

    // ================================================================ m06 acknowledgedClues strip
    const m06Id = newGame('m06_follow_the_money', opts.port);
    ids.m06_follow_the_money = m06Id;
    const m06 = await openPage(browser, baseUrl, m06Id);
    const m06boot = await bootstrap(baseUrl, m06Id);
    const m06reason = 'Tracing the three suspense withdrawals'; // the marker's reason prose
    const reasonShipped = present(JSON.stringify(m06boot), m06reason);
    const m06clues = await m06.evaluate(() => (typeof window.gameScenario?.acknowledgedClues === 'undefined') ? 'undefined' : 'present');
    record('m06 bootstrap: no acknowledgedClues key or reason prose, window undefined',
      !('acknowledgedClues' in m06boot) && !reasonShipped && m06clues === 'undefined',
      `clues-key=${'acknowledgedClues' in m06boot} reason-prose-shipped=${reasonShipped} window=${m06clues}`);
    const m06b = await openPage(browser, baseUrl, m06Id);
    const m06clues2 = await m06b.evaluate(() => (typeof window.gameScenario?.acknowledgedClues === 'undefined') ? 'undefined' : 'present');
    const m06boot2 = await bootstrap(baseUrl, m06Id);
    record('m06 reload: acknowledgedClues still undefined, reason prose still absent',
      m06clues2 === 'undefined' && !present(JSON.stringify(m06boot2), m06reason), `window=${m06clues2}`);
    await m06b.close();
    await m06.close();

    // ================================================================ comparator on test_unlock_gaps
    const tugId = newSwapGame('test_seating', 'test_unlock_gaps', opts.port);
    ids.test_unlock_gaps = tugId;
    const tug = await openPage(browser, baseUrl, tugId);
    const U = (tt, id, att, m) => tug.evaluate(([tt, id, att, m]) => window.ApiClient.unlock(tt, id, att, m).then(r => r).catch(e => ({ success: false, err: e.message })), [tt, id, att, m]);

    // Combination locker (test_combo_locker, 12-30-5): refusals first, then the right answer opens.
    const lkWrong = await U('object', 'test_combo_locker', '12-30-6', 'combination');
    const lkBlank = await U('object', 'test_combo_locker', '', 'combination');
    const lkBad = await U('object', 'test_combo_locker', 'not-a-combo', 'combination');
    const lkRight = await U('object', 'test_combo_locker', '12-30-5', 'combination');
    record('tug combination: wrong/blank/malformed refused, right opens',
      !lkWrong?.success && !lkBlank?.success && !lkBad?.success && lkRight?.success === true,
      `wrong=${lkWrong?.success} blank=${lkBlank?.success} bad=${lkBad?.success} right=${lkRight?.success}`);

    // Cryptex box (test_cryptex_box, CIPHER): wrong refused, then a DIFFERENT-CASE right answer
    // opens the same fresh lock (casecmp? over the authored CIPHER).
    const cxWrong = await U('object', 'test_cryptex_box', 'CIPHEX', 'cryptex');
    const cxCase = await U('object', 'test_cryptex_box', 'cipher', 'cryptex');
    record('tug cryptex: wrong refused, different-case right opens (cipher vs CIPHER)',
      !cxWrong?.success && cxCase?.success === true, `wrong=${cxWrong?.success} diffCaseRight=${cxCase?.success}`);

    // A lock given only a wrong answer stays shut across a reload (archive door, cryptex KEYS).
    const arWrong = await U('door', 'archive', 'WRONG', 'cryptex');
    const tug2 = await openPage(browser, baseUrl, tugId);
    const arBoot = await bootstrap(baseUrl, tugId);
    const archiveLocked = arBoot.rooms?.archive?.locked === true;
    record('tug refused lock stays shut across reload (archive door)', !arWrong?.success && archiveLocked,
      `wrong-refused=${!arWrong?.success} archive-locked-after-reload=${archiveLocked}`);
    await tug2.close();
    await tug.close();

    // ================================================================ runtime door-entry strip
    // A scenario with a bare PIN door entry (office -> vault) and an rfid door entry
    // (office -> secure). GET /room/office must strip the PIN entry's `requires` (the client
    // validates a pad lock server-side) but keep the rfid card id (clone-as-entry reads it).
    const dsId = newDoorStripGame('test_seating', opts.port);
    ids.door_strip = dsId;
    const dsPage = await openPage(browser, baseUrl, dsId);
    const office = (await roomJson(baseUrl, dsId, 'office')).room;
    const dsDoors = office?.doors || [];
    const pinEntry = dsDoors.find(d => d.connectedRoom === 'vault') || {};
    const rfidEntry = dsDoors.find(d => d.connectedRoom === 'secure') || {};
    const officeRaw = JSON.stringify(office);
    record('door-strip: bare PIN door entry requires stripped, PIN absent from room payload',
      !('requires' in pinEntry) && !present(officeRaw, '7781'),
      `pin-entry=${JSON.stringify(pinEntry)} 7781-present=${present(officeRaw, '7781')}`);
    record('door-strip: rfid door entry keeps its card id (clone-as-entry)',
      rfidEntry.requires === 'badge01', `rfid-entry=${JSON.stringify(rfidEntry)}`);
    // A legitimate player still opens the vault with the right PIN (never refused by the strip).
    // ApiClient.unlock throws on a non-2xx (a refused attempt is 422), so catch and treat as a miss.
    const tryUnlock = (page, tt, id, att, m) => page.evaluate(([tt, id, att, m]) =>
      window.ApiClient.unlock(tt, id, att, m).then(r => r).catch(e => ({ success: false, err: e.message })), [tt, id, att, m]);
    const dsVault = await tryUnlock(dsPage, 'door', 'vault', '7781', 'pin');
    record('door-strip: legit vault PIN 7781 still opens through POST /unlock', dsVault?.success === true, JSON.stringify(dsVault).slice(0, 120));
    await dsPage.close();

    // ================================================================ m01 PIN no-regression
    // A shipped-mission PIN lock (derek_storage_safe, 1337) opens with the right PIN and refuses
    // a wrong one through the real POST /unlock. Wrong first: a right unlock would mark it open.
    const m01Id = newGame('m01_first_contact', opts.port);
    ids.m01_first_contact = m01Id;
    const m01 = await openPage(browser, baseUrl, m01Id);
    const m01Wrong = await tryUnlock(m01, 'object', 'derek_storage_safe', '0000', 'pin');
    const m01Right = await tryUnlock(m01, 'object', 'derek_storage_safe', '1337', 'pin');
    record('m01 PIN no-regression: wrong 0000 refused, right 1337 opens (derek_storage_safe)',
      !m01Wrong?.success && m01Right?.success === true, `wrong=${m01Wrong?.success} right=${m01Right?.success}`);
    await m01.close();

    // ================================================================ lab shoulder-surf PIN no-regression
    // The lab's shoulder-surf payoff is the archive safe (p4_safe, PIN 7041). The surfed PIN opens
    // it and a wrong one is refused on the real POST /unlock route, unchanged by the door strip.
    const labId = newGame('lab_physical_pentest', opts.port);
    ids.lab_physical_pentest = labId;
    const lab = await openPage(browser, baseUrl, labId);
    const labWrong = await tryUnlock(lab, 'object', 'p4_safe', '9999', 'pin');
    const labRight = await tryUnlock(lab, 'object', 'p4_safe', '7041', 'pin');
    record('lab shoulder-surf PIN no-regression: wrong 9999 refused, surfed 7041 opens (p4_safe)',
      !labWrong?.success && labRight?.success === true, `wrong=${labWrong?.success} right=${labRight?.success}`);
    await lab.close();
  } finally {
    await browser.close();
  }

  const failed = checks.filter(c => !c.pass);
  console.log(`\nGAME IDS: ${JSON.stringify(ids)}`);
  console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(e => { console.error(e); process.exit(1); });
}
