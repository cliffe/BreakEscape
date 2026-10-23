// Browser check of the triage starter's sync, then emit (05 N6; 00 section 11; P3-C).
//   node tools/playtest/se/triage-sync-regress.js <game url>
// e.g. node tools/playtest/se/triage-sync-regress.js http://127.0.0.1:3001/break_escape/games/2950
// Set OUT=<file> to keep the results as JSON, CHROMIUM=<path> to choose the browser.
//
// Runs against any game (the slice is fine): it imports systems/triage-starter.js into the
// page and saves probe rounds under the prefixes p3c_*_, with the page's real stateSync and
// the real server. page.route stands in for the network:
//   1. blocked, then lifted: the notice shows while blocked, nothing is emitted, and once the
//      block lifts the events go out (done last, then inbox_triage_completed) and the
//      confirmed PUT carried <prefix>done;
//   2. blocked for good: the attempts run out, nothing is emitted, the state is 'failed';
//   3. a forced 403: one PUT, no retry, nothing emitted.
// It does not open the triage overlay or complete a task: the minigame-level run (the
// triage-workstation, the host NPC's mapping, the task POST) is Phase 3's E2E script, after
// P3-W. The server half (globals land before complete_task) is
// test/controllers/break_escape/social_sync_then_emit_test.rb.
const { chromium } = require('playwright');
const fs = require('fs');

