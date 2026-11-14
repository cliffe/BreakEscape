// Live browser proofs for the phish-evidence server hardening, chunk C (the reader
// change). Adapted from phish-chunk-ab-liveproof.mjs: the reader now reads only the
// two server stores, so case (e) asserts the migrated secret IS served, case (g)
// proves a forged se_landing_pages global with no server stores serves nothing, and
// case (h) proves a re-drive cannot downgrade a recorded convincing build.
// (PHISH_EVIDENCE_SERVER_PLAN.md section 15; build log "Chunk C").
//
// Each case drives the REAL client paths on a keyless server: the landing-page
// builder minigame (its Attach fires systems/se-landing-page-client.js
// recordLandingPageBuild -> POST se/landing_page) and the mail client minigame
// (its Send fires performSend, which imports systems/se-phish-send-client.js
// recordPhishSend -> POST se/phish_send). The only hand-crafted POST is case (d),
// where a forged body is the point. Server stores are read back read-only with a
// rails runner; the credential reveal is read through a fresh bootstrap
// (GET capture_secrets). Games are created only with tools/playtest/new-game.rb
// (lab_social_engineering), started in operations_room (the room holding the
// builder and the mail workstation) so the proof reaches both without replaying
// the whole lab; the lord OSINT facts the lab grants through play are granted
// through the real social-intel grantFact path.
//
//   node tools/playtest/se/phish-chunk-c-liveproof.mjs [--port 3665] [--only a,b,c,d,e,f,g,h]
//
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE picks the browser; HEADED=1 shows it. The
// keyless server must already be up on the port; this tool neither starts nor
// stops it. Exit 0 if every selected case passed, 1 otherwise. Runs headless with
// setFPS(20) and fixed steps on.

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

function parseArgs(argv) {
  const o = { port: 3665, only: null };
  const a = [...argv];
  while (a.length) {
    const [n, inl] = a.shift().split('=', 2);
    const take = () => (inl !== undefined ? inl : a.shift());
    if (n === '--port') o.port = Number(take());
    else if (n === '--only') o.only = take().split(',').map(s => s.trim());
  }
  return o;
}

