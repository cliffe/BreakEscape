// t04_nightshade_file (m09), ONE-SHOT, the Nightshade subplot: in the restricted stacks the player dusts Margaret
// Sorensen's rubber stamp with the fingerprint kit (find, magnetic powder for the grained handle, the wand, tape, peel,
// pattern and her reference card, "Log the print"), walks east into the cage, presents the lift to the plan cabinet's
// reader and takes "Candidate Assessment, Intake 2011" (Nightshade's recruitment file) out of the drawer. HaX texts.
// No voice in the take itself (the kit and the reader have none; HaX's reply is a phone text). setup() proves TTS is live
// (one POST /tts for the night clerk's "What's up?" must answer audio) before any one-shot take is recorded.
// One-shot: taking the file sets nightshade_file_held (the legacy clock, match_the_hand, hand_before_name).
// Entry state: LIVE game 87 (playtest04, m09, set 918): all four flags in, cage_opened, nightshade_file_held false.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/87 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m09 t04_nightshade_file "" ""      (HUD kept: the objectives and the phone text)
// Marks: tts-check, kit-open, step:*, found, powder, dusted, taped, mounted, pattern, matched, logged, enter-cage,
// reader-open, card, cabinet-open, file-taken {nightshade_file_held}, synced, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { walkTo, globals, endgameGlobals, syncNow, closeAll, playChat, watchTts } from './_live.mjs';

const STAMP = 'sorensen_stamp';
const CABINET = 'plan_cabinet';

const mgState = (page) => page.evaluate(() => {
  const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
  if (!mg || typeof mg.getTestState !== 'function') return null;
  const s = mg.getTestState();
  return { step: s.step, coverage: s.coverage, tapeCoverage: s.tapeCoverage, canLift: s.canLift, found: s.found, pattern: s.debug && s.debug.pattern,
    correct: s.debug && (s.debug.correctCandidate != null ? s.debug.correctCandidate : s.debug.correctCardIndex), centre: s.debug && s.debug.printCentre,
    tape: mg.tapeBounds || null, candidates: s.candidates, cards: s.cards, lastResult: s.lastResult };
});
const canvasBox = (page) => page.locator('.dusting-canvas').boundingBox();
const toPage = (box, x, y) => ({ x: box.x + (x / 128) * box.width, y: box.y + (y / 128) * box.height });

async function zigzag(page, box, r, rows, stepsPerRow = 14) {
  const ys = Array.from({ length: rows }, (_, i) => r.y + (r.h * (i + 0.5)) / rows);
  let p = toPage(box, r.x, ys[0]);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  for (let i = 0; i < ys.length; i++) {
    const x1 = i % 2 === 0 ? r.x + r.w : r.x;
    p = toPage(box, x1, ys[i]);
    await page.mouse.move(p.x, p.y, { steps: stepsPerRow });
    if (i + 1 < ys.length) { const q = toPage(box, x1, ys[i + 1]); await page.mouse.move(q.x, q.y, { steps: 3 }); }
  }
  await page.mouse.up();
}

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const g = await endgameGlobals(page);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.flag3_submitted !== true || g.cage_opened !== true || g.nightshade_file_held === true) throw new Error('wrong entry state: ' + JSON.stringify(g));
  // TTS live check: one voiced line must come back as audio.
  const tts = await page.evaluate(async () => {
    const tok = document.querySelector('meta[name="csrf-token"]')?.content;
    const r = await fetch('/break_escape/games/87/tts', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': tok }, body: JSON.stringify({ npc_id: 'old_coyote', text: "What's up?" }) });
    const b = await r.arrayBuffer();
    return { status: r.status, type: r.headers.get('content-type'), bytes: b.byteLength };
  });
  console.error('TTS-CHECK', JSON.stringify(tts));
  if (tts.status !== 200 || !/audio/.test(tts.type || '')) throw new Error('TTS not voicing: ' + JSON.stringify(tts));
  await walkTo(page, bridge, 'restricted_stacks', (l, d) => console.error('SETUP', l, JSON.stringify(d || null).slice(0, 200)));
  await clearScreen(page, bridge, () => {});
  const m = await bridge.moveToNear(STAMP, { timeoutMs: 20000 });
  if (!m || !m.ok) console.error('moveToNear stamp', JSON.stringify(m).slice(0, 300));
  await sleep(800);
}

