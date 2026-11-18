import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3098'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log=(k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
for(let k=0;k<12;k++){await ev(h,()=>window.__test.dismissBlockingUi());await h.t(1000);}
const st=()=>ev(h,()=>{const i='adaeze_okafor';const s=window.npcBehaviorManager.getBehavior(i).sprite;const p=window.player;const n=window.__test.needs.state(i);return{x:Math.round(s.body.center.x),y:Math.round(s.body.center.y),px:Math.round(p.x),py:Math.round(p.y+31),hostile:window.npcHostileSystem.isNPCHostile(i),gh:window.npcHostileSystem.isNPCHostile('gwen_pritchard'),ko:window.npcHostileSystem.isNPCKO(i),mode:n?.mode,post:n?.atPost}});
const home=await st(); log('home',home);
// west side of Adaeze: stand 40 px west of her, face east, punch once
await ev(h,()=>window.__test.dismissBlockingUi());log('near',await ev(h,()=>window.__test.moveToNear('adaeze_okafor')));
await h.t(1500);log('pl',await st());
await ev(h,()=>{const s=window.npcBehaviorManager.getBehavior('adaeze_okafor').sprite;window.playerCombat.attack({x:s.x,y:s.y});});
await h.t(500);
log('after punch',await st());
const ch=[];for(let k=0;k<8;k++){const q=await st();ch.push([k,q.x,q.y,Math.round(Math.hypot(q.x-home.x,q.y-home.y)),Math.round(Math.hypot(q.px-q.x,q.py-q.y)),q.hostile,q.mode]);await h.t(1000);}log('chase [t,x,y,distPost,distPlayer,hostile,mode]',ch);
await ev(h,()=>window.__test.moveTo(window.player.x-120,window.player.y,{timeoutMs:15000}));const c2=[];for(let k=0;k<14;k++){const q=await st();c2.push([k,q.x,q.y,Math.round(Math.hypot(q.x-home.x,q.y-home.y)),Math.round(Math.hypot(q.px-q.x,q.py-q.y)),q.mode]);await h.t(1000);}log('mid120 [t,x,y,distPost,distPlayer,mode]',c2);
// retreat west/south beyond 200 px from her post, watch
let maxd=0,hostileSeen=false,chased=false;
await ev(h,()=>window.__test.moveTo(window.player.x-140,window.player.y,{timeoutMs:15000}));
const T0=Date.now();const rows=[];
for(let k=0;k<30;k++){
  const s=await st();const d=Math.round(Math.hypot(s.x-home.x,s.y-home.y));maxd=Math.max(maxd,d);
  if(s.hostile)hostileSeen=true;
  if(k%5===0)rows.push([Math.round((Date.now()-T0)/1000),s.hostile,d,Math.round(Math.hypot(s.px-s.x,s.py-s.y)),s.mode,s.post]);
  await h.t(1000);
}
log('rows [t,hostile,distFromPost,distToPlayer,mode,post]',rows);
const fin=await st();
log('final',{...fin,distFromPost:Math.round(Math.hypot(fin.x-home.x,fin.y-home.y)),maxd,hostileSeen});
log('globals',await ev(h,()=>{const g=window.__test.getState().globals||{};return Object.fromEntries(Object.entries(g).filter(([k])=>/ops_staff|adaeze|gwen/.test(k)))}));
log('errs',h.errs.filter(e=>!/503/.test(e)));
await h.browser.close();
