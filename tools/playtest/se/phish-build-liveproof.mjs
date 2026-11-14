// Live browser proof for the phish-evidence landing-page build route (Route 1,
// PHISH_EVIDENCE_SERVER_PLAN.md sections 3.2 and 10; build chunks 1 to 3).
//
// Drives the REAL landing-page builder minigame through the window.__test
// bridge on a keyless server, builds a convincing payroll_login page for target
// lord, and clicks the real Attach button so the minigame's own attach() fires
// its _recordBuildOnServer() POST to games/:id/se/landing_page. This proves the
// browser path fills the server store, not just a hand-made POST.
//
//   node tools/playtest/se/phish-build-liveproof.mjs --url <gameUrl>
//     [--mode normal|throttle|offline] [--weak] [--out <file.json>]
//
//   normal    straight build + attach.
//   throttle  slow-3G CDP network conditions plus a 1200 ms route delay on the
//             build POST, then attach: the honest build must still record.
//   offline   go offline, attach (the fire-and-forget POST is lost: chunk 3 has
//             no re-send queue yet, that is chunk 5), come back online, attach
//             again: the honest build is never refused and ends up recorded.
//
// Records every response body the browser receives for a game route and reports
// whether seLandingPages or sePhishSends ever appears in one (plan section 7:
// the stores must never ride back out to the client).
//
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE picks the browser; HEADED=1 shows it.
// Use setFPS(20) with fixed steps on (set after the bridge is ready).

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  return process.argv.includes(`--${name}`) ? true : def;
}

const URL = arg('url');
const MODE = arg('mode', 'normal');
const WEAK = !!arg('weak', false);
const OUT = arg('out', null);
const BUILDER_ID = arg('builder-id', 'slice_page_builder');
if (!URL) { console.error('need --url'); process.exit(2); }

const BUILD_ROUTE = /\/se\/landing_page(\?|$)/;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Convincing choices for payroll_login / lord (linkThreshold 70, minDomainTier 2):
// ledgerwell brand, payslip purpose, d_word (tier 2) domain, crisp logo, matching
// wording, email+password, padlock on. --weak drops to an unrelated tier-0 domain
// and generic wording so meetsThreshold comes back false.
const CONVINCING = ['brand:ledgerwell', 'purpose:payslip', 'domain:d_word', 'logo:crisp', 'wording:w_formal', 'form:email', 'form:password', 'padlock:on'];
const WEAKER = ['brand:ledgerwell', 'purpose:signin', 'domain:d_unrelated', 'logo:blurry', 'wording:w_generic', 'form:email', 'padlock:off'];

async function clearOverlays(page, rounds = 40) {
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
        await sleep(400);
      }
      continue;
    }
    const bl = await page.evaluate(() => window.__test.getState().blockingUi);
    if (bl) {
      const pick = bl.buttons.map(x => x.label).find(l => /^resume$|no,|figure it out|continue|start/i.test(l)) || bl.buttons[0].label;
      await page.evaluate(l => window.__test.dismissBlockingUi(l), pick);
      await sleep(500);
      continue;
    }
    return i;
  }
  return rounds;
}

async function openBuilder(page) {
  // Reveal lord's contact through the real grantFact path (best effort: the
  // target is derived from the page's targets map, so the builder opens with
  // targetId=lord whether or not this fact is set).
  const granted = await page.evaluate(async () => {
    try {
      const mod = await import('/break_escape/js/systems/social-intel.js');
      mod.grantFact('portal_name');
      await new Promise(r => setTimeout(r, 150));
      return window.gameState.globalVariables.se_intel_portal_name === true;
    } catch (e) { return false; }
  });
  await page.evaluate((bid) => window.__test.interact(bid), BUILDER_ID);
  await page.evaluate(() => window.__test.waitForMinigame('landing-page-builder', { timeoutMs: 15000 })).catch(() => {});
  const ok = await page.evaluate(() => {
    const mg = window.MinigameFramework.currentMinigame;
    return !!mg && mg.constructor.name === 'LandingPageBuilderMinigame';
  });
  if (!ok) throw new Error('landing-page-builder did not open');
  const info = await page.evaluate(() => {
    const b = window.MinigameFramework.currentMinigame.getTestState().builder;
    return { pageId: b.pageId, targetId: b.targetId, step: b.step };
  });
  return info;
}

// Pick the choices, score, then click the real Attach button. Returns the
// builder's own scored verdict and whether attach completed client-side.
async function buildAndAttach(page, picks) {
  const scored = await page.evaluate(async (focuses) => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const mg = window.MinigameFramework.currentMinigame;
    const C = mg.container;
    for (const f of focuses) {
      const el = C.querySelector(`[data-focus="${f}"]`);
      if (el) { el.click(); await sleep(60); }
    }
    const sc = C.querySelector('[data-focus="score"]');
    if (sc) sc.click();
    await sleep(250);
    const b = mg.getTestState().builder;
    return b.scored ? { credibility: b.scored.credibility, meetsThreshold: b.scored.meetsThreshold, gatesPassed: b.scored.gatesPassed } : null;
  }, picks);
  // Click Attach: this fires the real attach() -> _recordBuildOnServer() POST.
  const attached = await page.evaluate(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const mg = window.MinigameFramework.currentMinigame;
    const att = mg.container.querySelector('.lpb-attach-btn');
    if (!att) return false;
    att.click();
    await sleep(200);
    return true;
  });
  return { scored, attached };
}

