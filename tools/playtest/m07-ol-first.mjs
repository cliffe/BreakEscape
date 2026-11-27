import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3098'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log=(k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
const T0=Date.now();
await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
const tEnter=Date.now();
await ev(h,()=>window.__test.moveTo(520,248,{timeoutMs:25000}));
const rd=()=>ev(h,()=>({a:window.__test.needs.state('adaeze_okafor'),g:window.__test.needs.state('gwen_pritchard'),ck:window.npcNeedsSystem.clockMs}));
let first=null,r0=null,samples=[];
const t0=Date.now();
while(Date.now()-t0<200000){
  const r=await rd(); const now=Date.now();
  if(!r0) r0={w:now,ck:r.ck,a:r.a.levels.thirst,g:r.g.levels.thirst};
  samples.push([Math.round((now-tEnter)/1000),r.ck,+r.a.levels.thirst.toFixed(2),+r.g.levels.thirst.toFixed(2),r.a.mode,r.g.mode]);
  if(!first&&(r.a.job||r.a.mode!=='idle')){first={sinceEnter:(now-tEnter)/1000,sinceMove:(now-t0)/1000,mode:r.a.mode,lvl:r.a.levels.thirst};}
  if(first&&now-tEnter>first.sinceEnter*1000+8000)break;
  await h.t(1000);
}
log('first',first);
log('initialA/G',{a:samples[0][2],g:samples[0][3]});
// clock ratio from samples while idle: needs-minutes fallen / real minutes (decay 10/min adaeze, 8/min gwen)
const idle=samples.filter(s=>s[4]==='idle'&&s[5]==='idle');
const s0=idle[0],s1=idle[idle.length-1];
const realMin=(s1[0]-s0[0])/60;
log('ratio',{realSec:s1[0]-s0[0],clockSec:(s1[1]-s0[1])/1000,adaeze:(s0[2]-s1[2])/10/realMin,gwen:(s0[3]-s1[3])/8/realMin});
log('log',await ev(h,()=>window.__test.needs.log().filter(e=>['urgent','job_start','using'].includes(e.ev)).slice(0,6)));
log('errs',h.errs.filter(e=>!/503/.test(e)));
await h.browser.close();