const OPTS = parseArgs(process.argv.slice(2));
const BASE = `http://127.0.0.1:${OPTS.port}`;
const EXE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const RENV = { ...process.env, RBENV_VERSION: '2.7.8', PLAYTEST_PORT: String(OPTS.port), BREAK_ESCAPE_STANDALONE: 'true' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const CONVINCING = ['brand:ledgerwell', 'purpose:payslip', 'domain:d_word', 'logo:crisp', 'wording:w_formal', 'form:email', 'form:password', 'padlock:on'];
const WEAK = ['brand:ledgerwell', 'purpose:signin', 'domain:d_unrelated', 'logo:blurry', 'wording:w_generic', 'form:email', 'padlock:off'];
const LORD_FACTS = ['lord_intern', 'lord_portal', 'lord_portal_name', 'lord_payslip_date', 'lord_trusts_portal_sender'];

// --- game creation and read-only store reads (rails runner) --------------------

function newGame(extra = []) {
  const out = execFileSync('bundle', ['exec', 'rails', 'runner', 'tools/playtest/new-game.rb',
    'lab_social_engineering', '--start-room', 'operations_room', ...extra], { env: RENV, encoding: 'utf8' });
  const m = out.match(/GAME_ID=(\d+)/);
  if (!m) throw new Error(`new-game.rb gave no GAME_ID:\n${out}`);
  return Number(m[1]);
}

const READER = `
gid = ARGV[0].to_i
g = BreakEscape::Game.find(gid)
ps = g.player_state
caps = (ps['seCaptures'] || {}).transform_values { |e| e.is_a?(Hash) ? e.slice('targetId','kind','proven','address') : e }
require 'json'
puts 'STORES=' + JSON.generate(
  'game' => gid,
  'seLandingPages' => ps['seLandingPages'],
  'sePhishSends' => ps['sePhishSends'],
  'phishEvidenceMigrated' => ps['phishEvidenceMigrated'],
  'seCaptures' => caps
)
`;

function readStores(gameId) {
  const out = execFileSync('bundle', ['exec', 'rails', 'runner', READER, String(gameId)], { env: RENV, encoding: 'utf8' });
  const line = out.split('\n').find(l => l.startsWith('STORES='));
  if (!line) throw new Error(`reader gave no STORES line:\n${out}`);
  return JSON.parse(line.slice('STORES='.length));
}

// Seed ONE game's player_state to a legacy save shape (chunk B). No migrations.
function seedLegacy(gameId, { strong }) {
  const choices = strong
    ? { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true }
    : { brand: 'ledgerwell', purpose: 'signin', domainId: 'd_unrelated', logo: 'blurry', wording: 'w_generic', fields: ['email'], padlock: false };
  const rb = `
gid = ARGV[0].to_i
strong = ARGV[1] == 'true'
g = BreakEscape::Game.find(gid)
g.with_lock do
  ps = g.player_state
  gv = (ps['globalVariables'] ||= {})
  gv['se_landing_pages'] = {
    'payroll_login' => {
      'pageId' => 'payroll_login', 'targetId' => 'lord', 'built' => true,
      'choices' => ${JSON.stringify(choices)},
      'meetsThreshold' => true, 'credibility' => 99,
      'victim' => { 'visited' => true, 'submitted' => true, 'noticed' => false }
    }
  }
  ps.delete('seLandingPages'); ps.delete('sePhishSends'); ps.delete('phishEvidenceMigrated')
  ps.delete('mailState')
  # The honest legacy save also holds its captured credential, recorded unproven, with no
  # surviving sent mail. The migration populates the stores and the bootstrap stamp (chunk C
  # reader) proves it; capture_secrets then serves Sofia2026! for the strong save, withholds for weak.
  ps['seCaptures'] = { 'lord' => { 'targetId' => 'lord', 'kind' => 'credential',
                                   'address' => 's.lord@ledgerwell.example', 'proven' => false } }
  g.player_state = ps
  g.save!
end
puts 'SEEDED=' + gid.to_s
`;
  const out = execFileSync('bundle', ['exec', 'rails', 'runner', rb, String(gameId), String(strong)], { env: RENV, encoding: 'utf8' });
  if (!out.includes(`SEEDED=${gameId}`)) throw new Error(`seed failed:\n${out}`);
}

// Seed a forged-client state that isolates the chunk C reader: a built/convincing/submitted
// se_landing_pages GLOBAL and a landed sent-mail record, an unproven lord capture claim, empty
// server stores, and phishEvidenceMigrated already true so the one-time migration is a no-op and
// cannot re-derive the forged global. The reader must ignore the client globals entirely, so the
// secret is withheld. No migrations or schema commands are run.
function seedForgedReader(gameId) {
  const rb = `
gid = ARGV[0].to_i
g = BreakEscape::Game.find(gid)
g.with_lock do
  ps = g.player_state
  gv = (ps['globalVariables'] ||= {})
  gv['se_landing_pages'] = {
    'payroll_login' => {
      'pageId' => 'payroll_login', 'targetId' => 'lord', 'built' => true,
      'meetsThreshold' => true, 'credibility' => 99,
      'victim' => { 'visited' => true, 'submitted' => true }
    }
  }
  ps['mailState'] = { 'mailboxes' => { 'lord' => { 'messages' => [
    { 'folder' => 'sent', 'landed' => true, 'targetId' => 'lord', 'link' => { 'kitId' => 'kit_payroll_page' } }
  ] } } }
  ps['seCaptures'] = { 'lord' => { 'targetId' => 'lord', 'kind' => 'credential',
                                   'address' => 's.lord@ledgerwell.example', 'proven' => false } }
  ps['seLandingPages'] = {}
  ps['sePhishSends'] = {}
  ps['phishEvidenceMigrated'] = true
  g.player_state = ps
  g.save!
end
puts 'SEEDED=' + gid.to_s
`;
  const out = execFileSync('bundle', ['exec', 'rails', 'runner', rb, String(gameId)], { env: RENV, encoding: 'utf8' });
  if (!out.includes(`SEEDED=${gameId}`)) throw new Error(`forged seed failed:\n${out}`);
}

// --- browser helpers -----------------------------------------------------------

async function openGame(ctx, gameId, { skipResume = true } = {}) {
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  PAGEERR', String(e).slice(0, 160)));
  const url = `${BASE}/break_escape/games/${gameId}` + (skipResume ? '?skip_resume=1' : '');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 120000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  await page.evaluate(() => { try { const g = window.game?.sys?.game; if (g) { g.loop.smoothStep = false; g.loop.minFps = 1; } window.game?.physics?.world?.setFPS?.(20); } catch { /* */ } });
  await sleep(1500);
  await clearOverlays(page, 20); // dismiss the opening brief/cutscene so the first interact lands
  return page;
}

async function clearOverlays(page, rounds = 30) {
  for (let i = 0; i < rounds; i++) {
    const cur = await page.evaluate(() => window.MinigameFramework.currentMinigame?.constructor?.name || null);
    if (cur === 'LandingPageBuilderMinigame' || cur === 'MailClientMinigame') return cur;
    const mg = await page.evaluate(() => window.__test.getState().activeMinigame);
    if (mg) {
      const d = await page.evaluate(() => window.__test.minigame.getState()?.dialogue);
      if (d) {
        await page.evaluate(() => { const s = window.__test.minigame.getState().dialogue; return s.awaitingChoice ? window.__test.minigame.choose(1) : window.__test.minigame.continue(); });
        await page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 6000 })).catch(() => {});
        continue;
      }
      const clicked = await page.evaluate(() => {
        const C = window.MinigameFramework.currentMinigame?.container; if (!C) return false;
        const btn = [...C.querySelectorAll('button')].find(b => /start|begin|continue|build|open|next|got it/i.test(b.textContent || '') && !b.disabled);
        if (btn) { btn.click(); return true; } return false;
      });
      if (clicked) { await sleep(500); continue; }
      await page.evaluate(() => window.__test.minigame.close()); await sleep(400);
      continue;
    }
    const bl = await page.evaluate(() => window.__test.getState().blockingUi);
    if (bl) {
      const pick = bl.buttons.map(x => x.label).find(l => /^resume$|no,|figure it out|continue|start/i.test(l)) || bl.buttons[0].label;
      await page.evaluate(l => window.__test.dismissBlockingUi(l), pick); await sleep(400); continue;
    }
    return cur;
  }
  return null;
}

