// Live proof: closing the copier during the access-list "Access Granted" hold still commits the
// unlock once (fix/rfid-accesslist-hold). Keyless server, headless, 20 fps. Never :3000/:3001.
//   node tools/playtest/rfid-accesslist-hold-proof.mjs <gameId> <port> <outdir> lib   (MODE=early|control)
// Game: fresh test_access_doors started in `lobby` (--start-room lobby). Copy Dana's badge in
// conversation, then Emulate it at the finance office door (access: roles finance).
import { open, ev, shot, sleep, log, BASE, gid, OUT, browser } from './rfid-early-close-proof.mjs';
import fs from 'node:fs';
const mode = process.env.MODE || 'early';
const J = x => JSON.stringify(x);
const rec = { mode, gameId: gid, steps: [] };
const step = (n, v) => { rec.steps.push({ n, ...(v === undefined ? {} : { v }) }); log(mode, n, v === undefined ? '' : J(v).slice(0, 300)); };
const mgState = p => ev(p, () => window.__test.minigame.getState());
async function waitText(p, re, ms = 60000) {
  const t0 = Date.now(); let last = null;
  while (Date.now() - t0 < ms) { const st = await mgState(p).catch(() => null); if (st && re.test(st.text || '')) return st; last = st; await sleep(300); }
  await p.screenshot({ path: `${OUT}/fail-${mode}.png` }).catch(() => {});
  throw new Error('timeout ' + re + ' last=' + J(last).slice(0, 600));
}
const room = async () => (await (await fetch(`${BASE}/break_escape/games/${gid}/scenario_map`)).json()).rooms?.finance_office;
const DOOR = 'door:finance_lobby->finance_office';
const doorState = p => ev(p, () => (window.__test.doorways() || []).find(d => d.id === 'door:finance_lobby->finance_office')?.sprite);
async function converse(p, pick) {
  for (let i = 0; i < 30; i++) {
    const st = await mgState(p).catch(() => null);
    if (!st || st.id === 'rfid' || /Save/.test(st.text || '') && /Read|Saved/.test(st.text || '')) return 'copier';
    const d = st.dialogue;
    if (!d) { await sleep(400); continue; }
    if (d.awaitingChoice) { const r = await ev(p, x => window.__test.minigame.chooseMatching(x), pick); if (!r?.ok) return 'nochoice ' + J(r); await sleep(900); continue; }
    await p.keyboard.press('Space'); await sleep(700);
  }
  return 'timeout';
}
step('server before: finance_office', await room());
const page = await open(mode);
step('pick up copier', (await ev(page, () => window.__test.interact('card_copier'))).ok);
await sleep(1500);
await ev(page, () => window.__test.dismissBlockingUi()).catch(() => {});
step('inventory', await ev(page, () => window.inventory.items.map(i => i.scenarioData?.id || i.scenarioData?.type)));
step('enter finance_lobby', (await ev(page, () => window.__test.enterRoom('finance_lobby'))).ok);
await ev(page, () => window.__test.interact('dana')).then(r => step('talk to dana', r.ok));
await waitText(page, /./, 20000);
step('converse', await converse(page, 'Can I scan'));
// the copier opens: wait for the read, then Save
await waitText(page, /Save/, 60000);
await sleep(5000);
step('copier text', (await mgState(page)).text.slice(0, 160));
await ev(page, () => { const b = Array.from(document.querySelectorAll('.rfid-minigame-container button')).find(x => x.innerText.trim().startsWith('Save')); if (b) b.click(); });
await sleep(1500);
await shot(page, `${mode}-1-saved`);
await ev(page, () => window.__test.minigame.close()).catch(() => {});
await sleep(1500);
step('after copier', await ev(page, () => window.__test.getState().activeMinigame?.id || null));
step('converse end', await converse(page, 'let you get on'));
await sleep(1000);
await ev(page, () => window.__test.dismissBlockingUi()).catch(() => {});
if (await ev(page, () => window.__test.getState().activeMinigame?.id)) await ev(page, () => window.__test.minigame.close()).catch(() => {});
step('saved cards', await ev(page, () => window.__test.access.savedCards()));
rec.doorBefore = await doorState(page);
step('door before', rec.doorBefore);
await ev(page, (m) => {
  window.__ph = {};
  setInterval(() => { if (window.__ph.seenAt && !window.__ph.goneWall && !window.MinigameFramework?.currentMinigame) window.__ph.goneWall = Date.now(); }, 15);
  new MutationObserver(() => {
    if (window.__ph.seenAt || !document.body.innerText.includes('Access Granted')) return;
    window.__ph.seenAt = performance.now(); window.__ph.seenWall = Date.now();
    if (m === 'early') setTimeout(async () => { window.__ph.closeWall = Date.now(); try { window.__ph.closeRes = await window.__test.minigame.close(); } catch (e) { window.__ph.closeRes = 'err ' + e; } }, 250);
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
}, mode);
const net0 = page.net.length;
const ir = await ev(page, () => window.__test.interact('door:finance_lobby->finance_office'));
step('interact door', { ok: ir.ok, opened: ir.opened, reason: ir.reason });
await waitText(page, /Emulate/);
await shot(page, `${mode}-2-reader`);
step('reader menu', (await mgState(page)).controls.map(c => c.label));
await ev(page, () => window.__test.minigame.clickControl('Emulate'));
const t0 = Date.now();
while (Date.now() - t0 < 60000 && !(await ev(page, () => window.__ph.seenAt))) await sleep(40);
await sleep(120);
await shot(page, `${mode}-3-access-granted`);
await sleep(mode === 'early' ? 1500 : 4000);
rec.ph = await ev(page, () => window.__ph);
step('timers', { seenToCloseMs: rec.ph.closeWall ? rec.ph.closeWall - rec.ph.seenWall : null, seenToGoneMs: rec.ph.goneWall ? rec.ph.goneWall - rec.ph.seenWall : null, closeRes: rec.ph.closeRes });
step('minigame after', await ev(page, () => window.__test.getState().activeMinigame?.id || null));
await sleep(1500);
rec.net = page.net.slice(net0).map(n => ({ m: n.m, path: n.path.replace(/.*games\/\d+/, ''), status: n.status }));
step('network', rec.net.filter(n => !/sync_state/.test(n.path)));
rec.unlockPosts = rec.net.filter(n => n.m === 'POST' && n.path === '/unlock');
step('POST /unlock', rec.unlockPosts.map(n => n.status));
rec.doorAfter = await doorState(page);
step('door in-page after', rec.doorAfter);
await shot(page, `${mode}-4-after`);
await ev(page, () => window.stateSync?.sync?.());
rec.serverAfter = await room();
step('server after: finance_office', rec.serverAfter);
await page.close();
const page2 = await open(mode + '-reload');
rec.doorReload = await doorState(page2);
step('door after reload (absent = open doorway)', rec.doorReload || null);
await ev(page2, () => window.__test.enterRoom('finance_lobby'));
rec.enter = await ev(page2, () => window.__test.enterRoom('finance_office'));
step('walk into finance_office after reload', { ok: rec.enter.ok, reason: rec.enter.reason, room: await ev(page2, () => window.__test.getState().player?.room || window.__test.getState().currentRoom || null) });
await shot(page2, `${mode}-5-reload`);
rec.errs = page.errs.concat(page2.errs);
await page2.close();
rec.pass = rec.unlockPosts.length === 1 && rec.unlockPosts[0].status === 200 && rec.serverAfter?.accessible === true && (!rec.doorReload || rec.doorReload.locked === false) && rec.enter.ok === true;
fs.writeFileSync(`${OUT}/${mode}.json`, J(rec, null, 1));
log(mode, rec.pass ? 'PASS' : 'FAIL');
await browser.close();
process.exit(rec.pass ? 0 : 1);
