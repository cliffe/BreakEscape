// m10 duty-guard / Fitter's Locker live proof (keyless server, headless, fixed steps ON, 20 fps).
//   M10_PORT=3201 node tools/playtest/m10-locker-proof.mjs <gameId> [pickA|pickB]
// Picks the fitter's locker under the duty guard's eye; walks the "Read what it says under the photo" choice.
// Prints the guard's state, the player's HP, what blocks the canvas, and whether F punches.
import { start } from './m10-ol-lib.mjs';
const [gid, which = 'pickA'] = process.argv.slice(2);
const g = await start(gid, { reload: false });
await g.ev(() => window.__test.throttleFps(20));
const snap = (tag) => g.ev(() => {
  const st = window.__test.getState();
  let h = null; try { h = window.npcHostileSystem.isNPCHostile('duty_guard'); } catch (e) {}
  let beh = null; try { beh = window.npcBehaviorManager.getBehavior('duty_guard').currentState; } catch (e) {}
  return { room: window.currentPlayerRoom, hp: window.playerHealth?.getHP?.() ?? null, hostile: h, beh,
    mg: window.MinigameFramework?.currentMinigame?.constructor?.name || null,
    block: st.blockingUi && st.blockingUi.blocking ? { id: st.blockingUi.id, cls: st.blockingUi.classes, t: (st.blockingUi.text||'').slice(0,80) } : null };
}).then((r) => console.log(tag, JSON.stringify(r)));
await snap('start');
const lk = await g.ev(() => { const o = window.__test.getState({}); return Object.keys(o).slice(0,20); });
console.log(lk.join(','));
await g.ev(() => window.__test.interact('fitter_locker')).then((r) => console.log('interact', JSON.stringify(r).slice(0, 300)));
await g.t(1500);
await snap('after-interact');

const dlg = () => g.ev(() => { const d = window.__test.getState().dialogue; return d && { text: (d.text||'').slice(0,120), choices: (d.choices||[]).map(c=>c.text), awaiting: d.awaitingChoice, cont: d.canContinue, closed: d.closed }; });
for (let i = 0; i < 14; i++) {
  await g.ev(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(()=>{});
  await g.t(1200);
  await g.ev(() => window.__test.interact('fitter_locker')).catch(()=>{});
  await g.t(1500);
  const r = await g.ev(() => window.MinigameFramework?.currentMinigame?.constructor?.name);
  if (r === 'PersonChatMinigame') break;
}
await g.ev(() => { window.__top = {}; setInterval(() => { const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); const st = document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2); if (st[0] !== c) { const k = (st[0].tagName + '#' + st[0].id + '.' + st[0].className).slice(0,100); window.__top[k] = (window.__top[k]||0)+1; } }, 15); });
await snap('chat');
console.log('dlg', JSON.stringify(await dlg()));
const waitChoices = async () => { for (let k = 0; k < 20; k++) { const d = await dlg(); if (d && d.awaiting) return d; await g.t(500); } return await dlg(); };
const pickBy = (re) => g.ev((src) => window.__test.minigame.choose(new RegExp(src)), re);
const state = async (tag) => { await snap(tag); console.log(' ', JSON.stringify(await dlg()), JSON.stringify(await g.ev(() => window.__test.getState().globals.duty_warnings))); };
console.log('1 choices', JSON.stringify(await waitChoices()));
console.log('choose photo', JSON.stringify(await pickBy('photo')).slice(0, 120));
console.log('2 choices', JSON.stringify(await waitChoices()));
await state('after-photo (guard must NOT be hostile)');
console.log('3 choices', JSON.stringify(await waitChoices()));
console.log('choose back off', JSON.stringify(await pickBy('Back off')).slice(0, 120));
for (let k = 0; k < 12 && (await g.ev(() => window.MinigameFramework?.currentMinigame?.constructor?.name)) === 'PersonChatMinigame'; k++) await g.t(700);
await state('after-back-off (chat closed, guard calm)');
// second catch
for (let i = 0; i < 14; i++) {
  await g.ev(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(()=>{});
  await g.t(1200);
  await g.ev(() => window.__test.interact('fitter_locker')).catch(()=>{});
  await g.t(1500);
  if ((await g.ev(() => window.MinigameFramework?.currentMinigame?.constructor?.name)) === 'PersonChatMinigame') break;
}
await g.t(2500);
await state('second-catch (hostile on the line)');
await g.t(7000);
await state('after-second-catch');
await g.t(4000);
await state('later');
await g.ev(() => window.__test.pressKey('f')).then(r=>console.log('pressF', JSON.stringify(r).slice(0,200)));
await g.browser.close();
