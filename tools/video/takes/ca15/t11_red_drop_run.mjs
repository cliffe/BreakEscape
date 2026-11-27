// t11_red_drop_run: beats 1, 7, 8, 9, 10 of the ca15 r3 trailer, one continuous run. After the four everyday picks (off camera) the kiosk shows the
// "One from the red-team kit" panel; the take presses Look up, Nilesh gives the stick (line 87: "Leave it next door, somewhere people stop. Then watch
// who picks it up."), the learner picks "On it.", walks through the east door into the Tarrowby open-plan, drops the stick by the kettle where Joanne and
// Niamh are using it, and watches Joanne find it (hook bark), carry it to her desk, say her line and plug it in. The session note toast arrives; the
// learner then goes back to the kiosk.
// Entry state: a fresh game from the normal start (training_room). setup() plays the picks off camera, after loading open_plan once (enter and leave)
// so its NPCs run while the learner is in the training room. No globals are set.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca15_shadow_it t11_red_drop_run "" "--hide-hud --zoom-step 1"
// HUD (script r3 section 5, steps 1-6, via the #be-hide-hud style text): inventory bar shown from before the walk to drop_land + 0.8 s; the toast container
// shown from use_started until the return to the kiosk. The chat's choice list (.person-chat-choices-container) is hidden from before the chat until
// line87_end + 2.0 s.
// Marks: player-sprite, lookup, line84/85/87 start/end (voice watcher), line87_start/line87_end, menu_restored, chosen_on_it, hud_inv_on, needs_forced,
//   door_through, walk_end, menu_open, drop_click, drop_land, hud_inv_off, picked_up, joanne_bark_start/end (bubble), walk_start, use_started,
//   hud_toast_on, find_line_end, note_given, note_toast (only if the game shows one: it does not), note_toast_check, hud_inv_on2, note_in_tray, return_start, hud_toast_off, kiosk_back, end.
// Edit windows (from the marks, the script's rows): beat 1 in = picked_up - 0.6; beat 7 in = line87_start - 0.1; beat 8 out = drop_land + 0.6;
// beat 9 out = find_line_end + 0.4; beat 10 in = note_toast - 0.2.
import { sleep, prepare, toWorldBeatPanel, pressButton, checkSprite, watchBubbles, interactRetry } from './_ca15.mjs';
import { watchVoice, awaitChoice } from '../lib/lib.mjs';
import { npcPos, triggerNeed } from '../lib/camlib.mjs';

const J = 'ca15_joanne_pell', N = 'ca15_niamh_doherty';
const ORIGIN = { x: 320, y: 0 };                       // open_plan world origin (probe: rooms.open_plan.position)
const STAND = { x: ORIGIN.x + 12.4 * 32, y: ORIGIN.y + 6.3 * 32 };   // 1.6 tiles west of the kettle stand point (14, 6), clear of the cooler and the wet-floor sign
const KETTLE_STAND = { x: ORIGIN.x + 14 * 32, y: ORIGIN.y + 6 * 32 };

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const a = await bridge.enterRoom('open_plan', { timeoutMs: 20000 });
  if (!a || !a.ok) throw new Error('preload: could not enter open_plan ' + JSON.stringify(a).slice(0, 200));
  await sleep(800);
  const b = await bridge.enterRoom('training_room', { timeoutMs: 20000 });
  if (!b || !b.ok) throw new Error('preload: could not return to training_room ' + JSON.stringify(b).slice(0, 200));
  await sleep(500);
  await toWorldBeatPanel(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (Object.keys(g).some(k => /^ca15_drop_/.test(k) && g[k] === true)) throw new Error('entry state wrong: a ca15_drop_ global is already set');
}

const hudText = (page, fn) => page.evaluate((src) => {
  const e = document.getElementById('be-hide-hud'); if (!e) return false;
  if (window.__t11HudBase === undefined) window.__t11HudBase = e.textContent;
  const base = window.__t11HudBase;
  e.textContent = (new Function('base', 'return (' + src + ')(base)'))(base);
  return true;
}, fn.toString());
const hudInvOn = (page) => hudText(page, (t) => t.replace('#inventory-container,', '') + '#inventory-container{justify-content:center !important}');
const hudAllOff = (page) => hudText(page, (t) => t);
const hudToastOn = (page) => hudText(page, (t) => t.replace('#notification-container,', ''));

