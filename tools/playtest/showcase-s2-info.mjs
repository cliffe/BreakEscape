import { start, ev, objPos, waitAtPost, NPCS } from './showcase-s2-lib.mjs';
const h = await start(process.argv[2]);
for (const id of NPCS) await waitAtPost(h, id, 60000);
console.log(JSON.stringify(await ev(h, () => ({ room: window.currentPlayerRoom, p: [window.player.x, window.player.y], pos: window.roomPositions, ob: !!window.objectivesManager, gv: Object.keys(window.globalVariables || {}).slice(0, 12), clk: window.npcNeedsSystem.clockMs }))));
console.log(JSON.stringify(await objPos(h, 'office', 'office_coffee', 'office_mugs', 'office_coffee_socket')));
await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(1500);
console.log(JSON.stringify(await objPos(h, 'kitchen', 'kitchen_coffee', 'water_cooler', 'washing_up_tray')));
console.log(JSON.stringify(await ev(h, () => ({ room: window.currentPlayerRoom, p: [window.player.x, window.player.y] }))));
console.log(h.errs); await h.browser.close();