async function grantLordFacts(page) {
  return page.evaluate(async (ids) => {
    const m = await import('/break_escape/js/systems/social-intel.js');
    for (const id of ids) { try { m.grantFact(id); } catch (e) { /* */ } }
    await new Promise(r => setTimeout(r, 200));
    return true;
  }, LORD_FACTS);
}

// Build the payroll page through the real builder minigame. Returns the builder's
// own scored verdict (the server recomputes its own, independently).
async function buildPage(page, picks) {
  await page.evaluate(() => window.__test.interact('page_builder'));
  await sleep(600);
  const cur = await clearOverlays(page, 25);
  if (cur !== 'LandingPageBuilderMinigame') throw new Error(`builder did not open (${cur})`);
  const r = await page.evaluate(async (focuses) => {
    const s = (ms) => new Promise(res => setTimeout(res, ms));
    const mg = window.MinigameFramework.currentMinigame; const C = mg.container;
    const b0 = mg.getTestState().builder;
    for (const f of focuses) { const el = C.querySelector(`[data-focus="${f}"]`); if (el) { el.click(); await s(60); } }
    C.querySelector('[data-focus="score"]')?.click(); await s(250);
    const b = mg.getTestState().builder;
    const att = C.querySelector('.lpb-attach-btn'); if (att) att.click(); await s(400);
    return { pageId: b0.pageId, targetId: b0.targetId, scored: b.scored, attached: !!att };
  }, picks);
  await sleep(900);
  await page.evaluate(() => { try { window.MinigameFramework.currentMinigame?.close?.(); } catch { /* */ } });
  await sleep(600);
  await clearOverlays(page, 10);
  return r;
}

