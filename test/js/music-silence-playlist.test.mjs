// F10: a 'silence' playlist whose one track is a real, silent audio file, so a
// scenario music event can switch to silence ("playlist": "silence").
// Run with: node test/js/music-silence-playlist.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
globalThis.window = {};
const tmp = mkdtempSync(join(tmpdir(), 'music-silence-test-'));
writeFileSync(join(tmp, 'music-config.mjs'), readFileSync(join(root, 'public/break_escape/js/music/music-config.js'), 'utf8'));
const { MUSIC_CONFIG } = await import(pathToFileURL(join(tmp, 'music-config.mjs')).href);
const musicDir = join(root, 'public/break_escape/assets/music');

test('the silence playlist exists and points at a shipped file', () => {
    const pl = MUSIC_CONFIG.playlists.silence;
    assert.ok(pl, 'silence playlist');
    assert.equal(pl.tracks.length, 1);
    assert.ok(existsSync(join(musicDir, pl.tracks[0].file)), pl.tracks[0].file);
});

const ffmpeg = spawnSync('ffmpeg', ['-version']);
test('the silence track is silent', { skip: ffmpeg.status !== 0 && 'ffmpeg not found' }, () => {
    const file = join(musicDir, MUSIC_CONFIG.playlists.silence.tracks[0].file);
    const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
    const max = Number((r.stderr.match(/max_volume:\s*(-?[\d.]+|-inf) dB/) || [])[1]?.replace('-inf', '-200'));
    assert.ok(max <= -80, `max_volume ${max} dB`);
});
