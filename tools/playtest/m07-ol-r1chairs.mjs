import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3098'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
await h.t(3000);
await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
await ev(h,()=>window.__test.moveTo(520,248,{timeoutMs:25000}));
console.log('chairs_start',JSON.stringify(await ev(h,()=>Object.values(window.rooms.operations_floor.objects).filter(o=>/chair/i.test((o.texture&&o.texture.key)||'')||/chair/i.test(o.scenarioData?.name||'')).map(o=>[o.texture?.key,+o.x.toFixed(1),+o.y.toFixed(1)]))));
await h.browser.close();
