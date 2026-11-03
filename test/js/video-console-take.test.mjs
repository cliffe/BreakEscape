// Console take support in tools/video/capture: record-take option parsing (--no-game), the console take's settings and
// canvas check, and check-take --video-only on synthetic videos made with ffmpeg.
// Run with: bin/test-js test/js/video-console-take.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cap = join(dirname(fileURLToPath(import.meta.url)), '../../tools/video/capture');
const { parseCliArgs, recordOptionsFromArgs, recordFfmpegArgs } = await import(join(cap, 'record-take.mjs'));
const vc = await import(join(cap, 'takes/vm_console.mjs'));

test('record-take: existing game options are unchanged without --no-game', () => {
  const r = recordOptionsFromArgs(parseCliArgs(['--display', '97', '--url', 'http://x/g/1', '--out', '/o/t', '--take', 't.mjs', '--hide-hud', '--zoom-step', '1', '--music', '0']));
  assert.equal(r.opts.noGame, false);
  assert.equal(r.opts.bridge, true);
  assert.equal(r.opts.hideHud, true);
  assert.equal(r.opts.zoomStep, 1);
  assert.deepEqual(r.opts.volumes, { music: 0 });
  assert.equal(r.opts.storageState, undefined);
  assert.equal(r.opts.ignoreHttpsErrors, false);
  assert.equal(recordOptionsFromArgs(parseCliArgs(['--display', '97', '--out', '/o/t'])).error, 'usage');
});

test('record-take: --no-game needs no url, switches the bridge off and takes the storage state', () => {
  const r = recordOptionsFromArgs(parseCliArgs(['--no-game', '--display', '97', '--out', '/o/c', '--take', 'vm_console.mjs', '--storage-state', '/s.json', '--ignore-https-errors']));
  assert.equal(r.opts.noGame, true);
  assert.equal(r.opts.bridge, false);
  assert.equal(r.opts.storageState, '/s.json');
  assert.equal(r.opts.ignoreHttpsErrors, true);
  assert.match(recordOptionsFromArgs(parseCliArgs(['--no-game', '--display', '97', '--out', '/o/c'])).error, /--take/);
  assert.match(recordOptionsFromArgs(parseCliArgs(['--no-game', '--title-take', '--display', '97', '--out', '/o/c', '--take', 't'])).error, /title-take/);
});

test('record-take: ffmpeg args force CFR with -vsync, never -fps_mode (ffmpeg 4.2 compatibility)', () => {
  const args = recordFfmpegArgs({ display: 97, sink: 'be_rec_97', fps: 30, size: '1920x1080', outFile: '/o/t.mkv', pixFmt: 'yuv420p', crf: 14, preset: 'ultrafast' });
  assert.ok(!args.includes('-fps_mode'), '-fps_mode is unknown to ffmpeg 4.2.7 and must not be used');
  const i = args.indexOf('-vsync');
  assert.ok(i >= 0 && args[i + 1] === 'cfr', '-vsync cfr forces a constant frame rate on every ffmpeg version');
  const r = args.indexOf('-r');
  assert.ok(r >= 0 && args[r + 1] === '30', 'output frame rate is set');
  assert.ok(args.includes(':97') && args.includes('be_rec_97.monitor'), 'grabs display :97 and the pulse monitor');
  assert.equal(args[args.length - 1], '/o/t.mkv', 'the output file is last');
});

test('vm_console: desktop credentials parse from user:password and JSON', () => {
  assert.deepEqual(vc.parseDesktopCreds('kali:pa:ss'), { user: 'kali', password: 'pa:ss' });
  assert.deepEqual(vc.parseDesktopCreds('{"user":"a","password":"b"}'), { user: 'a', password: 'b' });
  assert.deepEqual(vc.parseDesktopCreds('{"desktop_user":"a","desktop_pass":"b"}'), { user: 'a', password: 'b' });
  for (const bad of [undefined, '', 'nocolon', ':x', 'x:', '{bad', '{"user":"a"}']) assert.equal(vc.parseDesktopCreds(bad), null);
});

