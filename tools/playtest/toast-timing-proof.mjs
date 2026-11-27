// Live proof: item toasts after an ink give_item (Ffion's badge) and a give_item reward, and a
// task toast, all raised while a panel is open, appear once, promptly after it closes.
//   FLAG1=<a m03 flag string from the game's flags> node tools/playtest/toast-timing-proof.mjs <gameId> <port>
// Drive only a game id new-game.rb printed in this run. Headless, setFPS(20), fixed steps on.
import { createRequire } from 'node:module';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.CHROMIUM || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3208'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
const t = ms => page.waitForTimeout(ms);
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body && window.eventDispatcher, null, { timeout: 90000 });
await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
await t(2500);
for (let i = 0; i < 10; i++) {
  const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame, bl: s.blockingUi }; });
  if (st.mg) { await page.evaluate(() => window.__test.minigame.close()); await t(800); continue; }
  if (st.bl) { await page.evaluate(l => window.__test.dismissBlockingUi(l), st.bl.buttons[0].label); await t(800); continue; }
  break;
}
// Record every toast that becomes visible: time (ms since start) and text
await page.evaluate(() => {
  window.__toastLog = []; const t0 = performance.now(); window.__t0 = t0;
  const seen = new WeakSet();
  const scan = () => {
    document.querySelectorAll('#notification-container .notification').forEach(el => {
      if (seen.has(el) || !el.classList.contains('show')) return;
      seen.add(el);
      window.__toastLog.push({ at: Math.round(performance.now() - t0), title: el.querySelector('.notification-title')?.textContent || '', text: el.querySelector('.notification-message')?.textContent || '' });
    });
  };
  setInterval(scan, 25);
});
const log = () => page.evaluate(() => window.__toastLog.slice());
const now = () => page.evaluate(() => Math.round(performance.now() - window.__t0));
const out = { gid, errs };
const inv = () => page.evaluate(() => (window.inventory.items || []).map(i => i.scenarioObject?.scenarioData?.name || i.scenarioData?.name));

// A. Ffion's badge through ink give_item
await page.evaluate(() => window.MinigameFramework.startMinigame('person-chat', null, { npcId: 'ffion_rees', title: 'Ffion Rees' }));
await t(2500);
out.chatOpen = await page.evaluate(() => !!window.MinigameFramework.currentMinigame);
const choices = await page.evaluate(() => [...document.querySelectorAll('.choice-button, .person-chat-choice, [class*=choice]')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 8));
out.choices = choices;
for (let i = 0; i < 10; i++) {   // advance until the sign-in choice shows
  const txt = await page.evaluate(() => document.body.innerText.includes('Where do I sign'));
  if (txt) break;
  await page.evaluate(() => { try { window.__test.minigame.continue?.(); } catch (e) {} const b = document.querySelector('.continue-button, [class*=continue]'); b?.click(); });
  await t(700);
}
await page.evaluate(() => { const el = [...document.querySelectorAll('button, div, li')].reverse().find(e => e.children.length === 0 && /Where do I sign/.test(e.textContent)); el?.click(); });
await t(3500);
out.invAfterChat = await inv();
out.toastsDuringChat = (await log()).map(x => x.text);
const closeAt = await now();
await page.evaluate(() => window.__test.minigame.close());
await t(4000);
out.badgeToasts = (await log()).filter(x => /Visitor Badge/.test(x.text)).map(x => ({ title: x.title, text: x.text, afterCloseMs: x.at - closeAt }));
await t(7000);

// B. give_item reward raised with a panel open (a flag station's own window)
await page.evaluate(() => window.MinigameFramework.startMinigame('notes', null, { title: 'Proof window' }));
await t(1500);
const before = (await log()).length;
out.reward = await page.evaluate(async (flag) => {
  const { applyActions } = await import('/break_escape/js/systems/apply-actions.js');
  const gid = location.pathname.split('/').pop();
  const meta = document.querySelector('meta[name="csrf-token"]');
  const r = await fetch(`/break_escape/games/${gid}/flags`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': meta ? meta.content : '' }, body: JSON.stringify({ flag, stationId: 'flag_station_dropsite' }) });
  const data = await r.json();
  if (data.rewards?.length) applyActions(data.rewards, { source: 'flag_reward', gameId: gid });
  return { status: r.status, success: data.success, rewardTypes: (data.rewards || []).map(x => x.type + ':' + (x.item?.name || x.taskId || '')) };
}, process.env.FLAG1);
await t(2000);
out.rewardDuringWindow = (await log()).slice(before).map(x => x.text);
const closeB = await now();
await page.evaluate(() => window.__test.minigame.close());
await t(4000);
out.rewardToasts = (await log()).slice(before).map(x => ({ title: x.title, text: x.text, afterCloseMs: x.at - closeB }));
out.invAfterReward = await inv();
await t(7000);

// C. task-tick toast raised while a chat is open: held, then shown once after it closes
await page.evaluate(() => window.MinigameFramework.startMinigame('person-chat', null, { npcId: 'ffion_rees', title: 'Ffion Rees' }));
await t(2500);
const beforeC = (await log()).length;
out.taskTick = await page.evaluate(() => {
  const om = window.objectivesManager;
  om.showTaskCompleteNotification({ title: 'Proof task tick' });
  return { chatOpen: !!window.MinigameFramework.currentMinigame };
});
await t(2000);
out.taskDuringChat = (await log()).slice(beforeC).map(x => x.text);
const closeC = await now();
await page.evaluate(() => window.__test.minigame.close());
await t(4000);
out.taskToasts = (await log()).slice(beforeC).map(x => ({ title: x.title, text: x.text, afterCloseMs: x.at - closeC }));
await t(1000);

out.all = await log();
console.log(JSON.stringify(out, null, 1));
await browser.close();
