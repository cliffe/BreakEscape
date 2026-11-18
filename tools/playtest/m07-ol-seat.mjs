import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3098'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log=(k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
await h.t(2500);
log('npc', await ev(h,()=>['adaeze_okafor','gwen_pritchard'].map(i=>{const s=window.npcBehaviorManager.getBehavior(i)?.sprite; return {i,x:s.x,y:s.y,bx:s.body.center.x,by:s.body.center.y,seated:s._seated||s.isSeated||null,anim:s.anims?.currentAnim?.key,tx:(s.body.center.x-320)/32,ty:s.body.center.y/32, depth:s.depth}})));
log('player', await ev(h,()=>({x:window.player.x,y:window.player.y,bx:window.player.body.center.x,by:window.player.body.center.y})));
// cooler: sprite and use cell info
log('cooler', await ev(h,()=>{const s=window.npcNeedsSystem; const o=Object.values(window.rooms.operations_floor.objects).find(o=>o.scenarioData?.id==='ops_cooler'); const keys=Object.keys(s).filter(k=>/obj|machine|affordance/i.test(k)); return {keys, ox:o.x,oy:o.y,ow:o.width,oh:o.height,ocx:o.getCenter?.()}}));
await h.page.screenshot({path:'tmp/m07-ops0.png'});
await h.browser.close();