// Compose and send the convincing payroll link to lord through the real mail
// client. Returns whether the client judged it landed and the local evidence the
// reader reads (victim.submitted, the landed sent message).
async function sendToLord(page) {
  await page.evaluate(() => { try { return window.__test.moveToNear('mail_workstation'); } catch { /* */ } }).catch(() => {});
  await sleep(400);
  await page.evaluate(() => window.__test.interact('mail_workstation'));
  await sleep(800);
  const cur = await clearOverlays(page, 25);
  if (cur !== 'MailClientMinigame') throw new Error(`mail client did not open (${cur})`);
  return page.evaluate(async () => {
    const s = (ms) => new Promise(res => setTimeout(res, ms));
    const mg = window.MinigameFramework.currentMinigame;
    mg.openCompose({ presetContactId: 'lord' }); await s(500);
    const R = mg.composer.root;
    const setSel = (cls, val, part) => { const sel = part ? R.querySelector(`select.${cls}[data-part="${part}"]`) : R.querySelector(`select.${cls}`); if (!sel) return false; sel.value = val; sel.dispatchEvent(new Event('change', { bubbles: true })); return true; };
    const pick = async (slot, value) => { const b = R.querySelector(`.mail-blank[data-slot="${slot}"]`); if (!b) return 'no-blank'; b.click(); await s(150); const p = mg.composer.getState().picker; if (!p) return 'no-picker'; const i = p.options.findIndex(o => o.value === value); if (i < 0) return 'no-opt'; const opts = R.querySelectorAll('[role=option]'); if (!opts[i]) return 'no-el'; opts[i].click(); await s(150); return 'ok'; };
    setSel('mail-compose-subject', 's_payslip');
    setSel('mail-compose-template', 'pretext_payslip', 'pretext'); await s(200);
    setSel('mail-compose-template', 'ask_view_portal', 'ask'); await s(100);
    const steps = {};
    steps.sender_name = await pick('sender_name', 'portal_full');
    steps.sender_address = await pick('sender_address', 'portal_address');
    steps.name = await pick('name', 'lord_first');
    steps.portal = await pick('portal', 'staff_portal_name');
    steps.when = await pick('when', 'mon_6th');
    const linkBtn = R.querySelector('button.mail-compose-link'); if (linkBtn) { linkBtn.click(); await s(250); }
    const c = mg.composer.getState();
    const sendBtn = R.querySelector('button.mail-compose-send');
    const sendDisabled = sendBtn ? sendBtn.disabled : null;
    if (sendBtn && !sendBtn.disabled) { sendBtn.click(); await s(700); }
    const g = window.gameState.globalVariables;
    const rec = g.se_landing_pages && g.se_landing_pages.payroll_login;
    const ms = window.mailState || {};
    const sent = [];
    Object.values(ms.mailboxes || {}).forEach(bx => Array.isArray(bx.messages) && bx.messages.forEach(m => { if (m.folder === 'sent') sent.push({ id: m.id, targetId: m.targetId, landed: m.landed, kitId: m.link && m.link.kitId }); }));
    return { steps, sendDisabled, link: c.link, sentThisSession: mg.sentThisSession, victim: rec && rec.victim, sent, metrics: (ms.metrics && ms.metrics.lord) || null };
  });
}

