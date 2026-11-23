// D331 (23 Nov): every Cyber Aware scenario (scenarios/ca*) scores itself with the PeaceFolk
// playlist. The generators emit the music block (awareness_deploy.music_block) and the hand-authored
// episodes carry the same literal; this test guards that all of them agree and that the playlist
// in music-config.js points at mp3 files that exist.
// Run with: node --test test/js/social-awareness-music.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const scenarios = join(root, 'scenarios');
globalThis.window = globalThis.window || {};
const { MUSIC_CONFIG } = await import('../../public/break_escape/js/music/music-config.js');

const EXPECTED = ['Gently Decaying', 'Gently Decaying Again', 'Guitar Motif', 'Quietly Cinematic', 'Quiet Reflection'];
const dirs = readdirSync(scenarios, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^ca(\d{2}|_pre|_post|_annual)/.test(d.name))
  .map((d) => d.name);

test('there are 69 CA scenarios', () => assert.equal(dirs.length, 69));

test('peacefolk playlist lists the five tracks and the files exist', () => {
  const pl = MUSIC_CONFIG.playlists.peacefolk;
  assert.ok(pl);
  assert.deepEqual(pl.tracks.map((t) => t.title).sort(), [...EXPECTED].sort());
  for (const t of pl.tracks) {
    assert.ok(existsSync(join(root, 'public/break_escape/assets/music', t.file)), t.file);
  }
});

test('every CA scenario opens with the PeaceFolk game_loaded event', () => {
  for (const d of dirs) {
    const sc = JSON.parse(readFileSync(join(scenarios, d, 'scenario.json.erb'), 'utf8'));
    const ev = sc.music?.events;
    assert.equal(ev?.length, 1, `${d}: one music event`);
    assert.equal(ev[0].trigger, 'game_loaded', d);
    assert.equal(ev[0].playlist, 'peacefolk', d);
    assert.equal(ev[0].fade, false, d);
    assert.ok(MUSIC_CONFIG.playlists[ev[0].playlist], d);
  }
});
