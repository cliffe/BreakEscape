// Exploration: route then inspect badge and try the server door.
import { open, ev } from './m01-ol-lib.mjs';
import { route } from './m07-ol-route.mjs';
const [gid, port = '3098'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v).slice(0, 1500));
h.page.on('console', m => { if (/RFID|CHECK|Access|denied/i.test(m.text())) console.log('CON', m.text().slice(0, 500)); });
await h.t(3000);
await route(h, () => {});
log('items', await ev(h, () => window.inventory.items.filter(i => /badge|rfid/i.test(JSON.stringify(i.scenarioData))).map(i => { const d = i.scenarioData; return { id: d.id, name: d.name, type: d.type, desc: d.description || d.observations, card_id: d.card_id, rfid_data: d.rfid_data, key_id: d.key_id }; })));
log('badge full', await ev(h, () => window.inventory.items.filter(i => i.scenarioData.id === 'printed_contractor_badge').map(i => i.scenarioData)));
const D='door:operations_floor->server_room';
await ev(h, (d) => window.__test.moveToNear(d), D);
await ev(h, (d) => window.__test.interact(d), D);
await h.t(1500);
log('inv all', await ev(h, () => window.inventory.items.map(i => ({ n: i.scenarioData.name, t: i.scenarioData.type }))));
await h.browser.close();