async function sync(page) {
  await page.evaluate(() => { try { window.stateSync && window.stateSync.sync && window.stateSync.sync(); } catch { /* */ } });
  await sleep(1200);
}

async function captureSecrets(page) {
  return page.evaluate(async () => {
    const base = window.breakEscapeConfig?.apiBasePath;
    const r = await fetch(`${base}/capture_secrets`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    return { status: r.status, body: await r.text() };
  });
}

// --- cases ---------------------------------------------------------------------

const CASES = {};

CASES.a = async (ctx, rec) => {
  const gid = newGame();
  const page = await openGame(ctx, gid);
  await grantLordFacts(page);
  const build = await buildPage(page, CONVINCING);
  const send = await sendToLord(page);
  await sync(page);
  const stores = readStores(gid);
  await page.close();
  const fresh = await openGame(ctx, gid);
  const secrets = await captureSecrets(fresh);
  await fresh.close();
  const lp = stores.seLandingPages?.payroll_login;
  const ps = stores.sePhishSends?.['lord/kit_payroll_page'];
  const pass = !!(lp && lp.built === true && lp.meetsThreshold === true && ps && ps.landed === true
    && stores.seCaptures?.lord?.proven === true && /Sofia2026!/.test(secrets.body));
  rec('a', pass, { gid, build: build.scored, sendLanded: send.sentThisSession === 1 && (send.sent[0]?.landed === true), stores, secrets: secrets.body });
};

CASES.b = async (ctx, rec) => {
  const gid = newGame();
  const page = await openGame(ctx, gid);
  await grantLordFacts(page);
  // Offline across build and send: the honest POSTs are queued in memory.
  await ctx.setOffline(true);
  const build = await buildPage(page, CONVINCING);
  const send = await sendToLord(page);
  const whileOffline = readStores(gid);
  // Reconnect and fire the online event plus a sync; the build client drains
  // builds before sends.
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await sleep(600);
  await page.evaluate(async () => { try { const mod = await import('/break_escape/js/systems/se-phish-send-client.js'); await mod.drainPhishSendQueue?.(); } catch { /* */ } });
  await sleep(400);
  await sync(page);
  await sleep(800);
  const after = readStores(gid);
  await page.close();
  const ps = after.sePhishSends?.['lord/kit_payroll_page'];
  const lp = after.seLandingPages?.payroll_login;
  const pass = !!((whileOffline.sePhishSends == null || whileOffline.sePhishSends['lord/kit_payroll_page'] == null)
    && lp && lp.meetsThreshold === true && ps && ps.landed === true);
  rec('b', pass, { gid, sendDisabled: send.sendDisabled, whileOffline, after });
};

CASES.c = async (ctx, rec) => {
  const gid = newGame();
  const page = await openGame(ctx, gid);
  await grantLordFacts(page);
  // Hold ONLY the phish POST routes (not sync_state), so the durable globals
  // still persist for the reload re-drive.
  await page.route('**/se/landing_page', r => r.abort());
  await page.route('**/se/phish_send', r => r.abort());
  const build = await buildPage(page, CONVINCING);
  const send = await sendToLord(page);
  await sync(page); // persists globalVariables.se_landing_pages (built + victim.submitted)
  const held = readStores(gid);
  await page.unroute('**/se/landing_page');
  await page.unroute('**/se/phish_send');
  await page.close();
  // Reload: main.js game_loaded re-drives the build then the send from the durable
  // se_landing_pages. Open without skip_resume so the bootstrap applies.
  const reloaded = await openGame(ctx, gid, { skipResume: false });
  await sleep(2500);
  await sync(reloaded);
  await sleep(800);
  const after = readStores(gid);
  await reloaded.close();
  const ps = after.sePhishSends?.['lord/kit_payroll_page'];
  const lp = after.seLandingPages?.payroll_login;
  const pass = !!((held.sePhishSends == null || held.sePhishSends['lord/kit_payroll_page'] == null)
    && lp && lp.meetsThreshold === true && ps && ps.landed === true);
  rec('c', pass, { gid, held, after });
};

CASES.d = async (ctx, rec) => {
  const gid = newGame();
  const page = await openGame(ctx, gid);
  // A crafted POST se/phish_send for a non-phish target and for a non-link kit.
  const res = await page.evaluate(async () => {
    const cfg = window.breakEscapeConfig; const token = cfg.csrfToken || document.querySelector('meta[name="csrf-token"]')?.content || '';
    const post = async (body) => {
      const r = await fetch(`${cfg.apiBasePath}/se/phish_send`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify(body) });
      let j = null; try { j = await r.json(); } catch { /* */ }
      return { status: r.status, body: j };
    };
    return {
      wrongTarget: await post({ targetId: 'ceo_not_a_target', kitId: 'kit_payroll_page' }),
      wrongKit: await post({ targetId: 'lord', kitId: 'kit_cv' }),
    };
  });
  await page.close();
  const stores = readStores(gid);
  const pass = res.wrongTarget.status === 422 && res.wrongKit.status === 422 && (stores.sePhishSends == null || Object.keys(stores.sePhishSends).length === 0);
  rec('d', pass, { gid, res, sePhishSends: stores.sePhishSends });
};

