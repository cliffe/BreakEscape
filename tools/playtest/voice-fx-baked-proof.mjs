// Live proof for baked voice FX (tools/voice_fx/bake.py): a real POST /tts for an m02 Ghost line
// returns X-Voice-FX-Baked with a body whose MD5 is the sidecar's baked_md5, and the client skips the
// run-time 'voice-distortion' for it but still applies it to a clip with no header.
//   node tools/playtest/voice-fx-baked-proof.mjs <game_url>      (keyless server, e.g. :3026)
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv[2];
const md5 = b => createHash('md5').update(b).digest('hex');
const sidecars = readdirSync('tts_cache/m02_ransomed_trust').filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync('tts_cache/m02_ransomed_trust/' + f)));
const bySpeaker = t => sidecars.find(s => s.npc === 'ghost' && s.text === t);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} performance.setResourceTimingBufferSize(5000); });
const tts = [];
page.on('response', async r => {
  if (r.request().method() === 'POST' && r.url().endsWith('/tts')) {
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
// Instrument the real TTSManager class the game loaded: log every FX-profile change with the play() it belongs to
const inst = await page.evaluate(async () => {
  const src = performance.getEntriesByType('resource').map(e => e.name).find(n => /systems\/tts-manager\.js/.test(n));
  const mod = await import(src); const P = mod.default.prototype;
  window.__fxlog = [];
  const setP = P._setActiveFXProfile, play = P.play;
  P._setActiveFXProfile = function (p) { window.__fxlog.push({ ev: 'setProfile', profile: p ? 'voice-distortion-object' : null }); console.log('[TTSPROOF] _setActiveFXProfile(' + (p ? 'profile' : 'null') + ')'); return setP.call(this, p); };
  P.play = async function (npc, text, o) { window.__fxlog.push({ ev: 'play', npc, text }); console.log('[TTSPROOF] play ' + npc + ': ' + String(text).slice(0, 50)); const r = await play.call(this, npc, text, o); window.__fxlog.push({ ev: 'played', npc, activeProfileAtEnd: !!this._activeFXProfile, ms: r }); console.log('[TTSPROOF] play done ' + npc + ' activeProfileAtEnd=' + !!this._activeFXProfile); return r; };
  return src;
});
console.log('instrumented', inst.split('/').slice(-3).join('/'));

// Clear the resume overlay, title screen, intro chat and Mission Brief as the playtest scripts do
for (let i = 0; i < 40; i++) {
  const st = await page.evaluate(() => ({ blocked: window.__test.openInventoryItem?.('phone') }));
  const mg = await page.evaluate(() => window.MinigameFramework?.currentMinigame?.constructor?.name || null);
  if (mg === 'NotesMinigame') { await page.evaluate(() => window.__test.minigame.close()); await page.waitForTimeout(1200); continue; }
  if (mg === 'PhoneChatMinigame' || mg === 'PhoneMinigame') { break; }
  const miss = d => !d || String(d.reason || '').startsWith('no-button-matching');
  let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume'));
  if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi('figure it out'));
  if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi('ready'));
  if (miss(d)) d = await page.evaluate(() => window.__test.dismissBlockingUi());
  if (d?.reason === 'ambiguous-blocking-ui') d = await page.evaluate(() => window.__test.minigame.chooseIndex(2));
  if (d?.reason === 'blocking-ui-has-no-buttons') await page.keyboard.press('Space');
  await page.waitForTimeout(1200);
}
console.log('after clearing, minigame:', await page.evaluate(() => window.MinigameFramework?.currentMinigame?.constructor?.name || null));
await page.evaluate(() => window.MinigameFramework?.currentMinigame && window.__test.minigame.close());
await page.waitForTimeout(800);

// 1. REAL PATH: the Ghost phone contact speaks through the game's own phone-chat TTS
const line = bySpeaker('Money is simply a means to hasten your inevitable end.');
// the knot the m02 recovery-console mapping opens, through the game's own bark -> openPhoneChat path
await page.evaluate(() => window.barkSystem.openPhoneChat({ npcId: 'ghost', startKnot: 'on_recovery_console' }));
await page.waitForTimeout(6000);
const btns = await page.evaluate(() => [...document.querySelectorAll('[class*="voice"], [class*="play"]')].map(e => e.className + '|' + (e.textContent || '').trim().slice(0, 30)).slice(0, 10));
console.log('voice buttons:', JSON.stringify(btns));
const pb = page.locator('.voice-message-play-btn, .voice-play-btn, [class*="voice-message"] button').first();
if (await pb.count()) { await pb.click().catch(() => {}); await page.waitForTimeout(4000); }
const tabs = await page.evaluate(() => [...document.querySelectorAll('[class*="contact"], [class*="phone"] button')].slice(0, 12).map(e => (e.className + '|' + (e.textContent || '').trim().slice(0, 40))));
console.log('phone dom:', JSON.stringify(tabs));
console.log('minigame:', await page.evaluate(() => window.MinigameFramework?.currentMinigame?.constructor?.name || null));
console.log('real /tts calls so far:', JSON.stringify(tts, null, 1));

// 2. The same two cases through the game's own TTSManager.play -> ApiClient.getTTS -> POST /tts, Ghost's scenario fx registered as
//    phone-chat-ui.js does (setVoiceFX(npcId, voice.fx)): (a) a cached line = baked clip; (b) a clip the server sends with no header
const cleanBytes = readFileSync('tts_cache/m02_ransomed_trust/clean/' + line.key + '.mp3');
await page.route('**/tts', async route => {
  const req = route.request();
  if (req.method() === 'POST' && /PROOF unbaked/.test(req.postData() || '')) {
    return route.fulfill({ status: 200, contentType: 'audio/mpeg', body: cleanBytes }); // no X-Voice-FX-Baked
  }
  return route.continue();
});
const fx = await page.evaluate(() => window.gameScenario?.rooms ? null : null);
const run = async (text) => page.evaluate(async (t) => {
  const src = performance.getEntriesByType('resource').map(e => e.name).find(n => /systems\/tts-manager\.js/.test(n));
  const TTS = (await import(src)).default; const m = new TTS();
  m.setVoiceFX('ghost', 'voice-distortion');
  window.__fxlog.push({ ev: 'case', text: t });
  const ms = await m.play('ghost', t);
  return { ms, activeProfileAfter: !!m._activeFXProfile };
}, text);
const before = tts.length;
const fetched = await page.evaluate(async (t) => {
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
  const r = await fetch(location.pathname.replace(/\/?$/, '') + '/tts', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ npc_id: 'ghost', text: t }) });
  const buf = new Uint8Array(await r.arrayBuffer()); let bin = ''; buf.forEach(b => bin += String.fromCharCode(b));
  return { status: r.status, header: r.headers.get('X-Voice-FX-Baked'), type: r.headers.get('content-type'), b64: btoa(bin) };
}, 'Money is simply a means to hasten your inevitable end.');
const fbody = Buffer.from(fetched.b64, 'base64');
console.log('POST /tts (m02 Ghost):', fetched.status, fetched.type, 'X-Voice-FX-Baked:', fetched.header, 'bytes', fbody.length, 'body md5', md5(fbody), '| sidecar baked_md5', line.voice_fx.baked_md5, md5(fbody) === line.voice_fx.baked_md5 ? 'MATCH' : 'MISMATCH');
const baked = await run('Money is simply a means to hasten your inevitable end.');
const unbaked = await run('PROOF unbaked clip, no header.');
console.log('baked case  :', JSON.stringify(baked), JSON.stringify(tts[before]));
console.log('unbaked case:', JSON.stringify(unbaked), JSON.stringify(tts[before + 1]));
console.log('sidecar baked_md5 for the baked line:', line.voice_fx.baked_md5, ' clean_md5:', line.voice_fx.clean_md5);
console.log('fxlog:', JSON.stringify(await page.evaluate(() => window.__fxlog), null, 1));
await browser.close();
