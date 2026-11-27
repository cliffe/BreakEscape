// Live proof: the press terminal (m02) shows something during the wait between the
// player's first pick and the next choices. Samples the panel every 250 ms and takes
// screenshots at fixed times. Headless, setFPS(20) with fixed steps on.
//
//   [SKIP_AT=500,1500 SKIP_KIND=click|space|enter] node tools/playtest/press-terminal-gap-proof.mjs <gameId> <port> <label> [outDir]
//
// SKIP_AT lists the ms after the pick at which to press the skip control (default none, the
// baseline). SKIP_KIND picks a click on the thread, Space or Enter.
//
// Drive only a game id new-game.rb printed in this run.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const NODE_MODULES = (process.env.PLAYWRIGHT_NODE_MODULES || `${REPO_ROOT}node_modules`).replace(/\/?$/, '/');
const require = createRequire(NODE_MODULES);
const { chromium } = require('playwright-core');
const EXEC = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM
    || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3106', label = 'run', outDir = `${REPO_ROOT}tmp/press_gap_shots`] = process.argv.slice(2);
if (!gid) { console.error('usage: press-terminal-gap-proof.mjs <gameId> <port> <label> [outDir]'); process.exit(2); }
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
await page.evaluate(() => window.MinigameFramework.startMinigame('phone-chat', null, {
    phoneId: 'press_terminal', npcIds: ['press_terminal_system'], title: 'Hospital Communications Terminal',
    theme: window.npcManager.getNPC('press_terminal_system')?.phoneTheme }));
await t(800);
await page.evaluate(() => document.querySelector('.contact-item')?.click());
const panel = () => page.evaluate(() => {
    const q = s => document.querySelector(s);
    const ti = q('#typing-indicator');
    const bubbles = [...document.querySelectorAll('#messages-container .message-bubble')];
    const last = bubbles[bubbles.length - 1];
    return { bubbles: bubbles.length, lastLen: last ? last.textContent.length : 0,
        typingShown: !!ti && getComputedStyle(ti).display !== 'none',
        choices: document.querySelectorAll('#choices-container .choice-button').length,
        cursor: !!q('.terminal-cursor') };
});
// Wait for the first choices (decision menu), possibly after typed text.
for (let i = 0; i < 120; i++) { if ((await panel()).choices > 0) break; await t(500); }
const menu = await page.evaluate(() => [...document.querySelectorAll('#choices-container .choice-button')].map(b => b.textContent.trim()));
await page.screenshot({ path: `${outDir}/${label}-0-menu.png` });
// First pick: the upload route.
const pick = await page.evaluate(() => {
    const bs = [...document.querySelectorAll('#choices-container .choice-button')];
    const i = bs.findIndex(b => /upload|send|expos|release|transmit/i.test(b.textContent));
    return i < 0 ? 0 : i;
});
const t0 = Date.now();
await page.evaluate(i => document.querySelectorAll('#choices-container .choice-button')[i].click(), pick);
const skipAt = (process.env.SKIP_AT || '').split(',').filter(Boolean).map(Number);
const skipKind = process.env.SKIP_KIND || 'click';
const skipsDone = []; const skipLog = [];
const samples = []; const shots = new Set();
let firstChoicesAt = null;
while (Date.now() - t0 < 40000) {
    const at = Date.now() - t0; const s = await panel(); samples.push({ at, ...s });
    for (const mark of [1000, 3000, 5000, 7000, 9000]) if (at >= mark && !shots.has(mark)) { shots.add(mark); await page.screenshot({ path: `${outDir}/${label}-${String(mark / 1000)}s.png` }); }
    if (s.choices > 0) { firstChoicesAt = at; break; }
    for (const m of skipAt) if (at >= m && !skipsDone.includes(m)) {
        skipsDone.push(m);
        if (skipKind === 'click') await page.evaluate(() => document.querySelector('#messages-container').click());
        else await page.keyboard.press(skipKind === 'enter' ? 'Enter' : 'Space');
        skipLog.push({ at, kind: skipKind, before: s });
        await page.screenshot({ path: `${outDir}/${label}-skip${skipsDone.length}.png` });
    }
    await t(skipAt.length ? 50 : 250);
}
await page.screenshot({ path: `${outDir}/${label}-choices.png` });
// "Empty" sample = no typing indicator, no cursor, and no change in the bubble text length.
let empty = 0, longestEmptyMs = 0, run = null, prev = null;
for (const s of samples) {
    const quiet = !s.typingShown && !s.cursor && s.choices === 0 && prev && prev.lastLen === s.lastLen && prev.bubbles === s.bubbles;
    if (quiet) { empty++; run = run ?? s.at; longestEmptyMs = Math.max(longestEmptyMs, s.at - run); } else run = null;
    prev = s;
}
const report = { gid, label, skipAt, skipKind, skips: skipLog.length, menu, picked: menu[pick], firstChoicesAtMs: firstChoicesAt, samples: samples.length, quietSamples: empty, longestQuietMs: longestEmptyMs, typingSamples: samples.filter(s => s.typingShown).length, errs };
fs.writeFileSync(`${outDir}/${label}-report.json`, JSON.stringify({ ...report, samples }, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
