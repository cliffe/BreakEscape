// m07 gate minors: committing the team with the correction already in hand puts a toast up saying the window is open.
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3168', out] = process.argv.slice(2);
const h = await open(gid, port);
await ev(h, () => window.__test.throttleFps(20));
const log = (k,v)=>console.log(k, JSON.stringify(v));
const shot = n => h.page.screenshot({ path: `${out}/${n}.png` });
const state = () => ev(h,()=>{const s=window.__test.minigame.getState();const d=s?.dialogue||{};return {id:s?.id,say:(d.text||'').slice(0,80),ch:(d.choices||[]).map(c=>c.text),cont:d.canContinue}});
const barks = () => ev(h,()=>[...document.querySelectorAll('.npc-bark')].map(e=>e.textContent.trim().slice(0,160)));
await h.t(4000);
let committed=false;
for (let i=0;i<80 && !committed;i++){
  const s = await state();
  if (s.ch && s.ch.length){
    const pick = s.ch.find(t=>/Fracture/.test(t)) || s.ch.find(t=>/made the call/i.test(t)) || s.ch.find(t=>/walk me through|Meltdown/i.test(t)) || s.ch[0];
    if (/Fracture/.test(pick)) committed=true;
    await ev(h,(t)=>window.__test.minigame.clickText(t),pick); log('pick',pick);
  } else if (s.cont) { await ev(h,()=>window.__test.mg?.continue?.() ?? window.__test.minigame.action?.('continue')); }
  else await ev(h,()=>window.__test.minigame.clickText('Continue'));
  await h.t(600);
}
log('committed', committed);
await h.t(1500);
await ev(h,()=>window.__test.dismissBlockingUi?.());
const t0=Date.now(); let seen=[];
while(Date.now()-t0<20000){ const b=await barks(); for(const x of b) if(!seen.includes(x)) { seen.push(x); log('bark@'+Math.round((Date.now()-t0)/1000)+'s', x); if(/can still be moved/.test(x)) await shot('window1-toast'); } await h.t(500); }
log('timers', await ev(h,()=>[...document.querySelectorAll('[class*=timer]')].map(e=>e.textContent.trim().slice(0,60))));
await shot('window2-hud');
log('errs', h.errs.filter(e=>!/503/.test(e)));
await h.browser.close();
