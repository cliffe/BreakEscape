// Capture real getState() snapshots for docs/test-bridge.md
const { chromium } = require('playwright');
const fs = require('fs');
const url = process.argv[2];

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADED === '0' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 30000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 60000 }));
  const out = {};

  out.atLoad = await page.evaluate(() => {
    const s = window.__test.getState();
    return { activeMinigame: s.activeMinigame, blockingUi: s.blockingUi, room: s.room };
  });

  for (let i = 0; i < 220; i++) {
    const mg = await page.evaluate(() => window.__test.getState().activeMinigame);
    if (mg) {
      const d = await page.evaluate(() => window.__test.minigame.getState()?.dialogue);
      if (d) { await page.evaluate(() => { const s = window.__test.minigame.getState().dialogue;
          return s.awaitingChoice ? window.__test.minigame.choose(1) : window.__test.minigame.continue(); });
        await page.waitForTimeout(320); }
      else { await page.evaluate(() => window.__test.minigame.close()); await page.waitForTimeout(600); }
      continue;
    }
    const bl = await page.evaluate(() => window.__test.getState().blockingUi);
    if (bl) { const pick = bl.buttons.map(x=>x.label).find(l=>/no,|figure it out|resume/i.test(l)) || bl.buttons[0].label;
      await page.evaluate(l => window.__test.dismissBlockingUi(l), pick); await page.waitForTimeout(900); continue; }
    break;
  }
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__test.clearLog());

  // A. Overworld snapshot
  out.overworld = await page.evaluate(() => window.__test.getState());

  // B. Open a notes minigame, waiting deterministically for it.
  const note = await page.evaluate(() =>
    window.__test.getState().nearby.find(e => e.kind === 'object' && e.type === 'notes') || null);
  if (note) {
    out.interactResult = await page.evaluate(id => window.__test.interact(id), note.id);
    out.waitForMinigame = await page.evaluate(() => window.__test.waitForMinigame(null, { timeoutMs: 15000 }));
    out.duringMinigame = await page.evaluate(() => window.__test.getState());
    out.minigameNamespace = await page.evaluate(() => window.__test.minigame.getState());
    await page.evaluate(() => window.__test.minigame.close());
    await page.evaluate(() => window.__test.waitForMinigameClosed({ timeoutMs: 10000 }));
  }

  // C. NPC dialogue snapshot
  const npc = await page.evaluate(() => window.__test.getState().nearby.find(e => e.kind === 'npc') || null);
  if (npc) {
    await page.evaluate(id => window.__test.interact(id), npc.id);
    await page.evaluate(() => window.__test.waitForMinigame('person-chat', { timeoutMs: 15000 }));
    await page.waitForTimeout(800);
    // advance to a point where choices are showing
    for (let i = 0; i < 25; i++) {
      const d = await page.evaluate(() => window.__test.getState().dialogue);
      if (!d || d.awaitingChoice) break;
      await page.evaluate(() => window.__test.minigame.continue());
      await page.waitForTimeout(450);
    }
    out.duringDialogue = await page.evaluate(() => window.__test.getState());
  }

  out.eventLog = await page.evaluate(() => window.__test.drainLog());
  fs.writeFileSync(process.env.OUT || '/tmp/capture.json', JSON.stringify(out, null, 2));
  console.log('captured ->', process.env.OUT || '/tmp/capture.json');
  await page.screenshot({ path: '/tmp/capture.png' });
  await browser.close();
})();