test('vm_console: settings, login modes, and no secret in an error', () => {
  assert.throws(() => vc.consoleSettings({}), /CONSOLE_VM_URL/);
  const base = { CONSOLE_VM_URL: 'https://h/vm' };
  assert.equal(vc.consoleSettings({ ...base, PLAYTEST_DESKTOP_CREDS: 'u:p' }).creds.user, 'u');
  assert.equal(vc.consoleSettings({ ...base, PLAYTEST_DESKTOP_CREDS: 'u:p', CONSOLE_DESKTOP_LOGIN: 'no' }).creds, null);
  assert.equal(vc.consoleSettings(base).creds, null);
  let msg = '';
  try { vc.consoleSettings({ ...base, CONSOLE_DESKTOP_LOGIN: 'yes', PLAYTEST_DESKTOP_CREDS: 'sekrit' }); } catch (e) { msg = e.message; }
  assert.match(msg, /CONSOLE_DESKTOP_LOGIN=yes/);
  assert.ok(!msg.includes('sekrit'));
  assert.throws(() => vc.consoleSettings({ ...base, CONSOLE_DESKTOP_LOGIN: 'maybe' }));
  const s = vc.consoleSettings({ ...base, CONSOLE_SIZE: '1280x720' });
  assert.deepEqual([s.width, s.height], [1280, 720]);
});

test('vm_console: canvas must be exactly 1:1', () => {
  const ok = { canvas: { w: 1920, h: 1080 }, shown: { w: 1920, h: 1080 }, dpr: 1 };
  assert.deepEqual(vc.canvasProblems(ok, 1920, 1080), []);
  assert.equal(vc.canvasProblems({ canvas: null }, 1920, 1080).length, 1);
  assert.match(vc.canvasProblems({ ...ok, canvas: { w: 1024, h: 768 } }, 1920, 1080)[0], /1024x768/);
  assert.match(vc.canvasProblems({ ...ok, shown: { w: 1600, h: 900 } }, 1920, 1080)[0], /not 1:1/);
  assert.equal(vc.canvasProblems({ ...ok, dpr: 2 }, 1920, 1080).length, 1);
});

test('vm_console: SetDesktopSize (type 251) is dropped, other messages pass', () => {
  const sent = [];
  globalThis.WebSocket = function () {}; globalThis.WebSocket.prototype.send = function (d) { sent.push(d); };
  vc.dropSetDesktopSize();
  const ws = new globalThis.WebSocket();
  ws.send(new Uint8Array([251, 0, 0, 0]));
  ws.send(new Uint8Array([5, 1, 0, 0]));
  ws.send('text');
  assert.equal(sent.length, 2);
  assert.equal(sent[0][0], 5);
});

// ---- check-take --video-only on synthetic videos ----
const have = (c) => spawnSync(c, ['-version']).status === 0;
const dir = have('ffmpeg') ? mkdtempSync(join(tmpdir(), 'console-take-')) : null;
// 30 fps, 6 s: white at the start and end, dark with a moving box between; optional silent audio.
function makeTake(name, audio) {
  const out = join(dir, name);
  const vf = "color=c=0x202020:s=320x180:r=30:d=6,drawbox=x='20+40*t':y=60:w=40:h=40:color=red:t=fill,drawbox=x=0:y=0:w=320:h=180:color=white:t=fill:enable='lt(t,0.4)+gt(t,5.4)'";
  const args = ['-y', '-v', 'error', '-f', 'lavfi', '-i', vf, ...(audio ? ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '6', '-c:a', 'pcm_s16le'] : []), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out];
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return out;
}
const check = (file, extra = []) => spawnSync(process.execPath, [join(cap, 'check-take.mjs'), file, ...extra], { encoding: 'utf8' });

test('check-take --video-only: a take with no audio stream passes and is trimmed', { skip: !dir }, () => {
  const f = makeTake('silent.mkv', false);
  const r = check(f, ['--video-only']);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const j = JSON.parse(r.stdout);
  assert.equal(j.offsetMode, 'video-only');
  assert.equal(j.videoSlates.length, 2);
  assert.ok(existsSync(j.trimmed.out));
});

test('check-take: without --video-only a take with no audio stream still fails as before', { skip: !dir }, () => {
  const r = check(join(dir, 'silent.mkv'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing video or audio stream/);
});

test('check-take --video-only: a take with a silent audio track also passes', { skip: !dir }, () => {
  const f = makeTake('withaudio.mkv', true);
  const r = check(f, ['--video-only']);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.ok(JSON.parse(r.stdout).trimmed.out);
});
