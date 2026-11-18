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
    // ok:false with a minigame up (or the Mission Brief) is a blocker to clear, whatever the reason
    const blocker = last && !last.ok && (last.activeMinigame || last.opened?.id === 'notes');
    if (last?.ok) {
      try {
        await page.waitForSelector('.phone-messages-container', { timeout: 20000 });
      } catch (e) {
        const seen = await page.evaluate(() => ({ mg: window.MinigameFramework?.currentMinigame?.constructor?.name || null, dm: document.querySelector('[data-minigame]')?.getAttribute('data-minigame') || null }));
        throw new Error(`${tag}: openInventoryItem said ok but no phone UI: ${JSON.stringify(last).slice(0, 500)} seen ${JSON.stringify(seen)} trail ${trail.slice(-8).join(' | ')}`);
      }
      return;
    }
    const blocked = last?.reason === 'blocking-ui' || last?.reason === 'minigame-active' || last?.reason === 'item-obscured' || last?.reason === 'no-inventory-item-matching' || last?.reason === 'wrong-target-opened' || last?.reason === 'unrelated-overlay';
    if (!blocked && !blocker) break;
    // Pick the intro choice that ends HaX's chat; otherwise the plain dismiss; the session overlay wants "Resume".
    if (last?.activeMinigame?.id === 'notes' || last?.opened?.id === 'notes') { // the Mission Brief closes through the minigame handle
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
    // The session overlay can come up without a Resume button (X and Start over): X closes it, Start over would reset the game
    if (d?.blocker?.id === 'session-resume-overlay') d = await page.evaluate(() => window.__test.dismissBlockingUi('X'));
    // An intro chat whose choices name neither Resume nor ready: take the last choice (1-based).
    if (d?.reason === 'ambiguous-blocking-ui' && last?.activeMinigame?.id === 'person-chat') d = await page.evaluate(() => window.__test.minigame.chooseIndex(2));
    // The title screen minigame can show up as an ambiguous blocker: Space continues it too
    if (last?.activeMinigame?.id === 'title-screen') await page.keyboard.press('Space');
    // The title screen has no buttons: it continues on Space.
    if (d?.reason === 'blocking-ui-has-no-buttons') await page.keyboard.press('Space');
    trail.push(`${last?.activeMinigame?.id || last?.reason}>${d?.clicked || d?.reason || (d?.ok ? 'ok' : '?')}[${d?.blocker?.id || d?.blocker?.classes || ''}:${(d?.blocker?.buttons || []).map(b => b.label).join('/')}]`);
    await page.waitForTimeout(1500);
  }
  throw new Error(`${tag}: could not open the phone: ${JSON.stringify(last).slice(0, 600)} trail ${trail.slice(-12).join(' | ')}`);
}

