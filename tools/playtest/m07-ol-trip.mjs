import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3098', tries='1'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log=(k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
await h.t(2500);
log('park',await ev(h,()=>window.__test.moveTo(520,248,{timeoutMs:25000})).then(r=>({ok:r.ok,f:r.feetAt})));
await h.t(1500);
let shot=false;
const snap=()=>ev(h,()=>{const o={};for(const i of ['adaeze_okafor','gwen_pritchard']){const s=window.__test.needs.state(i);const sp=window.npcBehaviorManager.getBehavior(i)?.sprite;o[i]={m:s.mode,at:s.atPost,job:s.job?{k:s.job.kind,obj:s.job.objectId,ph:s.job.phase,n:s.job.need,cell:s.job.cell||s.job.target||null}:null,x:+(sp.body.center.x-320).toFixed(1),y:+sp.body.center.y.toFixed(1),th:+s.levels.thirst.toFixed(1)};}return o;});
for (let t=0;t<+tries;t++){
  await ev(h,()=>window.__test.needs.set('adaeze_okafor','thirst',20));
  const t0=Date.now(); let last=''; const ev0=await ev(h,()=>window.__test.needs.log().length);
  while(Date.now()-t0<150000){
    const s=await snap(); const k=JSON.stringify(Object.values(s).map(v=>[v.m,v.job&&v.job.ph,v.job&&v.job.obj,v.at]));
    if(!shot&&Object.values(s).every(v=>v.job&&v.job.ph==='using')){await h.page.screenshot({path:'tmp/m07-both-using.png'});shot=true;}
    if(k!==last){log('t'+Math.round((Date.now()-t0)/1000),s);last=k;}
    if(Object.values(s).every(v=>v.at&&!v.job&&v.m==='idle')&&Date.now()-t0>20000)break;
    await h.t(500);
  }
  log('log', await ev(h,(n)=>window.__test.needs.log().slice(n),ev0));
  await h.t(3000);
}
log('errs',h.errs);
await h.browser.close();
