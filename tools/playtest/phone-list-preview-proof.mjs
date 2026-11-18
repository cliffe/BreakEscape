// Live proof for the phone contact list refresh (fix/phone-list-preview): with the phone open on
// the contact list, a text, a missed call and a voicemail change the HaX row's preview, time and
// badge in place. m01 game on a keyless server. Run:
//   node tools/playtest/phone-list-preview-proof.mjs <game_url> <outdir>
// Texts are short (the preview cuts at 40 characters) and unique per run and viewport.
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
  const T = (n) => `P${RUN}${tag[0]} ${n}`; // under 40 characters, so the preview is the literal text
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.game?.loop && !!window.__test, null, { timeout: 90000 });
  await page.evaluate(() => window.__test.throttleFps(20)); // fixed steps stay on
  await page.waitForTimeout(1500);
  await openPhone(page, tag);
  await page.waitForTimeout(800);
  if ((await page.evaluate(() => window.MinigameFramework.currentMinigame?.ui?.getCurrentView?.())) !== 'contact-list') {
    await page.click('.back-button, #back-button, .phone-back-button').catch(() => {});
    await page.waitForTimeout(800);
  }
  const view = await page.evaluate(() => window.MinigameFramework.currentMinigame?.ui?.getCurrentView?.());
  check(view === 'contact-list', `${tag}: the phone is on the contact list (${view})`);

  // One snapshot of the list: HaX's preview, time, badge, class; every other row's text
  const snap = () => page.evaluate((id) => {
    const rows = Array.from(document.querySelectorAll('.contact-item'));
    const hax = rows.find(r => r.dataset.npcId === id);
    const q = (r, s) => r?.querySelector(s);
    return {
      has: !!hax,
      same: hax?.dataset.proofTag === 'row',
      preview: q(hax, '.contact-last-message')?.textContent ?? null,
      missed: !!q(hax, '.contact-last-message.missed'),
      time: q(hax, '.contact-time')?.textContent ?? null,
      badge: parseInt(q(hax, '.unread-badge')?.textContent || '0', 10) || 0,
      others: rows.filter(r => r !== hax).map(r => r.dataset.npcId + '|' + r.innerText).join('\n')
    };
  }, HAX);
  const tagRow = () => page.evaluate((id) => {
    const r = Array.from(document.querySelectorAll('.contact-item')).find(x => x.dataset.npcId === id);
    if (r) r.dataset.proofTag = 'row';
    return !!r;
  }, HAX);
  // The time the list should show: the phone's own formatter on the last non-narration history row
  const expectedTime = () => page.evaluate((id) => {
    const ui = window.MinigameFramework.currentMinigame.ui;
    const h = window.npcManager.getConversationHistory(id);
    return h.length ? ui.formatTimestamp(h[h.length - 1].timestamp) : '';
  }, HAX);
  check(await tagRow(), `${tag}: HaX has a row in the list`);

  // (a) a text through addMessage + showBark, then one through _deliverTimedMessage
  const viaBark = (text) => page.evaluate(({ id, text }) => {
    window.npcManager.addMessage(id, 'npc', text, { isBark: true });
    const npc = window.npcManager.getNPC(id);
    window.barkSystem.showBark({ npcId: id, npcName: npc?.displayName, message: text, avatar: npc?.avatar, phoneId: npc?.phoneId });
  }, { id: HAX, text });
  const viaTimed = (text) => page.evaluate(({ id, text }) => {
    const npc = window.npcManager.getNPC(id);
    return window.npcManager._deliverTimedMessage({ npcId: id, text, phoneId: npc?.phoneId });
  }, { id: HAX, text });
  const textCase = async (label, text, push) => {
    const before = await snap();
    await push(text);
    await page.waitForTimeout(600);
    const after = await snap();
    check(after.preview === text, `${tag}: ${label}: HaX preview is the literal text (${JSON.stringify(after.preview)})`);
    check(after.time === (await expectedTime()), `${tag}: ${label}: time matches the last history row (${after.time})`);
    check(after.badge === before.badge + 1, `${tag}: ${label}: badge rose by one (${before.badge} -> ${after.badge})`);
    check(after.same, `${tag}: ${label}: the HaX row node is the same node`);
    check(after.others === before.others, `${tag}: ${label}: other rows are unchanged`);
    await page.screenshot({ path: `${outdir}/${tag}-${label.replace(/\W+/g, '-')}.png` });
  };
  await textCase('bark text', T('bark'), viaBark);
  await textCase('timed text', T('timed'), viaTimed);

  // (b) a missed call
  {
    const before = await snap();
    await page.evaluate((id) => window.npcManager.addCallRow(id, 'missed'), HAX);
    await page.waitForTimeout(600);
    const after = await snap();
    check(after.preview === 'Missed call', `${tag}: missed call: preview is "Missed call" (${JSON.stringify(after.preview)})`);
    check(after.missed, `${tag}: missed call: the preview has the missed class`);
    check(after.badge === before.badge + 1, `${tag}: missed call: badge +1 (${before.badge} -> ${after.badge})`);
    check(after.same && after.others === before.others, `${tag}: missed call: same HaX node, other rows unchanged`);
    await page.screenshot({ path: `${outdir}/${tag}-missed-call.png` });
  }

  // (c) a voicemail: the call row, then its lines, in one tick
  {
    const before = await snap();
    const last = T('voicemail last');
    await page.evaluate(({ id, a, b }) => {
      window.npcManager.addCallRow(id, 'voicemail');
      window.npcManager.addMessage(id, 'npc', a, { isBark: true });
      window.npcManager.addMessage(id, 'npc', b, { isBark: true });
    }, { id: HAX, a: T('voicemail first'), b: last });
    await page.waitForTimeout(600);
    const after = await snap();
    check(after.preview === last, `${tag}: voicemail: preview shows the last line (${JSON.stringify(after.preview)})`);
    check(after.badge === before.badge + 2, `${tag}: voicemail: badge counts the two lines (${before.badge} -> ${after.badge})`);
    check(after.same && after.others === before.others, `${tag}: voicemail: same HaX node, other rows unchanged`);
    await page.screenshot({ path: `${outdir}/${tag}-voicemail.png` });
  }

  // (d) a hostile text is plain text
  {
    const hostile = '<img src=x onerror="window.__p=1">';
    await page.evaluate(({ id, t }) => window.npcManager.addMessage(id, 'npc', t, { isBark: true }), { id: HAX, t: hostile });
    await page.waitForTimeout(500);
    const after = await snap();
    check(after.preview === hostile, `${tag}: hostile text shows as literal text (${JSON.stringify(after.preview)})`);
    check(await page.evaluate(() => typeof window.__p === 'undefined'), `${tag}: window.__p is undefined after 500 ms`);
    await page.screenshot({ path: `${outdir}/${tag}-hostile.png` });
  }
  await page.close();
}

await run(1280, 720, 'desktop');
await run(844, 390, 'landscape');
await run(390, 844, 'portrait');
await browser.close();
console.log(bad ? `${bad} FAILED` : 'all ok');
process.exit(bad ? 1 : 0);