async function run(w, h, tag) {
  const T = (n) => `P${RUN}${tag[0]} ${n}`; // under 40 characters, so the preview is the literal text
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const t00 = Date.now(); const step = (m) => console.log(`[${((Date.now() - t00) / 1000).toFixed(0)}s] ${tag}: ${m}`);
  const errs = [];
  page.on('pageerror', (e) => { errs.push(String(e).slice(0, 300)); console.log('PAGEERROR ' + tag + ': ' + String(e).slice(0, 300)); });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // A game made without a character can show the picker: choose female_hacker_hood_v2 (as ring-banner-probe.mjs does)
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate(() => !!window.game?.sys?.game?.loop && !!window.__test).catch(() => false)) break;
    // A game with saved state shows the resume overlay before the loop exists: take Resume (the second and later viewports always see it)
    const dr = await page.evaluate(() => window.__test?.dismissBlockingUi?.('Resume')).catch(() => null);
    if (dr?.reason === 'blocking-ui-has-no-buttons' || dr?.stillBlocked) await page.keyboard.press('Space'); // the title screen continues on Space
    const pick = await page.$('[data-character="female_hacker_hood_v2"], [data-key="female_hacker_hood_v2"], [data-sprite="female_hacker_hood_v2"]');
    if (pick) {
      await pick.click().catch(() => {});
      const go = await page.$('button:has-text("Start"), button:has-text("Confirm"), button:has-text("Play")');
      if (go) await go.click().catch(() => {});
    }
    await page.waitForTimeout(1000);
  }
  await page.waitForFunction(() => !!window.game?.sys?.game?.loop && !!window.__test, null, { timeout: 240000 });
  step('game ready');
  await page.evaluate(() => window.__test.throttleFps(20)); // fixed steps stay on
  await page.waitForTimeout(1500);
  await openPhone(page, tag);
  step('phone open');
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
      // name and preview only: the time text is wall-clock relative ("Just now", "1m") and drifts
      others: rows.filter(r => r !== hax).map(r => r.dataset.npcId + '|' + (q(r, '.contact-name')?.textContent ?? '') + '|' + (q(r, '.contact-last-message')?.textContent ?? '')).join('\n')
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
  // m01 has timed HaX texts that would move the badge and preview mid-case: wait until every
  // time-triggered one is delivered (event-triggered ones, triggerTime null, do not fire by themselves)
  const pending = () => page.evaluate((id) => window.npcManager.timedMessages.filter(m => m.npcId === id && m.triggerTime !== null && !m.delivered).length, HAX);
  const t0 = Date.now();
  while ((await pending()) > 0 && Date.now() - t0 < 180000) await page.waitForTimeout(1000);
  const left = await pending();
  check(left === 0, `${tag}: HaX timed messages all delivered before the cases (${left} left)`);
  await page.waitForTimeout(1000);

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

  // (e) a later text clears the missed styling
  {
    await page.evaluate((id) => window.npcManager.addCallRow(id, 'missed'), HAX);
    await page.waitForTimeout(600);
    const m = await snap();
    check(m.missed && m.preview === 'Missed call', `${tag}: missed again: shows Missed call with the missed class`);
    const text = T('after missed');
    await page.evaluate(({ id, t }) => window.npcManager.addMessage(id, 'npc', t, { isBark: true }), { id: HAX, t: text });
    await page.waitForTimeout(600);
    const after = await snap();
    check(after.preview === text && !after.missed, `${tag}: later text replaces the preview and clears the missed class (${JSON.stringify(after.preview)}, missed ${after.missed})`);
    await page.screenshot({ path: `${outdir}/${tag}-missed-cleared.png` });
  }

  // (f) scroll position is kept when a row updates: squeeze the list so it overflows (test-only CSS), scroll, push a text
  {
    await page.evaluate(() => { const l = document.getElementById('contact-list'); l.style.maxHeight = '70px'; l.style.overflowY = 'auto'; });
    await page.waitForTimeout(300);
    const geo = await page.evaluate(() => { const l = document.getElementById('contact-list'); l.scrollTop = 25; return { top: l.scrollTop, sh: l.scrollHeight, ch: l.clientHeight }; });
    check(geo.sh > geo.ch && geo.top > 0, `${tag}: list overflows and is scrolled (scrollTop ${geo.top}, ${geo.sh}/${geo.ch})`);
    await page.evaluate(({ id, t }) => window.npcManager.addMessage(id, 'npc', t, { isBark: true }), { id: HAX, t: T('while scrolled') });
    await page.waitForTimeout(600);
    const top2 = await page.evaluate(() => document.getElementById('contact-list').scrollTop);
    const s2 = await snap();
    check(top2 === geo.top && s2.preview === T('while scrolled'), `${tag}: scrollTop kept at ${geo.top} after a row update (now ${top2})`);
    await page.screenshot({ path: `${outdir}/${tag}-scroll-kept.png` });
    await page.evaluate(() => { const l = document.getElementById('contact-list'); l.style.maxHeight = ''; l.style.overflowY = ''; });
  }

  // (g) open the thread and go back: counts are right
  {
    const pre = await snap();
    await page.evaluate((id) => Array.from(document.querySelectorAll('.contact-item')).find(r => r.dataset.npcId === id).click(), HAX);
    await page.waitForTimeout(1500);
    const inThread = await page.evaluate(() => window.MinigameFramework.currentMinigame?.ui?.getCurrentView?.());
    check(inThread === 'conversation', `${tag}: clicking the row opens the thread (${inThread})`);
    await page.screenshot({ path: `${outdir}/${tag}-thread.png` });
    await page.click('#back-button').catch(() => {});
    await page.waitForTimeout(1200);
    const back = await snap();
    const view2 = await page.evaluate(() => window.MinigameFramework.currentMinigame?.ui?.getCurrentView?.());
    console.log(`     note ${tag}: badge before thread ${pre.badge}, after back ${back.badge}, preview ${JSON.stringify(back.preview)}`);
    check(view2 === 'contact-list' && back.badge === 0, `${tag}: back on the list with the HaX badge cleared (${pre.badge} -> ${back.badge})`);
    check(back.preview === pre.preview, `${tag}: preview unchanged after the round trip (${JSON.stringify(back.preview)})`);
    check(back.others === pre.others, `${tag}: other rows unchanged after the round trip`);
    await page.screenshot({ path: `${outdir}/${tag}-after-back.png` });
  }

  // (h) phone closed: pushing texts and a call row throws nothing; reopening shows the latest
  {
    const errsBefore = errs.length;
    const c = await page.evaluate(() => window.__test.minigame.close());
    await page.waitForTimeout(1000);
    const gone = await page.evaluate(() => !document.querySelector('.phone-messages-container'));
    check(gone, `${tag}: phone closed (${JSON.stringify(c)?.slice(0, 80)})`);
    const closedText = T('phone closed');
    const thrown = await page.evaluate(({ id, t }) => { try { window.npcManager.addMessage(id, 'npc', t, { isBark: true }); window.npcManager.addCallRow(id, 'missed'); return null; } catch (e) { return String(e); } }, { id: HAX, t: closedText });
    await page.waitForTimeout(1500);
    check(thrown === null && errs.length === errsBefore, `${tag}: nothing thrown with the phone closed (${thrown || 'no exception'}, page errors ${errs.length - errsBefore})`);
    await page.screenshot({ path: `${outdir}/${tag}-phone-closed.png` });
    await openPhone(page, tag);
    await page.waitForTimeout(800);
    const reopened = await snap();
    console.log(`     note ${tag}: reopened preview ${JSON.stringify(reopened.preview)} badge ${reopened.badge}`);
    check(reopened.preview === 'Missed call' && reopened.missed, `${tag}: reopened list shows the latest row (Missed call)`);
    await page.screenshot({ path: `${outdir}/${tag}-reopened.png` });
  }
  check(errs.length === 0, `${tag}: page errors: ${errs.length}${errs.length ? ' ' + errs.join(' || ') : ''}`);
  await page.close();
}

await run(1280, 720, 'desktop');
await run(390, 844, 'portrait');
await browser.close();
console.log(bad ? `${bad} FAILED` : 'all ok');
process.exit(bad ? 1 : 0);
