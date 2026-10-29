#!/usr/bin/env node
/**
 * record-take.mjs - run and record one take (video + live audio) of Break Escape.
 *
 * CLI:
 *   VIDEO_STATE_DIR=<dir> NODE_PATH=/opt/node-tools/node_modules \
 *   node record-take.mjs --display 97 --url http://127.0.0.1:3001/break_escape/games/<id> \
 *        --take ../takes/m01/foo.mjs --out <dir>/foo [--fps 30] [--size 1920x1080] [--music 0] \
 *        [--sfx 1 --voice 1 --master 1] [--zoom 0] [--no-sandbox true|false] [--no-bridge]
 *   Writes <out>.mkv, <out>.markers.json, <out>.ffmpeg.log
 *
 * Library: import { recordTake } from './record-take.mjs'.
 *
 * A take module: export default async (page, bridge, mark) => { ... }
 *   page    Playwright page
 *   bridge  proxy for window.__test: await bridge.getState(); await bridge.minigame.choose(1)
 *           (also bridge.eval(fn, arg) for an arbitrary page.evaluate)
 *   mark    mark('label', {any: 'data'}) -> logs a take-relative time (ms from the start slate)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launchGame } from './launch.mjs';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Proxy so bridge.foo.bar(a, b) runs window.__test.foo.bar(a, b) in the page. */
export function makeBridge(page) {
  const make = (pathParts) => new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === 'then') return undefined;
      if (prop === 'eval' && pathParts.length === 0) return (fn, arg) => page.evaluate(fn, arg);
      return make([...pathParts, String(prop)]);
    },
    apply(_t, _this, args) {
      return page.evaluate(({ p, a }) => {
        let ctx = window.__test, fn = window.__test;
        for (const k of p) { ctx = fn; fn = fn[k]; }
        return fn.apply(ctx, a);
      }, { p: pathParts, a: args });
    },
  });
  return make([]);
}

function cpuSample() {
  const l = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0].trim().split(/\s+/).slice(1).map(Number);
  const idle = l[3] + (l[4] || 0);
  return { idle, total: l.reduce((a, b) => a + b, 0) };
}

async function startFfmpeg({ display, sink, fps, size, outFile, logFile, pixFmt, crf, preset, audioDelayMs = 0 }) {
  const args = [
    '-y', '-hide_banner',
    '-thread_queue_size', '1024', '-use_wallclock_as_timestamps', '1',
    '-f', 'x11grab', '-draw_mouse', '0', '-framerate', String(fps), '-video_size', size, '-i', `:${display}`,
    '-thread_queue_size', '1024', '-use_wallclock_as_timestamps', '1',
    ...(audioDelayMs ? ['-itsoffset', String(audioDelayMs / 1000)] : []),   // audio leads picture: delay it
    '-f', 'pulse', '-ar', '48000', '-ac', '2', '-i', `${sink}.monitor`,
    '-fps_mode', 'cfr', '-r', String(fps),
    '-c:v', 'libx264', '-crf', String(crf), '-preset', preset, '-pix_fmt', pixFmt,
    '-c:a', 'pcm_s16le', outFile,
  ];
  const log = fs.createWriteStream(logFile);
  const proc = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
  const st = { proc, startedAt: Date.now(), firstFrameAt: null, last: '', speeds: [], exited: null };
  let buf = '';
  proc.stderr.on('data', (d) => {
    log.write(d);
    buf += d.toString();
    const parts = buf.split(/[\r\n]+/); buf = parts.pop();
    for (const p of parts) {
      if (/^frame=/.test(p.trim())) {
        if (!st.firstFrameAt) st.firstFrameAt = Date.now();
        st.last = p.trim();
        const m = /speed=\s*([\d.]+)x/.exec(p); if (m) st.speeds.push(Number(m[1]));
      }
    }
  });
  proc.on('exit', (code, sig) => { st.exited = { code, sig }; log.end(); });
  for (let i = 0; i < 100 && !st.firstFrameAt && !st.exited; i++) await sleep(100);
  if (!st.firstFrameAt) throw new Error('ffmpeg did not start recording; see ' + logFile);
  st.stop = async () => {
    if (st.exited) return;
    try { proc.stdin.write('q'); proc.stdin.end(); } catch (_) {}
    for (let i = 0; i < 100 && !st.exited; i++) await sleep(100);
    if (!st.exited) { try { process.kill(proc.pid, 'SIGINT'); } catch (_) {} }
    for (let i = 0; i < 100 && !st.exited; i++) await sleep(100);
    if (!st.exited) { try { process.kill(proc.pid, 'SIGKILL'); } catch (_) {} }
  };
  return st;
}

