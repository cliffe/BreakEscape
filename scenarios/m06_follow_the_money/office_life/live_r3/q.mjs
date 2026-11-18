// R3 fix live: node q.mjs <gid> <mode: queue|print>
import { boot, goRoom } from './lib.mjs';
const [gid, mode] = process.argv.slice(2);
const TOM='tomasz_wisniewski', LER='lerato_dlamini', TR='trader_npc';
const T0=Date.now(); const log=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(1)+'s',...a);
const { browser, page, errs } = await boot(gid);
const sleep=ms=>page.waitForTimeout(ms);
const st=id=>page.evaluate(id=>{const s=window.__test.needs.state(id);const b=window.npcBehaviorManager.getBehavior(id);const sp=b?.sprite;
 return {job:s?.job?`${s.job.need}/${s.job.phase}/${s.job.targetId??''}`:null,atPost:s?.atPost??null,x:Math.round(sp.x),y:Math.round(sp.y),feet:Math.round(sp.y+31),room:b.roomId};},id);
async function talk(id){
  await page.evaluate(id=>window.__test.interact(id,{timeoutMs:30000}).catch(()=>0),id);
  await sleep(3000);
  for(let n=0;n<150;n++){const d=await page.evaluate(()=>window.__test.minigame.getState()?.dialogue||null);if(!d||d.ended)break;
   if(d.awaitingChoice)await page.evaluate(()=>window.__test.minigame.choose(1).catch(()=>0));else await page.evaluate(()=>window.__test.minigame.continue_().catch(()=>0));await sleep(250);}
  await page.evaluate(()=>window.__test.minigame.close().catch(()=>0));
}
await goRoom(page,'security_checkpoint'); await goRoom(page,'trading_floor'); await sleep(4000);
log('cells', await page.evaluate(()=>{const w=window.npcNeedsSystem.world;const o=w.getObject('floor_coffee');const f=w.getObject('floor_fridge');
 return JSON.stringify({coffeeCells:w.queueCells(o,[{dx:2,dy:0},{dx:3,dy:0}]),fridgeAff:f.affordance,coffeeAff:o.affordance});}));
const all=[TR,TOM,LER];
const seen={};
if(mode==='queue'){
  await talk(TR); log('talked Dani');
  await page.evaluate(()=>{window.__test.needs.set('lerato_dlamini','caffeine',5);window.__test.needs.set('tomasz_wisniewski','caffeine',5);});
  for(let t=0;t<120;t++){
    const row=[];
    for(const id of all){const s=await st(id);row.push(`${id.slice(0,4)} ${s.job||'-'} (${s.x},${s.y}) f${s.feet} ${s.room}`);
      if(s.job){const ph=s.job.split('/')[1];(seen[id]??=new Set()).add(ph+':'+s.room);}}
    log(row.join(' | '));
    await sleep(1500);
    if(t>10 && all.every(id=>true)){const ss=await Promise.all(all.map(st)); if(ss.every(s=>!s.job) && Object.keys(seen).length>=3) break;}
  }
  log('seen',JSON.stringify(Object.fromEntries(Object.entries(seen).map(([k,v])=>[k,[...v]]))));
  log('heard',await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(window.gameState.globalVariables).filter(([k])=>k.startsWith('heard_'))))));
}
if(mode==='fridge'){
  await page.evaluate(()=>{window.__test.needs.set('lerato_dlamini','hunger',5);window.__test.needs.set('tomasz_wisniewski','hunger',5);});
  for(let t=0;t<80;t++){const row=[];for(const id of [TOM,LER]){const s=await st(id);row.push(`${id.slice(0,4)} ${s.job||'-'} (${s.x},${s.y}) f${s.feet} ${s.room}`);}
   log(row.join(' | '));await sleep(1500);}
}
if(mode==='print'){
  // Irina conversation triggers Tomasz print errand; set coffee pair first
  await page.evaluate(()=>{window.__test.needs.set('lerato_dlamini','caffeine',5);window.__test.needs.set('trader_npc','caffeine',5);});
  await sleep(2000);
  await talk('irina_volkova'); log('talked Irina');
  for(let t=0;t<90;t++){const row=[];for(const id of all){const s=await st(id);row.push(`${id.slice(0,4)} ${s.job||'-'} (${s.x},${s.y}) ${s.room}`);}log(row.join(' | '));await sleep(1500);}
}
console.log('ERRS',JSON.stringify(errs.slice(0,3)));
await browser.close();