const pl = (page) => page.evaluate(() => [Math.round(window.player.x), Math.round(window.player.y)]);
const globals = async (bridge) => (await bridge.getState()).globals || {};
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const bw = await watchBubbles(page, mark);
  // In-page toast watcher (30 ms): the session note toast lives only ~1.1 s, too short for the take's polling loop.
  await page.evaluate(() => {
    window.__toastW = { rec: null, all: [] };
    window.__toastW.timer = setInterval(() => {
      const el = [...document.querySelectorAll('#notification-container .notification')].find(n => /Session note/i.test(n.innerText));
      const w = window.__toastW;
      for (const n of document.querySelectorAll('#notification-container .notification')) { const tx = n.innerText.trim().replace(/\s+/g, ' ').slice(0, 60); if (!w.all.some(a => a.tx === tx)) w.all.push({ tx, t: Date.now() }); }
      if (el) {
        const r = el.getBoundingClientRect();
        if (!w.rec && r.width > 0) w.rec = { start: Date.now(), end: 0, text: el.innerText.trim().slice(0, 80), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
      } else if (w.rec && !w.rec.end) w.rec.end = Date.now();
    }, 30);
  });
  await checkSprite(page, mark);
  // The choice list stays hidden from before the chat opens until line87_end + 2.0 s (beat 7's tail holds on Nilesh's portrait).
  await page.evaluate(() => { const s = document.createElement('style'); s.id = 'be-t11-hide-choices'; s.textContent = '.person-chat-choices-container{visibility:hidden !important}'; document.head.appendChild(s); });
  await sleep(1500);
  mark('lookup'); await pressButton(page, /^Look up/);
  const l87 = await vw.waitForLine(/Leave it next door/i, 60000);
  if (!l87) throw new Error('line 87 never voiced; heard: ' + JSON.stringify(vw.lines.map(x => x.text)));
  mark('line87_start', { text: l87.text }, l87.start); mark('line87_end', { durMs: l87.durMs }, l87.end);
  await sleep(Math.max(0, l87.end + 2000 - Date.now()));
  await page.evaluate(() => { const s = document.getElementById('be-t11-hide-choices'); if (s) s.remove(); });
  mark('menu_restored');
  await awaitChoice(bridge, 30000); await sleep(900);
  const c = await bridge.minigame.choose(/^On it/); mark('chosen_on_it', { ok: c && c.ok });
  if (!c || !c.ok) throw new Error('On it. not chosen: ' + JSON.stringify(c));
  const nj = await triggerNeed(page, J, 'caffeine', 10), nn = await triggerNeed(page, N, 'caffeine', 10);
  mark('needs_forced', { j: nj, n: nn, jp: await npcPos(page, J), np: await npcPos(page, N) });
  await sleep(1200);
  for (let i = 0; i < 8; i++) { const s = await bridge.getState(); if (!s.dialogue && !s.activeMinigame) break; await bridge.minigame.close().catch(() => {}); await sleep(600); }
  const g0 = await globals(bridge);
  if (g0.ca15_drop_given !== true) throw new Error('ca15_drop_given not set after On it.');
  await sleep(800);

  // HUD step 2 and the forced caffeine needs, then the walk.
  mark('hud_inv_on', { ok: await hudInvOn(page) });
  const w0 = Date.now();
  const e = await bridge.enterRoom('open_plan', { timeoutMs: 20000 });
  mark('door_through', { ok: e && e.ok, ms: Date.now() - w0, p: await pl(page) });
  if (!e || !e.ok) throw new Error('enterRoom open_plan failed ' + JSON.stringify(e).slice(0, 200));
  let m = await bridge.moveTo(STAND.x, STAND.y, { timeoutMs: 15000, pointer: false });
  for (let i = 0; i < 3; i++) {   // moveTo sometimes ends short (seen at 524,108): go again until the feet are near the stand point
    const q = await pl(page); if (Math.hypot(q[0] - STAND.x, q[1] + 0 - (STAND.y - 32)) < 24) break;
    mark('walk_retry', { p: q }); m = await bridge.moveTo(STAND.x, STAND.y, { timeoutMs: 15000, pointer: false });
  }
  const sp = await pl(page);
  mark('walk_end', { ok: m && m.ok, ms: Date.now() - w0, p: sp, kettleDist: Math.round(dist({ x: sp[0], y: sp[1] + 32 }, KETTLE_STAND)), jp: await npcPos(page, J), np: await npcPos(page, N) });

  // Menu, then Drop here: menu_open (menu on screen), drop_click, drop_land (the ground item exists and the global is set).
  await bridge.openInventoryItem('ca15_red_stick').then(r => { if (!r || !r.ok || !r.menu) throw new Error('stick menu did not open ' + JSON.stringify(r).slice(0, 240)); });
  mark('menu_open'); await sleep(700);
  mark('drop_click');
  const d = await page.evaluate(() => {
    const b = [...document.querySelectorAll('#be-interaction-menu .be-im-item')].find(x => /drop here/i.test(x.innerText));
    if (!b) return { ok: false, reason: 'no drop entry' };
    if (b.getAttribute('aria-disabled') === 'true') return { ok: false, reason: 'disabled ' + (b.querySelector('.be-im-detail')?.innerText || '') };
    b.click(); return { ok: true };
  });
  if (!d.ok) throw new Error('Drop here failed: ' + d.reason);
  const dt0 = Date.now(); let landed = false;
  while (Date.now() - dt0 < 6000) { const g = await globals(bridge); if (g.ca15_drop_dropped === true) { landed = true; break; } await sleep(50); }
  mark('drop_land', { landed, p: await pl(page), inv: ((await bridge.getState()).inventory || []).map(i => i.id || i.name) });
  if (!landed) throw new Error('drop never landed (ca15_drop_dropped not set)');
  const tLand = Date.now();

  // After the drop: hold until Joanne picks it up and carries it to her desk. HUD step 3 at drop_land + 0.8 s.
  let hudOff = false, found = false, tFound = 0, p0 = null, walking = false, useStarted = false, tUse = 0, lineEnd = false, used = false, tUsed = 0;
  let toastEnded = false, tTray = 0, toastOn = false, noteGiven = false, toast = null, repaired = false, returned = false;
  const T_END = Date.now() + 110000;
  while (Date.now() < T_END) {
    const now = Date.now();
    if (!hudOff && now - tLand >= 800) { hudOff = true; await hudAllOff(page); mark('hud_inv_off'); }
    const g = await globals(bridge);
    if (!found && g.ca15_drop_found === true) { found = true; tFound = now; p0 = await npcPos(page, J); mark('picked_up', { jp: p0 }); }
    if (!found && !repaired && now - tLand > 10000) {
      const jp = await npcPos(page, J);
      if (jp && dist(jp, { x: 504, y: 166 }) < 40) { repaired = true; mark('repair_need', { r: await triggerNeed(page, J, 'caffeine', 10) }); }
    }
    if (found && !walking) { const jp = await npcPos(page, J); if (jp && p0 && dist(jp, p0) > 14) { walking = true; mark('walk_start', { jp }); } }
    if (bw.seen.some(b => /plug it in/i.test(b.text)) && !useStarted) {
      useStarted = true; tUse = (bw.seen.find(b => /plug it in/i.test(b.text)) || {}).t || now;
      mark('use_started', { jp: await npcPos(page, J) }, tUse); mark('hud_toast_on', { ok: await hudToastOn(page) });
    }
    if (useStarted && !lineEnd) {
      const open = await page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /plug it in/.test((s.pages || []).join(' ')))));
      if (!open) { lineEnd = true; mark('find_line_end'); }
    }
    if (g.ca15_drop_used === true && !used) { used = true; tUsed = now; mark('used', { done: g.ca15_drop_done }); }
    if (used && !noteGiven && now - tUsed >= 300) { noteGiven = true; mark('note_given'); }
    // The note is given by a timed give_item action, which shows no "Picked up" toast in the live flow (the watcher proves it). The tray is the payoff.
    if (noteGiven && !toast) {
      const t = await page.evaluate(() => window.__toastW && window.__toastW.rec ? { ...window.__toastW.rec } : null);
      if (t) { toast = t; mark('note_toast', { text: t.text, rect: t.rect }, t.start); }
    }
    if (noteGiven && !tTray && ((await bridge.getState()).inventory || []).some(i => /session_note/.test(i.id || ''))) {
      mark('hud_inv_on2', { ok: await hudInvOn(page) }); await sleep(250);
      const sl = await page.evaluate(() => { const i = [...document.querySelectorAll('.inventory-item')].find(x => /session note/i.test((x.scenarioData && x.scenarioData.name) || x.alt || x.title || '')); if (!i) return null; const r = i.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
      mark('note_in_tray', { rect: sl }); tTray = Date.now();
    }
    if (tTray && now - tTray >= 2600) break;
    if (used && !returned && now - tUsed >= 9000) { returned = true; break; }
    await sleep(60);
  }
  await vw.stop(); await bw.stop(); await page.evaluate(() => clearInterval(window.__toastW.timer)).catch(() => {});
  const miss = [['picked_up', found], ['walk_start', walking], ['use_started', useStarted], ['find_line_end', lineEnd], ['note_given', noteGiven]].filter(x => !x[1]).map(x => x[0]);
  if (miss.length) throw new Error('marks missing: ' + miss.join(', '));
  const tw = await page.evaluate(() => window.__toastW && window.__toastW.rec).catch(() => null);
  mark('note_toast_check', { seen: !!tw, all: await page.evaluate(() => window.__toastW.all.map(a => a.tx)).catch(() => []) });
  if (!tTray) throw new Error('session note never reached the tray');

  // The kiosk reopens by itself a few seconds after the note (the runner continues to "Where it led"). Wait for it, then hold.
  mark('return_start'); await hudAllOff(page); mark('hud_toast_off');
  const k0 = Date.now(); let kiosk = false;
  while (Date.now() - k0 < 12000) { if (await page.evaluate(() => /Six months later/i.test(document.body.innerText))) { kiosk = true; break; } await sleep(100); }
  mark('kiosk_back', { auto: kiosk });
  if (!kiosk) { await interactRetry(bridge, 'training_kiosk', mark); mark('kiosk_back_manual'); }
  await sleep(1800);
  mark('end');
};
