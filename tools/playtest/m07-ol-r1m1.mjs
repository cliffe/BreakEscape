import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3098'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log=(k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
await ev(h,()=>window.__test.moveTo(520,248,{timeoutMs:25000}));
const chairs=()=>ev(h,()=>Object.values(window.rooms.operations_floor.objects).filter(o=>/chair/i.test((o.texture&&o.texture.key)||'')||/chair/i.test(o.scenarioData?.name||'')).map(o=>[o.texture?.key,+o.x.toFixed(1),+o.y.toFixed(1)]));
const before=await chairs(); log('chairs_before',before);
const t0=Date.now(); let both=false;
while(Date.now()-t0<240000){
  const s=await ev(h,()=>['adaeze_okafor','gwen_pritchard'].map(i=>window.__test.needs.state(i)));
  if(!both&&s.every(x=>x.job&&x.job.phase==="using")){both=true;log("both_using_at",(Date.now()-t0)/1000);}
  if(both&&s.every(x=>x.atPost&&!x.job&&x.mode==='idle'))break;
  await h.t(500);
}
for(const w of [2,8,20]){await h.t(w===2?2000:w===8?6000:12000);log('chairs_after+'+w,await chairs());log('seated',await ev(h,()=>['adaeze_okafor','gwen_pritchard'].map(i=>!!window.npcBehaviorManager.getBehavior(i)._seat)));}
const nl=await ev(h,()=>window.__test.needs.log());
log('seat_events',nl.filter(e=>/seat|mount|stuck|using|returned|no_beside/.test(e.ev)));
log('errs',h.errs.filter(e=>!/503/.test(e)));
await h.browser.close();