CASES.e = async (ctx, rec) => {
  const detail = {};
  let pass = true;
  for (const strong of [true, false]) {
    const gid = newGame();
    seedLegacy(gid, { strong });
    const before = readStores(gid);
    const page = await openGame(ctx, gid, { skipResume: false }); // fresh bootstrap runs the migration
    await sleep(1500);
    const secrets = await captureSecrets(page);
    await page.close();
    const after = readStores(gid);
    const lp = after.seLandingPages?.payroll_login;
    const ps = after.sePhishSends?.['lord/kit_payroll_page'];
    const revealed = /Sofia2026!/.test(secrets.body);
    // Chunk C case (e): the migration populates the two server stores with the server's
    // re-derived score off the durable victim.submitted marker (no surviving sent mail), and
    // the chunk C reader reads them. A strong legacy save is now SERVED Sofia2026! on its
    // first bootstrap; a weak one re-derives meetsThreshold:false and the secret is withheld.
    const want = strong
      ? (lp && lp.built === true && lp.meetsThreshold === true && ps && ps.landed === true && after.phishEvidenceMigrated === true && revealed)
      : (lp && lp.built === true && lp.meetsThreshold === false && ps && ps.landed === false && after.phishEvidenceMigrated === true && !revealed);
    pass = pass && !!want;
    detail[strong ? 'strong' : 'weak'] = { gid, beforeHadStores: !!(before.seLandingPages || before.sePhishSends), revealed, after, secrets: secrets.body };
  }
  rec('e', pass, detail);
};

CASES.f = async (ctx, rec) => {
  const gid = newGame();
  const page = await openGame(ctx, gid);
  await grantLordFacts(page);
  const weakBuild = await buildPage(page, WEAK);
  await sync(page);
  const afterWeak = readStores(gid);
  // Improve: rebuild the same page convincingly.
  const strongBuild = await buildPage(page, CONVINCING);
  await sync(page);
  const afterImprove = readStores(gid);
  // A later send over the improved page.
  const send = await sendToLord(page);
  await sync(page);
  const afterSend = readStores(gid);
  await page.close();
  const lpWeak = afterWeak.seLandingPages?.payroll_login;
  const lpImp = afterImprove.seLandingPages?.payroll_login;
  const ps = afterSend.sePhishSends?.['lord/kit_payroll_page'];
  // Reported plainly whatever happens; the expected shape is weak records
  // meetsThreshold:false, the improved rebuild overwrites to true, the later send lands.
  const pass = !!(lpWeak && lpWeak.meetsThreshold === false && lpImp && lpImp.meetsThreshold === true && ps && ps.landed === true);
  rec('f', pass, { gid, weakScored: weakBuild.scored, strongScored: strongBuild.scored, afterWeak: lpWeak, afterImprove: lpImp, sendLanded: ps?.landed, afterSend });
};

