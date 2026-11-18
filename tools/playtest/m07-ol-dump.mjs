import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3098'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log=(k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
log('state0', await ev(h,()=>{const s=window.__test.getState(); return {room:s.currentRoom||s.room, keys:Object.keys(s).slice(0,20), blocking:s.blockingUi, mg:s.activeMinigame}}));
for (let i=0;i<6;i++){ const st=await ev(h,()=>({mg:window.__test.getState().activeMinigame,b:window.__test.getState().blockingUi})); log('busy',st); if(!st.mg&&!st.b)break; await h.page.keyboard.press('Escape'); await h.t(800);}
const r = await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
log('enter', r);
await h.t(2000);
log('ops objects', await ev(h,()=>Object.values(window.rooms.operations_floor.objects||{}).map(o=>({k:o.texture?.key,id:o.scenarioData?.id||null,x:Math.round(o.x),y:Math.round(o.y),w:o.width,h:o.height}))));
log('needs ids', await ev(h,()=>window.__test.needs.ids()));
log('state', await ev(h,()=>['adaeze_okafor','gwen_pritchard'].map(i=>window.__test.needs.state(i))));
log('room bounds', await ev(h,()=>{const r=window.rooms.operations_floor; return {pos:r.position, w:r.map?.widthInPixels, h:r.map?.heightInPixels}}));
log('errs', h.errs);
await h.browser.close();
