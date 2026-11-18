// Live proof of the terminal phone skip (click / Space / Enter) on test-phone-terminal.
//
//   MODE=click|enter|back node tools/playtest/phone-terminal-skip-proof.mjs <gameId> <port> [outDir]
//
// click / enter: pick "Who are you?" on the terminal contact, press the control at MARKS ms (default 1400 and
//   2300, in the first line and in the pause), and report when the choices came back (a full reply takes about 7 s).
// back: pick the same, press Space once mid-reply, go Back before the lines end,
//   open the second contact (also terminal-themed here) and check its opening still types
//   out character by character.
// Also records the hint title on the thread. Drive only a game id new-game.rb printed in this run.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM
    || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const MODE = process.env.MODE || 'click';
const [gid, port = '3106', outDir = `${REPO_ROOT}tmp/press_skip_shots`] = process.argv.slice(2);
if (!gid) { console.error('usage: MODE=click|enter|back phone-terminal-skip-proof.mjs <gameId> <port> [outDir]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
const t = ms => page.waitForTimeout(ms);
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body && window.MinigameFramework && window.npcManager, null, { timeout: 90000 });
await t(2500);
for (let i = 0; i < 6; i++) {
    const busy = await page.evaluate(() => !!(window.MinigameFramework?.currentMinigame || window.__test.getState().blockingUi));
    if (!busy) break;
    await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} window.__test.dismissBlockingUi?.(); });
    await t(300);
}
await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
// In-memory only: put the handler on the terminal phone so the list has a second contact
await page.evaluate(() => { window.npcManager.getNPC('handler').phoneId = 'terminal_phone'; });
await page.evaluate(() => window.MinigameFramework.startMinigame('phone-chat', null, {
    phoneId: 'terminal_phone', npcIds: ['signal', 'handler'], title: 'Unknown Signal', theme: 'terminal' }));
await t(800);
const panel = () => page.evaluate(() => {
    const ti = document.querySelector('#typing-indicator');
    const bubbles = [...document.querySelectorAll('#messages-container .message-bubble')];
    const last = bubbles[bubbles.length - 1];
    return { bubbles: bubbles.length, lastLen: last ? last.textContent.length : 0,
        typingShown: !!ti && getComputedStyle(ti).display !== 'none',
        choices: document.querySelectorAll('#choices-container .choice-button').length,
        cursor: !!document.querySelector('.terminal-cursor') };
});
const waitChoices = async (ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await panel()).choices > 0) return Date.now() - t0; await t(100); } return null; };
const openContact = (name) => page.evaluate((n) => { const el = [...document.querySelectorAll('.contact-item')].find(e => e.textContent.includes(n)); el?.click(); return !!el; }, name);
const out = { mode: MODE, gid };
await openContact('UNKNOWN');
out.openingChoicesAfterMs = await waitChoices();
out.hintTitle = await page.evaluate(() => document.querySelector('#messages-container')?.getAttribute('title'));
await page.screenshot({ path: `${outDir}/${MODE}-0-menu.png` });
await page.evaluate(() => document.querySelector('#choices-container .choice-button').click());   // Who are you?
const t0 = Date.now();
const press = async (kind) => { if (kind === 'click') await page.evaluate(() => document.querySelector('#messages-container').click()); else await page.keyboard.press(kind === 'enter' ? 'Enter' : 'Space'); };
if (MODE === 'click' || MODE === 'enter') {
    const marks = (process.env.MARKS || "1400,2300").split(",").map(Number); const done = []; const log = [];
    let firstChoices = null;
    while (Date.now() - t0 < 30000) {
        const at = Date.now() - t0; const s = await panel();
        if (s.choices > 0) { firstChoices = at; break; }
        for (const m of marks) if (at >= m && !done.includes(m)) { done.push(m); await press(MODE); log.push({ at, before: s }); await page.screenshot({ path: `${outDir}/${MODE}-skip${done.length}.png` }); }
        await t(40);
    }
    out.presses = log.length; out.choicesAfterMs = firstChoices; out.log = log;
    await page.screenshot({ path: `${outDir}/${MODE}-choices.png` });
    out.lines = await page.evaluate(() => [...document.querySelectorAll('#messages-container .message-text')].map(e => e.textContent));
} else {
    await t(1400);
    await press('space'); await t(400);   // finish the first line; the pause before the next is running
    await page.screenshot({ path: `${outDir}/back-1-after-two-presses.png` });
    out.afterPresses = await panel();
    await page.evaluate(() => document.querySelector('#back-button, .back-button')?.click());
    await t(300);
    out.view = await page.evaluate(() => window.MinigameFramework.currentMinigame?.ui?.getCurrentView?.());
    await page.screenshot({ path: `${outDir}/back-2-list.png` });
    out.skipState = await page.evaluate(() => ({ skipAll: window.MinigameFramework.currentMinigame?._skipAll, instant: window.MinigameFramework.currentMinigame?.ui?._instantType }));
    await openContact('Handler');
    const samples = [];
    for (let i = 0; i < 60; i++) { samples.push(await panel()); await t(60); }
    out.handlerOpeningSamples = samples.filter((_, i) => i % 5 === 0);
    out.handlerTypedGradually = new Set(samples.map(s => s.lastLen)).size > 3 || samples.some(s => s.cursor);
    await page.screenshot({ path: `${outDir}/back-3-second-contact.png` });
}
out.errs = errs;
fs.writeFileSync(`${outDir}/${MODE}-report.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