// Chunk C case (g): a forged se_landing_pages global and a forged landed sent mail, with no server
// stores and the migration already run, serves no secret. The reader reads only the server stores.
CASES.g = async (ctx, rec) => {
  const gid = newGame();
  seedForgedReader(gid);
  const before = readStores(gid);
  const page = await openGame(ctx, gid, { skipResume: false }); // fresh bootstrap (migration is a no-op)
  await sleep(1200);
  const secrets = await captureSecrets(page);
  await page.close();
  const after = readStores(gid);
  const revealed = /Sofia2026!/.test(secrets.body);
  const noStores = (after.seLandingPages == null || Object.keys(after.seLandingPages).length === 0) &&
    (after.sePhishSends == null || Object.keys(after.sePhishSends).length === 0);
  const pass = !revealed && noStores && after.seCaptures?.lord?.proven !== true;
  rec('g', pass, { gid, revealed, beforeHadStores: !!(before.seLandingPages && Object.keys(before.seLandingPages).length), after, secrets: secrets.body });
};

// Chunk C case (h): a re-drive (redrive:true) with weaker choices cannot downgrade a recorded
// convincing build. Build convincing through the real builder, then hand-craft a re-drive POST with
// weak choices; the server keeps the stronger verdict.
CASES.h = async (ctx, rec) => {
  const gid = newGame();
  const page = await openGame(ctx, gid);
  await grantLordFacts(page);
  const build = await buildPage(page, CONVINCING);
  await sync(page);
  const afterBuild = readStores(gid);
  const weakChoices = { brand: 'ledgerwell', purpose: 'signin', domainId: 'd_unrelated', logo: 'blurry', wording: 'w_generic', fields: ['email'], padlock: false };
  const redrive = await page.evaluate(async (choices) => {
    const cfg = window.breakEscapeConfig;
    const r = await fetch(`${cfg.apiBasePath}/se/landing_page`, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': cfg.csrfToken || '' },
      body: JSON.stringify({ pageId: 'payroll_login', targetId: 'lord', choices, redrive: true }),
    });
    return { status: r.status, body: await r.json() };
  }, weakChoices);
  await page.close();
  const afterRedrive = readStores(gid);
  const lpBuild = afterBuild.seLandingPages?.payroll_login;
  const lpAfter = afterRedrive.seLandingPages?.payroll_login;
  const pass = !!(lpBuild && lpBuild.meetsThreshold === true &&
    lpAfter && lpAfter.meetsThreshold === true && lpAfter.credibility === lpBuild.credibility &&
    redrive.body && redrive.body.meetsThreshold === true);
  rec('h', pass, { gid, built: build.scored, afterBuild: lpBuild, redrive, afterRedrive: lpAfter });
};

// --- run -----------------------------------------------------------------------

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1', ...(EXE ? { executablePath: EXE } : {}) });
  const results = [];
  const rec = (name, pass, detail) => { results.push({ name, pass }); console.log(`\n===== CASE ${name}: ${pass ? 'PASS' : 'FAIL'} =====`); console.log(JSON.stringify(detail, null, 2)); };
  const want = OPTS.only || ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (const name of want) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    try {
      await CASES[name](ctx, rec);
    } catch (e) {
      results.push({ name, pass: false });
      console.log(`\n===== CASE ${name}: FAIL (threw) =====`);
      console.log(String(e && e.stack || e));
    }
    await ctx.close();
  }
  await browser.close();
  console.log('\n===== SUMMARY =====');
  for (const r of results) console.log(`  case ${r.name}: ${r.pass ? 'PASS' : 'FAIL'}`);
  const allPass = results.every(r => r.pass);
  process.exit(allPass ? 0 : 1);
})();