const hasLift = (page) => page.evaluate(() => (window.gameState.biometricSamples || []).some(x => x && x.type === 'fingerprint' && /sorensen/i.test(x.ownerId || x.owner || '')));

// Her conversation at the shredder: `prefer` picks a line, else "I'm done here."
async function talkSorensen(page, bridge, mark, prefer) {
  const r = await playChat(page, bridge, mark, { prefer: [...prefer, /^I'm done here/i], avoid: [/.*/], dwellMs: 1600, timeoutMs: 150000 })
    .catch(e => ({ error: String(e).slice(0, 200) }));
  mark('sorensen-chat', r);
  await closeAll(bridge);
}
const personChatOpen = async (bridge) => { const s = await bridge.getState(); return !!(s.activeMinigame && s.activeMinigame.id === 'person-chat'); };

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sleep(1500);
  if (!(await hasLift(page))) await dust(page, bridge, mark);
  else mark('lift-already-held');
  await cabinet(page, bridge, mark);
};

async function dust(page, bridge, mark) {
  const r = await bridge.interact(STAMP, { approach: false, timeoutMs: 20000 });
  await bridge.waitForMinigame('dusting', { timeoutMs: 10000 });
  mark('kit-open', { ok: r && r.ok });
  await sleep(2500);
  await page.click('.dusting-panel [data-action="start"]');
  mark('step:find');
  await sleep(2000);
  let s = await mgState(page), box = await canvasBox(page);
  const c = s.centre;
  for (const [x, y] of [[20, 30], [60, 25], [100, 70], [c.x + 18, c.y + 10]]) { const p = toPage(box, x, y); await page.mouse.move(p.x, p.y, { steps: 18 }); await sleep(250); }
  const pc = toPage(box, c.x, c.y);
  await page.mouse.move(pc.x, pc.y, { steps: 12 }); await sleep(500);
  await page.mouse.click(pc.x, pc.y);
  mark('found', { centre: c });
  for (let i = 0; i < 20 && (s = await mgState(page)).step !== 'powder'; i++) await sleep(150);
  await sleep(1800);
  await page.click('.dusting-panel [data-action="powder"][data-powder="magnetic"]');
  mark('powder', { powder: 'magnetic' });
  await sleep(1200);
  if (await page.$('.dusting-panel [data-action="tool"][data-tool="wand"][aria-pressed="false"]')) { await page.click('.dusting-panel [data-action="tool"][data-tool="wand"]'); mark('tool', { tool: 'wand' }); await sleep(600); }
  box = await canvasBox(page);
  const R = 30;
  for (let pass = 0; pass < 8; pass++) {
    await zigzag(page, box, { x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R }, 10, 16);
    s = await mgState(page);
    mark('dust-pass', { pass, coverage: s.coverage, canLift: s.canLift });
    if (s.canLift && s.coverage >= 0.5) break;
  }
  mark('dusted', { coverage: s.coverage });
  await sleep(1200);
  await page.click('.dusting-panel [data-action="to-lift"]');
  mark('step:lift');
  await sleep(1500);
  for (let pass = 0; pass < 4; pass++) {
    s = await mgState(page); box = await canvasBox(page);
    const t = s.tape || { x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R };
    await zigzag(page, box, t, Math.max(6, Math.round(t.h / 5)), 12);
    s = await mgState(page);
    mark('tape-pass', { pass, tapeCoverage: s.tapeCoverage });
    if (s.tapeCoverage >= 0.95) break;
  }
  mark('taped', { tapeCoverage: s.tapeCoverage });
  await sleep(1000);
  await page.click('.dusting-panel [data-action="peel"]');
  for (let i = 0; i < 30 && (s = await mgState(page)).step !== 'compare'; i++) await sleep(150);
  mark('mounted');
  await sleep(2200);
  await page.click(`.dusting-panel [data-action="pattern"][data-pattern="${s.pattern}"]`);
  mark('pattern', { pattern: s.pattern });
  await sleep(2200);
  s = await mgState(page);
  const idx = s.correct != null ? s.correct : (s.candidates || []).findIndex(x => /sorensen/i.test(x.label));
  await page.click(`.dusting-panel [data-action="ref"][data-index="${idx}"]`);
  mark('matched', { idx });
  await sleep(2800);
  await page.click('.dusting-panel [data-action="finish"]');
  await sleep(2000);
  const lifted = await page.evaluate(() => (window.gameState.biometricSamples || []).filter(x => x && x.type === 'fingerprint').map(x => x.ownerId || x.owner));
  mark('logged', { lifted });
  await syncNow(page);
  await closeAll(bridge);
  await sleep(1200);
}

async function cabinet(page, bridge, mark) {
  let s, st;
  // Into the cage: Sorensen at the shredder speaks first (voiced person chat).
  mark('enter-cage');
  await bridge.enterRoom('restricted_cage', { timeoutMs: 45000 });
  for (let i = 0; i < 10 && !(await personChatOpen(bridge)); i++) await sleep(500);
  if (await personChatOpen(bridge)) await talkSorensen(page, bridge, mark, []);
  await sleep(1500);
  const m = await bridge.moveToNear(CABINET, { timeoutMs: 20000 });
  mark('at-cabinet', { ok: m && m.ok });
  await sleep(1000);
  await bridge.interact(CABINET, { approach: false, timeoutMs: 20000 }).catch(e => mark('interact-err', { e: String(e).slice(0, 160) }));
  await sleep(2000);
  st = await bridge.getState();
  mark('reader-open', { mg: st.activeMinigame });
  s = await mgState(page);
  if (s && s.cards) {
    const ci = s.correct != null && s.correct >= 0 ? s.correct : s.cards.findIndex(x => /sorensen/i.test(x.label));
    await sleep(1500);
    const cards = await page.$$('.fpr-card');
    if (!cards[ci]) throw new Error('no reader card ' + ci + ' of ' + cards.length);
    await cards[ci].click();
    mark('card', { ci, label: s.cards[ci] && s.cards[ci].label });
    await sleep(4000);
  }
  // The drawer: the container opens on a match (or open it again).
  for (let i = 0; i < 10; i++) {
    st = await bridge.getState();
    if (st.activeMinigame && /container/i.test(st.activeMinigame.id || st.activeMinigame.type || '')) break;
    if (i === 5) { await closeAll(bridge); await bridge.interact(CABINET, { approach: false, timeoutMs: 20000 }).catch(() => {}); }
    await sleep(800);
  }
  mark('cabinet-open', { mg: st.activeMinigame });
  await sleep(2000);
  const t = await bridge.minigame.take('Candidate Assessment, Intake 2011');
  mark('take', { ok: t && t.ok });
  await sleep(2500);
  // If the file opened for reading, hold on it, then close.
  st = await bridge.getState();
  mark('after-take', { mg: st.activeMinigame });
  await sleep(4000);
  mark('file-taken', await globals(page, ['nightshade_file_held', 'legacy_clock_run', 'hand_before_name']));
  mark('synced', { ok: await syncNow(page) });
  await closeAll(bridge);
  await sleep(2000);
  // The file in hand, back to her: "Only yours burn." She stops the shredder (stop_the_shredding, optional).
  if ((await globals(page, ['nightshade_file_held'])).nightshade_file_held === true) {
    const t = await bridge.interact('sorensen', { timeoutMs: 20000 }).catch(e => ({ ok: false, e: String(e).slice(0, 160) }));
    mark('talk-sorensen', { ok: t && t.ok });
    for (let i = 0; i < 10 && !(await personChatOpen(bridge)); i++) await sleep(500);
    if (await personChatOpen(bridge)) await talkSorensen(page, bridge, mark, [/^Your Architect kept his own papers/i]);
    mark('sorensen-fate', await globals(page, ['sorensen_fate']));
  }
  mark('synced', { ok: await syncNow(page) });
  await sleep(2500);
  mark('linger-end', await globals(page, ['nightshade_file_held']));
  if ((await globals(page, ['nightshade_file_held'])).nightshade_file_held !== true) throw new Error('file not held');
}
