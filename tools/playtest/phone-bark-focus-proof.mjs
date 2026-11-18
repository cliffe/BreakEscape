// Live proof for A1 (focus into the phone) and A11 (no toast for the open conversation).
// m01 game on a keyless server (:3226). Run (NOT yet; live runs on hold):
//   node tools/playtest/phone-bark-focus-proof.mjs <game_url> <outdir>
// The HaX text goes the way an event mapping sends it: npcManager.addMessage then barkSystem.showBark.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [url, outdir] = process.argv.slice(2);
let bad = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) bad++; };
const HAX = 'agent_0x99';
const browser = await chromium.launch();

async function run(w, h, tag) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.game?.loop && !!window.__test, null, { timeout: 90000 });
  await page.evaluate(() => { const l = window.game.loop; l.fpsLimit = 20; l.hasFpsLimit = true; window.game.physics?.world?.setFPS?.(20); });
  await page.waitForTimeout(1500);
  // dismiss any Mission Brief / resume overlay so the phone can open
  for (const sel of ['#session-resume-btn', '.mission-brief-close', '.mission-brief-start']) {
    const el = await page.$(sel); if (el && await el.isVisible()) { await el.click(); await page.waitForTimeout(300); }
  }
  const send = (text) => page.evaluate(({ id, text }) => {
    window.npcManager.addMessage(id, 'npc', text, { isBark: true });
    const npc = window.npcManager.getNPC(id);
    window.barkSystem.showBark({ npcId: id, npcName: npc?.displayName, message: text, avatar: npc?.avatar, phoneId: npc?.phoneId });
  }, { id: HAX, text });
  const barks = () => page.evaluate(() => document.querySelectorAll('#npc-bark-container .npc-bark').length);
  const active = () => page.evaluate(() => { const a = document.activeElement; return a ? (a.className || a.id || a.tagName) + '' : null; });

  // A1: open the phone (list or HaX thread) and look at focus
  await page.evaluate(() => window.__test.openInventoryItem?.('phone') || window.__test.openPhone?.());
  await page.waitForSelector('.phone-messages-container', { timeout: 20000 });
  await page.waitForTimeout(800);
  const inside = await page.evaluate(() => !!document.activeElement?.closest?.('.phone-messages-container'));
  check(inside, `${tag}: focus is inside the phone on open (${await active()})`);
  await page.keyboard.press('Tab');
  const tabInside = await page.evaluate(() => !!document.activeElement?.closest?.('.phone-messages-container'));
  check(tabInside && !(await page.evaluate(() => document.activeElement?.classList?.contains('npc-bark-dismiss'))),
    `${tag}: first Tab stays in the phone (${await active()})`);
  await page.screenshot({ path: `${outdir}/${tag}-1-phone-open.png` });

  // A11: open HaX's conversation, send the next HaX message, expect no toast
  await page.evaluate((id) => window.MinigameFramework.currentMinigame.openConversation(id), HAX);
  await page.waitForTimeout(1500);
  const before = await barks();
  await send('Proof text one: eyes on the vault.');
  await page.waitForTimeout(1500);
  check((await barks()) === before, `${tag}: no toast for HaX while HaX's conversation is open`);
  check(await page.evaluate(() => document.body.innerText.includes('Proof text one')), `${tag}: the open thread shows the text`);
  await page.screenshot({ path: `${outdir}/${tag}-2-open-thread-no-toast.png` });
  check(await page.evaluate(() => !!document.activeElement?.closest?.('.phone-messages-container')), `${tag}: focus still in the phone after the text`);

  // Back to the list: the toast shows
  await page.click('.back-button, #back-button, .phone-back-button').catch(() => {});
  await page.waitForTimeout(800);
  await send('Proof text two: list view toast.');
  await page.waitForTimeout(1500);
  const onList = await page.evaluate(() => window.MinigameFramework.currentMinigame?.ui?.getCurrentView?.());
  check(onList === 'contact-list', `${tag}: phone is on the contact list (${onList})`);
  check((await barks()) > before, `${tag}: toast shows for HaX on the list view`);
  await page.screenshot({ path: `${outdir}/${tag}-3-list-toast.png` });

  // Closed phone: the toast shows
  await page.evaluate(() => window.MinigameFramework.endMinigame(false, null));
  await page.waitForTimeout(800);
  await send('Proof text three: phone closed.');
  await page.waitForTimeout(1500);
  check((await barks()) > 0, `${tag}: toast shows with the phone closed`);
  await page.screenshot({ path: `${outdir}/${tag}-4-closed-toast.png` });
  await page.close();
}

await run(1280, 720, 'desktop');
await run(390, 844, 'portrait');
await browser.close();
console.log(bad ? `${bad} FAILED` : 'all ok');
process.exit(bad ? 1 : 0);
