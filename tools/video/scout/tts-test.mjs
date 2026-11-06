#!/usr/bin/env node
// Live /tts tester: posts to a game's /tts endpoint the way the client does (session cookie + CSRF token) and prints status and duration.
//   node tools/video/scout/tts-test.mjs --server http://127.0.0.1:3001 --game <game id> --npc <npc id> --text "<exact ink text>" [--text ...]
//   node tools/video/scout/tts-test.mjs --server ... --game ... --lines lines.json   ([{"npc_id": "...", "text": "..."}], the output of dump-lines.rb, or a subset)
// A control line (text that is in no ink) is always added unless --no-control: it must be refused (403), which proves the check is live.
// Results: 200 audio/mpeg = cached and playable (duration from ffprobe); 503 = no cached clip (keyless server); 403 = text not in that NPC's ink;
// 404/400 = wrong npc id or no voice. Exit 0 only if the control was refused. Keyless servers never generate audio, so this costs nothing.
// Make a game first: PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission>   (prints GAME_ID)
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const all = (k) => a.flatMap((x, i) => x === '--' + k ? [a[i + 1]] : []);
const server = (opt('server', '') || '').replace(/\/$/, ''); const game = opt('game'); const npc = opt('npc'); const outDir = opt('out');
let lines = all('text').map((text) => ({ npc_id: npc, text }));
if (opt('lines')) lines = lines.concat(JSON.parse(fs.readFileSync(opt('lines'), 'utf8')).map((l) => ({ npc_id: l.npc_id || npc, text: l.text })));
if (!server || !game || !lines.length || lines.some((l) => !l.npc_id)) { console.error('usage: tts-test.mjs --server URL --game ID (--npc ID --text "..." [--text ...] | --lines file.json) [--npc ID] [--out DIR] [--no-control]'); process.exit(2); }
const base = `${server}/break_escape/games/${game}`;
const page = await fetch(base); const html = await page.text();
const csrf = (html.match(/csrfToken:\s*'([^']*)'/) || [])[1];
const cookie = (page.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
if (!page.ok || !csrf) { console.error(`cannot load the game page ${base} (status ${page.status}, csrf ${csrf ? 'found' : 'missing'}): wrong server or game id?`); process.exit(2); }
const control = a.includes('--no-control') ? null : { npc_id: lines[0].npc_id, text: 'Zebra quartz waffle protocol zero seven.', control: true };
const tmp = outDir || fs.mkdtempSync(path.join(process.env.BE_VIDEO_SCRATCH || os.tmpdir(), 'tts-test-')); fs.mkdirSync(tmp, { recursive: true });
let controlRefused = true, n = 0;
for (const l of control ? [...lines, control] : lines) {
  const r = await fetch(`${base}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, Cookie: cookie, Accept: 'audio/mpeg' }, body: JSON.stringify({ npc_id: l.npc_id, text: l.text }) });
  let dur = '';
  if (r.status === 200 && /audio/.test(r.headers.get('content-type') || '')) {
    const f = path.join(tmp, `clip_${String(n++).padStart(3, '0')}.mp3`); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    dur = (spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout || '').trim();
    dur = dur ? Number(dur).toFixed(2) + ' s' : '(ffprobe failed)';
  } else await r.arrayBuffer();
  if (l.control && r.status === 200) controlRefused = false;
  console.log(`${l.control ? 'CONTROL' : String(r.status === 200 ? 'PLAY   ' : 'NO     ')}\t${r.status}\t${dur}\t${l.npc_id}\t${l.text.slice(0, 80)}`);
}
if (control) console.log(controlRefused ? 'control line refused: the check is live' : 'WARNING: the control line was accepted, so a 200 proves nothing');
process.exit(controlRefused ? 0 : 1);
