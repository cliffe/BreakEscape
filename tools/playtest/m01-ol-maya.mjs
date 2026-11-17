// Step 5 / test 14: Maya's trip and its privacy guards, one route per run.
//   node tools/playtest/m01-ol-maya.mjs <route> <gameId> [port]
// Routes: post, tipoff, tellall, topicchoices, getstarted, inout, away, attack
// Headless, setFPS(20), fixed steps on. Never setManualClock. A null needs state counts as at post.
import { open, load, ev, dlg, converse, waitAtPost, dismiss } from './m01-ol-lib.mjs';
const [route, gid, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const G = () => ev(h, () => { const g = window.gameState?.globalVariables || {}; return { away: g.maya_away, settled: g.maya_settled, disc: g.discussed_operation, ko: g.maya_ko }; });
const mst = () => ev(h, () => { const s = window.__test.needs.state('maya_chen'); const sp = window.npcBehaviorManager?.getBehavior('maya_chen')?.sprite; return { mode: s?.mode, atPost: s?.atPost, job: s?.job ? { obj: s.job.objectId, phase: s.job.phase } : null, room: window.npcManager?.getNPC?.('maya_chen')?.roomId, x: sp ? +(sp.body.center.x / 32).toFixed(1) : null, y: sp ? +(sp.body.center.y / 32).toFixed(1) : null, room_p: window.currentPlayerRoom }; });
const talk = async () => { const r = await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500); return r; };
const esc = async () => { await h.page.keyboard.press('Escape'); await h.t(900); const d = await dlg(h); if (d.active) { await h.page.keyboard.press('Escape'); await h.t(700); } return !(await dlg(h)).active; };
const lastLines = async () => (await dlg(h)).text;
// advance with Space until the dialogue shows choices or closes; return text history
async function toChoices(max = 25) { const seen = []; for (let i = 0; i < max; i++) { const d = await dlg(h); if (!d.active) return { closed: true, seen }; const t = (d.text || '').split('\n').filter(x => x.trim() && !/^(×|Skip)/.test(x.trim())); const l = t[t.length - 1]; if (l && !seen.includes(l)) seen.push(l); if (d.controls.some(c => /^\d\./.test(c))) return { closed: false, seen, choices: d.controls }; await h.page.keyboard.press('Space'); await h.t(800); } return { seen, timeout: true }; }
const pick = async re => { const r = await ev(h, p => window.__test.minigame.chooseMatching(p), re); await h.t(900); return r?.ok; };
async function followMaya(maxMs = 20000) { const t0 = Date.now(); while (Date.now() - t0 < maxMs) { const m = await mst(); if (m.job || m.mode !== 'idle') return m; await h.t(300); } return await mst(); }

log('start', { m: await mst(), g: await G() });
if (route === 'post') {
  log('fresh at post', await waitAtPost(h, 'maya_chen', 20000));
  await load(h); await h.t(3000);
  log('after reload at post', { w: await waitAtPost(h, 'maya_chen', 20000), m: await mst() });
}
if (route === 'tipoff' || route === 'tellall' || route === 'topicchoices' || route === 'getstarted') {
  await waitAtPost(h, 'maya_chen', 20000);
  log('talk1', (await talk())?.ok);
  let r = await toChoices(); log('opener', r);
  await pick("That's right"); r = await toChoices(); log('after opener', r);
  if (route === 'tipoff') { await pick('What message'); r = await toChoices(); log('reveal', r); await pick('Tell me more'); }
  else { await pick('SAFETYNET sent me'); r = await toChoices(); log('informant', r); await pick('Tell me everything'); }
  // now on the first operation line(s)
  await h.t(600);
  if (route === 'topicchoices') { r = await toChoices(); log('topic choices', { seen: r.seen, choices: r.choices, g: await G() }); }
  else log('first op line', { text: await lastLines(), g: await G() });
  log('esc closed', await esc());
  await h.t(5000);
  log('5s after Esc (expect at post, no trip)', { m: await mst(), g: await G() });
  // reopen
  log('talk2', (await talk())?.ok);
  r = await toChoices(); log('resume', r);
  if (route === 'getstarted') {
    // finish this topic to the hub, then tactical advice and "I'll get started"
    await pick("okay with that"); r = await toChoices(); log('after topic', { seen: r.seen, choices: r.choices, g: await G() });
    log('esc at hub?', 'no, continue'); await pick('What should I do first'); r = await toChoices(); log('tactical', r);
    await pick("I'll get started"); await h.t(2500);
    log('after get started: dialogue', await dlg(h));
    await esc(); await h.t(5000);
    log('5s after I\'ll get started (expect at post)', { m: await mst(), g: await G() });
    log('talk3', (await talk())?.ok);
    r = await toChoices(); log('next talk (expect tail line then hub)', r);
    log('settled at hub', await G());
    await pick('keep investigating'); await h.t(500); await esc(); 
    const t0 = Date.now(); let m = await mst(); while (Date.now() - t0 < 9000 && !m.job) { await h.t(300); m = await mst(); }
    log('trip armed after close at hub', m);
  } else {
    await pick("okay with that"); r = await toChoices(); log('back at hub choices', { seen: r.seen, choices: r.choices, g: await G() });
    await pick('keep investigating'); await h.t(500); await esc();
    const t0 = Date.now(); let m = await mst(); while (Date.now() - t0 < 9000 && !m.job) { await h.t(300); m = await mst(); }
    log('trip started after close at hub', { m, g: await G(), ms: Date.now() - t0 });
  }
}
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.page.screenshot({ path: `tmp/m01-maya-${route}.png` });
await h.browser.close();
