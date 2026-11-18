// m07 office life, natural run: enter the ops floor, stand in the middle of the room, set nothing, watch 240 s.
// node tools/playtest/m07-blind-natural.mjs <gameId> [port] [seconds] [x] [y]
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3137', secs='240', px='300', py='200'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log=(k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
await h.t(1500);
await ev(h,()=>window.__test.dismissBlockingUi());
log('park',await ev(h,(a)=>window.__test.moveTo(a[0],a[1],{timeoutMs:25000}),[+px,+py]).then(r=>({ok:r.ok,f:r.feetAt})));
const t0=Date.now(); let last='';
const snap=()=>ev(h,()=>{const o={};for(const i of ['adaeze_okafor','gwen_pritchard']){const s=window.__test.needs.state(i);const sp=window.npcBehaviorManager.getBehavior(i)?.sprite;o[i]={m:s.mode,at:s.atPost,job:s.job?{k:s.job.kind,ph:s.job.phase}:null,x:Math.round(sp.body.center.x-320),y:Math.round(sp.body.center.y),th:+s.levels.thirst.toFixed(1)};}
 o.bl=window.__test.getState().blockingUi?1:0; return o;});
while(Date.now()-t0<+secs*1000){
  const s=await snap(); const k=JSON.stringify([s.adaeze_okafor.m,s.adaeze_okafor.job,s.gwen_pritchard.m,s.gwen_pritchard.job,s.bl]);
  if(k!==last){log('t'+Math.round((Date.now()-t0)/1000),s);last=k;}
  await h.t(1000);
}
log('globals',await ev(h,()=>({ex1:window.gameState?.globalVariables?.heard_ex_last_two,srv:window.gameState?.globalVariables?.server_hall_reached})));
log('needslog', await ev(h,()=>window.__test.needs.log()));
log('errs',h.errs);
await h.browser.close();
