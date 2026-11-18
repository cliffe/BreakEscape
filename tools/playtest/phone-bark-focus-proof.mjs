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
const RUN = Date.now().toString(36).slice(-4); // texts are unique per run and viewport: a game keeps its history
const browser = await chromium.launch();


// Open the player's phone through the bridge. A fresh game first shows the resume overlay,
// the title screen, Agent HaX's intro chat and the Mission Brief; clear each in turn, then
// open the phone and fail with the bridge's reason if it never opens.
async function openPhone(page, tag) {
  let last = null;
  const trail = [];
  for (let i = 0; i < 40; i++) {
    last = await page.evaluate(() => window.__test.openInventoryItem('phone'));
    // On a fresh load the Mission Brief opens over the phone click: it counts as a miss.
    if (last?.ok && last?.opened?.id === 'notes') last = { ok: false, reason: 'minigame-active', activeMinigame: { id: 'notes' } };
    if (last?.ok) {
      try {
        await page.waitForSelector('.phone-messages-container', { timeout: 20000 });
      } catch (e) {
        const seen = await page.evaluate(() => ({ mg: window.MinigameFramework?.currentMinigame?.constructor?.name || null, dm: document.querySelector('[data-minigame]')?.getAttribute('data-minigame') || null }));
        throw new Error(`${tag}: openInventoryItem said ok but no phone UI: ${JSON.stringify(last).slice(0, 500)} seen ${JSON.stringify(seen)} trail ${trail.slice(-8).join(' | ')}`);
      }
      return;
    }
    const blocked = last?.reason === 'blocking-ui' || last?.reason === 'minigame-active' || last?.reason === 'item-obscured' || last?.reason === 'no-inventory-item-matching';
    if (!blocked) break;
    // Pick the intro choice that ends HaX's chat; otherwise the plain dismiss; the session overlay wants "Resume".
    if (last?.activeMinigame?.id === 'notes') { // the Mission Brief closes through the minigame handle
      const c = await page.evaluate(() => window.__test.minigame.close());
      trail.push(`notes>close:${c?.ok ?? c?.reason ?? '?'}`);
      await page.waitForTimeout(1500);
      continue;
    }
    const miss = (d) => !d || String(d.reason || '').startsWith('no-button-matching');
    let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume'));
    if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi('figure it out')); // tutorial offer
    if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi('ready'));
    if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi());
    // An intro chat whose choices name neither Resume nor ready: take the last choice (1-based).
    if (d?.reason === 'ambiguous-blocking-ui' && last?.activeMinigame?.id === 'person-chat') d = await page.evaluate(() => window.__test.minigame.chooseIndex(2));
    // The title screen has no buttons: it continues on Space.
    if (d?.reason === 'blocking-ui-has-no-buttons') await page.keyboard.press('Space');
    trail.push(`${last?.activeMinigame?.id || last?.reason}>${d?.clicked || d?.reason || (d?.ok ? 'ok' : '?')}`);
    await page.waitForTimeout(1500);
  }
  throw new Error(`${tag}: could not open the phone: ${JSON.stringify(last).slice(0, 600)} trail ${trail.slice(-12).join(' | ')}`);
}