/** Injected into the page: white full-screen div for `ms` (3 capture frames)  + tone on the game's context. */
async function slate(page, { ms = 100, toneMs = 100, hz = 1000 } = {}) {
  return page.evaluate(({ ms, toneMs, hz }) => new Promise((resolve) => {
    const ctx = (window.MusicController && window.MusicController.context) || window.__beCtx;
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:2147483647;pointer-events:none';
    requestAnimationFrame(() => {
      document.documentElement.appendChild(d);
      const epochMs = performance.timeOrigin + performance.now();
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.frequency.value = hz; g.gain.value = 0.8;
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + toneMs / 1000);
      const t0 = performance.now();
      const tick = () => { if (performance.now() - t0 >= ms) { d.remove(); resolve({ epochMs, ctxState: ctx.state }); } else requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }), { ms, toneMs, hz });
}

export async function recordTake(o) {
  const {
    display, url, outBase, fps = 30, size = '1920x1080', takeFile,
    volumes = {}, zoomStep, noSandbox, bridge: useBridge = true, mode = 'kiosk',
    pixFmt = 'yuv420p', crf = 14, preset = 'veryfast', audioDelayMs = 0, titleTimeoutMs = 90000,
  } = o;
  const [w, h] = size.split('x').map(Number);
  const sink = o.sink || `be_rec_${display}`;
  fs.mkdirSync(path.dirname(outBase), { recursive: true });
  const outFile = outBase + '.mkv', logFile = outBase + '.ffmpeg.log', markFile = outBase + '.markers.json';
  const slateMs = Math.max(60, Math.ceil(3000 / fps) + 20);   // 3 capture frames of white, 1 kHz tone alongside
  const markers = [], events = [];
  const report = { ok: false, url, fps, size, outFile, notes: [] };
  let takeFn = null;
  if (takeFile) { const m = await import(pathToFileURL(path.resolve(takeFile)).href); takeFn = m.default || m.take; }

  const g = await launchGame({ display, url, width: w, height: h, volumes, zoomStep, noSandbox, mode });
  const { page } = g;
  let ff = null, poll = null, t0 = null;
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message)));
  try {
    // 1. wait for game, pass title screen with trusted clicks
    if (useBridge) {
      await page.waitForFunction(() => !!window.__test, null, { timeout: 120000 });
      await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 60000 })).catch(() => {});
    } else { await sleep(1500); }
    const tStart = Date.now();
    let state = 'unknown';
    while (Date.now() - tStart < titleTimeoutMs) {
      state = await page.evaluate(() => window.MusicController && window.MusicController.context.state).catch(() => null);
      const mg = useBridge ? await page.evaluate(() => { try { return window.__test.getState().activeMinigame; } catch (_) { return 'err'; } }).catch(() => 'err') : null;
      const titleUp = mg && /title/i.test(String(mg.id || mg));
      if (state === 'running' && !titleUp && mg !== 'err') break;
      await page.mouse.click(Math.round(w / 2), Math.round(h / 2));   // trusted (CDP input), lifts autoplay + skips title
      await sleep(900);
    }
    // 2. assert AudioContext running
    state = await page.evaluate(() => window.MusicController && window.MusicController.context.state);
    report.audioContextState = state;
    if (state !== 'running') throw new Error(`AudioContext is '${state}', not 'running'`);
    if (useBridge) await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 30000 })).catch(() => {});
    report.window = await page.evaluate(() => ({ iw: innerWidth, ih: innerHeight, ow: outerWidth, oh: outerHeight, dpr: devicePixelRatio }));
    await sleep(500);

    // 3. start recording, start slate
    const cpu0 = cpuSample();
    ff = await startFfmpeg({ display, sink, fps, size, outFile, logFile, pixFmt, crf, preset, audioDelayMs });
    report.ffmpegSpawnedAt = ff.startedAt; report.ffmpegFirstFrameAt = ff.firstFrameAt;
    await sleep(700);
    const bridge = useBridge ? makeBridge(page) : null;
    const s1 = await slate(page, { ms: slateMs, toneMs: slateMs });
    t0 = s1.epochMs;
    report.startSlate = { epochMs: s1.epochMs, ctxState: s1.ctxState };
    const pageT0 = await page.evaluate(() => performance.now());
    if (useBridge) {
      poll = setInterval(async () => {
        try {
          const log = await page.evaluate(() => window.__test.peekLog ? window.__test.peekLog(500) : []);
          for (const e of log) if (!events.some(x => x.seq === e.seq)) {
            events.push({ seq: e.seq, tMs: Math.round(e.t - pageT0), kind: e.kind, action: e.action, event: e.event, message: e.message, detail: e.detail ?? e.data });
          }
        } catch (_) {}
      }, 400);
    }
    await sleep(500);
    const mark = (label, data) => { const t = Date.now() - t0; markers.push({ tMs: Math.round(t), label, data: data ?? null }); return t; };
    mark('take-begin');

    // 4. the take
    if (takeFn) await takeFn(page, bridge, mark);
    mark('take-end');
    if (poll) { clearInterval(poll); poll = null; }
    await sleep(500);

    // 5. end slate, stop
    const s2 = await slate(page, { ms: slateMs, toneMs: slateMs });
    report.endSlate = { epochMs: s2.epochMs, ctxState: s2.ctxState };
    await sleep(700);
    const cpu1 = cpuSample();
    await ff.stop();
    report.cpuBusyPct = +(100 * (1 - (cpu1.idle - cpu0.idle) / (cpu1.total - cpu0.total))).toFixed(1);
    report.loadavg = fs.readFileSync('/proc/loadavg', 'utf8').trim().split(' ').slice(0, 3).map(Number);
    report.ok = true;
  } catch (e) {
    report.error = String(e && e.stack || e);
  } finally {
    if (poll) clearInterval(poll);
    if (ff) await ff.stop();
    await g.close();
  }
  if (ff) {
    const last = ff.last;
    const num = (re) => { const m = re.exec(last); return m ? Number(m[1]) : null; };
    report.ffmpeg = {
      lastProgress: last, frames: num(/frame=\s*(\d+)/), dup: num(/dup=\s*(\d+)/), drop: num(/drop=\s*(\d+)/),
      speedLast: ff.speeds.length ? ff.speeds[ff.speeds.length - 1] : null,
      speedMin: ff.speeds.length ? Math.min(...ff.speeds.slice(2)) : null,   // skip start-up warm-up samples
      speedMean: ff.speeds.length ? +(ff.speeds.reduce((a, b) => a + b, 0) / ff.speeds.length).toFixed(3) : null,
      exit: ff.exited,
    };
  }
  report.pageErrors = errors.slice(0, 20);
  fs.writeFileSync(markFile, JSON.stringify({ ...report, t0EpochMs: t0, markers, events }, null, 2));
  return { ...report, markFile };
}

