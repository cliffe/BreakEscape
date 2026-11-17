// Bernadette's conversation at her post in the evening: prints the transcript, checks the goodbye line.
import { start, log, converse } from './m05-ol-lib.mjs';
const g = await start(process.argv[2]);
const seen = []; g.page.on('request', r => { if (/\/tts$/.test(new URL(r.url()).pathname)) seen.push('tts'); });
for (const r of ['main_corridor', 'server_hallway', 'server_room', 'server_hallway', 'main_corridor', 'break_room']) { let x = await g.enter(r); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter(r); } }
await g.t(2500);
log('B', JSON.stringify(await g.pos('bernadette_lyons')));
log('near', JSON.stringify(await g.near('bernadette_lyons'))); await g.t(500);
log('interact', JSON.stringify(await g.interact('bernadette_lyons')));
const lines = [];
for (let i = 0; i < 40; i++) {
  await g.page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 6000 })).catch(() => {});
  const st = await g.ev(() => { const m = window.MinigameFramework && window.MinigameFramework.currentMinigame; return m ? (window.__test.getState().dialogue || { none: true }) : null; });
  if (!st) { lines.push('<closed>'); break; }
  if (st.text) lines.push(JSON.stringify(st.text));
  if (st.choices && st.choices.length) { lines.push('CHOICES ' + JSON.stringify(st.choices.map(c => c.text || c))); await g.shot('s6-bernadette-choice'); await g.page.evaluate(() => window.__test.minigame.chooseIndex(1)).catch(() => {}); }
  else if (st.canContinue) await g.page.evaluate(() => window.__test.minigame.continue()).catch(() => {});
  else if (st.ended) { await g.shot('s6-bernadette-goodbye'); lines.push('<ended>'); await g.page.evaluate(() => window.__test.minigame.close()).catch(() => {}); break; }
  await g.t(300);
}
console.log(lines.join('\n'));
log('goodbye present', lines.some(l => /Right you are\. Mind how you go\./.test(l)));
log('errs', JSON.stringify(g.errs));
await g.browser.close();