async function run(w, h, tag) {
  const P = `Proof ${RUN} ${tag}`;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.game?.loop && !!window.__test, null, { timeout: 90000 });
  await page.evaluate(() => window.__test.throttleFps(20)); // fixed steps stay on
  await page.waitForTimeout(1500);
  const send = (text, startKnot, skipAdd) => page.evaluate(({ id, text, startKnot, skipAdd }) => {
    if (!skipAdd) window.npcManager.addMessage(id, 'npc', text, { isBark: true });
    const npc = window.npcManager.getNPC(id);
    window.barkSystem.showBark({ npcId: id, npcName: npc?.displayName, message: text, avatar: npc?.avatar, phoneId: npc?.phoneId, startKnot });
  }, { id: HAX, text, startKnot, skipAdd });
  const barks = () => page.evaluate(() => document.querySelectorAll('#npc-bark-container .npc-bark').length);
  const active = () => page.evaluate(() => { const a = document.activeElement; return a ? (a.className || a.id || a.tagName) + '' : null; });

  // A1: open the phone (list or HaX thread) and look at focus
  await openPhone(page, tag);
  await page.waitForTimeout(800);
  const inside = await page.evaluate(() => !!document.activeElement?.closest?.('.phone-messages-container'));
  check(inside, `${tag}: focus is inside the phone on open (${await active()})`);
  await page.keyboard.press('Tab');
  // The phone's own X and Notepad buttons sit outside .phone-messages-container but inside the phone.
  const tabInside = await page.evaluate(() => !!document.activeElement?.closest?.('[data-minigame="phone-chat"]'));
  check(tabInside && !(await page.evaluate(() => document.activeElement?.classList?.contains('npc-bark-dismiss'))),
    `${tag}: first Tab stays in the phone (${await active()})`);
  await page.screenshot({ path: `${outdir}/${tag}-1-phone-open.png` });

  // A11: open HaX's conversation, send the next HaX message, expect no toast
  await page.evaluate((id) => window.MinigameFramework.currentMinigame.openConversation(id), HAX);
  await page.waitForTimeout(1500);
  const hud = () => page.evaluate(() => { const b = document.querySelector('.phone-badge'); return b ? (parseInt(b.textContent, 10) || 0) : 0; });
  const total = () => page.evaluate(() => { const m = window.MinigameFramework.currentMinigame; return window.npcManager.getTotalUnreadCount(m.phoneId, m.allowedNpcIds || null); });
  const before = await barks();
  // Add the history row first (unread), sample the phone's unread total, then deliver the bark
  // so the fold has something to mark read: the drop is measured across the fold itself.
  await page.evaluate(({ id, t }) => window.npcManager.addMessage(id, 'npc', t, { isBark: true }), { id: HAX, t: `${P} one: eyes on the vault.` });
  const totalBefore = await total();
  const haxBefore = await page.evaluate((id) => (window.npcManager.getConversationHistory(id) || [])
    .filter(m => !m.read && (m.type === 'npc' || (m.type === 'call' && m.callEvent === 'missed'))).length, HAX);
  check(haxBefore >= 1, `${tag}: the proof text is unread before the fold (HaX unread ${haxBefore})`);
  await send(`${P} one: eyes on the vault.`, undefined, true);
  await page.waitForTimeout(1500);
  check((await barks()) === before, `${tag}: no toast for HaX while HaX's conversation is open`);
  check(await page.evaluate((t) => document.body.innerText.includes(t), `${P} one`), `${tag}: the open thread shows the text`);
  const unread = () => page.evaluate((id) => (window.npcManager.getConversationHistory(id) || [])
    .filter(m => !m.read && (m.type === 'npc' || (m.type === 'call' && m.callEvent === 'missed'))).length, HAX);
  check((await unread()) === 0, `${tag}: HaX has 0 unread after the fold`);
  // Another contact may still have unread texts, so the badge need not vanish: its count
  // must equal the phone's total, and have dropped by HaX's own unread count
  const hudAfter = await hud();
  const totalAfter = await total();
  check(hudAfter === totalAfter, `${tag}: HUD badge (${hudAfter}) equals the phone's unread total (${totalAfter})`);
  check(totalBefore - totalAfter === haxBefore, `${tag}: unread total dropped by HaX's unread count across the fold (${totalBefore} -> ${totalAfter}, HaX had ${haxBefore})`);
  await page.screenshot({ path: `${outdir}/${tag}-2-open-thread-no-toast.png` });
  check(await page.evaluate(() => !!document.activeElement?.closest?.('.phone-messages-container')), `${tag}: focus still in the phone after the text`);

  // Back to the list: the toast shows
  await page.click('.back-button, #back-button, .phone-back-button').catch(() => {});
  await page.waitForTimeout(800);
  await send(`${P} two: list view toast.`);
  await page.waitForTimeout(1500);
  const onList = await page.evaluate(() => window.MinigameFramework.currentMinigame?.ui?.getCurrentView?.());
  check(onList === 'contact-list', `${tag}: phone is on the contact list (${onList})`);
  // Wide screens keep texts on top of the open list; the phone layout (body.hud-compact) holds
  // every bark while the phone is open (npc-barks.js _shouldDefer), shown after it closes.
  const compact = await page.evaluate(() => document.body.classList.contains('hud-compact'));
  if (compact) check((await barks()) === before, `${tag}: phone layout holds the list-view toast while the phone is open (shown after close, below)`);
  else check((await barks()) > before, `${tag}: toast shows for HaX on the list view`);
  await page.screenshot({ path: `${outdir}/${tag}-3-list-toast.png` });

  // Closed phone: the toast shows
  await page.evaluate(() => window.MinigameFramework.endMinigame(false, null));
  await page.waitForTimeout(800);
  await send(`${P} three: phone closed.`);
  await page.waitForTimeout(1500);
  check((await barks()) > 0, `${tag}: toast shows with the phone closed`);
  await page.screenshot({ path: `${outdir}/${tag}-4-closed-toast.png` });

  // M1: a text that names a knot is not folded: held while the thread is open, toast after close.
  // (M2, a text during a call: not scripted here. m01 has no __test route to start a call;
  // the ringer offer needs a mapping, and the unit test covers isCallMode / callActive.)
  await page.evaluate(() => window.barkSystem?.dismissAllBarks?.());
  await openPhone(page, tag);
  await page.evaluate((id) => window.MinigameFramework.currentMinigame.openConversation(id), HAX);
  await page.waitForTimeout(1500);
  const b0 = await barks();
  await send(`${P} four: knot text, held.`, 'first_ring');
  await page.waitForTimeout(1500);
  check((await barks()) === b0, `${tag}: knot text shows no toast while the thread is open`);
  check(!(await page.evaluate((t) => document.body.innerText.includes(t), `${P} four`)), `${tag}: knot text is not folded into the thread`);
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
