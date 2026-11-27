// R2 m1 frame-time (checkpoint, ops seated, ops with operators away) and m5 trip re-time. One fresh game per run.
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port='3098'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log=(k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
await ev(h,()=>{ window.__fr=[]; let last=performance.now(); const f=(t)=>{ window.__fr.push([t, t-last, window.game.sys.game.loop.delta]); last=t; requestAnimationFrame(f);}; requestAnimationFrame(f); });
const stat=(a)=>{ if(!a.length) return null; const s=[...a].sort((x,y)=>x-y); return {n:a.length, mean:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2), p95:+s[Math.floor(s.length*0.95)].toFixed(2), max:+s[s.length-1].toFixed(1)}; };
const take=async (ms)=>{ const t0=await ev(h,()=>performance.now()); await h.t(ms); const t1=await ev(h,()=>performance.now()); const fr=await ev(h,([a,b])=>window.__fr.filter(x=>x[0]>=a&&x[0]<=b),[t0,t1]); return {raf:stat(fr.map(x=>x[1])), loop:stat(fr.map(x=>x[2]).filter(x=>x!=null))}; };
log('fps_target', await ev(h,()=>[window.game.sys.game.loop.targetFps, window.game.physics.world.fps, window.game.sys.game.loop.actualFps]));
log('checkpoint_30s', await take(30000));
await ev(h,()=>window.__test.enterRoom('operations_floor',{timeoutMs:20000}));
await ev(h,()=>window.__test.moveTo(520,248,{timeoutMs:25000}));
const tEnter=Date.now();
log('ops_seated_30s', await take(30000));
// now follow the natural trip, tagging frames
const ids=['adaeze_okafor','gwen_pritchard'];
const rec={}; ids.forEach(i=>rec[i]={});
const marks=[]; // [pageTime, nAway]
const t0=Date.now(); let bothAwayFrom=null, bothAwayTo=null;
while(Date.now()-t0<200000){
  const [s,pt]=await ev(h,()=>[['adaeze_okafor','gwen_pritchard'].map(i=>{const x=window.__test.needs.state(i);return {j:x.job&&x.job.phase,m:x.mode,p:x.atPost};}),performance.now()]);
  const now=(Date.now()-tEnter)/1000;
  s.forEach((x,k)=>{ const r=rec[ids[k]]; const away=!x.p; if(away&&r.left==null) r.left=now; if(x.j==='using'&&r.use==null) r.use=now; if(x.j!=='using'&&r.use!=null&&r.endUse==null) r.endUse=now; if(!away&&r.left!=null&&r.back==null) r.back=now; });
  marks.push([pt,s.filter(x=>!x.p).length]);
  if(rec[ids[0]].back!=null&&rec[ids[1]].back!=null) break;
  await h.t(250);
}
log('trip', rec);
const two=marks.filter(m=>m[1]===2).map(m=>m[0]);
if(two.length){ const a=Math.min(...two), b=Math.max(...two); const fr=await ev(h,([a,b])=>window.__fr.filter(x=>x[0]>=a&&x[0]<=b),[a,b]); log('both_away_window_s',(b-a)/1000); log('both_away_frames',{raf:stat(fr.map(x=>x[1])),loop:stat(fr.map(x=>x[2]).filter(x=>x!=null))}); }
const any=marks.filter(m=>m[1]>=1).map(m=>m[0]);
if(any.length){ const a=Math.min(...any), b=Math.max(...any); const fr=await ev(h,([a,b])=>window.__fr.filter(x=>x[0]>=a&&x[0]<=b),[a,b]); log('any_away_window_s',(b-a)/1000); log('any_away_frames',{raf:stat(fr.map(x=>x[1])),loop:stat(fr.map(x=>x[2]).filter(x=>x!=null))}); }
log('errs',h.errs.filter(e=>!/503/.test(e)));
await h.browser.close();