(async () => {
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch({ headless: !process.env.HEADED, ...(exe ? { executablePath: exe } : {}) });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();

  const responses = [];
  page.on('response', async (resp) => {
    const u = resp.url();
    if (!/\/break_escape\/games\/\d+/.test(u)) return;
    const ct = (resp.headers()['content-type'] || '');
    let body = '';
    try {
      if (/json|html|text/.test(ct)) body = await resp.text();
    } catch { body = ''; }
    const path = u.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    responses.push({
      path, status: resp.status(), ctype: ct.split(';')[0],
      hasSeLandingPages: body.includes('seLandingPages'),
      hasSePhishSends: body.includes('sePhishSends'),
      hasSeLandingPagesClientKey: body.includes('se_landing_pages'),
      len: body.length,
    });
  });

  // Track the build POST(s).
  const buildPosts = [];
  page.on('requestfinished', async (req) => {
    if (req.method() !== 'POST' || !BUILD_ROUTE.test(req.url())) return;
    let status = null, respBody = '';
    try { const r = await req.response(); status = r && r.status(); respBody = r ? await r.text() : ''; } catch {}
    buildPosts.push({ status, body: respBody.slice(0, 300), t: Date.now() });
  });
  page.on('requestfailed', (req) => {
    if (req.method() === 'POST' && BUILD_ROUTE.test(req.url())) {
      buildPosts.push({ status: 'FAILED', body: req.failure()?.errorText || 'failed', t: Date.now() });
    }
  });

  const result = { url: URL, mode: MODE, weak: WEAK };
  try {
    await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'skip_resume=1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 120000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    // setFPS(20), fixed steps ON (never fixedStep=false).
    await page.evaluate(() => {
      try {
        const g = window.game?.sys?.game;
        if (g) { g.loop.smoothStep = false; g.loop.minFps = 1; }
        window.game?.physics?.world?.setFPS?.(20);
      } catch {}
    });
    await sleep(1500);
    await clearOverlays(page, 40);

    const picks = WEAK ? WEAKER : CONVINCING;

    let cdp = null;
    if (MODE === 'throttle') {
      cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      // Slow 3G plus latency.
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false, latency: 400,
        downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8,
      });
      await page.route(BUILD_ROUTE, async (route) => { await sleep(1200); await route.continue(); });
    }

    if (MODE === 'offline') {
      // First: build+attach while offline. Chunk 3 is fire-and-forget with no
      // re-send queue, so this POST is lost; the attach still completes client-side.
      const builder = await openBuilder(page);
      result.builder = builder;
      await ctx.setOffline(true);
      const first = await buildAndAttach(page, picks);
      result.offlineAttach = first;
      await sleep(1500);
      result.postsWhileOffline = JSON.parse(JSON.stringify(buildPosts));
      // Back online, re-open the builder and re-attach: the honest build records.
      await ctx.setOffline(false);
      await sleep(800);
      await clearOverlays(page, 20);
      await openBuilder(page);
      const second = await buildAndAttach(page, picks);
      result.onlineReattach = second;
    } else {
      const builder = await openBuilder(page);
      result.builder = builder;
      const b = await buildAndAttach(page, picks);
      result.build = b;
    }

    // Wait for the build POST(s) to resolve (throttled ones take longer).
    for (let i = 0; i < 40 && buildPosts.filter(p => p.status !== 'FAILED').length === 0; i++) await sleep(300);
    await sleep(800);

    // Force a client sync so the client UI globals (se_landing_pages, landing_*_built)
    // persist, the way the game syncs after a minigame closes. The server store was
    // already written by the POST, independently of this sync.
    await page.evaluate(() => { try { window.stateSync && window.stateSync.sync && window.stateSync.sync(); } catch {} });
    await sleep(1500);

    if (cdp) { await page.unroute(BUILD_ROUTE).catch(() => {}); }
  } catch (e) {
    result.error = String(e && e.stack || e);
  }

  result.buildPosts = buildPosts;
  result.responses = responses;
  result.leak = {
    seLandingPagesInAnyResponse: responses.some(r => r.hasSeLandingPages),
    sePhishSendsInAnyResponse: responses.some(r => r.hasSePhishSends),
    responsesScanned: responses.length,
    routes: [...new Set(responses.map(r => r.path.replace(/\/break_escape\/games\/\d+/, '/games/:id')))],
  };

  console.log(JSON.stringify(result, null, 2));
  if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 2));
  await browser.close();
})();
