// Live browser proof that the OLD client-evidence path still drives the phished
// credential reveal at this tip (build chunks 1 to 3; the reader change is chunk
// 7, PHISH_EVIDENCE_SERVER_PLAN.md section 3.4, not yet landed).
//
// On lab_social_engineering it: builds and attaches the payroll_login page
// through the real builder UI, then writes the client evidence the honest send
// path produces (se_landing_pages victim.submitted and a landed sent message to
// lord carrying kit_payroll_page), submits the capture through the game's own
// window.submitSECapture, syncs, and reads GET /capture_secrets. The secret
// Sofia2026! comes back because phish_page_evidence_holds? still reads the client
// globals (se_landing_pages / mailState), exactly as on main.
//
//   node tools/playtest/se/phish-reveal-liveproof.mjs --url <gameUrl> [--out f.json]
//
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE picks the browser; HEADED=1 shows it.

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  return process.argv.includes(`--${name}`) ? true : def;
}
const URL = arg('url');
const OUT = arg('out', null);
if (!URL) { console.error('need --url'); process.exit(2); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const CONVINCING = ['brand:ledgerwell', 'purpose:payslip', 'domain:d_word', 'logo:crisp', 'wording:w_formal', 'form:email', 'form:password', 'padlock:on'];
const KIT = 'kit_payroll_page';
const ADDRESS = 's.lord@ledgerwell.example';

async function clearOverlays(page, rounds = 40) {
  for (let i = 0; i < rounds; i++) {
    const mg = await page.evaluate(() => window.__test.getState().activeMinigame);
    if (mg) {
      const d = await page.evaluate(() => window.__test.minigame.getState()?.dialogue);
      if (d) {
        await page.evaluate(() => { const s = window.__test.minigame.getState().dialogue; return s.awaitingChoice ? window.__test.minigame.choose(1) : window.__test.minigame.continue(); });
        await page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 8000 })).catch(() => {});
      } else { await page.evaluate(() => window.__test.minigame.close()); await sleep(400); }
      continue;
    }
    const bl = await page.evaluate(() => window.__test.getState().blockingUi);
    if (bl) {
      const pick = bl.buttons.map(x => x.label).find(l => /^resume$|no,|figure it out|continue|start/i.test(l)) || bl.buttons[0].label;
      await page.evaluate(l => window.__test.dismissBlockingUi(l), pick); await sleep(500); continue;
    }
    return i;
  }
  return rounds;
}

(async () => {
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch({ headless: !process.env.HEADED, ...(exe ? { executablePath: exe } : {}) });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  const result = { url: URL };
  const secretResponses = [];
  page.on('response', async (resp) => {
    if (!/\/capture_secrets/.test(resp.url())) return;
    try { secretResponses.push(await resp.text()); } catch {}
  });

  try {
    await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'skip_resume=1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 120000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await page.evaluate(() => { try { const g = window.game?.sys?.game; if (g) { g.loop.smoothStep = false; g.loop.minFps = 1; } window.game?.physics?.world?.setFPS?.(20); } catch {} });
    await sleep(1500);
    await clearOverlays(page, 40);

    // Build + attach through the real builder UI.
    await page.evaluate(async () => { try { const m = await import('/break_escape/js/systems/social-intel.js'); m.grantFact('portal_name'); } catch {} await new Promise(r => setTimeout(r, 150)); });
    await page.evaluate(() => window.__test.interact('page_builder'));
    await page.evaluate(() => window.__test.waitForMinigame('landing-page-builder', { timeoutMs: 15000 })).catch(() => {});
    result.build = await page.evaluate(async (focuses) => {
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      const mg = window.MinigameFramework.currentMinigame;
      const C = mg.container;
      for (const f of focuses) { const el = C.querySelector(`[data-focus="${f}"]`); if (el) { el.click(); await sleep(60); } }
      C.querySelector('[data-focus="score"]')?.click(); await sleep(250);
      const b = mg.getTestState().builder;
      C.querySelector('.lpb-attach-btn')?.click(); await sleep(300);
      return b.scored ? { credibility: b.scored.credibility, meetsThreshold: b.scored.meetsThreshold } : null;
    }, CONVINCING);
    await sleep(1200);

    // Write the client evidence the honest landing send produces, then record the
    // capture through the game's own capture client and sync.
    const injected = await page.evaluate(({ kit, address }) => {
      const g = window.gameState.globalVariables;
      // victim.submitted on the client page record (what performSend writes when the send lands).
      const pages = (g.se_landing_pages && typeof g.se_landing_pages === 'object') ? g.se_landing_pages : {};
      const rec = pages.payroll_login || { pageId: 'payroll_login', targetId: 'lord', choices: {}, credibility: 87, meetsThreshold: true };
      rec.built = true; rec.meetsThreshold = true; rec.victim = { visited: true, submitted: true };
      window.gameState.globalVariables.se_landing_pages = { ...pages, payroll_login: rec };
      // A landed sent message to lord with the page kit (what the mail send commits).
      // The sync reads mailState from window.mailScheduler.exportMailState(), so the
      // message goes into the scheduler's own store with an id (keyed-section delta).
      const sch = window.mailScheduler;
      if (sch && sch.state) {
        sch.state.mailboxes = sch.state.mailboxes || {};
        sch.state.mailboxes.lord = sch.state.mailboxes.lord || { messages: [], unread: 0 };
        sch.state.mailboxes.lord.messages = sch.state.mailboxes.lord.messages || [];
        sch.state.mailboxes.lord.messages.push({ id: 'proof_sent_lord_1', folder: 'sent', landed: true, targetId: 'lord', to: 's.lord@ledgerwell.example', thread: 'lord:guest', link: { kitId: kit } });
      }
      // Record the capture through the game's own client (queues + syncs).
      const queued = window.submitSECapture ? window.submitSECapture({ targetId: 'lord', kind: 'credential', address }) : 'no submitSECapture';
      try { window.stateSync && window.stateSync.sync && window.stateSync.sync(); } catch {}
      return { queued, pageRec: window.gameState.globalVariables.se_landing_pages.payroll_login };
    }, { kit: KIT, address: ADDRESS });
    result.injected = injected;
    await sleep(2000);
    // force one more sync to be sure the capture round-tripped
    await page.evaluate(() => { try { window.stateSync && window.stateSync.sync && window.stateSync.sync(); } catch {} });
    await sleep(1500);

    // GET /capture_secrets through the page (same-origin).
    const secrets = await page.evaluate(async () => {
      const base = window.breakEscapeConfig?.apiBasePath;
      const r = await fetch(`${base}/capture_secrets`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      return { status: r.status, body: await r.text() };
    });
    result.captureSecrets = secrets;
  } catch (e) {
    result.error = String(e && e.stack || e);
  }
  result.secretResponses = secretResponses;
  console.log(JSON.stringify(result, null, 2));
  if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 2));
  await browser.close();
})();
