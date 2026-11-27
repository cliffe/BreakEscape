// t09_incident_room: the Major Incident Command Board (crescendo 15 f). Feeds the crescendo's "command board" shot (the backup console is NOT filmed).
// Entry state: tools/video/takes/run-take.sh sis01 t09_incident_room "--start-room major_incident_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Fresh game. Interact command_board, hold 3.0 s with frame marks, close. Marks: interact, minigame (id/type), panel-rect (the board's container, crop box), frame:board_t+N, closed, end.
import { sleep, prepare, sprite, interact, rectOf } from './_sis01b.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  mark('start-hold'); await sleep(1200);
  await interact(bridge, mark, 'command_board');
  let mg = null; for (let i = 0; i < 40 && !mg; i++) { mg = (await bridge.getState()).activeMinigame; if (!mg) await sleep(150); }
  if (!mg) throw new Error('command_board opened no minigame');
  mark('minigame', { mg: JSON.stringify(mg).slice(0, 160) });
  await sleep(500);
  mark('panel-rect', { box: await page.evaluate(() => { const c = document.querySelector('.minigame-container, [class*=minigame-container], [class*=game-container]'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cls: c.className }; }),
    text: await page.evaluate(() => (document.querySelector('.minigame-container, [class*=minigame-container]')?.innerText || '').slice(0, 400)) });
  for (const f of [0.6, 1.5, 2.4, 3.0]) { await sleep(f === 0.6 ? 100 : 800); mark('frame:board_t+' + f); }
  await bridge.minigame.close().catch(() => {}); mark('closed');
  await sleep(500); mark('end');
};
