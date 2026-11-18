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
  await page.evaluate(() => window.__test.throttleFps(20)); // fixed steps stay on
  await page.waitForTimeout(1500);
  // dismiss any Mission Brief / resume overlay so the phone can open
  for (const sel of ['#session-resume-btn', '.mission-brief-close', '.mission-brief-start']) {
    const el = await page.$(sel); if (el && await el.isVisible()) { await el.click(); await page.waitForTimeout(300); }
  }
  const send = (text, startKnot) => page.evaluate(({ id, text, startKnot }) => {
    window.npcManager.addMessage(id, 'npc', text, { isBark: true });
    const npc = window.npcManager.getNPC(id);
    window.barkSystem.showBark({ npcId: id, npcName: npc?.displayName, message: text, avatar: npc?.avatar, phoneId: npc?.phoneId, startKnot });
  }, { id: HAX, text, startKnot });
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
  const hud = () => page.evaluate(() => { const b = document.querySelector('.phone-badge'); return b ? (parseInt(b.textContent, 10) || 0) : 0; });
  const hudBefore = await hud();
  const haxBefore = await page.evaluate((id) => (window.npcManager.getConversationHistory(id) || [])
    .filter(m => !m.read && (m.type === 'npc' || (m.type === 'call' && m.callEvent === 'missed'))).length, HAX);
  const before = await barks();
  await send('Proof text one: eyes on the vault.');
  await page.waitForTimeout(1500);
  check((await barks()) === before, `${tag}: no toast for HaX while HaX's conversation is open`);
  check(await page.evaluate(() => document.body.innerText.includes('Proof text one')), `${tag}: the open thread shows the text`);
  const unread = () => page.evaluate((id) => (window.npcManager.getConversationHistory(id) || [])
    .filter(m => !m.read && (m.type === 'npc' || (m.type === 'call' && m.callEvent === 'missed'))).length, HAX);
  check((await unread()) === 0, `${tag}: HaX has 0 unread after the fold`);
  // Another contact may still have unread texts, so the badge need not vanish: its count
  // must equal the phone's total, and have dropped by HaX's own unread count
  const hudAfter = await hud();
  const total = await page.evaluate(() => { const m = window.MinigameFramework.currentMinigame; return window.npcManager.getTotalUnreadCount(m.phoneId, m.npcIds || null); });
  check(hudAfter === total, `${tag}: HUD badge (${hudAfter}) equals the phone's unread total (${total})`);
  check(hudBefore - hudAfter === haxBefore, `${tag}: HUD badge dropped by HaX's unread count (${hudBefore} -> ${hudAfter}, HaX had ${haxBefore})`);
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

  // M1: a text that names a knot is not folded: held while the thread is open, toast after close.
  // (M2, a text during a call: not scripted here. m01 has no __test route to start a call;
  // the ringer offer needs a mapping, and the unit test covers isCallMode / callActive.)
  await page.evaluate(() => window.barkSystem?.dismissAllBarks?.());
  await page.evaluate(() => window.__test.openInventoryItem?.('phone') || window.__test.openPhone?.());
  await page.waitForSelector('.phone-messages-container', { timeout: 20000 });
  await page.evaluate((id) => window.MinigameFramework.currentMinigame.openConversation(id), HAX);
  await page.waitForTimeout(1500);
  const b0 = await barks();
  await send('Proof text four: knot text, held.', 'first_ring');
  await page.waitForTimeout(1500);
  check((await barks()) === b0, `${tag}: knot text shows no toast while the thread is open`);
  check(!(await page.evaluate(() => document.body.innerText.includes('Proof text four'))), `${tag}: knot text is not folded into the thread`);
  await page.screenshot({ path: `${outdir}/${tag}-5-knot-held.png` });
  await page.evaluate(() => window.MinigameFramework.endMinigame(false, null));
  await page.waitForTimeout(4500);
  check((await barks()) > b0, `${tag}: knot text toast shows after the phone closes`);
  await page.screenshot({ path: `${outdir}/${tag}-6-knot-toast-after-close.png` });
  await page.close();
}

await run(1280, 720, 'desktop');
await run(390, 844, 'portrait');
await browser.close();
console.log(bad ? `${bad} FAILED` : 'all ok');
process.exit(bad ? 1 : 0);
