// Real-path proof for baked voice FX: m02's Ghost speaks through the game's OWN trigger (the first
// use of the hospital recovery console once the restore manifest is held -> object_interacted ->
// video-call on_recovery_console -> PhoneChatMinigame -> PhoneCallVoice -> TTSManager.play).
// Nothing here calls TTSManager or registers a voice profile; the page is only observed:
//   (a) POST /tts response carries X-Voice-FX-Baked and its body md5 equals the sidecar baked_md5
//   (b) the client set no run-time FX profile for that clip (_setActiveFXProfile(null) after play)
//   (c) the audio element played (play() resolved, currentTime > 0, 'ended' fired)
//   game: PLAYTEST_PORT=3026 tools/playtest/new-game.sh m02_ransomed_trust --set restore_manifest_obtained=true --start-room server_room
//   node tools/playtest/voice-fx-real-path-proof.mjs <game_url> [console_object_id=hospital_recovery_console]
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv[2];
const objId = process.argv[3] || 'hospital_recovery_console';
const speaker = process.env.PROOF_NPC || 'ghost';
const cacheDir = process.env.PROOF_CACHE || 'tts_cache/m02_ransomed_trust';
const md5 = b => createHash('md5').update(b).digest('hex');
const sidecars = readdirSync(cacheDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(cacheDir + '/' + f)));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.addInitScript(() => {
  try { localStorage.setItem('tutorial_declined', 'true'); } catch {} performance.setResourceTimingBufferSize(5000);
  // observe-only: copy every POST /tts body (Playwright's response.body() is empty for the streamed clip)
  window.__ttsBodies = [];
  const f = window.fetch;
  window.fetch = async function (input, init) {
    const res = await f.apply(this, arguments);
    try {
      const u = new URL(typeof input === 'string' ? input : input.url, location.href);
      if ((init?.method || 'GET') === 'POST' && u.pathname.endsWith('/tts')) {
        const req = JSON.parse(init.body); const buf = new Uint8Array(await res.clone().arrayBuffer()); let bin = ''; buf.forEach(b => bin += String.fromCharCode(b));
        window.__ttsBodies.push({ npc: req.npc_id, text: req.text, status: res.status, header: res.headers.get('X-Voice-FX-Baked'), b64: btoa(bin) });
      }
    } catch {}
    return res;
  };
});
const tts = [];
page.on('response', async r => {
  if (r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/tts')) {
    let body = null; try { body = await r.body(); } catch {}
    let req = null; try { req = JSON.parse(r.request().postData()); } catch {}
    tts.push({ status: r.status(), npc: req?.npc_id, text: req?.text, header: r.headers()['x-voice-fx-baked'] || null, md5: body && md5(body), bytes: body?.length });
  }
});
page.on('console', m => { if (/\[TTSPROOF\]/.test(m.text())) console.log('console:', m.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.game?.loop && !!window.__test, null, { timeout: 90000 });
await page.evaluate(() => window.__test.throttleFps(20));
await page.waitForTimeout(1500);
await page.waitForFunction(() => performance.getEntriesByType('resource').some(e => /systems\/tts-manager\.js/.test(e.name)), null, { timeout: 60000 });
// Observe only: log profile changes and play() calls on the class the game loaded, and the audio element's events
await page.evaluate(async () => {
  const src = performance.getEntriesByType('resource').map(e => e.name).find(n => /systems\/tts-manager\.js/.test(n));
  const P = (await import(src)).default.prototype;
  window.__fxlog = []; window.__audio = [];
  const setP = P._setActiveFXProfile, play = P.play;
  P._setActiveFXProfile = function (p) { window.__fxlog.push({ ev: 'setProfile', profile: p ? 'voice-distortion' : null }); console.log('[TTSPROOF] _setActiveFXProfile(' + (p ? 'voice-distortion profile' : 'null') + ')'); return setP.call(this, p); };
  P.play = async function (npc, text, o) {
    console.log('[TTSPROOF] play ' + npc + ': ' + String(text).slice(0, 60));
    const a = this.audio; const rec = { npc, text, ended: false, played: false, maxTime: 0 };
    window.__audio.push(rec);
    if (a && !a.__proofHooked) { a.__proofHooked = true; a.addEventListener('playing', () => { rec.played = true; }); a.addEventListener('ended', () => { rec.ended = true; console.log('[TTSPROOF] audio ended'); }); a.addEventListener('timeupdate', () => { rec.maxTime = Math.max(rec.maxTime, a.currentTime); }); }
    const r = await play.call(this, npc, text, o);
    console.log('[TTSPROOF] play resolved ms=' + r + ' activeProfile=' + !!this._activeFXProfile);
    window.__fxlog.push({ ev: 'played', npc, ms: r, activeProfileAfterSet: !!this._activeFXProfile });
    return r;
  };
});
for (let i = 0; i < 40; i++) {
  const mg = await page.evaluate(() => window.MinigameFramework?.currentMinigame?.constructor?.name || null);
  if (mg === 'NotesMinigame') { await page.evaluate(() => window.__test.minigame.close()); await page.waitForTimeout(1200); continue; }
  const miss = d => !d || String(d.reason || '').startsWith('no-button-matching');
  let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume'));
  if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi('figure it out'));
  if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi('ready'));
  if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi());
  if (d?.reason === 'ambiguous-blocking-ui') d = await page.evaluate(() => window.__test.minigame.chooseIndex(2));
  if (d?.reason === 'blocking-ui-has-no-buttons') await page.keyboard.press('Space');
  await page.waitForTimeout(1200);
  if (miss(d) && !mg) break;
}
await page.evaluate(() => window.MinigameFramework?.currentMinigame && window.__test.minigame.close());
await page.waitForTimeout(800);
console.log('globals before:', JSON.stringify(await page.evaluate(() => ({ m: window.gameState?.globalVariables?.restore_manifest_obtained, o: window.gameState?.globalVariables?.ghost_offer_made }))));
// THE GAME'S OWN TRIGGER: use the recovery console
const ir = await page.evaluate(id => window.__test.interact(id), objId);
console.log('interact:', JSON.stringify(ir).slice(0, 300));
// Ghost's call plays; wait for the first line to be fetched and finish
await page.waitForFunction(() => (window.__audio || []).some(a => a.ended), null, { timeout: 60000 }).catch(() => console.log('no audio ended within 60s'));
await page.waitForTimeout(1500);
const bodies = (await page.evaluate(() => window.__ttsBodies)).map(b => { const buf = Buffer.from(b.b64, 'base64'); return { npc: b.npc, text: b.text, status: b.status, header: b.header, md5: md5(buf), bytes: buf.length }; });
const ghostCalls = bodies.filter(t => t.npc === speaker);
const fxlog = await page.evaluate(() => window.__fxlog), audio = await page.evaluate(() => window.__audio);
console.log('minigame:', await page.evaluate(() => window.MinigameFramework?.currentMinigame?.constructor?.name || null));
console.log('tts calls (in-page fetch):', JSON.stringify(bodies, null, 1));
console.log('fxlog:', JSON.stringify(fxlog));
console.log('audio:', JSON.stringify(audio));
let pass = true;
for (const c of ghostCalls) {
  const norm = t => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
  const sc = sidecars.find(s => s.npc === speaker && norm(s.text) === norm(c.text));
  const baked = sc?.voice_fx?.baked_md5;
  const a = c.header && baked && c.md5 === baked;
  console.log(`(a) "${String(c.text).slice(0, 50)}" status=${c.status} X-Voice-FX-Baked=${c.header} body md5=${c.md5} sidecar baked_md5=${baked} ${a ? 'PASS' : 'FAIL'}`);
  if (!a) pass = false;
}
if (!ghostCalls.length) { console.log('(a) FAIL: no POST /tts for ' + speaker); pass = false; }
// pair each play with the profile calls that followed it (play sets the profile, then null when baked)
const seq = fxlog.map(e => e.ev === 'setProfile' ? (e.profile ? 'P' : 'null') : e.ev).join(',');
console.log('fx sequence:', seq);
const bOk = ghostCalls.length > 0 && fxlog.filter(e => e.ev === 'played').every(e => !e.activeProfileAfterSet) && fxlog.some(e => e.ev === 'setProfile' && e.profile === null);
console.log('(b)', bOk ? 'PASS' : 'FAIL', '(no active run-time profile after play of a baked clip)');
const cOk = audio.some(a => a.played && a.maxTime > 0);
console.log('(c)', cOk ? 'PASS' : 'FAIL', JSON.stringify(audio.map(a => ({ played: a.played, ended: a.ended, maxTime: a.maxTime }))));
await browser.close();
process.exit(pass && bOk && cOk ? 0 : 1);
