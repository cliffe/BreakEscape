// scripts/generate_dungeon_graph.rb draws story gates (unlockCondition.globalVariable and
// eventMapping unlockAim) in the Story Aims graph. Runs the generator on a fixture copy.
// Run with: node --test test/js/dungeon-graph-story-gates.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);

test('story gates become edges and give a critical path', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'story-gates-'));
  try {
    cpSync(join(root, 'test/js/fixtures/story_gates'), dir, { recursive: true });
    const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
      { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    // task -> mapping sets phase -> scene opens on phase -> scene close sets night_falls
    assert.match(r.stdout, /Critical path \(2 hops\): Get In → Night Work → Finale/);
    const md = readFileSync(join(dir, 'dungeon_graph.md'), 'utf8');
    const story = md.slice(md.indexOf('## Story Aims'), md.indexOf('## Story + Puzzle'));
    const edges = [...story.matchAll(/^\s+(\w+) -\.->\|([^|]*)\| (\w+)$/gm)].map(m => `${m[1]} ${m[2]} ${m[3]}`);
    assert.deepEqual(edges.sort(), [
      'aim_get_in night_falls aim_night_work',          // also opened by unlockAim on the same global: one edge, global label
      'aim_night_work bonus_earned aim_bonus',          // ~ bonus_earned = true in the debrief ink (synced VAR)
      'aim_night_work finale_ready aim_finale',         // global_variable_changed chain back to a task
      'story_talk_to_stranger side_open aim_side',      // #set_global in a talk the player starts; game_loaded backstop ignored
    ].sort());
    assert.match(md, /\| Story graph nodes \/ edges \| 6 \/ 4 \|/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
