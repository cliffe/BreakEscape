// Live proof for the m03 blind-playtest fixes: decode-watch task ticks, Training Lab Terminal
// flag note, creditsOverlay text. Headless, setFPS(20) with fixed steps on.
//   node tools/playtest/m03-blind-fixes-proof.mjs <gameId> <port>
// Drive only a game id new-game.rb printed in this run.
import { createRequire } from 'node:module';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.CHROMIUM || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3109'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
const t = ms => page.waitForTimeout(ms);
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body && window.eventDispatcher, null, { timeout: 90000 });
await t(2500);
await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} });
const out = { gid, errs };
const task = id => page.evaluate(i => { for (const a of window.objectivesManager.aims) for (const k of a.tasks) if (k.taskId === i) return k.status + ' | ' + k.title; return 'none'; }, id);
out.before = { board: await task('decode_whiteboard'), roster: await task('decode_client_roster'),
  inv: await page.evaluate(() => (window.inventory.items || []).map(i => i.scenarioObject?.scenarioData?.type || i.scenarioData?.type)) };
// 1. Opening alone does not tick: fire the read globals the old tick keyed on.
await page.evaluate(() => { for (const n of ['whiteboard_seen', 'roster_seen']) { window.gameState.globalVariables[n] = true; window.eventDispatcher.emit(`global_variable_changed:${n}`, { name: n, value: true }); } });
await t(500);
out.afterOpenOnly = { board: await task('decode_whiteboard'), roster: await task('decode_client_roster') };
// 2. Open CyberChef and load a recipe by URL hash (decodes the hex roster).
await page.evaluate(() => window.openCryptoWorkstation());
await t(6000);
const hex = [...new TextEncoder().encode("ZERO DAY: ACTIVE CLIENT ROSTER (export)\n- GHOST / Ransomware Incorporated: healthcare package, DELIVERED")].map(b => b.toString(16).padStart(2, '0')).join('');
out.hexFound = !!hex;
const wrong = await page.evaluate(h => { document.getElementById('cyberchef-frame').src = '/break_escape/assets/cyberchef/CyberChef_v10.19.4.html#recipe=From_Base64(\'A-Za-z0-9%2B/%3D\',true,false)&input=' + btoa(h); return 'wrong recipe'; }, hex);
await t(5000);
out.outputWrong = await page.evaluate(() => (document.getElementById('cyberchef-frame').contentDocument.querySelector('#output-text .cm-content')?.innerText || '').slice(0, 60));
out.afterWrongRecipe = await task('decode_client_roster');
const fr = page.frameLocator('#cyberchef-frame');
await fr.locator('#input-text .cm-content').click();
await page.keyboard.insertText(hex);
await t(2500);
out.outputWrongWithInput = await page.evaluate(() => (document.getElementById('cyberchef-frame').contentDocument.querySelector('#output-text .cm-content')?.innerText || '').slice(0, 40));
out.afterWrongRecipe = await task('decode_client_roster');
await fr.locator('#rec-list .operation').first().hover();
await page.evaluate(() => { const d = document.getElementById('cyberchef-frame').contentDocument; d.querySelector('#rec-list .operation .disable-icon, #rec-list .operation .bakery-disable')?.click(); });
await page.evaluate(() => { const w = document.getElementById('cyberchef-frame').contentWindow; w.location.hash = w.location.hash.replace(/recipe=[^&]*/, "recipe=From_Hex('Auto')"); });
await t(7000);
out.outputRight = await page.evaluate(() => (document.getElementById('cyberchef-frame').contentDocument.querySelector('#output-text .cm-content')?.innerText || '').slice(0, 60));
await t(1500);
out.afterHexDecode = { board: await task('decode_whiteboard'), roster: await task('decode_client_roster'), rosterDecoded: await page.evaluate(() => window.gameState.globalVariables.roster_decoded) };
await page.screenshot({ path: process.env.SHOT_DIR + '/cc.png' });
await page.evaluate(() => window.closeLaptop());
// 3. Training Lab Terminal panel.
await page.evaluate(() => { const sc = window.gameScenario; let o = null; for (const r of Object.values(window.rooms || {})) for (const x of Object.values(r.objects || {})) { const d = x.scenarioData; if (d && d.type === 'vm-launcher') o = d; } window.MinigameFramework.startMinigame('vm-launcher', null, { title: o.name, vm: o.vm, hacktivityMode: false, stationId: o.id, showPostit: true, postitNote: o.postitNote, flagNote: o.flagNote || '' }); });
await t(1500);
out.panel = await page.evaluate(() => (document.querySelector('.vm-flag-note')?.innerText) || 'MISSING');
await page.screenshot({ path: process.env.SHOT_DIR + '/panel.png' });
// 4. creditsOverlay in the loaded scenario.
out.creditsOverlay = await page.evaluate(async () => { const j = await (await fetch(`/break_escape/games/${location.pathname.split('/').pop()}/scenario`, { headers: { Accept: 'application/json' } })).json(); return (j.scenario || j).creditsOverlay; });
console.log(JSON.stringify(out, null, 1));
await browser.close();
