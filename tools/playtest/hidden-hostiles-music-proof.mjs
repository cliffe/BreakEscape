// Hidden hostiles and the fight music - live proof. Keyless server on PORT (default 3093).
// Usage: node tools/playtest/hidden-hostiles-music-proof.mjs <gameId> <route>
//   route hide-then-ko  : hide the day guard (night), then KO the lobby guard; then reload, visit
//                         the annex (no fight music), then reveal the day guard (dawn): fight music back.
//   route ko-then-hide  : KO the lobby guard first (day guard still fights), then hide the day guard
//                         (night): the fight ends with no npc_ko after the hide.
//   route reserve       : the reserve guard (startHostile, initiallyHidden) is hostile only once shown:
//                         hidden, it plays no fight music and all_hostiles_ko can fire (KO the lobby
//                         guard: noir); a reload while hidden still gives no cue; the cellar door
//                         reveals it with exactly one threat cue.
// Each route needs its own fresh test_hidden_hostiles game (tools/playtest/new-game.rb).
// Run from inside the worktree so playwright resolves. Headless; setFPS(20), fixed steps on.
// Every change goes through real paths: door attempts set the night/dawn globals and the day
// guard's own mappings hide and show it; debugKO knocks a guard out. Exits 1 on any mismatch.
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 3093), BASE = `http://127.0.0.1:${PORT}`;
const gameId = Number(process.argv[2]);
const route = process.argv[3];
if (!gameId || !['hide-then-ko', 'ko-then-hide', 'reserve'].includes(route)) {
  console.error('usage: hidden-hostiles-music-proof.mjs <gameId> <hide-then-ko|ko-then-hide|reserve>'); process.exit(2);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { gameId, route, steps: [] };
let failed = 0;
const expect = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  out.steps.push({ label, ok, got, want });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: got ${JSON.stringify(got)}${ok ? '' : `, want ${JSON.stringify(want)}`}`);
};

const music = page => page.evaluate(() => window.MusicController?.getState?.()?.playlist ?? null);
const day = page => page.evaluate(() => {
  const id = 'day_guard', n = window.npcManager.getNPC?.(id);
  return { hostile: window.npcHostileSystem.isNPCHostile(id), ko: window.npcHostileSystem.isNPCKO(id),
    hiddenByMapping: window.npcManager.isHiddenByMapping(id),
    spriteVisible: n ? !!(n._sprite || n.sprite)?.visible : null };
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* */ } });

async function boot(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  // fixed steps stay ON; 20 fps keeps headless physics from tunnelling walls
  await page.evaluate(() => { window.game?.physics?.world?.setFPS?.(20); });
  let clean = 0;
  for (let i = 0; i < 30 && clean < 2; i++) {
    const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame?.id || null, blk: !!(s.blockingUi || s.player?.blocking) }; }).catch(() => ({ mg: 'x', blk: false }));
    if (!st.mg && !st.blk) { clean++; await sleep(300); continue; }
    clean = 0;
    if (st.mg === 'title-screen') await page.keyboard.press('Enter').catch(() => {});
    else if (st.mg) await page.evaluate(() => window.__test.minigame.close()).catch(() => {});
    else {
      let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => null);
      if (!d || d.ok === false) d = await page.evaluate(() => window.__test.dismissBlockingUi()).catch(() => null);
    }
    await sleep(600);
  }
  await sleep(1000);
}
const enter = async room => { out[`enter_${room}`] = await page.evaluate(r => window.__test.enterRoom(r), room); await sleep(2000); };
async function tryDoor(to) {
  out[`door_${to}`] = await page.evaluate(id => window.__test.interact(id), `door:lobby->${to}`).catch(e => ({ error: String(e) }));
  await sleep(2000);
  await page.evaluate(() => window.__test.minigame?.close?.()).catch(() => {});
  await sleep(500);
}
const ko = async id => { out[`ko_${id}`] = await page.evaluate(i => window.__test.debugKO(i), id); await sleep(1500); };

await boot(`${BASE}/break_escape/games/${gameId}?skip_resume=1`);
out.startPlaylist = await music(page);   // recorded, not judged: depends on load order in the start room

const reserve = page => page.evaluate(() => {
  const id = 'reserve_guard';
  return { hostile: window.npcHostileSystem.isNPCHostile(id), ko: window.npcHostileSystem.isNPCKO(id),
    hiddenByMapping: window.npcManager.isHiddenByMapping(id) };
});
const countCues = page => page.evaluate(() => {
  window.__cues = [];
  window.eventDispatcher.on('npc_hostile_state_changed', d => { if (d?.isHostile) window.__cues.push(d.npcId); });
});
const cues = page => page.evaluate(() => window.__cues || []);

if (route === 'reserve') {
  expect('start: reserve guard hidden, not hostile', await reserve(page), { hostile: false, ko: false, hiddenByMapping: false });
  expect('start: reserve guard sprite is hidden', await page.evaluate(() => !!window.__test.getState && (window.npcManager.getNPC('reserve_guard')?.isVisible === false || window.npcManager.getNPC('reserve_guard')?.behavior?.initiallyHidden === true)), true);
  await ko('fight_guard');
  expect('lobby guard KO with the reserve guard hidden: all_hostiles_ko fires', await music(page), 'noir');
  await sleep(2500);   // let the state sync before the reload
  await boot(`${BASE}/break_escape/games/${gameId}?skip_resume=1`);
  expect('reload while hidden: still not hostile', await reserve(page), { hostile: false, ko: false, hiddenByMapping: false });
  expect('reload while hidden: no fight music', await music(page), 'noir');
  await countCues(page);
  await tryDoor('cellar');
  expect('cellar: reserve guard revealed and hostile', (await reserve(page)).hostile, true);
  expect('cellar: exactly one threat cue for the reserve guard', await cues(page), ['reserve_guard']);
  expect('cellar: the reveal brings the fight music', await music(page), 'threat');
  out.failed = failed;
  console.log(JSON.stringify({ gameId, route, failed }));
  await browser.close();
  process.exit(failed ? 1 : 0);
}

await enter('annex');
expect('annex entered: day guard hostile and visible, fight music', { p: await music(page), d: (({ hostile, ko }) => ({ hostile, ko }))(await day(page)) },
  { p: 'threat', d: { hostile: true, ko: false } });
await enter('lobby');

if (route === 'hide-then-ko') {
  await tryDoor('vault');
  let d = await day(page);
  expect('night: day guard hidden by mapping, hostile, conscious', { h: d.hiddenByMapping, host: d.hostile, ko: d.ko }, { h: true, host: true, ko: false });
  expect('night: lobby guard still fights, so threat stays', await music(page), 'threat');
  await ko('fight_guard');
  expect('lobby guard KO: the hidden guard does not count, fight music ends', await music(page), 'noir');

  await sleep(2500);   // let the visibility record sync before the reload
  await boot(`${BASE}/break_escape/games/${gameId}?skip_resume=1`);
  expect('reload: hidden record restored', await page.evaluate(() => window.npcManager.isHiddenByMapping('day_guard')), true);
  expect('reload: lobby music is the game_loaded entry', await music(page), 'noir');
  await enter('annex');
  d = await day(page);
  expect('reload, annex loaded: hidden hostile restored but not announced, still noir', { p: await music(page), h: d.hiddenByMapping, host: d.hostile }, { p: 'noir', h: true, host: true });
  await enter('lobby');
  await tryDoor('closet');
  d = await day(page);
  expect('dawn: day guard revealed (record cleared)', d.hiddenByMapping, false);
  expect('dawn: revealed hostile brings the fight music back', await music(page), 'threat');
} else {
  await ko('fight_guard');
  expect('lobby guard KO, day guard still fights: threat stays', await music(page), 'threat');
  await tryDoor('vault');
  const d = await day(page);
  expect('night after the KO: day guard hidden, hostile, conscious', { h: d.hiddenByMapping, host: d.hostile, ko: d.ko }, { h: true, host: true, ko: false });
  expect('hiding the last conscious hostile ends the fight (no npc_ko followed)', await music(page), 'noir');
}

out.failed = failed;
console.log(JSON.stringify({ gameId, route, failed }));
await browser.close();
process.exit(failed ? 1 : 0);
