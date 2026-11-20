// Screenshot the in-game HUD, optionally under a given UI theme.
//   [VW=1400 VH=900 DPR=1 HOVER=<selector> MENU=audio|display|controls KEEP_UI=1 (leave start-up dialogs open)
//    KEEP_UI=dialogs (close minigames, wait for and keep the first dialog)] node tools/playtest/hud-shot.js <game_url> <out.png> [theme]
const { chromium } = require('playwright');
const [url, out, theme] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: +(process.env.VW || 1400), height: +(process.env.VH || 900) },
    deviceScaleFactor: +(process.env.DPR || 1),
  });
  const u = new URL(url);
  u.searchParams.set('skip_resume', '1');
  if (theme) u.searchParams.set('ui_theme', theme);
  await page.goto(u.toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 30000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 60000 }));
  for (let i = 0; i < (process.env.KEEP_UI === '1' ? 0 : 80); i++) {
    const s = await page.evaluate(() => window.__test.getState());
    if (process.env.KEEP_UI === 'dialogs' && !s.activeMinigame) {
      if (s.blockingUi) break;
      await page.waitForTimeout(500); continue;
    }
    if (s.activeMinigame) { await page.evaluate(() => window.__test.minigame.close()); await page.waitForTimeout(500); continue; }
    if (s.blockingUi) {
      const pick = s.blockingUi.buttons.map(x => x.label).find(l => /no,|figure it out|resume|skip/i.test(l)) || s.blockingUi.buttons[0].label;
      await page.evaluate(l => window.__test.dismissBlockingUi(l), pick); await page.waitForTimeout(700); continue;
    }
    break;
  }
  await page.waitForTimeout(1500);
  if (process.env.HOVER) await page.hover(process.env.HOVER).catch(() => {});
  if (process.env.MENU) {
    await page.mouse.move(5, 300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page.click(`.game-menu-item[data-page="${process.env.MENU}"]`).catch(e => console.error('menu page:', e.message));
    await page.waitForTimeout(300);
    console.log('menu open:', await page.evaluate(() => window.gameMenu?.isOpen));
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
