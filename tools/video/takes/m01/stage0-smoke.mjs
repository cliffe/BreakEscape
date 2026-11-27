// Stage 0 smoke take. Entry state: head-start game
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room break_room --unlock main_office_area
// Walks break_room, crosses into main_office_area, walks it (~30 s), then talks to Derek in break_room if he is there.
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export default async (page, bridge, mark) => {
  const mv = async (x, y, label) => { mark('move:' + label, { x, y }); const r = await bridge.moveTo(x, y, { timeoutMs: 15000 }); mark('arrived:' + label, { ok: r && r.ok, reason: r && r.reason }); await sleep(400); };
  // the head-start game opens the 'Mission Brief' notes minigame; close it first
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { mark('close-brief'); await bridge.minigame.close().catch(() => {}); await sleep(800); }
  for (let i = 0; i < 4; i++) { const b = (await bridge.getState()).blockingUi; if (!b) break; mark('dismiss-ui', { text: String(b.text).slice(0, 60), buttons: b.buttons.map(x => x.label) }); const tut = /tutorial/i.test(b.classes + b.text); await bridge.dismissBlockingUi(tut ? 'figure it out' : null).catch(() => {}); await sleep(800); }
  await mv(96, 150, 'a'); await mv(220, 200, 'b'); await mv(120, 230, 'c'); await mv(270, 80, 'door-approach');
  mark('enterRoom', await bridge.enterRoom('main_office_area').then(r => !!(r && r.ok !== false)).catch(e => String(e)));
  await sleep(800);
  const s = await bridge.getState(); mark('room', s.room);
  const p = s.player;
  for (const [dx, dy] of [[70, 0], [0, 60], [-70, 0], [0, -60]]) await mv(p.x + dx, p.y + dy, 'office');
  mark('back');
  await bridge.enterRoom('break_room').catch(() => {});
  await sleep(600);
  const r = await bridge.interact('derek_lawson', { timeoutMs: 15000 }).catch(e => ({ error: String(e) }));
  mark('interact-derek', r && (r.ok ?? r.error));
  await bridge.waitForDialogue({ timeoutMs: 8000 }).catch(() => {});
  mark('mg', (await bridge.getState()).activeMinigame);
  await sleep(6000);
  await bridge.minigame.close().catch(() => {});
};