const [url] = process.argv.slice(2);
if (!url) { console.error('usage: triage-sync-regress.js <game url>'); process.exit(2); }
const out = { url, cases: [] };
let failed = 0;
const check = (name, ok, data = {}) => {
  out.cases.push({ name, ok, ...data });
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`, Object.keys(data).length ? JSON.stringify(data).slice(0, 400) : '');
};

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => console.log('PAGEERROR', String(e)));

    // Network control: 'open' | 'abort' | '403'
    let mode = 'open';
    const puts = [];
    await page.route('**/sync_state*', async (route) => {
      const req = route.request();
      if (req.method() !== 'PUT') return route.continue();
      let body = {};
      try { body = JSON.parse(req.postData() || '{}'); } catch (e) { /* keep {} */ }
      const entry = { t: Date.now(), mode, globals: body.globalVariables || {} };
      puts.push(entry);
      if (mode === 'abort') return route.abort('connectionrefused');
      if (mode === '403') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"success":false,"message":"refused"}' });
      const resp = await route.fetch();
      entry.status = resp.status();
      return route.fulfill({ response: resp });
    });

    const sep = url.includes('?') ? '&' : '?';
    await page.goto(`${url}${sep}skip_resume=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.stateSync && window.gameState?.globalVariables && window.eventDispatcher, null, { timeout: 60000 });

    await page.evaluate(async () => {
      window.__p3c = { events: [], saving: {} };
      window.eventDispatcher.on('global_variable_changed:p3c_*', (data, ev) => window.__p3c.events.push({ name: String(ev).replace('global_variable_changed:', ''), value: data?.value, t: Date.now() }));
      window.eventDispatcher.on('inbox_triage_completed', (data) => {
        if (String(data?.prefix || '').startsWith('p3c_')) window.__p3c.events.push({ name: 'inbox_triage_completed', prefix: data.prefix, t: Date.now() });
      });
      window.__p3c.mod = await import('/break_escape/js/systems/triage-starter.js');
      window.__p3c.run = (prefix, percent) => {
        const set = { id: prefix, stage: 'mission', outcome: { setGlobalPrefix: prefix, passPercent: 60 } };
        window.__p3c.saving[prefix] = [];
        window.__p3c[prefix] = window.__p3c.mod.persistTriageResult(
          { percent, reportRate: 0.5 },
          { set, stage: 'mission', prefix },
          { onSaving: (s) => window.__p3c.saving[prefix].push({ s, t: Date.now(), emitted: window.__p3c.events.filter(e => (e.name || '').startsWith(prefix) || e.prefix === prefix).length }) }
        ).then(r => (window.__p3c[prefix + 'result'] = r));
        return true;
      };
    });
    const eventsFor = (prefix) => page.evaluate(p => window.__p3c.events.filter(e => e.name.startsWith(p) || e.prefix === p).map(e => e.name), prefix);
    const savingFor = (prefix) => page.evaluate(p => window.__p3c.saving[p].map(x => x.s), prefix);
    const resultFor = (prefix) => page.evaluate(p => window.__p3c[p + 'result'] || null, prefix);

    // 1. Blocked, then lifted
    {
      const prefix = 'p3c_blocked_';
      mode = 'abort';
      const before = puts.length;
      await page.evaluate(p => window.__p3c.run(p, 72), prefix);
      await page.waitForTimeout(2500);
      const whileBlocked = await eventsFor(prefix);
      const savingWhileBlocked = await savingFor(prefix);
      const attemptsWhileBlocked = puts.length - before;
      check('blocked: nothing emitted while the sync is blocked', whileBlocked.length === 0, { whileBlocked, attemptsWhileBlocked });
      check('blocked: the saving notice is shown', savingWhileBlocked[0] === 'saving', { savingWhileBlocked });
      check('blocked: the starter is retrying', attemptsWhileBlocked >= 2, { attemptsWhileBlocked });
      mode = 'open';
      await page.waitForFunction(p => !!window.__p3c[p + 'result'], prefix, { timeout: 15000 });
      const result = await resultFor(prefix);
      const after = await eventsFor(prefix);
      const lastOk = puts.filter(x => x.mode === 'open' && x.status === 200).at(-1);
      check('lifted: confirmed', result?.confirmed === true, { result });
      check('lifted: events emitted, done last, then the done event',
        JSON.stringify(after) === JSON.stringify([`${prefix}percent`, `${prefix}reportRate`, `${prefix}pass`, `${prefix}done`, 'inbox_triage_completed']),
        { after });
      check('lifted: the confirmed PUT carried <prefix>done', lastOk?.globals?.[`${prefix}done`] === true, { lastOkGlobals: lastOk && Object.keys(lastOk.globals) });
      check('lifted: the notice was hidden after the emit', JSON.stringify(await savingFor(prefix)) === JSON.stringify(['saving', 'saved']));
    }

    // 2. Blocked for good
    {
      const prefix = 'p3c_offline_';
      mode = 'abort';
      const before = puts.length;
      await page.evaluate(p => window.__p3c.run(p, 40), prefix);
      await page.waitForFunction(p => !!window.__p3c[p + 'result'], prefix, { timeout: 30000 });
      const result = await resultFor(prefix);
      const evs = await eventsFor(prefix);
      check('offline: attempts run out, not confirmed', result?.confirmed === false, { result, attempts: puts.length - before });
      check('offline: nothing emitted', evs.length === 0, { evs });
      check('offline: notice then failed', JSON.stringify(await savingFor(prefix)) === JSON.stringify(['saving', 'failed']));
      mode = 'open';
    }

    // 3. Forced 403
    {
      const prefix = 'p3c_refused_';
      await page.waitForTimeout(300);
      mode = '403';
      const before = puts.length;
      await page.evaluate(p => window.__p3c.run(p, 80), prefix);
      await page.waitForFunction(p => !!window.__p3c[p + 'result'], prefix, { timeout: 15000 });
      await page.waitForTimeout(1500); // a retry, if any, would land within the first back-off steps
      const result = await resultFor(prefix);
      const evs = await eventsFor(prefix);
      const attempts = puts.slice(before).filter(x => x.mode === '403').length;
      check('403: not confirmed', result?.confirmed === false, { result });
      check('403: one PUT, no retry', attempts === 1, { attempts });
      check('403: nothing emitted', evs.length === 0, { evs });
      check('403: no saving notice, straight to failed', JSON.stringify(await savingFor(prefix)) === JSON.stringify(['failed']));
      mode = 'open';
    }

    // The values held by cases 2 and 3 still reach the server on the next sync
    {
      await page.evaluate(() => window.stateSync.syncConfirmed());
      const last = puts.filter(x => x.status === 200).at(-1);
      out.finalGlobals = Object.fromEntries(Object.entries(last?.globals || {}).filter(([k]) => k.startsWith('p3c_')));
    }
  } finally {
    await browser.close();
  }
  out.failed = failed;
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 2));
  console.log(failed ? `RESULT: FAIL (${failed})` : 'RESULT: PASS');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