// ---- CLI ----
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const a = {};
  const av = process.argv.slice(2);
  for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) a[av[i].slice(2)] = (av[i + 1] && !av[i + 1].startsWith('--')) ? av[++i] : true;
  if (!a.display || !a.url || !a.out) { console.error('usage: record-take.mjs --display N --url URL --out BASE [--take FILE] [--fps 30] [--size 1920x1080] [--music 0] [--zoom N] [--no-sandbox true|false] [--no-bridge] [--preset veryfast|ultrafast] [--audio-delay-ms 65]'); process.exit(2); }
  const volumes = {};
  for (const k of ['music', 'sfx', 'voice', 'master']) if (a[k] !== undefined) volumes[k] = Number(a[k]);
  const r = await recordTake({
    display: a.display, url: a.url, outBase: a.out, takeFile: a.take, fps: Number(a.fps) || 30, size: a.size || '1920x1080',
    volumes, zoomStep: a.zoom !== undefined ? Number(a.zoom) : undefined,
    noSandbox: a['no-sandbox'] === undefined ? undefined : a['no-sandbox'] === 'true',
    bridge: !a['no-bridge'], mode: a.mode || 'kiosk', pixFmt: a['pix-fmt'] || 'yuv420p', preset: a.preset || 'veryfast', audioDelayMs: Number(a['audio-delay-ms']) || 0,
  });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
